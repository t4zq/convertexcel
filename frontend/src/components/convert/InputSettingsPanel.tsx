import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import type { TableSettings } from "@/lib/convert-settings"

interface InputSettingsPanelProps {
  value: TableSettings
  onChange: (patch: Partial<TableSettings>) => void
}

export function InputSettingsPanel({ value, onChange }: InputSettingsPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1fr)_minmax(220px,0.8fr)]">
      <div className="space-y-2">
        <Label>丸め</Label>
        <RadioGroup
          value={value.roundMode}
          onValueChange={(v) => onChange({ roundMode: v as TableSettings["roundMode"] })}
          className="flex flex-wrap gap-4"
        >
          {[
            ["none", "なし"],
            ["decimal", "小数点"],
            ["sig-figs", "有効数字"],
          ].map(([v, label]) => (
            <label key={v} className="flex items-center gap-1.5 text-sm">
              <RadioGroupItem value={v} /> {label}
            </label>
          ))}
        </RadioGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="decimals">小数点桁</Label>
          <Input id="decimals" type="number" min={0} value={value.decimals} onChange={(e) => onChange({ decimals: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sigfigs">有効数字</Label>
          <Input id="sigfigs" type="number" min={1} value={value.sigFigs} onChange={(e) => onChange({ sigFigs: Number(e.target.value) })} />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.hasHeader} onCheckedChange={(v) => onChange({ hasHeader: v })} /> ヘッダー行あり</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.cleanInput} onCheckedChange={(v) => onChange({ cleanInput: v })} /> 入力を正規化</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.booktabs} onCheckedChange={(v) => onChange({ booktabs: v })} /> booktabs 表</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={value.siunitx} onCheckedChange={(v) => onChange({ siunitx: v })} /> siunitx（単位・桁揃え）</label>
      </div>
    </div>
  )
}
