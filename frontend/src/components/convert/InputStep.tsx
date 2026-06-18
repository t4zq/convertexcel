import { lazy, Suspense, useMemo, type RefObject } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Link2, Settings2, Upload } from "lucide-react"

import { LandingSeoContent } from "@/components/LandingSeoContent"
import { PasteInput } from "@/components/convert/PasteInput"
import { PanelFallback, SettingsReveal } from "@/components/convert/panels"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"
import type { TableSettings } from "@/lib/convert-settings"
import type { InputDiagnostics } from "@/lib/input-diagnostics"
import { stepItemVariants } from "@/lib/motion"

const InputSettingsPanel = lazy(() =>
  import("@/components/convert/InputSettingsPanel").then((module) => ({
    default: module.InputSettingsPanel,
  }))
)

type InputStepProps = {
  input: string
  onInputChange: (next: string) => void
  diagnostics: InputDiagnostics
  fileInputRef: RefObject<HTMLInputElement | null>
  onExcelUpload: (file: File) => void
  onShare: () => void
  showInputSettings: boolean
  onToggleInputSettings: () => void
  table: TableSettings
  onTableChange: (patch: Partial<TableSettings>) => void
}

export function InputStep({
  input,
  onInputChange,
  diagnostics,
  fileInputRef,
  onExcelUpload,
  onShare,
  showInputSettings,
  onToggleInputSettings,
  table,
  onTableChange,
}: InputStepProps) {
  const { language, t } = useI18n()
  const reducedMotion = useReducedMotion()
  const itemVariants = useMemo(() => stepItemVariants(reducedMotion), [reducedMotion])

  return (
    <>
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
                if (file) onExcelUpload(file)
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
              onClick={onShare}
              title={t.convert.shareTitle}
              className="gap-1.5 text-xs"
            >
              <Link2 className="h-3.5 w-3.5" /> {t.convert.share}
            </Button>
          </div>
        </div>

        <PasteInput
          value={input}
          onChange={onInputChange}
          diagnostics={diagnostics}
          placeholder={t.convert.pasteDescription}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onToggleInputSettings}
            title={`${showInputSettings ? t.convert.hideInputSettings : t.convert.showInputSettings} (Alt+I)`}
          >
            <Settings2 className="h-4 w-4" />
            <span>{showInputSettings ? t.convert.hideInputSettings : t.convert.showInputSettings}</span>
          </Button>
        </div>
        <SettingsReveal open={showInputSettings} reducedMotion={reducedMotion}>
          <Suspense fallback={<PanelFallback />}>
            <InputSettingsPanel value={table} onChange={onTableChange} />
          </Suspense>
        </SettingsReveal>
      </motion.div>

      {language === "ja" && <LandingSeoContent />}
    </>
  )
}
