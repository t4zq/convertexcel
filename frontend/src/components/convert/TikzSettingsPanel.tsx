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
import { DEFAULT_BODE_SETTINGS, type BodeSettings, type TikzSettings } from "@/lib/convert-settings"
import { SERIES_COLORS, SERIES_MARKS } from "@/lib/tikz-postprocess"
import { cn } from "@/lib/utils"

const LEGEND_POS = [
  "north west", "north east", "south west", "south east",
  "north", "south", "east", "west",
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

function FitMethodSelect({ value, onChange, methods }: { value: string; onChange: (v: string) => void; methods: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
      <SelectContent>
        {methods.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

interface TikzSettingsPanelProps {
  value: TikzSettings
  onChange: (patch: Partial<TikzSettings>) => void
  // y 系列数と、各系列の表示名（凡例用）。0/1 のときは一括の近似セレクタを出す。
  seriesCount: number
  seriesNames: string[]
  bodeColumnOptions?: ColumnOption[]
}

export function TikzSettingsPanel({
  value,
  onChange,
  seriesCount,
  seriesNames,
  bodeColumnOptions = [],
}: TikzSettingsPanelProps) {
  const { language, t } = useI18n()
  const colorLabel = (name: string, label: string) => language === "ja" ? label : name
  const bodeEnabled = value.bode?.enabled ?? false
  const fitMethods: [string, string][] = [
    ["none", t.settings.none],
    // 折れ線（漸近線）近似はボード線図モードのときだけ選べる。
    ...(bodeEnabled ? [[ASYMPTOTE_FIT, t.settings.bodeAsymptote] as [string, string]] : []),
    ["auto", t.settings.auto],
    ["linear", t.settings.linear],
    ["quadratic", t.settings.quadratic],
    ["cubic", t.settings.cubic],
    ["exponential", t.settings.exponential],
    ["logarithmic", t.settings.logarithmic],
    ["power", t.settings.power],
  ]

  // 旧バージョンの永続データでは fitMethods が無いことがあるため防御する。
  const methods = Array.isArray(value.fitMethods) ? value.fitMethods : []
  const fitAt = (i: number) => methods[i] ?? methods[0] ?? "auto"

  const colors = Array.isArray(value.seriesColors) ? value.seriesColors : []
  const marks  = Array.isArray(value.seriesMarks)  ? value.seriesMarks  : []
  const colorAt = (i: number) => colors[i] ?? "black"
  const markAt  = (i: number) => marks[i]  ?? "*"

  // 全系列を 1 つの値で一括設定する。
  const setFitAll = (v: string) => onChange({ fitMethods: [v] })

  // i 番目の系列だけ変更する。配列を系列数ぶんに広げてから書き換える。
  const setFitAt = (i: number, v: string) => {
    const next = Array.from({ length: seriesCount }, (_, k) => fitAt(k))
    next[i] = v
    onChange({ fitMethods: next })
  }

  const setColorAt = (i: number, v: string) => {
    const next = Array.from({ length: Math.max(seriesCount, i + 1) }, (_, k) => colorAt(k))
    next[i] = v
    onChange({ seriesColors: next })
  }

  const setMarkAt = (i: number, v: string) => {
    const next = Array.from({ length: Math.max(seriesCount, i + 1) }, (_, k) => markAt(k))
    next[i] = v
    onChange({ seriesMarks: next })
  }

  const perSeriesFit = seriesCount > 1
  const bode: BodeSettings = { ...DEFAULT_BODE_SETTINGS, ...(value.bode ?? {}) }
  const bodeRoleLabels: Record<BodeRole, string> = {
    none: t.settings.unused,
    frequency: t.settings.frequencyColumn,
    vin: t.settings.inputVoltageColumn,
    vout: t.settings.outputVoltageColumn,
    gain: t.settings.gainColumn,
    phase: t.settings.phaseColumn,
    delay: t.settings.delayColumn,
  }

  const updateBode = (patch: Partial<BodeSettings>) => onChange({ bode: { ...bode, ...patch } })
  const setBodeEnabled = (enabled: boolean) => onChange({
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
  const roleForColumn = (column: string): BodeRole => {
    const match = Object.entries(BODE_ROLE_FIELDS).find(([, field]) => bode[field] === column)
    return (match?.[0] as BodeRole | undefined) ?? "none"
  }
  const setRoleForColumn = (column: string, role: BodeRole) => {
    const next = clearBodeColumn(bode, column)
    updateBode(role === "none" ? next : assignBodeRole(next, role, column))
  }
  const bodeStyleIndexForColumn = (column: string): number | null => {
    const role = roleForColumn(column)
    if (role === "gain") return 0
    if (role === "phase") return 1
    return null
  }
  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Label className="flex w-fit items-center gap-2">
            <Switch checked={bode.enabled} onCheckedChange={setBodeEnabled} />
            <span>{t.settings.bodeMode}</span>
          </Label>
        </div>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="fn">{t.settings.filename}</Label>
          <Input id="fn" value={value.filename} onChange={(e) => onChange({ filename: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="fig">{t.settings.figureNumber}</Label>
          <Input id="fig" type="number" min={1} placeholder={t.settings.auto} value={value.figureNumber} onChange={(e) => onChange({ figureNumber: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label>{t.settings.legendPos}</Label>
          <Select value={value.legendPos} onValueChange={(v) => onChange({ legendPos: v })}>
            <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEGEND_POS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1">
          <Label>{t.settings.axisScale}</Label>
          <Select value={value.scaleMode} onValueChange={(v) => onChange({ scaleMode: v })}>
            <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">{t.settings.linear}</SelectItem>
              <SelectItem value="xlog">{t.settings.xlog}</SelectItem>
              <SelectItem value="semilog">{t.settings.semilog}</SelectItem>
              <SelectItem value="loglog">{t.settings.loglog}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!perSeriesFit && (
          <div className="min-w-0 space-y-1">
            <Label>{t.settings.fit}</Label>
            <FitMethodSelect value={fitAt(0)} onChange={setFitAll} methods={fitMethods} />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <Label htmlFor="unc">{t.settings.uncSigFigs}</Label>
          <Input
            id="unc"
            type="number"
            min={0}
            max={3}
            placeholder="0"
            value={value.uncSigFigs ?? 0}
            onChange={(e) => onChange({ uncSigFigs: Math.max(0, Math.min(3, Number(e.target.value) || 0)) })}
          />
        </div>
      </div>
      {(seriesCount > 0 || (bode.enabled && bodeColumnOptions.length > 0)) && (
        <div className="space-y-2">
          <Label>{t.settings.columnSettings}</Label>
          {bode.enabled && bodeColumnOptions.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-[72rem] w-full border-collapse text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="w-16 border-r px-2 py-2 text-left font-medium">{t.settings.column}</th>
                    <th className="min-w-40 border-r px-2 py-2 text-left font-medium">{t.settings.seriesName}</th>
                    <th className="min-w-56 border-r px-2 py-2 text-left font-medium">{t.settings.bodeColumnSettings}</th>
                    <th className="min-w-40 border-r px-2 py-2 text-left font-medium">{t.settings.fit}</th>
                    <th className="min-w-44 border-r px-2 py-2 text-left font-medium">{t.settings.color}</th>
                    <th className="min-w-32 px-2 py-2 text-left font-medium">{t.settings.marker}</th>
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
                        <td className="border-r px-2 py-2">
                          {styleIndex === null ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <FitMethodSelect value={fitAt(styleIndex)} onChange={(v) => setFitAt(styleIndex, v)} methods={fitMethods} />
                          )}
                        </td>
                        <td className="border-r px-2 py-2">
                          {styleIndex === null ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {SERIES_COLORS.map((c) => (
                                <button
                                  key={c.name}
                                  type="button"
                                  title={colorLabel(c.name, c.label)}
                                  onClick={() => setColorAt(styleIndex, c.name)}
                                  className={cn(
                                    "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                                    colorAt(styleIndex) === c.name ? "border-primary scale-110" : "border-transparent",
                                  )}
                                  style={{ backgroundColor: c.css }}
                                  aria-label={colorLabel(c.name, c.label)}
                                />
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {styleIndex === null ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-0.5">
                              {SERIES_MARKS.map((m) => (
                                <button
                                  key={m.value}
                                  type="button"
                                  title={m.value}
                                  onClick={() => setMarkAt(styleIndex, m.value)}
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
                                    markAt(styleIndex) === m.value
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-accent",
                                  )}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!bode.enabled && seriesCount > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-[46rem] w-full border-collapse text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="w-16 border-r px-2 py-2 text-left font-medium">{t.settings.column}</th>
                  <th className="min-w-36 border-r px-2 py-2 text-left font-medium">{t.settings.seriesName}</th>
                  <th className="min-w-40 border-r px-2 py-2 text-left font-medium">{t.settings.fit}</th>
                  <th className="min-w-44 border-r px-2 py-2 text-left font-medium">{t.settings.color}</th>
                  <th className="min-w-32 px-2 py-2 text-left font-medium">{t.settings.marker}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: seriesCount }, (_, i) => (
                  <tr key={i} className="border-t">
                    <td className="border-r px-2 py-2 text-muted-foreground">Y{i + 1}</td>
                    <td className="border-r px-2 py-2">
                      <span className="block max-w-44 truncate" title={seriesNames[i]}>
                        {seriesNames[i] || t.convert.series(i + 1)}
                      </span>
                    </td>
                    <td className="border-r px-2 py-2">
                      <FitMethodSelect value={fitAt(i)} onChange={(v) => setFitAt(i, v)} methods={fitMethods} />
                    </td>
                    <td className="border-r px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {SERIES_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            title={colorLabel(c.name, c.label)}
                            onClick={() => setColorAt(i, c.name)}
                            className={cn(
                              "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                              colorAt(i) === c.name ? "border-primary scale-110" : "border-transparent",
                            )}
                            style={{ backgroundColor: c.css }}
                            aria-label={colorLabel(c.name, c.label)}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-0.5">
                        {SERIES_MARKS.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            title={m.value}
                            onClick={() => setMarkAt(i, m.value)}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
                              markAt(i) === m.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent",
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="xlabel">{t.settings.xLabel}</Label>
          <Input id="xlabel" value={value.xLabel} onChange={(e) => onChange({ xLabel: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="ylabel">{t.settings.yLabel}</Label>
          <Input id="ylabel" value={value.yLabel} onChange={(e) => onChange({ yLabel: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="caption">{t.settings.caption}</Label>
          <Input id="caption" value={value.caption} onChange={(e) => onChange({ caption: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="label">{t.settings.label}</Label>
          <Input id="label" value={value.label} onChange={(e) => onChange({ label: e.target.value })} />
        </div>
      </div>
    </div>
  )
}
