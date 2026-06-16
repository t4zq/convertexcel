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
import { ASYMPTOTE_FIT } from "@/lib/bode"
import { DEFAULT_BODE_SETTINGS, type BodeSettings, type GnuplotSettings, type TikzSettings } from "@/lib/convert-settings"

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

type ColumnOption = { value: string; label: string }
type BodeRole = "none" | "frequency" | "vin" | "vout" | "gain" | "phase" | "delay"

const BODE_ROLE_FIELDS: Record<Exclude<BodeRole, "none">, keyof BodeSettings> = {
  frequency: "frequencyColumn",
  vin: "vinColumn",
  vout: "voutColumn",
  gain: "gainColumn",
  phase: "phaseColumn",
  delay: "delayColumn",
}

function clearBodeColumn(settings: BodeSettings, column: string): BodeSettings {
  const next = { ...settings }
  if (next.frequencyColumn === column) next.frequencyColumn = "none"
  if (next.vinColumn === column) next.vinColumn = "none"
  if (next.voutColumn === column) next.voutColumn = "none"
  if (next.gainColumn === column) next.gainColumn = "none"
  if (next.phaseColumn === column) next.phaseColumn = "none"
  if (next.delayColumn === column) next.delayColumn = "none"
  return next
}

function assignBodeRole(settings: BodeSettings, role: Exclude<BodeRole, "none">, column: string): BodeSettings {
  const next = { ...settings }
  if (role === "frequency") next.frequencyColumn = column
  if (role === "vin") next.vinColumn = column
  if (role === "vout") next.voutColumn = column
  if (role === "gain") next.gainColumn = column
  if (role === "phase") next.phaseColumn = column
  if (role === "delay") next.delayColumn = column
  return next
}

interface GnuplotSettingsPanelProps {
  value: GnuplotSettings
  onChange: (patch: Partial<GnuplotSettings>) => void
  tikzValue?: TikzSettings
  onTikzChange?: (patch: Partial<TikzSettings>) => void
  bodeColumnOptions?: ColumnOption[]
}

export function GnuplotSettingsPanel({
  value,
  onChange,
  tikzValue,
  onTikzChange,
  bodeColumnOptions = [],
}: GnuplotSettingsPanelProps) {
  const { t } = useI18n()
  const bode: BodeSettings = { ...DEFAULT_BODE_SETTINGS, ...(tikzValue?.bode ?? {}) }
  const fitMethods: [string, string][] = [
    ["none", t.settings.none],
    [ASYMPTOTE_FIT, t.settings.bodeAsymptote],
    ["auto", t.settings.auto],
    ["linear", t.settings.linear],
    ["quadratic", t.settings.quadratic],
    ["cubic", t.settings.cubic],
    ["exponential", t.settings.exponential],
    ["logarithmic", t.settings.logarithmic],
    ["power", t.settings.power],
  ]
  // 折れ線近似などの近似手法。styleIndex 0 = gain, 1 = phase。
  const methods = Array.isArray(tikzValue?.fitMethods) ? tikzValue.fitMethods : []
  const fitAt = (index: number) => methods[index] ?? methods[0] ?? "auto"
  const setFitAt = (index: number, v: string) => {
    if (!onTikzChange) return
    const length = Math.max(methods.length, index + 1, 2)
    const next = Array.from({ length }, (_, k) => fitAt(k))
    next[index] = v
    onTikzChange({ fitMethods: next })
  }
  const bodeStyleIndexForColumn = (column: string): number | null => {
    if (bode.gainColumn === column) return 0
    if (bode.phaseColumn === column) return 1
    return null
  }
  const bodeRoleLabels: Record<BodeRole, string> = {
    none: t.settings.unused,
    frequency: t.settings.frequencyColumn,
    vin: t.settings.inputVoltageColumn,
    vout: t.settings.outputVoltageColumn,
    gain: t.settings.gainColumn,
    phase: t.settings.phaseColumn,
    delay: t.settings.delayColumn,
  }

  const updateBode = (patch: Partial<BodeSettings>) => {
    if (!onTikzChange) return
    onTikzChange({ bode: { ...bode, ...patch } })
  }
  const setBodeEnabled = (enabled: boolean) => {
    if (!onTikzChange) return
    onTikzChange({
      ...(enabled
        ? {
            scaleMode: "xlog",
            // 既定で gain・phase 列を折れ線近似にする。
            fitMethods: [ASYMPTOTE_FIT, ASYMPTOTE_FIT],
            xLabel: "frequency [Hz]",
            yLabel: "gain [dB] / phase [deg]",
          }
        : {}),
      bode: { ...bode, enabled },
    })
  }
  const roleForColumn = (column: string): BodeRole => {
    const match = Object.entries(BODE_ROLE_FIELDS).find(([, field]) => bode[field] === column)
    return (match?.[0] as BodeRole | undefined) ?? "none"
  }
  const setRoleForColumn = (column: string, role: BodeRole) => {
    const next = clearBodeColumn(bode, column)
    updateBode(role === "none" ? next : assignBodeRole(next, role, column))
  }
  return (
    <div className="space-y-3">
      {tikzValue && onTikzChange && (
        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Label className="flex w-fit items-center gap-2">
              <Switch checked={bode.enabled} onCheckedChange={setBodeEnabled} />
              <span>{t.settings.bodeMode}</span>
            </Label>
          </div>
        </div>
      )}
      {tikzValue && onTikzChange && bode.enabled && bodeColumnOptions.length > 0 && (
        <div className="space-y-2">
          <Label>{t.settings.columnSettings}</Label>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-[44rem] w-full border-collapse text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="w-28 border-r px-2 py-2 text-left font-medium">{t.settings.column}</th>
                  <th className="min-w-40 border-r px-2 py-2 text-left font-medium">{t.settings.seriesName}</th>
                  <th className="min-w-56 border-r px-2 py-2 text-left font-medium">{t.settings.bodeColumnSettings}</th>
                  <th className="min-w-40 px-2 py-2 text-left font-medium">{t.settings.fit}</th>
                </tr>
              </thead>
              <tbody>
                {bodeColumnOptions.map((option) => {
                  const styleIndex = bodeStyleIndexForColumn(option.value)
                  return (
                  <tr key={option.value} className="border-t">
                    <td className="border-r px-2 py-2 text-muted-foreground">{option.value}</td>
                    <td className="border-r px-2 py-2">
                      <span className="block max-w-52 truncate" title={option.label}>{option.label}</span>
                    </td>
                    <td className="border-r px-2 py-2">
                      <Select value={roleForColumn(option.value)} onValueChange={(role) => setRoleForColumn(option.value, role as BodeRole)}>
                        <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(bodeRoleLabels).map(([role, label]) => (
                            <SelectItem key={role} value={role}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      {styleIndex === null ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <Select value={fitAt(styleIndex)} onValueChange={(v) => setFitAt(styleIndex, v)}>
                          <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {fitMethods.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
