// 変換ページの設定値と、エンジン (engine/loader) のオプションへの変換。

import type { ConvertOptions, RoundMode, TikzOptions } from "@/engine/loader"

export interface TableSettings {
  roundMode: "none" | "decimal" | "sig-figs"
  decimals: number
  sigFigs: number
  hasHeader: boolean
  cleanInput: boolean
  booktabs: boolean
  siunitx: boolean
}

export interface TikzSettings {
  filename: string
  figureNumber: string // 空文字 = 自動採番
  legendPos: string
  scaleMode: string
  // 系列ごとの近似手法。索引 i = i 番目の y 系列。
  // 1 要素だけなら全系列に適用される（エンジン側でクランプ）。
  fitMethods: string[]
  xLabel: string
  yLabel: string
  caption: string
  label: string
  // 系列ごとの色・マーカー。空文字はエンジンのデフォルト（black / *）を維持する。
  seriesColors: string[]
  seriesMarks: string[]
}

export const DEFAULT_TABLE_SETTINGS: TableSettings = {
  roundMode: "none",
  decimals: 2,
  sigFigs: 3,
  hasHeader: true,
  cleanInput: true,
  booktabs: true,
  siunitx: false,
}

export const DEFAULT_TIKZ_SETTINGS: TikzSettings = {
  filename: "data",
  figureNumber: "",
  legendPos: "north west",
  scaleMode: "linear",
  fitMethods: ["auto"],
  xLabel: "x軸",
  yLabel: "y軸",
  caption: "図題",
  label: "fig:label",
  seriesColors: [],
  seriesMarks: [],
}

export function toConvertOptions(table: TableSettings): ConvertOptions {
  const mode: RoundMode = table.roundMode === "decimal" ? 1 : table.roundMode === "sig-figs" ? 2 : 0
  return {
    mode,
    decimals: table.decimals,
    sigFigs: table.sigFigs,
    hasHeader: table.hasHeader,
    cleanInput: table.cleanInput,
    booktabs: table.booktabs,
    siunitx: table.siunitx,
  }
}

export function toTikzOptions(tikz: TikzSettings, table: TableSettings): TikzOptions {
  return {
    filename: tikz.filename || "data",
    sigFigs: table.sigFigs,
    legendPos: tikz.legendPos,
    scaleMode: tikz.scaleMode,
    // エンジンはカンマ区切りで系列別に解釈する（split_line）。
    fitMethod: (tikz.fitMethods.length ? tikz.fitMethods : ["auto"]).join(","),
    hasHeader: table.hasHeader,
    cleanInput: table.cleanInput,
    figureNumber: Number(tikz.figureNumber) || 0,
    xLabel: tikz.xLabel,
    yLabel: tikz.yLabel,
    caption: tikz.caption,
    label: tikz.label,
  }
}
