import { lazy, Suspense } from "react"
import { useReducedMotion } from "motion/react"
import { FileText, LoaderCircle, Settings2 } from "lucide-react"

import { CopyButton } from "@/components/convert/CopyButton"
import { OutputCodeEditor, PanelFallback, SettingsReveal } from "@/components/convert/panels"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { useI18n } from "@/hooks/useI18n"
import type { OutputTab, usePreviewSubmission } from "@/hooks/usePreviewSubmission"
import type { GnuplotSettings, TikzSettings } from "@/lib/convert-settings"

const CsvActions = lazy(() =>
  import("@/components/convert/CsvActions").then((module) => ({
    default: module.CsvActions,
  }))
)
const GnuplotSettingsPanel = lazy(() =>
  import("@/components/convert/GnuplotSettingsPanel").then((module) => ({
    default: module.GnuplotSettingsPanel,
  }))
)
const TikzSettingsPanel = lazy(() =>
  import("@/components/convert/TikzSettingsPanel").then((module) => ({
    default: module.TikzSettingsPanel,
  }))
)

const OUTPUT_MIN_HEIGHT = 273

type OutputPanelProps = {
  activeTab: OutputTab
  onTabChange: (tab: OutputTab) => void
  csvOut: string
  latexOut: string
  onLatexChange: (value: string) => void
  tikzOut: string
  onTikzChange: (value: string) => void
  gnuplotOut: string
  onGnuplotChange: (value: string) => void
  preview: ReturnType<typeof usePreviewSubmission>
  cooldown: number
  tikz: TikzSettings
  onTikzSettingsChange: (patch: Partial<TikzSettings>) => void
  gnuplot: GnuplotSettings
  onGnuplotSettingsChange: (patch: Partial<GnuplotSettings>) => void
  showTikzSettings: boolean
  onToggleTikzSettings: () => void
  showGnuplotSettings: boolean
  onToggleGnuplotSettings: () => void
  seriesCount: number
  seriesNames: string[]
  gnuplotRendering: boolean
}

export function OutputPanel({
  activeTab,
  onTabChange,
  csvOut,
  latexOut,
  onLatexChange,
  tikzOut,
  onTikzChange,
  gnuplotOut,
  onGnuplotChange,
  preview,
  cooldown,
  tikz,
  onTikzSettingsChange,
  gnuplot,
  onGnuplotSettingsChange,
  showTikzSettings,
  onToggleTikzSettings,
  showGnuplotSettings,
  onToggleGnuplotSettings,
  seriesCount,
  seriesNames,
  gnuplotRendering,
}: OutputPanelProps) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t.convert.outputTitle}</CardTitle>
        <CardDescription>{t.convert.outputDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<PanelFallback />}>
          <CsvActions value={csvOut} />
        </Suspense>
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as OutputTab)}>
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
                onChange={onLatexChange}
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
                onClick={onToggleTikzSettings}
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
            <SettingsReveal open={showTikzSettings} reducedMotion={reducedMotion}>
              <Suspense fallback={<PanelFallback />}>
                <TikzSettingsPanel
                  value={tikz}
                  onChange={onTikzSettingsChange}
                  seriesCount={seriesCount}
                  seriesNames={seriesNames}
                />
              </Suspense>
            </SettingsReveal>
            <div>
              <OutputCodeEditor
                kind="tikz"
                value={tikzOut}
                onChange={onTikzChange}
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
                onClick={onToggleGnuplotSettings}
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
            <SettingsReveal open={showGnuplotSettings} reducedMotion={reducedMotion}>
              <Suspense fallback={<PanelFallback />}>
                <GnuplotSettingsPanel value={gnuplot} onChange={onGnuplotSettingsChange} />
              </Suspense>
            </SettingsReveal>
            <div>
              <OutputCodeEditor
                kind="gnuplot"
                value={gnuplotOut}
                onChange={onGnuplotChange}
                minHeight={OUTPUT_MIN_HEIGHT}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
