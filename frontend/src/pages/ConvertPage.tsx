import { lazy, Suspense, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Link2, LoaderCircle, Settings2, Upload } from "lucide-react"
import readXlsxFile from "read-excel-file/browser"

import { CopyButton } from "@/components/convert/CopyButton"
import { LandingSeoContent } from "@/components/LandingSeoContent"
import { PasteInput } from "@/components/convert/PasteInput"
import type { PendingSheetImport } from "@/components/convert/SheetEditor"
import { Loader } from "@/components/animate-ui/components/loader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
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

const OUTPUT_MIN_HEIGHT = 273
const SITE_URL = "https://convertexcel.net/"
const convertUrls = localizedSiteUrls(SITE_URL, "/")
const CodeAssistEditor = lazy(() =>
  import("@/components/CodeAssistEditor").then((module) => ({
    default: module.CodeAssistEditor,
  }))
)
const ShareDialog = lazy(() =>
  import("@/components/ShareDialog").then((module) => ({
    default: module.ShareDialog,
  }))
)
const CsvActions = lazy(() =>
  import("@/components/convert/CsvActions").then((module) => ({
    default: module.CsvActions,
  }))
)
const SheetEditor = lazy(() =>
  import("@/components/convert/SheetEditor").then((module) => ({
    default: module.SheetEditor,
  }))
)
const GnuplotPreviewPane = lazy(() =>
  import("@/components/convert/GnuplotPreviewPane").then((module) => ({
    default: module.GnuplotPreviewPane,
  }))
)
const GnuplotSettingsPanel = lazy(() =>
  import("@/components/convert/GnuplotSettingsPanel").then((module) => ({
    default: module.GnuplotSettingsPanel,
  }))
)
const InputSettingsPanel = lazy(() =>
  import("@/components/convert/InputSettingsPanel").then((module) => ({
    default: module.InputSettingsPanel,
  }))
)
const PreviewConsentDialog = lazy(() =>
  import("@/components/convert/PreviewConsentDialog").then((module) => ({
    default: module.PreviewConsentDialog,
  }))
)
const PreviewErrorPanel = lazy(() =>
  import("@/components/convert/PreviewErrorPanel").then((module) => ({
    default: module.PreviewErrorPanel,
  }))
)
const TikzSettingsPanel = lazy(() =>
  import("@/components/convert/TikzSettingsPanel").then((module) => ({
    default: module.TikzSettingsPanel,
  }))
)
type CodeAssistKind = "latex" | "tikz" | "gnuplot"

function EditorFallback({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="rounded-md border bg-muted/30"
      style={{ minHeight }}
      aria-hidden="true"
    />
  )
}

function PanelFallback({ minHeight = 48 }: { minHeight?: number }) {
  return (
    <div
      className="rounded-md border bg-muted/30"
      style={{ minHeight }}
      aria-hidden="true"
    />
  )
}

function OutputCodeEditor({
  kind,
  value,
  onChange,
  minHeight,
}: {
  kind: CodeAssistKind
  value: string
  onChange: (value: string) => void
  minHeight: number
}) {
  return (
    <Suspense fallback={<EditorFallback minHeight={minHeight} />}>
      <CodeAssistEditor kind={kind} value={value} onChange={onChange} minHeight={minHeight} />
    </Suspense>
  )
}

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
        <button
          type="button"
          aria-label={t.sheet.previousStep(stepTitle(previousStep))}
          onClick={() => moveStep(-1)}
          className={`group fixed inset-y-0 left-0 z-20 flex w-10 items-center justify-start gap-2 pl-0.5 transition-colors sm:w-14 ${
            hasContent && step === "input"
              ? "hover:bg-gradient-to-r hover:from-primary/[0.08] hover:to-transparent"
              : "hover:bg-gradient-to-r hover:from-foreground/[0.05] hover:to-transparent"
          }`}
        >
          <span
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all group-hover:scale-105 ${
              hasContent && step === "input"
                ? "border-primary bg-primary text-primary-foreground opacity-100"
                : "bg-background/80 text-muted-foreground opacity-60 group-hover:text-foreground group-hover:opacity-100"
            }`}
          >
            {hasContent && step === "input" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" aria-hidden="true" />
            )}
            <ChevronLeft className="relative h-5 w-5" />
          </span>
          {hasContent && step === "input" && (
            <span className="hidden shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm lg:inline">
              {t.sheet.title}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label={t.sheet.nextStep(stepTitle(nextStep))}
          onClick={() => moveStep(1)}
          className={`group fixed inset-y-0 right-0 z-20 flex w-10 items-center justify-end gap-2 pr-0.5 transition-colors sm:w-14 ${
            hasContent && step === "input"
              ? "hover:bg-gradient-to-l hover:from-primary/[0.08] hover:to-transparent"
              : "hover:bg-gradient-to-l hover:from-foreground/[0.05] hover:to-transparent"
          }`}
        >
          {hasContent && step === "input" && (
            <span className="hidden rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm lg:inline">
              {t.convert.outputTitle}
            </span>
          )}
          <span
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all group-hover:scale-105 ${
              hasContent && step === "input"
                ? "border-primary bg-primary text-primary-foreground opacity-100"
                : "bg-background/80 text-muted-foreground opacity-60 group-hover:text-foreground group-hover:opacity-100"
            }`}
          >
            {hasContent && step === "input" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" aria-hidden="true" />
            )}
            <ChevronRight className="relative h-5 w-5" />
          </span>
        </button>

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
              <motion.header variants={itemVariants} className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                  {t.convert.eyebrow}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">{t.convert.title}</h1>
                <p className="text-muted-foreground text-sm">{t.convert.intro}</p>
              </motion.header>
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">{t.convert.inputTitle}</h2>
                    <p className="text-muted-foreground text-sm">{t.convert.pasteDescription}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleExcelUpload(file)
                        e.target.value = ""
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      title={t.convert.uploadExcelTitle}
                      className="gap-1.5 text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" /> {t.convert.uploadExcel}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareDialogOpen(true)}
                      title={t.convert.shareTitle}
                      className="gap-1.5 text-xs"
                    >
                      <Link2 className="h-3.5 w-3.5" /> {t.convert.share}
                    </Button>
                  </div>
                </div>

                <PasteInput
                  value={input}
                  onChange={setInput}
                  diagnostics={diagnostics}
                  placeholder={t.convert.pasteDescription}
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowInputSettings((v) => !v)}
                    title={`${showInputSettings ? t.convert.hideInputSettings : t.convert.showInputSettings} (Alt+I)`}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span>{showInputSettings ? t.convert.hideInputSettings : t.convert.showInputSettings}</span>
                  </Button>
                </div>
                {showInputSettings && (
                  <Suspense fallback={<PanelFallback />}>
                    <InputSettingsPanel value={table} onChange={updateTable} />
                  </Suspense>
                )}
              </motion.div>

              {language === "ja" && <LandingSeoContent />}
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
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t.convert.outputTitle}</CardTitle>
            <CardDescription>{t.convert.outputDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<PanelFallback />}>
              <CsvActions value={csvOut} />
            </Suspense>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OutputTab)}>
              <TabsList className="flex w-full justify-start overflow-x-auto">
                <TabsTrigger value="latex" title="Alt+1">table.tex</TabsTrigger>
                <TabsTrigger value="tikz" title="Alt+2">plot.pgfplots</TabsTrigger>
                <TabsTrigger value="gnuplot" title="Alt+3">plot.gp</TabsTrigger>
              </TabsList>
              <TabsContent value="latex" className="space-y-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <RippleButton size="sm" onClick={preview.requestPreview} disabled={!preview.canPreviewLatex} title={`${t.convert.previewTable} (Ctrl+Enter)`}>
                    <FileText className="h-4 w-4" />
                    <span>{t.convert.previewTable}</span>
                  </RippleButton>
                  <CopyButton value={latexOut} label={t.convert.copyTable} />
                  {cooldown > 0 && <span className="text-muted-foreground self-center text-sm">{t.convert.cooldown(cooldown)}</span>}
                </div>
                <div>
                  <OutputCodeEditor
                    kind="latex"
                    value={latexOut}
                    onChange={setLatexOut}
                    minHeight={OUTPUT_MIN_HEIGHT}
                  />
                </div>
              </TabsContent>
              <TabsContent value="tikz" className="space-y-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTikzSettings((v) => !v)}
                    title={`${showTikzSettings ? t.convert.hideTikzSettings : t.convert.showTikzSettings} (Alt+G)`}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span>{showTikzSettings ? t.convert.hideTikzSettings : t.convert.showTikzSettings}</span>
                  </Button>
                  <RippleButton size="sm" onClick={preview.requestPreview} disabled={!preview.canPreviewTikz} title={`${t.convert.previewGraph} (Ctrl+Enter)`}>
                    <FileText className="h-4 w-4" />
                    <span>{t.convert.previewGraph}</span>
                  </RippleButton>
                  <CopyButton value={tikzOut} label={t.convert.copyPlot} />
                  {cooldown > 0 && <span className="text-muted-foreground self-center text-sm">{t.convert.cooldown(cooldown)}</span>}
                </div>
                {showTikzSettings && (
                  <Suspense fallback={<PanelFallback />}>
                    <TikzSettingsPanel
                      value={tikz}
                      onChange={updateTikz}
                      seriesCount={seriesCount}
                      seriesNames={seriesNames}
                    />
                  </Suspense>
                )}
                <div>
                  <OutputCodeEditor
                    kind="tikz"
                    value={tikzOut}
                    onChange={setTikzOut}
                    minHeight={OUTPUT_MIN_HEIGHT}
                  />
                </div>
              </TabsContent>
              <TabsContent value="gnuplot" className="space-y-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowGnuplotSettings((v) => !v)}
                    title={`${showGnuplotSettings ? t.convert.hideTikzSettings : t.convert.showTikzSettings} (Alt+G)`}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span>{showGnuplotSettings ? t.convert.hideTikzSettings : t.convert.showTikzSettings}</span>
                  </Button>
                  <RippleButton size="sm" onClick={preview.requestPreview} disabled={gnuplotRendering || !preview.canPreviewGnuplot} title={`${t.convert.previewGnuplot} (Ctrl+Enter)`}>
                    {gnuplotRendering ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    <span>{t.convert.previewGnuplot}</span>
                  </RippleButton>
                  <CopyButton value={gnuplotOut} label={t.convert.copyPlotGnuplot} />
                </div>
                {showGnuplotSettings && (
                  <Suspense fallback={<PanelFallback />}>
                    <GnuplotSettingsPanel value={gnuplot} onChange={updateGnuplot} />
                  </Suspense>
                )}
                <div>
                  <OutputCodeEditor
                    kind="gnuplot"
                    value={gnuplotOut}
                    onChange={setGnuplotOut}
                    minHeight={OUTPUT_MIN_HEIGHT}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t.convert.pdfTitle}</CardTitle>
            <CardDescription>
              {activeTab === "gnuplot" ? t.convert.gnuplotPreviewDescription : t.convert.pdfDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTab === "gnuplot" ? (
              <Suspense fallback={<PanelFallback minHeight={420} />}>
                <GnuplotPreviewPane
                  svg={gnuplotSvg}
                  rendering={gnuplotRendering}
                  error={gnuplotErr}
                  onImageActionError={markImageActionFailed}
                />
              </Suspense>
            ) : (
            <>
            {preview.previewStatus.phase !== "idle" && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-md border bg-muted/40 px-3 py-2"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    {preview.previewStatus.phase === "complete" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Loader size={5} className="shrink-0 text-info" />
                    )}
                    <span className="truncate">
                      {preview.previewStatus.phase === "complete"
                        ? t.convert.previewComplete
                        : t.convert.previewProgress(
                            preview.previewStatus.kind === "tikz" ? t.convert.previewKindGraph : t.convert.previewKindTable,
                          )}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {preview.previewStatus.progress}%
                  </span>
                </div>
                <Progress
                  value={preview.previewStatus.progress}
                  aria-label={t.convert.previewProgressLabel}
                  className="h-1.5 bg-background [&_[data-slot=progress-indicator]]:bg-info [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out"
                />
              </div>
            )}
            {preview.previewError && (
              <Suspense fallback={null}>
                <PreviewErrorPanel error={preview.previewError} onDismiss={preview.dismissPreviewError} />
              </Suspense>
            )}
            <iframe
              ref={preview.iframeRef}
              name="tex-iframe"
              title="LaTeX PDF preview"
              className="h-[420px] w-full rounded-md border xl:h-[760px] dark:[filter:invert(1)_hue-rotate(180deg)]"
              onLoad={preview.finishPreviewLoad}
            />
            </>
            )}
          </CardContent>
        </Card>
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
