import { useMemo } from "react"
import createPlotlyComponent from "react-plotly.js/factory"
import Plotly from "plotly.js-dist-min"

// 全ページ共通の Plotly ラッパ。dist-min + factory でバンドルを抑える。
const Plot = createPlotlyComponent(Plotly)

// converTeXcel のチャートテーマ (旧 stats.js の配色を踏襲)
export const CHART_COLORS = ["#107c41", "#005fb8", "#c16800", "#8c6c00", "#7f52b8"]

export function baseLayout(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#ffffff",
    font: { family: '"Segoe UI", system-ui, sans-serif', size: 12, color: "#1a1a1c" },
    hovermode: "closest",
    margin: { t: 24, l: 62, r: 24, b: 56 },
    legend: { orientation: "h", y: -0.2, x: 0, font: { size: 11 } },
    xaxis: { showline: true, linecolor: "#6b7280", gridcolor: "#e3e8e4", zeroline: false, ticks: "outside" },
    yaxis: { showline: true, linecolor: "#6b7280", gridcolor: "#e3e8e4", zeroline: false, ticks: "outside" },
    ...overrides,
  }
}

interface PlotlyChartProps {
  data: unknown[]
  layout?: Record<string, unknown>
  className?: string
  style?: React.CSSProperties
  config?: Record<string, unknown>
}

export function PlotlyChart({ data, layout, className, style, config }: PlotlyChartProps) {
  const mergedLayout = useMemo(() => baseLayout(layout), [layout])
  const mergedConfig = useMemo(
    () => ({ displaylogo: false, responsive: true, ...config }),
    [config]
  )
  return (
    <Plot
      data={data as never}
      layout={mergedLayout as never}
      config={mergedConfig as never}
      className={className}
      style={style ?? { width: "100%", height: "360px" }}
      useResizeHandler
    />
  )
}
