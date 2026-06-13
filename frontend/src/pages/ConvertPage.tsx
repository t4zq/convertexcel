import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ClipboardPaste, FileText, Link2, Settings2, Table2 } from "lucide-react"

import { CodeAssistEditor } from "@/components/CodeAssistEditor"
import { ShareDialog } from "@/components/ShareDialog"
import { CopyButton } from "@/components/convert/CopyButton"
import { CsvActions } from "@/components/convert/CsvActions"
import { DataEntryForm } from "@/components/convert/DataEntryForm"
import { InputDiagnosticsPanel } from "@/components/convert/InputDiagnosticsPanel"
import { InputSettingsPanel } from "@/components/convert/InputSettingsPanel"
import { PreviewConsentDialog } from "@/components/convert/PreviewConsentDialog"
import { TikzSettingsPanel } from "@/components/convert/TikzSettingsPanel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { genCsvAttachment, isWasmAvailable } from "@/engine/loader"
import { useCollapsibleHeight } from "@/hooks/useCollapsibleHeight"
import { useConversionOutputs } from "@/hooks/useConversionOutputs"
import { useCooldown } from "@/hooks/useCooldown"
import { useI18n } from "@/hooks/useI18n"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { usePersistentState } from "@/hooks/usePersistentState"
import { useSeo } from "@/hooks/useSeo"
import { getSharedInput, useShareUrl } from "@/hooks/useShareUrl"
import { useSplitResize } from "@/hooks/useSplitResize"
import { useStatusSetter } from "@/hooks/useStatusBar"
import {
  DEFAULT_TABLE_SETTINGS,
  getDefaultTikzSettings,
  localizeDefaultTikzText,
  type TableSettings,
  type TikzSettings,
} from "@/lib/convert-settings"
import { diagnoseInput } from "@/lib/input-diagnostics"
import {
  COOLDOWN_SECONDS,
  submitToTexlive,
  wrapLatexDocument,
  wrapTikzDocument,
} from "@/lib/texlive"

const SAMPLE = `x\ty1\ty2
1\t2.3\t4.5
2\t3.1\t5.2
3\t4.8\t5.9
4\t6.0\t6.1
5\t7.2\t6.4`

const OUTPUT_MIN_HEIGHT = 273
const SITE_URL = "https://convertexcel.net/"

export default function ConvertPage() {
  const { language, t, seo: seoText } = useI18n()
  const canonical = language === "en" ? `${SITE_URL}en` : SITE_URL
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
      ja: SITE_URL,
      en: `${SITE_URL}en`,
      "x-default": SITE_URL,
    },
    schema: pageSchema,
  })

  const [input, setInput] = usePersistentState("convertexcel:input", "")
  const [table, setTable] = usePersistentState("convertexcel:table", DEFAULT_TABLE_SETTINGS)
  const [tikz, setTikz] = usePersistentState("convertexcel:tikz", getDefaultTikzSettings(language))
  const [inputMode, setInputMode] = useState<"paste" | "form">("paste")
  const [formKey, setFormKey] = useState(0)
  const [showInputSettings, setShowInputSettings] = useState(false)
  const [showTikzSettings, setShowTikzSettings] = useState(false)
  const [pending, setPending] = useState<null | "latex" | "tikz">(null)
  const [activeTab, setActiveTab] = useState<"latex" | "tikz">("latex")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const setStatus = useStatusSetter()

  const updateTable = (patch: Partial<TableSettings>) => setTable((s) => ({ ...s, ...patch }))
  const updateTikz = (patch: Partial<TikzSettings>) => setTikz((s) => ({ ...s, ...patch }))

  useEffect(() => {
    setTikz((current) => localizeDefaultTikzText(current, language))
  }, [language, setTikz])

  // 入力が空のときはサンプルを「透過した例」として表示する。
  // 出力・診断・PDF はこの実効ソースから生成し、ユーザーが入力すると実データに切り替わる。
  const isExample = input.trim() === ""
  const source = isExample ? SAMPLE : input

  const { latexOut, csvOut, tikzOut, setLatexOut, setTikzOut } = useConversionOutputs(source, table, tikz)
  const { cooldown, startCooldown } = useCooldown()
  const inputArea = useCollapsibleHeight()
  const split = useSplitResize()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const { copied, copyShareUrl, shareUrl } = useShareUrl(input)

  // 共有URLから入力を復元（localStorage より優先）。
  useEffect(() => {
    const shared = getSharedInput()
    if (shared !== null) setInput(shared)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreview = useCallback(() => {
    if (cooldown > 0) return
    const out = activeTab === "latex" ? latexOut : tikzOut
    if (!out.trim()) return
    setPending(activeTab)
  }, [cooldown, activeTab, latexOut, tikzOut])

  useKeyboardShortcuts({
    onPreview: handlePreview,
    onSwitchTab: setActiveTab,
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

  // 透過表示中のコードは閲覧用の例なので、編集や選択を無効化する。
  const ghost = isExample ? "pointer-events-none opacity-60 select-none" : undefined

  // WASM エンジンの利用可否（ステータスバー表示用）。
  const [engineReady, setEngineReady] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    isWasmAvailable().then((ok) => alive && setEngineReady(ok))
    return () => {
      alive = false
    }
  }, [])

  // ステータスバーへ現在の状態を公開する。
  useEffect(() => {
    setStatus({
      errors: diagnostics.problems.filter((p) => p.severity === "error").length,
      warnings: diagnostics.problems.filter((p) => p.severity === "warning").length,
      rows: diagnostics.rowCount,
      cols: diagnostics.maxCols,
      chars: input.length,
      activeOutput: activeTab === "latex" ? "table.tex" : "plot.pgfplots",
      engineReady,
    })
  }, [diagnostics, input, activeTab, engineReady, setStatus])

  async function doPreview(kind: "latex" | "tikz") {
    const iframeName = iframeRef.current?.name ?? "tex-iframe"
    if (kind === "latex") {
      if (!latexOut.trim()) return
      submitToTexlive(iframeName, wrapLatexDocument(latexOut), [])
    } else {
      if (!tikzOut.trim()) return
      const refs = Array.from(new Set([...tikzOut.matchAll(/\{([^{}]+\.csv)\}/g)].map((m) => m[1])))
      const csv = await genCsvAttachment(source, table.hasHeader, table.cleanInput)
      const extra = refs.map((name) => ({ name, contents: csv }))
      submitToTexlive(iframeName, wrapTikzDocument(tikzOut), extra)
    }
    startCooldown(COOLDOWN_SECONDS)
  }

  async function acceptConsent() {
    const kind = pending
    setPending(null)
    if (kind) await doPreview(kind)
  }

  return (
    <div className="w-full space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {t.convert.eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t.convert.title}</h1>
        <p className="text-muted-foreground text-sm">
          {t.convert.intro}
        </p>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{t.convert.inputTitle}</CardTitle>
                <CardDescription>
                  {inputMode === "paste"
                    ? t.convert.pasteDescription
                    : t.convert.formDescription}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md border bg-muted p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setInputMode("paste")}
                    title={t.convert.pasteTitle}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      inputMode === "paste"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ClipboardPaste className="h-3 w-3" />
                    {t.convert.paste}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormKey((k) => k + 1)
                      setInputMode("form")
                    }}
                    title={t.convert.formTitle}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      inputMode === "form"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Table2 className="h-3 w-3" />
                    {t.convert.form}
                  </button>
                </div>
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
          </CardHeader>
          {inputArea.visible && (
            <CardContent
              className="space-y-4 overflow-auto"
              style={{ maxHeight: `${inputArea.height}px` }}
            >
              {inputMode === "paste" ? (
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={SAMPLE}
                  rows={6}
                  spellCheck={false}
                  className="min-h-[120px] font-mono text-xs xl:min-h-[150px]"
                />
              ) : (
                <DataEntryForm
                  key={formKey}
                  initialValue={isExample ? SAMPLE : input}
                  onChange={setInput}
                />
              )}
              <InputDiagnosticsPanel diagnostics={diagnostics} />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowInputSettings((v) => !v)}
                  title={showInputSettings ? t.convert.hideInputSettings : t.convert.showInputSettings}
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only">{showInputSettings ? t.convert.hideInputSettings : t.convert.showInputSettings}</span>
                </Button>
              </div>
              {showInputSettings && <InputSettingsPanel value={table} onChange={updateTable} />}
            </CardContent>
          )}
        </Card>

        <div
          role="separator"
          aria-label={t.convert.inputResizeLabel}
          aria-orientation="horizontal"
          aria-valuemin={inputArea.min}
          aria-valuemax={inputArea.max}
          aria-valuenow={inputArea.visible ? inputArea.height : 0}
          tabIndex={0}
          {...inputArea.separatorProps}
          className={`flex h-5 cursor-row-resize touch-none items-center justify-center rounded-md transition-colors ${
            inputArea.isResizing ? "bg-primary/15" : "hover:bg-accent"
          }`}
          title={t.convert.inputResizeTitle}
        >
          <span className="h-1 w-full max-w-5xl rounded-full bg-border" />
        </div>

        <div
          ref={split.containerRef}
          className="grid gap-4 xl:[grid-template-columns:minmax(460px,var(--result-width))_0.75rem_minmax(360px,var(--pdf-width))]"
          style={{
            "--result-width": `${split.width}%`,
            "--pdf-width": `${100 - split.width}%`,
          } as CSSProperties}
        >
        <Card>
          <CardHeader>
            <CardTitle>{t.convert.outputTitle}</CardTitle>
            <CardDescription>{t.convert.outputDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CsvActions value={csvOut} />
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "latex" | "tikz")}>
              <TabsList className="flex w-full justify-start overflow-x-auto">
                <TabsTrigger value="latex" title="Alt+1">table.tex</TabsTrigger>
                <TabsTrigger value="tikz" title="Alt+2">plot.pgfplots</TabsTrigger>
              </TabsList>
              <TabsContent value="latex" className="space-y-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button size="icon" onClick={handlePreview} disabled={cooldown > 0 || !latexOut.trim()} title={`${t.convert.previewTable} (Ctrl+Enter)`}>
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">{t.convert.previewTable}</span>
                  </Button>
                  <CopyButton value={latexOut} label={t.convert.copyTable} />
                  {cooldown > 0 && <span className="text-muted-foreground self-center text-sm">{t.convert.cooldown(cooldown)}</span>}
                </div>
                <div className={ghost}>
                  <CodeAssistEditor kind="latex" value={latexOut} onChange={setLatexOut} minHeight={OUTPUT_MIN_HEIGHT} />
                </div>
              </TabsContent>
              <TabsContent value="tikz" className="space-y-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => setShowTikzSettings((v) => !v)}
                    title={showTikzSettings ? t.convert.hideTikzSettings : t.convert.showTikzSettings}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">{showTikzSettings ? t.convert.hideTikzSettings : t.convert.showTikzSettings}</span>
                  </Button>
                  <Button size="icon" onClick={handlePreview} disabled={cooldown > 0 || !tikzOut.trim()} title={`${t.convert.previewGraph} (Ctrl+Enter)`}>
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">{t.convert.previewGraph}</span>
                  </Button>
                  <CopyButton value={tikzOut} label={t.convert.copyPlot} />
                  {cooldown > 0 && <span className="text-muted-foreground self-center text-sm">{t.convert.cooldown(cooldown)}</span>}
                </div>
                {showTikzSettings && (
                  <TikzSettingsPanel
                    value={tikz}
                    onChange={updateTikz}
                    seriesCount={seriesCount}
                    seriesNames={seriesNames}
                  />
                )}
                <div className={ghost}>
                  <CodeAssistEditor kind="tikz" value={tikzOut} onChange={setTikzOut} minHeight={OUTPUT_MIN_HEIGHT} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle>{t.convert.pdfTitle}</CardTitle>
            <CardDescription>{t.convert.pdfDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              ref={iframeRef}
              name="tex-iframe"
              title="LaTeX PDF preview"
              className="h-[420px] w-full rounded-md border xl:h-[760px] dark:[filter:invert(1)_hue-rotate(180deg)]"
            />
          </CardContent>
        </Card>
        </div>
      </div>

      <PreviewConsentDialog
        open={pending !== null}
        onCancel={() => setPending(null)}
        onAccept={acceptConsent}
      />
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        url={shareUrl}
        copied={copied}
        onCopy={copyShareUrl}
      />
    </div>
  )
}
