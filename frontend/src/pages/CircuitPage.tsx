import { useEffect, useMemo, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataGrid } from "@/components/DataGrid"
import { CHART_COLORS, PlotlyChart } from "@/components/PlotlyChart"
import { analyzeCircuit } from "@/engine/loader"
import { pairColumns } from "@/lib/grid"
import type { CircuitResult, Grid } from "@/lib/types"

type Mode = "bode" | "transient" | "impedance"

const DEFAULTS: Record<Mode, Grid> = {
  bode: [
    ["周波数[Hz]", "ゲイン[dB]", "位相[deg]"],
    ["10", "-0.1", "-6"],
    ["100", "-0.5", "-18"],
    ["1000", "-3.0", "-45"],
    ["10000", "-23", "-84"],
    ["100000", "-43", "-89"],
  ],
  transient: [
    ["時間[s]", "電圧[V]"],
    ["0", "0"],
    ["0.1", "0.63"],
    ["0.2", "0.86"],
    ["0.3", "0.95"],
    ["0.5", "0.99"],
    ["0.7", "1.0"],
  ],
  impedance: [
    ["周波数[Hz]", "インピーダンス[Ω]"],
    ["10", "1000"],
    ["100", "320"],
    ["1000", "100"],
    ["5000", "60"],
    ["10000", "120"],
    ["50000", "500"],
  ],
}

const MODE_HINT: Record<Mode, string> = {
  bode: "周波数・ゲイン(dB)・位相の列を入力。-3dB カットオフと傾きを推定します。",
  transient: "時間・値の列を入力。1次系として時定数 τ を推定します。",
  impedance: "周波数・|Z| の列を入力。最小インピーダンス(共振)を推定します。",
}

const fmtEng = (v: number | undefined, unit: string) => {
  if (v === undefined || !Number.isFinite(v)) return "—"
  const abs = Math.abs(v)
  const prefixes: [number, string][] = [
    [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"],
  ]
  for (const [scale, p] of prefixes) {
    if (abs >= scale) return `${(v / scale).toPrecision(4)} ${p}${unit}`
  }
  return `${v.toPrecision(4)} ${unit}`
}

export default function CircuitPage() {
  const [mode, setMode] = useState<Mode>("bode")
  const [grids, setGrids] = useState<Record<Mode, Grid>>(DEFAULTS)
  const [result, setResult] = useState<CircuitResult | null>(null)
  const grid = grids[mode]

  const setGrid = (g: Grid) => setGrids((p) => ({ ...p, [mode]: g }))

  useEffect(() => {
    let alive = true
    const { x: a, y: b } = pairColumns(grid, 0, 1)
    if (a.length < 2) {
      setResult(null)
      return
    }
    analyzeCircuit({ mode, a, b }).then((r) => alive && setResult(r))
    return () => {
      alive = false
    }
  }, [grid, mode])

  const traces = useMemo(() => {
    const { x, y } = pairColumns(grid, 0, 1)
    const main = {
      x,
      y,
      name: grid[0]?.[1] ?? "値",
      type: "scatter",
      mode: mode === "transient" ? "lines+markers" : "markers",
      marker: { color: CHART_COLORS[0], size: 7 },
      line: { color: CHART_COLORS[0] },
    }
    const out: unknown[] = [main]
    if (mode === "bode") {
      const { x: px, y: py } = pairColumns(grid, 0, 2)
      if (px.length) {
        out.push({ x: px, y: py, name: "位相[deg]", yaxis: "y2", type: "scatter", mode: "markers", marker: { color: CHART_COLORS[1], size: 6 } })
      }
    }
    return out
  }, [grid, mode])

  const layout = useMemo(() => {
    if (mode === "bode") {
      return {
        xaxis: { type: "log", title: "周波数 [Hz]" },
        yaxis: { title: "ゲイン [dB]" },
        yaxis2: { title: "位相 [deg]", overlaying: "y", side: "right" },
        shapes: result?.cutoff_fc
          ? [{ type: "line", x0: result.cutoff_fc, x1: result.cutoff_fc, yref: "paper", y0: 0, y1: 1, line: { color: "#c16800", dash: "dash" } }]
          : [],
      }
    }
    if (mode === "impedance") {
      return { xaxis: { type: "log", title: "周波数 [Hz]" }, yaxis: { type: "log", title: "|Z| [Ω]" } }
    }
    return { xaxis: { title: "時間 [s]" }, yaxis: { title: "値" } }
  }, [mode, result])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Circuit Lab</p>
        <h1 className="text-2xl font-semibold tracking-tight">回路解析</h1>
        <p className="text-muted-foreground text-sm">
          周波数特性・過渡応答・インピーダンスを可視化し、カットオフや時定数を推定します。計算は Rust(WASM)。
        </p>
      </header>

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList>
          <TabsTrigger value="bode">周波数特性</TabsTrigger>
          <TabsTrigger value="transient">過渡応答</TabsTrigger>
          <TabsTrigger value="impedance">インピーダンス</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>入力データ</CardTitle>
          <CardDescription>{MODE_HINT[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataGrid value={grid} onChange={setGrid} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>グラフ</CardTitle>
        </CardHeader>
        <CardContent>
          <PlotlyChart data={traces} layout={layout} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>推定値</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-muted-foreground text-sm">数値データを入力すると推定値が表示されます。</p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              {mode === "bode" && (
                <>
                  <Metric label="カットオフ周波数 fc" value={fmtEng(result.cutoff_fc, "Hz")} />
                  <Metric label="最大ゲイン" value={result.max_gain_db !== undefined ? `${result.max_gain_db.toFixed(2)} dB` : "—"} />
                  <Metric label="傾き" value={result.slope_db_per_decade !== undefined ? `${result.slope_db_per_decade.toFixed(1)} dB/dec` : "—"} />
                  <Metric label="時定数 τ" value={fmtEng(result.tau, "s")} />
                </>
              )}
              {mode === "transient" && (
                <>
                  <Metric label="時定数 τ" value={fmtEng(result.tau, "s")} />
                  <Metric label="最終値" value={result.final_value !== undefined ? result.final_value.toPrecision(4) : "—"} />
                </>
              )}
              {mode === "impedance" && (
                <>
                  <Metric label="最小 |Z|" value={fmtEng(result.z_min, "Ω")} />
                  <Metric label="最大 |Z|" value={fmtEng(result.z_max, "Ω")} />
                  <Metric label="共振周波数" value={fmtEng(result.resonance_fc, "Hz")} />
                </>
              )}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
