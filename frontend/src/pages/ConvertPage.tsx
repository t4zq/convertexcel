import { lazy, Suspense, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CheckCircle2, Upload } from "lucide-react"
import readXlsxFile from "read-excel-file/browser"

import { InputStep } from "@/components/convert/InputStep"
import { OutputPanel } from "@/components/convert/OutputPanel"
import { PreviewPanel } from "@/components/convert/PreviewPanel"
import { StepNavButton } from "@/components/convert/StepNavButton"
import { PanelFallback } from "@/components/convert/panels"
import type { PendingSheetImport } from "@/components/convert/SheetEditor"
import { useConvertPageStatus } from "@/hooks/useConvertPageStatus"
import { useConversionOutputs } from "@/hooks/useConversionOutputs"
import { useCooldown } from "@/hooks/useCooldown"
import { useGnuplotPreview } from "@/hooks/useGnuplotPreview"
import { useI18n } from "@/hooks/useI18n"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { usePersistentState } from "@/hooks/usePersistentState"
import { usePreviewSubmission, type OutputTab } from "@/hooks/usePreviewSubmission"
import { useSeo } from "@/hooks/useSeo"
import { getSharedState, useShareUrl } from "@/hooks/useShareUrl"
import { useSplitResize } from "@/hooks/useSplitResize"
import {
  DEFAULT_TABLE_SETTINGS,
  DEFAULT_GNUPLOT_SETTINGS,
  getDefaultTikzSettings,
  localizeDefaultTikzText,
  type GnuplotSettings,
  type TableSettings,
  type TikzSettings,
} from "@/lib/convert-settings"
import { localizedSiteUrls } from "@/lib/i18n"
import { diagnoseInput } from "@/lib/input-diagnostics"
import { stepItemVariants, stepPageVariants } from "@/lib/motion"
import type { SheetEditorHandle } from "@/components/convert/SheetEditor"

type Step = "input" | "convert" | "sheet"

const STEPS: Step[] = ["input", "convert", "sheet"]

const SITE_URL = "https://convertexcel.net/"
const convertUrls = localizedSiteUrls(SITE_URL, "/")
const ShareDialog = lazy(() =>
  import("@/components/ShareDialog").then((module) => ({
    default: module.ShareDialog,
  }))
)
const SheetEditor = lazy(() =>
  import("@/components/convert/SheetEditor").then((module) => ({
    default: module.SheetEditor,
  }))
)
const PreviewConsentDialog = lazy(() =>
  import("@/components/convert/PreviewConsentDialog").then((module) => ({
    default: module.PreviewConsentDialog,
  }))
)

export default function ConvertPage() {
  const { language, t, seo: seoText } = useI18n()
  const canonical = convertUrls[language]
  const pageSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "converTeXcel",
      url: canonical,
      inLanguage: language,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      description: seoText.convertDescription,
      featureList: [...seoText.features],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
      },
    }),
    [canonical, language, seoText.convertDescription, seoText.features],
  )

  useSeo({
    title: seoText.convertTitle,
    description: seoText.convertDescription,
    canonical,
    language,
    alternates: {
      ...convertUrls,
      "x-default": convertUrls.ja,
    },
    schema: pageSchema,
  })

  const [input, setInput] = usePersistentState("convertexcel:input", "")
  const sheetEditorRef = useRef<SheetEditorHandle>(null)
  const [table, setTable] = usePersistentState("convertexcel:table", DEFAULT_TABLE_SETTINGS)
  const [tikz, setTikz] = usePersistentState("convertexcel:tikz", getDefaultTikzSettings(language))
  const [gnuplot, setGnuplot] = usePersistentState("convertexcel:gnuplot", DEFAULT_GNUPLOT_SETTINGS)
  const [showInputSettings, setShowInputSettings] = useState(false)
  const [showTikzSettings, setShowTikzSettings] = useState(false)
  const [showGnuplotSettings, setShowGnuplotSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<OutputTab>("latex")
  const [sharedStateRestored, setSharedStateRestored] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingSheetImport[] | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateTable = (patch: Partial<TableSettings>) => setTable((s) => ({ ...s, ...patch }))
  const updateTikz = (patch: Partial<TikzSettings>) => setTikz((s) => ({ ...s, ...patch }))
  const updateGnuplot = (patch: Partial<GnuplotSettings>) => setGnuplot((s) => ({ ...s, ...patch }))

  useEffect(() => {
    setTikz((current) => localizeDefaultTikzText(current, language))
  }, [language, setTikz])

  // 出力・診断・PDF は入力そのものから生成する（空のときは何も表示しない）。
  const source = input
  const hasContent = input.trim() !== ""

  // 入力 → 変換 → シート → 入力のリングを横スライドで切り替える。
  // direction: 1 = 順方向（右から）, -1 = 逆方向（左から）。
  const [step, setStep] = useState<Step>("input")
  const [direction, setDirection] = useState(1)
  const reducedMotion = useReducedMotion()
  const pageVariants = useMemo(() => stepPageVariants(reducedMotion), [reducedMotion])
  const itemVariants = useMemo(() => stepItemVariants(reducedMotion), [reducedMotion])
  const goToStep = useCallback((next: Step) => {
    if (next === step) return

    if (step === "sheet") {
      const editor = sheetEditorRef.current
      if (editor) {
        setInput(editor.exportActiveSheet())
        editor.flushSnapshot()
      }
    }

    const currentIndex = STEPS.indexOf(step)
    const nextIndex = STEPS.indexOf(next)
    setDirection((nextIndex - currentIndex + STEPS.length) % STEPS.length === 1 ? 1 : -1)
    setStep(next)
  }, [setInput, step])
  const moveStep = useCallback((offset: -1 | 1) => {
    const currentIndex = STEPS.indexOf(step)
    goToStep(STEPS[(currentIndex + offset + STEPS.length) % STEPS.length])
  }, [goToStep, step])
  // Excel をアップロードしたら、新しいシートとして取り込み、左スライドでシート入力へ移行する。
  const handleExcelUpload = useCallback(async (file: File) => {
    try {
      const sheets = await readXlsxFile(file)
      const imports = sheets
        .map((sheet) => ({
          name: sheet.sheet,
          values: sheet.data.map((row) => row.map((cell) => (cell == null ? "" : String(cell)))),
        }))
        .filter((sheet) => sheet.values.length > 0)
      if (imports.length === 0) return
      setPendingImport(imports)
      goToStep("sheet")
    } catch {
      // 読み取れないファイルは無視する（xlsx 以外など）。
    }
  }, [goToStep])
  const stepTitle = useCallback((value: Step) => {
    if (value === "input") return t.convert.inputTitle
    if (value === "convert") return t.convert.outputTitle
    return t.sheet.title
  }, [t.convert.inputTitle, t.convert.outputTitle, t.sheet.title])
  const previousStep = STEPS[(STEPS.indexOf(step) - 1 + STEPS.length) % STEPS.length]
  const nextStep = STEPS[(STEPS.indexOf(step) + 1) % STEPS.length]
  // 変換出力・診断ステータスは変換ステップを開いたときだけ計算する。
  const outputActive = step === "convert"

  const { latexOut, csvOut, tikzOut, gnuplotOut, setLatexOut, setTikzOut, setGnuplotOut } = useConversionOutputs(
    source,
    table,
    tikz,
    gnuplot,
    outputActive,
  )
  const { cooldown, startCooldown } = useCooldown()
  // gnuplot プレビューはクライアント内 SVG 描画（外部送信・同意・クールダウン不要）。
  const {
    svg: gnuplotSvg,
    rendering: gnuplotRendering,
    error: gnuplotErr,
    renderPreview: renderGnuplotPreview,
    markImageActionFailed,
  } = useGnuplotPreview(gnuplotOut, t.convert.gnuplotError, outputActive && gnuplot.autoPreview)
  const preview = usePreviewSubmission({
    activeTab,
    cooldown,
    latexOut,
    tikzOut,
    gnuplotOut,
    source,
    table,
    renderGnuplotPreview,
    startCooldown,
  })
  const split = useSplitResize()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const defaultTikzForLanguage = useMemo(() => getDefaultTikzSettings(language), [language])
  const shareState = useMemo(
    () => ({ input, table, tikz, gnuplot, activeTab }),
    [input, table, tikz, gnuplot, activeTab],
  )
  const hasShareContent = useMemo(
    () =>
      input.trim() !== "" ||
      activeTab !== "latex" ||
      JSON.stringify(table) !== JSON.stringify(DEFAULT_TABLE_SETTINGS) ||
      JSON.stringify(tikz) !== JSON.stringify(defaultTikzForLanguage) ||
      JSON.stringify(gnuplot) !== JSON.stringify(DEFAULT_GNUPLOT_SETTINGS),
    [input, activeTab, table, tikz, gnuplot, defaultTikzForLanguage],
  )
  const { copied, copyShareUrl, shareUrl } = useShareUrl(shareState, hasShareContent)

  // 共有URLから入力・設定を復元（localStorage より優先）。
  useEffect(() => {
    const shared = getSharedState()
    if (!shared) return
    if (typeof shared.input === "string") setInput(shared.input)
    if (shared.table) setTable((current) => ({ ...current, ...shared.table }))
    if (shared.tikz) setTikz((current) => ({ ...current, ...shared.tikz }))
    if (shared.gnuplot) setGnuplot((current) => ({ ...current, ...shared.gnuplot }))
    if (shared.activeTab) setActiveTab(shared.activeTab)
    setSharedStateRestored(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sharedStateRestored) return
    const timer = window.setTimeout(() => setSharedStateRestored(false), 4200)
    return () => window.clearTimeout(timer)
  }, [sharedStateRestored])

  const copyActiveOutput = useCallback(() => {
    const output = activeTab === "latex" ? latexOut : activeTab === "tikz" ? tikzOut : gnuplotOut
    if (!output.trim()) return
    void navigator.clipboard.writeText(output)
  }, [activeTab, gnuplotOut, latexOut, tikzOut])

  const toggleActiveGraphSettings = useCallback(() => {
    if (activeTab === "gnuplot") {
      setShowGnuplotSettings((value) => !value)
      return
    }
    setShowTikzSettings((value) => !value)
  }, [activeTab])

  useKeyboardShortcuts({
    onPreview: () => {
      if (step !== "convert") {
        goToStep("convert")
        return
      }
      preview.requestPreview()
    },
    onCopyActive: copyActiveOutput,
    onToggleInputSettings: () => setShowInputSettings((value) => !value),
    onToggleGraphSettings: () => {
      goToStep("convert")
      toggleActiveGraphSettings()
    },
    onSwitchTab: (tab) => {
      setActiveTab(tab)
      goToStep("convert")
    },
  })

  const diagnostics = useMemo(
    () => diagnoseInput(source, table.hasHeader, tikz.scaleMode),
    [source, table.hasHeader, tikz.scaleMode]
  )

  // y 系列数（x 列を除いた列数）と各系列の表示名。系列別近似 UI で使う。
  const seriesCount = Math.max(0, diagnostics.maxCols - 1)
  const seriesNames = useMemo(
    () =>
      Array.from({ length: seriesCount }, (_, i) => {
        const col = diagnostics.numericColumns.find((c) => c.index === i + 1)
        return col?.name ?? t.convert.series(i + 1)
      }),
    [seriesCount, diagnostics.numericColumns, t.convert]
  )

  useConvertPageStatus(diagnostics, input.length, activeTab, outputActive)

  return (
    <div className="w-full space-y-4 px-12 py-4 sm:px-16 sm:py-6">
      {sharedStateRestored && (
        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span>{t.share.restored}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* 画面左右端のクリックゾーン（上下フルハイト）でステップを前後に切り替える */}
        <StepNavButton
          side="left"
          label={t.sheet.previousStep(stepTitle(previousStep))}
          pillLabel={stepTitle(previousStep)}
          active={hasContent && step === "input"}
          onClick={() => moveStep(-1)}
        />
        <StepNavButton
          side="right"
          label={t.sheet.nextStep(stepTitle(nextStep))}
          pillLabel={stepTitle(nextStep)}
          active={hasContent && step === "input"}
          onClick={() => moveStep(1)}
        />

        <div className="relative">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === "input" ? (
            <motion.div
              key="input"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative space-y-4"
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("Files")) {
                  e.preventDefault()
                  setIsDraggingFile(true)
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setIsDraggingFile(false)
                }
              }}
              onDrop={(e) => {
                if (e.dataTransfer.types.includes("Files")) {
                  e.preventDefault()
                  setIsDraggingFile(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) void handleExcelUpload(file)
                }
              }}
            >
              {isDraggingFile && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-md bg-background/90 px-4 py-2 text-sm font-medium shadow-sm">
                    <Upload className="h-4 w-4 text-primary" />
                    {t.convert.dropExcel}
                  </div>
                </div>
              )}
              <InputStep
                input={input}
                onInputChange={setInput}
                diagnostics={diagnostics}
                fileInputRef={fileInputRef}
                onExcelUpload={(file) => void handleExcelUpload(file)}
                onShare={() => setShareDialogOpen(true)}
                showInputSettings={showInputSettings}
                onToggleInputSettings={() => setShowInputSettings((v) => !v)}
                table={table}
                onTableChange={updateTable}
              />
            </motion.div>
          ) : step === "sheet" ? (
            <motion.div
              key="sheet"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <Suspense fallback={<PanelFallback minHeight={420} />}>
                <SheetEditor
                  ref={sheetEditorRef}
                  input={input}
                  pendingImport={pendingImport}
                  onImported={() => setPendingImport(null)}
                />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="convert"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              ref={split.containerRef}
              className="grid gap-4 xl:[grid-template-columns:minmax(460px,var(--result-width))_0.75rem_minmax(360px,var(--pdf-width))]"
              style={{
                "--result-width": `${split.width}%`,
                "--pdf-width": `${100 - split.width}%`,
              } as CSSProperties}
            >
              <motion.div variants={itemVariants} className="h-full">
                <OutputPanel
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  csvOut={csvOut}
                  latexOut={latexOut}
                  onLatexChange={setLatexOut}
                  tikzOut={tikzOut}
                  onTikzChange={setTikzOut}
                  gnuplotOut={gnuplotOut}
                  onGnuplotChange={setGnuplotOut}
                  preview={preview}
                  cooldown={cooldown}
                  tikz={tikz}
                  onTikzSettingsChange={updateTikz}
                  gnuplot={gnuplot}
                  onGnuplotSettingsChange={updateGnuplot}
                  showTikzSettings={showTikzSettings}
                  onToggleTikzSettings={() => setShowTikzSettings((v) => !v)}
                  showGnuplotSettings={showGnuplotSettings}
                  onToggleGnuplotSettings={() => setShowGnuplotSettings((v) => !v)}
                  seriesCount={seriesCount}
                  seriesNames={seriesNames}
                  gnuplotRendering={gnuplotRendering}
                />
              </motion.div>

              <div
                role="separator"
                aria-label={t.convert.splitResizeLabel}
                aria-orientation="vertical"
                aria-valuemin={split.min}
                aria-valuemax={split.max}
                aria-valuenow={split.width}
                tabIndex={0}
                {...split.separatorProps}
                className={`hidden cursor-col-resize touch-none items-stretch justify-center rounded-md transition-colors xl:flex ${
                  split.isResizing ? "bg-primary/15" : "hover:bg-accent"
                }`}
                title={t.convert.splitResizeTitle}
              >
                <span className="my-4 w-1 rounded-full bg-border" />
              </div>

              <motion.div variants={itemVariants} className="h-full">
                <PreviewPanel
                  activeTab={activeTab}
                  preview={preview}
                  gnuplotSvg={gnuplotSvg}
                  gnuplotRendering={gnuplotRendering}
                  gnuplotError={gnuplotErr}
                  onImageActionError={markImageActionFailed}
                />
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {preview.pending !== null && (
        <Suspense fallback={null}>
          <PreviewConsentDialog
            open
            onCancel={preview.cancelConsent}
            onAccept={preview.acceptConsent}
          />
        </Suspense>
      )}
      {shareDialogOpen && (
        <Suspense fallback={null}>
          <ShareDialog
            open
            onClose={() => setShareDialogOpen(false)}
            url={shareUrl}
            copied={copied}
            onCopy={copyShareUrl}
          />
        </Suspense>
      )}
    </div>
  )
}
