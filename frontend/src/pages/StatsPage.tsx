import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataGrid } from "@/components/DataGrid"
import { CHART_COLORS, PlotlyChart } from "@/components/PlotlyChart"
import { computeStatsWASM, fitCurves, smoothSeries, welchTtest } from "@/engine/loader"
import { columnNumbers, numericColumns, pairColumns } from "@/lib/grid"
import type {
  FitOutput,
  Grid,
  SmoothMode,
  StatsResult,
  TTestResult,
} from "@/lib/types"

const SAMPLE: Grid = [
  ["x", "A", "B"],
  ["1", "2.1", "9.8"],
  ["2", "4.0", "8.1"],
  ["3", "6.2", "6.0"],
  ["4", "7.9", "4.2"],
  ["5", "10.1", "1.9"],
  ["6", "12.2", "0.3"],
]

const FIT_MODELS = [
  { id: "linear", label: "線形" },
  { id: "poly", label: "多項式" },
  { id: "exp", label: "指数" },
  { id: "power", label: "べき乗" },
  { id: "sin", label: "三角関数" },
]

const fmt = (x: number, d = 4) => (Number.isFinite(x) ? x.toFixed(d) : "—")

export default function StatsPage() {
  const [grid, setGrid] = useState<Grid>(SAMPLE)
  const cols = useMemo(() => numericColumns(grid), [grid])

  // ── 記述統計 + 相関 (グリッド変更で自動計算) ──
  const [stats, setStats] = useState<StatsResult | null>(null)
  useEffect(() => {
    let alive = true
    computeStatsWASM(grid).then((r) => alive && setStats(r))
    return () => {
      alive = false
    }
  }, [grid])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Statistics
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">統計探索</h1>
        <p className="text-muted-foreground text-sm">
          表データから記述統計・相関・グラフ・曲線フィット・Welch の t 検定を確認します。計算は Rust(WASM)。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>入力データ</CardTitle>
          <CardDescription>
            1行目を列名として扱います。Excel からの貼り付け（タブ区切り）にも対応。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataGrid value={grid} onChange={setGrid} />
        </CardContent>
      </Card>

      <ChartSection grid={grid} cols={cols} />

      {stats && <DescriptiveCard stats={stats} />}
      {stats && <CorrelationCard stats={stats} />}

      <FitSection grid={grid} cols={cols} />
      <TTestSection grid={grid} cols={cols} />
    </div>
  )
}

type Cols = ReturnType<typeof numericColumns>

const columnKey = (index: number) => String(index)

const hasColumnKey = (cols: Cols, key: string) =>
  cols.some((c) => columnKey(c.index) === key)

function useNumericColumnKey(cols: Cols, fallbackOffset = 0) {
  const [key, setKey] = useState("")

  useEffect(() => {
    if (cols.length === 0) {
      setKey("")
      return
    }
    setKey((prev) => {
      if (prev && hasColumnKey(cols, prev)) return prev
      const fallback = cols[Math.min(fallbackOffset, cols.length - 1)]
      return columnKey(fallback.index)
    })
  }, [cols, fallbackOffset])

  return [key, setKey] as const
}

function NumericColumnSelect({
  label,
  value,
  onValueChange,
  cols,
  className = "w-28",
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  cols: Cols
  className?: string
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="列" />
        </SelectTrigger>
        <SelectContent>
          {cols.map((c) => (
            <SelectItem key={c.index} value={columnKey(c.index)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ─── グラフ ────────────────────────────────────────────────

function ChartSection({ grid, cols }: { grid: Grid; cols: Cols }) {
  const [xKey, setXKey] = useNumericColumnKey(cols)
  const [ySel, setYSel] = useState<Record<number, boolean>>({})
  const [chartType, setChartType] = useState<"scatter" | "line">("scatter")
  const [smooth, setSmooth] = useState<SmoothMode>("none")
  const [window, setWindow] = useState(5)
  const [cutoff, setCutoff] = useState(30)
  const [traces, setTraces] = useState<unknown[]>([])

  // 既定の X / Y を初期化
  useEffect(() => {
    if (cols.length === 0) return
    setYSel((prev) => {
      const validIndexes = new Set(cols.map((c) => c.index))
      const next = Object.fromEntries(
        Object.entries(prev)
          .map(([index, selected]) => [Number(index), selected] as const)
          .filter(([index]) => validIndexes.has(index))
      )
      if (Object.values(next).some(Boolean)) return next
      const init: Record<number, boolean> = {}
      cols.slice(1).forEach((c) => (init[c.index] = true))
      return init
    })
  }, [cols])

  useEffect(() => {
    let alive = true
    const xIndex = Number(xKey)
    const yCols = cols.filter((c) => ySel[c.index] && c.index !== xIndex)
    Promise.all(
      yCols.map(async (yc) => {
        const { x, y } = pairColumns(grid, xIndex, yc.index)
        const ys = smooth === "none" ? y : await smoothSeries(y, smooth, window, cutoff)
        return { x, y: ys, name: yc.name }
      })
    ).then((series) => {
      if (!alive) return
      setTraces(
        series.map((s, i) => ({
          x: s.x,
          y: s.y,
          name: s.name,
          type: "scatter",
          mode: chartType === "line" ? "lines" : "markers",
          marker: { color: CHART_COLORS[i % CHART_COLORS.length], size: 7 },
          line: { color: CHART_COLORS[i % CHART_COLORS.length] },
        }))
      )
    })
    return () => {
      alive = false
    }
  }, [grid, cols, xKey, ySel, chartType, smooth, window, cutoff])

  const needsWindow = smooth === "moving-avg" || smooth === "median"
  const needsCutoff = smooth === "low-pass" || smooth === "fft-low-pass"

  return (
    <Card>
      <CardHeader>
        <CardTitle>グラフ</CardTitle>
        <CardDescription>X軸とY系列を選び、散布図/折れ線で表示。ノイズ除去も適用できます。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <NumericColumnSelect label="X軸" value={xKey} onValueChange={setXKey} cols={cols} className="w-32" />
          <div className="space-y-1">
            <Label>Y系列</Label>
            <div className="flex flex-wrap gap-3 pt-1">
              {cols.filter((c) => String(c.index) !== xKey).map((c) => (
                <label key={c.index} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={!!ySel[c.index]}
                    onCheckedChange={(v) => setYSel((p) => ({ ...p, [c.index]: !!v }))}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>種類</Label>
            <Select value={chartType} onValueChange={(v) => setChartType(v as "scatter" | "line")}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scatter">散布図</SelectItem>
                <SelectItem value="line">折れ線</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>ノイズ除去</Label>
            <Select value={smooth} onValueChange={(v) => setSmooth(v as SmoothMode)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                <SelectItem value="moving-avg">移動平均</SelectItem>
                <SelectItem value="median">メジアン</SelectItem>
                <SelectItem value="low-pass">低域通過(IIR)</SelectItem>
                <SelectItem value="fft-low-pass">FFT低域通過</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {needsWindow && (
            <div className="w-40 space-y-1">
              <Label>窓幅 {window}点</Label>
              <Slider min={3} max={51} step={2} value={[window]} onValueChange={([v]) => setWindow(v)} />
            </div>
          )}
          {needsCutoff && (
            <div className="w-40 space-y-1">
              <Label>カットオフ {cutoff}%</Label>
              <Slider min={1} max={99} step={1} value={[cutoff]} onValueChange={([v]) => setCutoff(v)} />
            </div>
          )}
        </div>
        {traces.length ? (
          <PlotlyChart data={traces} />
        ) : (
          <p className="text-muted-foreground text-sm">数値列を選ぶとグラフが表示されます。</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── 記述統計 ──────────────────────────────────────────────

function DescriptiveCard({ stats }: { stats: StatsResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>記述統計</CardTitle>
        <CardDescription>列ごとの n / 平均 / 標準偏差(標本) / 最小 / 四分位 / 最大。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>列</TableHead>
              {["n", "平均", "標準偏差", "最小", "Q1", "中央値", "Q3", "最大"].map((h) => (
                <TableHead key={h} className="text-right">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.descriptive.map((c) => (
              <TableRow key={c.column}>
                <TableCell className="font-medium">{c.column}</TableCell>
                <TableCell className="text-right tabular-nums">{c.n}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.mean)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.std)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.min)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.q1)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.median)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.q3)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.max)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── 相関ヒートマップ ──────────────────────────────────────

function CorrelationCard({ stats }: { stats: StatsResult }) {
  const { columns, matrix } = stats.correlation
  if (columns.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>相関行列</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">数値列が2列以上あると表示されます。</p>
        </CardContent>
      </Card>
    )
  }
  const data = [
    {
      type: "heatmap",
      z: matrix,
      x: columns,
      y: columns,
      zmin: -1,
      zmax: 1,
      colorscale: [
        [0, "#c16800"],
        [0.5, "#ffffff"],
        [1, "#005fb8"],
      ],
      text: matrix.map((row) => row.map((v) => fmt(v, 2))),
      texttemplate: "%{text}",
      hovertemplate: "%{y} × %{x}: %{z:.3f}<extra></extra>",
    },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>相関行列</CardTitle>
        <CardDescription>Pearson の相関係数。</CardDescription>
      </CardHeader>
      <CardContent>
        <PlotlyChart
          data={data}
          layout={{ yaxis: { autorange: "reversed" }, margin: { t: 10, l: 80, r: 20, b: 60 } }}
          style={{ width: "100%", height: "360px" }}
        />
      </CardContent>
    </Card>
  )
}

// ─── フィット ──────────────────────────────────────────────

function FitSection({ grid, cols }: { grid: Grid; cols: Cols }) {
  const [xKey, setXKey] = useNumericColumnKey(cols)
  const [yKey, setYKey] = useNumericColumnKey(cols, 1)
  const [models, setModels] = useState<Record<string, boolean>>({
    linear: true,
    poly: true,
    exp: true,
    power: false,
    sin: false,
  })
  const [degree, setDegree] = useState(2)
  const [out, setOut] = useState<FitOutput | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setErr(null)
    try {
      const { x, y } = pairColumns(grid, Number(xKey), Number(yKey))
      const selected = Object.keys(models).filter((m) => models[m])
      const res = await fitCurves({ x, y, models: selected, poly_degree: degree })
      setOut(res)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  const fitTraces = useMemo(() => {
    if (!out) return []
    const { x, y } = pairColumns(grid, Number(xKey), Number(yKey))
    const obs = { x, y, name: "実測", type: "scatter", mode: "markers", marker: { color: "#1a1a1c", size: 6 } }
    const curves = out.results.map((r, i) => ({
      x: r.curve.x,
      y: r.curve.y,
      name: `${r.label} (R²=${fmt(r.r2, 3)})`,
      type: "scatter",
      mode: "lines",
      line: { color: CHART_COLORS[i % CHART_COLORS.length] },
    }))
    return [obs, ...curves]
  }, [out, grid, xKey, yKey])

  const residualTraces = useMemo(() => {
    if (!out) return []
    const { x } = pairColumns(grid, Number(xKey), Number(yKey))
    return out.results.map((r, i) => ({
      x,
      y: r.residuals,
      name: r.label,
      type: "scatter",
      mode: "markers",
      marker: { color: CHART_COLORS[i % CHART_COLORS.length], size: 6 },
    }))
  }, [out, grid, xKey, yKey])

  return (
    <Card>
      <CardHeader>
        <CardTitle>曲線フィット</CardTitle>
        <CardDescription>X/Y列を選び複数モデルを比較。AIC 最小を推奨として表示します。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <NumericColumnSelect label="X列" value={xKey} onValueChange={setXKey} cols={cols} />
          <NumericColumnSelect label="Y列" value={yKey} onValueChange={setYKey} cols={cols} />
          <div className="space-y-1">
            <Label>モデル</Label>
            <div className="flex flex-wrap gap-3 pt-1">
              {FIT_MODELS.map((m) => (
                <label key={m.id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={!!models[m.id]} onCheckedChange={(v) => setModels((p) => ({ ...p, [m.id]: !!v }))} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          {models.poly && (
            <div className="w-40 space-y-1">
              <Label>多項式次数 {degree}</Label>
              <Slider min={1} max={8} step={1} value={[degree]} onValueChange={([v]) => setDegree(v)} />
            </div>
          )}
          <Button onClick={run}>フィット実行</Button>
        </div>
        {err && <p className="text-destructive text-sm">{err}</p>}

        {out && (
          <>
            {out.recommended && (
              <p className="text-sm">
                推奨モデル:{" "}
                <span className="font-medium">
                  {out.results.find((r) => r.model === out.recommended)?.label ?? out.recommended}
                </span>{" "}
                (AIC 最小)
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>モデル</TableHead>
                  <TableHead className="text-right">R²</TableHead>
                  <TableHead className="text-right">RMSE</TableHead>
                  <TableHead className="text-right">AIC</TableHead>
                  <TableHead>式</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {out.results.map((r) => (
                  <TableRow key={r.model} className={r.model === out.recommended ? "bg-accent/40" : ""}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.r2, 4)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.rmse, 4)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.aic, 2)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.expression}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div>
              <p className="mb-1 text-sm font-medium">フィット曲線</p>
              <PlotlyChart data={fitTraces} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">残差プロット</p>
              <PlotlyChart data={residualTraces} layout={{ yaxis: { title: "残差" } }} style={{ width: "100%", height: "260px" }} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Welch t 検定 ──────────────────────────────────────────

function TTestSection({ grid, cols }: { grid: Grid; cols: Cols }) {
  const [aKey, setAKey] = useNumericColumnKey(cols)
  const [bKey, setBKey] = useNumericColumnKey(cols, 1)
  const [res, setRes] = useState<TTestResult | null>(null)

  async function run() {
    const a = columnNumbers(grid, Number(aKey))
    const b = columnNumbers(grid, Number(bKey))
    setRes(await welchTtest(a, b))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welch の t 検定</CardTitle>
        <CardDescription>2系列の平均差を検定します（等分散を仮定しない）。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <NumericColumnSelect label="系列A" value={aKey} onValueChange={setAKey} cols={cols} />
          <NumericColumnSelect label="系列B" value={bKey} onValueChange={setBKey} cols={cols} />
          <Button onClick={run}>検定実行</Button>
        </div>
        {res && (
          <Table>
            <TableBody>
              <TableRow><TableCell>平均 A / B</TableCell><TableCell className="text-right tabular-nums">{fmt(res.mean_a)} / {fmt(res.mean_b)}</TableCell></TableRow>
              <TableRow><TableCell>分散 A / B</TableCell><TableCell className="text-right tabular-nums">{fmt(res.var_a)} / {fmt(res.var_b)}</TableCell></TableRow>
              <TableRow><TableCell>t 値</TableCell><TableCell className="text-right tabular-nums">{fmt(res.t)}</TableCell></TableRow>
              <TableRow><TableCell>自由度 (df)</TableCell><TableCell className="text-right tabular-nums">{fmt(res.df, 2)}</TableCell></TableRow>
              <TableRow><TableCell>p 値 (両側)</TableCell><TableCell className="text-right tabular-nums">{fmt(res.p_value, 4)}</TableCell></TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
