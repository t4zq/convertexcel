import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/hooks/useI18n"
import type { GnuplotSettings } from "@/lib/convert-settings"

// gnuplot の `set key` 引数。ラベルは i18n、値はそのままスクリプトへ渡す。
const KEY_POS = [
  "left top", "right top", "left bottom", "right bottom",
  "top center", "bottom center", "outside", "off",
]

// pointtype。0 = 既定（gnuplot に任せる）。値は SVG 端末の代表的な形状。
const POINT_TYPES: [number, string][] = [
  [0, "auto"],
  [1, "+"],
  [2, "×"],
  [3, "*"],
  [4, "□"],
  [5, "■"],
  [6, "○"],
  [7, "●"],
  [8, "△"],
  [9, "▲"],
]

interface GnuplotSettingsPanelProps {
  value: GnuplotSettings
  onChange: (patch: Partial<GnuplotSettings>) => void
}

export function GnuplotSettingsPanel({ value, onChange }: GnuplotSettingsPanelProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="gp-title">{t.settings.graphTitle}</Label>
          <Input
            id="gp-title"
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <Label>{t.settings.keyPos}</Label>
          <Select value={value.keyPos} onValueChange={(v) => onChange({ keyPos: v })}>
            <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KEY_POS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1">
          <Label>{t.settings.pointType}</Label>
          <Select
            value={String(value.pointType)}
            onValueChange={(v) => onChange({ pointType: Number(v) })}
          >
            <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POINT_TYPES.map(([pt, label]) => (
                <SelectItem key={pt} value={String(pt)}>
                  {pt === 0 ? t.settings.auto : `${pt} ${label}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="gp-ps">{t.settings.pointSize}</Label>
          <Input
            id="gp-ps"
            type="number"
            min={0}
            step={0.5}
            placeholder={t.settings.auto}
            value={value.pointSize || ""}
            onChange={(e) => onChange({ pointSize: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
      </div>
      <Label className="flex w-fit items-center gap-2">
        <Switch checked={value.grid} onCheckedChange={(c) => onChange({ grid: c })} />
        <span>{t.settings.grid}</span>
      </Label>
      <Label className="flex w-fit items-center gap-2">
        <Switch checked={value.autoPreview} onCheckedChange={(c) => onChange({ autoPreview: c })} />
        <span>{t.settings.autoPreview}</span>
      </Label>
    </div>
  )
}
