// 変換ページの設定値と、エンジン (engine/loader) のオプションへの変換。

import type { ConvertOptions, RoundMode, TikzOptions } from "@/engine/loader"
import type { Language } from "@/lib/i18n"

export interface TableSettings {
  roundMode: "none" | "decimal" | "sig-figs"
  decimals: number
  sigFigs: number
  columnAlign: "left" | "center" | "right"
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
  // 近似式に付ける不確かさの有効桁数。0 = 表示しない。
  uncSigFigs: number
}

// gnuplot 固有のグラフ設定。ラベル・軸スケール・近似手法は TikZ 設定を共有する。
export interface GnuplotSettings {
  // gnuplot の `set key` 引数（例: "left top" / "right bottom" / "outside" / "off"）。
  keyPos: string
  grid: boolean
  // pointtype。0 = 既定（出力しない）。
  pointType: number
  // pointsize。0 = 既定（出力しない）。
  pointSize: number
  // グラフタイトル（set title）。空文字 = 出力しない。
  title: string
  // true のとき、gnuplot タブではコード生成後にブラウザ内 SVG プレビューを自動更新する。
  autoPreview: boolean
}

export const DEFAULT_GNUPLOT_SETTINGS: GnuplotSettings = {
  keyPos: "left top",
  grid: false,
  pointType: 0,
  pointSize: 0,
  title: "",
  autoPreview: false,
}

export const DEFAULT_TABLE_SETTINGS: TableSettings = {
  roundMode: "none",
  decimals: 2,
  sigFigs: 3,
  columnAlign: "center",
  hasHeader: true,
  cleanInput: true,
  booktabs: true,
  siunitx: false,
}

const DEFAULT_TIKZ_TEXT: Record<Language, Pick<TikzSettings, "xLabel" | "yLabel" | "caption">> = {
  ja: {
    xLabel: "x軸",
    yLabel: "y軸",
    caption: "図題",
  },
  en: {
    xLabel: "x-axis",
    yLabel: "y-axis",
    caption: "Figure title",
  },
  zh: {
    xLabel: "x 轴",
    yLabel: "y 轴",
    caption: "图题",
  },
  "zh-Hant": {
    xLabel: "x 軸",
    yLabel: "y 軸",
    caption: "圖題",
  },
  ko: {
    xLabel: "x축",
    yLabel: "y축",
    caption: "그림 제목",
  },
  es: {
    xLabel: "eje x",
    yLabel: "eje y",
    caption: "Título de la figura",
  },
  de: {
    xLabel: "x-Achse",
    yLabel: "y-Achse",
    caption: "Abbildungstitel",
  },
}

const DEFAULT_TIKZ_TEXT_VALUES = {
  xLabel: Object.values(DEFAULT_TIKZ_TEXT).map((text) => text.xLabel),
  yLabel: Object.values(DEFAULT_TIKZ_TEXT).map((text) => text.yLabel),
  caption: Object.values(DEFAULT_TIKZ_TEXT).map((text) => text.caption),
}

export function getDefaultTikzSettings(language: Language = "ja"): TikzSettings {
  return {
    filename: "data",
    figureNumber: "",
    legendPos: "north west",
    scaleMode: "linear",
    fitMethods: ["auto"],
    ...DEFAULT_TIKZ_TEXT[language],
    label: "fig:label",
    seriesColors: [],
    seriesMarks: [],
    uncSigFigs: 0,
  }
}

export function localizeDefaultTikzText(tikz: TikzSettings, language: Language): TikzSettings {
  const target = DEFAULT_TIKZ_TEXT[language]
  return {
    ...tikz,
    xLabel: DEFAULT_TIKZ_TEXT_VALUES.xLabel.includes(tikz.xLabel) ? target.xLabel : tikz.xLabel,
    yLabel: DEFAULT_TIKZ_TEXT_VALUES.yLabel.includes(tikz.yLabel) ? target.yLabel : tikz.yLabel,
    caption: DEFAULT_TIKZ_TEXT_VALUES.caption.includes(tikz.caption) ? target.caption : tikz.caption,
  }
}

export const DEFAULT_TIKZ_SETTINGS: TikzSettings = getDefaultTikzSettings("ja")

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
    siunitx: table.siunitx,
    uncSigFigs: tikz.uncSigFigs ?? 0,
  }
}
