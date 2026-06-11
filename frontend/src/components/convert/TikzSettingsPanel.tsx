import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TikzSettings } from "@/lib/convert-settings"
import { SERIES_COLORS, SERIES_MARKS } from "@/lib/tikz-postprocess"
import { cn } from "@/lib/utils"

const LEGEND_POS = [
  "north west", "north east", "south west", "south east",
  "north", "south", "east", "west",
]

const FIT_METHODS: [string, string][] = [
  ["none", "なし"],
  ["auto", "自動"],
  ["linear", "線形"],
  ["quadratic", "2次"],
  ["cubic", "3次"],
  ["exponential", "指数"],
  ["logarithmic", "対数"],
  ["power", "べき乗"],
]

function FitMethodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
      <SelectContent>
        {FIT_METHODS.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
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
}

export function TikzSettingsPanel({ value, onChange, seriesCount, seriesNames }: TikzSettingsPanelProps) {
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
  return (
    <div className="space-y-3">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="fn">ファイル名</Label>
          <Input id="fn" value={value.filename} onChange={(e) => onChange({ filename: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="fig">図番号</Label>
          <Input id="fig" type="number" min={1} placeholder="自動" value={value.figureNumber} onChange={(e) => onChange({ figureNumber: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label>凡例位置</Label>
          <Select value={value.legendPos} onValueChange={(v) => onChange({ legendPos: v })}>
            <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEGEND_POS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1">
          <Label>軸スケール</Label>
          <Select value={value.scaleMode} onValueChange={(v) => onChange({ scaleMode: v })}>
            <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">線形</SelectItem>
              <SelectItem value="semilog">片対数</SelectItem>
              <SelectItem value="loglog">両対数</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!perSeriesFit && (
          <div className="min-w-0 space-y-1">
            <Label>近似</Label>
            <FitMethodSelect value={fitAt(0)} onChange={setFitAll} />
          </div>
        )}
      </div>
      {perSeriesFit && (
        <div className="space-y-1">
          <Label>近似（系列ごと）</Label>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
            {Array.from({ length: seriesCount }, (_, i) => (
              <div key={i} className="min-w-0 space-y-1">
                <span className="text-muted-foreground block truncate text-xs" title={seriesNames[i]}>
                  {seriesNames[i] || `系列${i + 1}`}
                </span>
                <FitMethodSelect value={fitAt(i)} onChange={(v) => setFitAt(i, v)} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="xlabel">x軸ラベル</Label>
          <Input id="xlabel" value={value.xLabel} onChange={(e) => onChange({ xLabel: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="ylabel">y軸ラベル</Label>
          <Input id="ylabel" value={value.yLabel} onChange={(e) => onChange({ yLabel: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="caption">キャプション</Label>
          <Input id="caption" value={value.caption} onChange={(e) => onChange({ caption: e.target.value })} />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="label">ラベル</Label>
          <Input id="label" value={value.label} onChange={(e) => onChange({ label: e.target.value })} />
        </div>
      </div>

      {seriesCount > 0 && (
        <div className="space-y-2">
          <Label>色・マーカー</Label>
          <div className="space-y-2">
            {Array.from({ length: seriesCount }, (_, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground w-12 shrink-0 truncate text-xs" title={seriesNames[i]}>
                  {seriesNames[i] || `系列${i + 1}`}
                </span>
                {/* カラーパレット */}
                <div className="flex flex-wrap gap-1">
                  {SERIES_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.label}
                      onClick={() => setColorAt(i, c.name)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                        colorAt(i) === c.name ? "border-primary scale-110" : "border-transparent",
                      )}
                      style={{ backgroundColor: c.css }}
                      aria-label={c.label}
                    />
                  ))}
                </div>
                {/* マーカー */}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
