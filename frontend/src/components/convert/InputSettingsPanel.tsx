import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/hooks/useI18n"
import type { TableSettings } from "@/lib/convert-settings"

interface InputSettingsPanelProps {
  value: TableSettings
  onChange: (patch: Partial<TableSettings>) => void
}

export function InputSettingsPanel({ value, onChange }: InputSettingsPanelProps) {
  const { t } = useI18n()

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1fr)_minmax(220px,0.8fr)]">
      <div className="space-y-2">
        <Label>{t.settings.rounding}</Label>
        <RadioGroup
          value={value.roundMode}
          onValueChange={(v) => onChange({ roundMode: v as TableSettings["roundMode"] })}
          className="flex flex-wrap gap-4"
        >
          {[
            ["none", t.settings.none],
            ["decimal", t.settings.decimal],
            ["sig-figs", t.settings.sigFigs],
          ].map(([v, label]) => (
            <label key={v} className="flex items-center gap-1.5 text-sm">
              <RadioGroupItem value={v} /> {label}
            </label>
          ))}
        </RadioGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="decimals">{t.settings.decimals}</Label>
          <Input id="decimals" type="number" min={0} value={value.decimals} onChange={(e) => onChange({ decimals: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sigfigs">{t.settings.sigFigs}</Label>
          <Input id="sigfigs" type="number" min={1} value={value.sigFigs} onChange={(e) => onChange({ sigFigs: Number(e.target.value) })} />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.hasHeader} onCheckedChange={(v) => onChange({ hasHeader: v })} /> {t.settings.hasHeader}</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.cleanInput} onCheckedChange={(v) => onChange({ cleanInput: v })} /> {t.settings.cleanInput}</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.booktabs} onCheckedChange={(v) => onChange({ booktabs: v })} /> {t.settings.booktabs}</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.siunitx} onCheckedChange={(v) => onChange({ siunitx: v })} /> {t.settings.siunitx}</label>
      </div>
    </div>
  )
}
