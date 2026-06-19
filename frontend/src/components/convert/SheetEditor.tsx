import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { Download, FileInput, Maximize2, Minimize2 } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  createUniver,
  defaultTheme,
  LocaleType,
  type FUniver,
  type ILanguagePack,
  type IWorkbookData,
} from "@univerjs/presets"
import { UniverSheetsCorePreset } from "@univerjs/presets/preset-sheets-core"
import "@univerjs/preset-sheets-core/lib/index.css"

import { Loader } from "@/components/animate-ui/components/loader"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"
import type { Language } from "@/lib/i18n"
import { parseTsv, serializeTsv } from "@/lib/tsv"
import { cn } from "@/lib/utils"
import { createXlsx, downloadBlob } from "@/lib/xlsx-export"

export interface PendingSheetImport {
  name: string
  values: string[][]
}

const DEFAULT_ROWS = 100
const DEFAULT_COLUMNS = 26

type LocaleModule = { default: ILanguagePack }

const UNIVER_LOCALES: Record<
  Language,
  { locale: LocaleType; load: () => Promise<LocaleModule> }
> = {
  ja: {
    locale: LocaleType.JA_JP,
    load: () => import("@univerjs/presets/preset-sheets-core/locales/ja-JP"),
  },
  en: {
    locale: LocaleType.EN_US,
    load: () => import("@univerjs/presets/preset-sheets-core/locales/en-US"),
  },
  zh: {
    locale: LocaleType.ZH_CN,
    load: () => import("@univerjs/presets/preset-sheets-core/locales/zh-CN"),
  },
  "zh-Hant": {
    locale: LocaleType.ZH_TW,
    load: () => import("@univerjs/presets/preset-sheets-core/locales/zh-TW"),
  },
  es: {
    locale: LocaleType.ES_ES,
    load: () => import("@univerjs/presets/preset-sheets-core/locales/es-ES"),
  },
  de: {
    locale: LocaleType.DE_DE,
    load: () => import("@univerjs/presets/preset-sheets-core/locales/de-DE"),
  },
}

export interface SheetEditorHandle {
  exportActiveSheet: () => string
}

interface SheetEditorProps {
  input: string
  // アップロード等で外部から取り込みたいシート群。ready 後に新しいシートとして取り込む。
  pendingImport?: PendingSheetImport[] | null
  onImported?: () => void
}

function createEmptyWorkbookData(locale: LocaleType): Partial<IWorkbookData> {
  return {
    id: crypto.randomUUID(),
    name: "converTeXcel",
    locale,
    sheetOrder: [],
    sheets: {},
    styles: {},
    resources: [],
  }
}

function uniqueSheetName(base: string, existingNames: Set<string>): string {
  const safe = base.trim() || "Imported"
  if (!existingNames.has(safe)) return safe
  let suffix = 2
  while (existingNames.has(`${safe} ${suffix}`)) suffix += 1
  return `${safe} ${suffix}`
}

export const SheetEditor = forwardRef<SheetEditorHandle, SheetEditorProps>(
  function SheetEditor({ input, pendingImport, onImported }, ref) {
    const { language, t } = useI18n()
    const reducedMotion = useReducedMotion()
    const containerRef = useRef<HTMLDivElement>(null)
    const univerApiRef = useRef<FUniver | null>(null)
    const univerRef = useRef<ReturnType<typeof createUniver>["univer"] | null>(null)
    const inputRef = useRef(input)
    const [ready, setReady] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)

    // 全画面の切り替え中はサイズが変わるので、Univer に再レイアウトを促す。
    // Esc でも全画面を抜けられるようにする。
    useEffect(() => {
      const timer = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 320)
      if (!fullscreen) return () => window.clearTimeout(timer)
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setFullscreen(false)
      }
      window.addEventListener("keydown", onKey)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener("keydown", onKey)
      }
    }, [fullscreen])

    inputRef.current = input

    useImperativeHandle(
      ref,
      () => ({
        exportActiveSheet: () => {
          const sheet = univerApiRef.current?.getActiveWorkbook()?.getActiveSheet()
          if (!sheet) return inputRef.current
          // 範囲を複数セル選択しているときはその選択範囲を、そうでなければシート全体を変換対象にする。
          const active = sheet.getActiveRange()
          const useSelection = !!active && (active.getWidth() > 1 || active.getHeight() > 1)
          const range = useSelection && active ? active : sheet.getDataRange()
          return serializeTsv(range.getValues())
        },
      }),
      [],
    )

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      let cancelled = false
      let themeObserver: MutationObserver | null = null

      setReady(false)
      const config = UNIVER_LOCALES[language]

      void config.load().then(({ default: localeMessages }) => {
        if (cancelled) return

        const { univer, univerAPI } = createUniver({
          locale: config.locale,
          locales: { [config.locale]: localeMessages },
          theme: defaultTheme,
          presets: [UniverSheetsCorePreset({ container })],
        })
        univerRef.current = univer
        univerApiRef.current = univerAPI

        const workbook = univerAPI.createWorkbook(createEmptyWorkbookData(config.locale))
        const sheet = workbook.getSheets()[0]
          ?? workbook.create("Sheet1", DEFAULT_ROWS, DEFAULT_COLUMNS)
        const rows = parseTsv(inputRef.current)
        if (rows.length > 0) {
          sheet
            .getRange(0, 0, rows.length, rows[0].length)
            .setValues(rows)
        }
        sheet.activate()

        let lastDarkMode: boolean | null = null
        const syncTheme = () => {
          const darkMode = document.documentElement.classList.contains("dark")
          if (darkMode === lastDarkMode) return
          lastDarkMode = darkMode
          univerAPI.toggleDarkMode(darkMode)
        }
        syncTheme()
        themeObserver = new MutationObserver(syncTheme)
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        })

        setReady(true)
      })

      return () => {
        cancelled = true
        themeObserver?.disconnect()
        const univerToDispose = univerRef.current
        univerRef.current = null
        univerApiRef.current = null
        // Univer UI も内部に React root を持つため、親Reactのunmount中に
        // 同期disposeせず次のタスクで破棄する。
        window.setTimeout(() => univerToDispose?.dispose(), 0)
      }
    }, [language])

    const importValues = (name: string, values: string[][]) => {
      const workbook = univerApiRef.current?.getActiveWorkbook()
      if (!workbook || values.length === 0) return

      const existingNames = new Set(workbook.getSheets().map((sheet) => sheet.getSheetName()))
      const sheet = workbook.create(
        uniqueSheetName(name, existingNames),
        Math.max(DEFAULT_ROWS, values.length),
        Math.max(DEFAULT_COLUMNS, values[0].length),
      )
      sheet
        .getRange(0, 0, values.length, values[0].length)
        .setValues(values)
      sheet.activate()
    }

    const importInput = () => importValues("Imported", parseTsv(input))

    const exportXlsx = () => {
      const workbook = univerApiRef.current?.getActiveWorkbook()
      if (!workbook) return
      const sheets = workbook.getSheets().map((sheet) => {
        const range = sheet.getDataRange()
        return {
          name: sheet.getSheetName(),
          values: range.getValues(),
          formulas: range.getFormulas(),
        }
      })
      downloadBlob(createXlsx(sheets), "converTeXcel.xlsx")
    }

    // ready 後に保留中の取り込み（アップロードされた Excel 等）を新しいシートへ反映する。
    // 末尾→先頭の順に取り込むことで、先頭シートが最後に作られてアクティブになる。
    useEffect(() => {
      if (!ready || !pendingImport || pendingImport.length === 0) return
      for (let i = pendingImport.length - 1; i >= 0; i--) {
        importValues(pendingImport[i].name, pendingImport[i].values)
      }
      onImported?.()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, pendingImport])

    return (
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.sheet.title}</h1>
            <p className="text-muted-foreground text-sm">{t.sheet.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={exportXlsx} disabled={!ready}>
              <Download className="h-4 w-4" />
              <span>{t.sheet.exportXlsx}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={importInput}
              disabled={!ready || input.trim() === ""}
              title={t.sheet.importTitle}
            >
              <FileInput className="h-4 w-4" />
              <span>{t.sheet.importInput}</span>
            </Button>
          </div>
        </div>
        <motion.div
          layout={!reducedMotion}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "overflow-hidden bg-background",
            fullscreen
              ? "fixed inset-x-0 top-0 bottom-6 z-50 rounded-none"
              : "relative h-[70vh] min-h-[420px] rounded-md border",
          )}
        >
          <AnimatePresence initial={false}>
          {!ready && (
            <motion.div
              className="absolute inset-0 z-10 grid place-items-center bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader size={9} className="text-primary" />
                <span className="text-sm">{t.sheet.loading}</span>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? t.sheet.exitFullscreen : t.sheet.fullscreen}
            aria-label={fullscreen ? t.sheet.exitFullscreen : t.sheet.fullscreen}
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-md border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={fullscreen ? "minimize" : "maximize"}
                initial={{ opacity: 0, rotate: reducedMotion ? 0 : -90, scale: reducedMotion ? 1 : 0.75 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: reducedMotion ? 0 : 90, scale: reducedMotion ? 1 : 0.75 }}
                transition={{ duration: reducedMotion ? 0 : 0.16 }}
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <div ref={containerRef} className="h-full w-full" />
        </motion.div>
      </section>
    )
  },
)
