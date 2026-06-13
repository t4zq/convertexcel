// TikZ 生成コードへのポストプロセス（WASM 再ビルド不要）。

export const SERIES_COLORS: { name: string; label: string; css: string }[] = [
  { name: "black",  label: "黒", css: "#1a1a1a" },
  { name: "blue",   label: "青", css: "#1565C0" },
  { name: "red",    label: "赤", css: "#C62828" },
  { name: "teal",   label: "緑", css: "#00695C" },
  { name: "orange", label: "橙", css: "#E65100" },
  { name: "purple", label: "紫", css: "#6A1B9A" },
  { name: "brown",  label: "茶", css: "#4E342E" },
  { name: "cyan",   label: "水", css: "#00838F" },
  { name: "olive",  label: "黄緑", css: "#558B2F" },
  { name: "violet", label: "藤", css: "#7B1FA2" },
]

export const SERIES_MARKS: { value: string; label: string }[] = [
  { value: "*",         label: "●" },
  { value: "o",         label: "○" },
  { value: "square*",   label: "■" },
  { value: "square",    label: "□" },
  { value: "triangle*", label: "▲" },
  { value: "triangle",  label: "△" },
  { value: "diamond*",  label: "◆" },
  { value: "x",         label: "×" },
]

const COLOR_NAMES = new Set(SERIES_COLORS.map((c) => c.name))
const MARK_VALUES = new Set(SERIES_MARKS.map((m) => m.value))

const safeColor = (value: string | undefined) =>
  value && COLOR_NAMES.has(value) ? value : undefined

const safeMark = (value: string | undefined) =>
  value && MARK_VALUES.has(value) ? value : undefined

function replaceOptionLine(lines: string[], option: "color" | "mark", value: string) {
  const pattern = option === "color"
    ? /^(\s*)color=[^,\]]+(,?\s*)$/
    : /^(\s*)mark=[^,\]]+(,?\s*)$/

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(pattern)
    if (match) {
      lines[i] = `${match[1]}${option}=${value}${match[2]}`
      return
    }
  }
}

function transformAddplotBlock(
  lines: string[],
  colors: string[],
  marks: string[],
  state: { nextDataSeries: number; lastDataSeries: number },
) {
  const body = lines.join("\n")
  const isDataPlot = /^\s*mark=/m.test(body)
  const isFitPlot = !isDataPlot && /\\addplot\b/.test(body) && /^\s*forget plot,?$/m.test(body)
  const seriesIndex = isDataPlot ? state.nextDataSeries : isFitPlot ? state.lastDataSeries : -1

  if (seriesIndex < 0) return lines

  const next = [...lines]
  const color = safeColor(colors[seriesIndex])
  if (color) replaceOptionLine(next, "color", color)
  if (isDataPlot) {
    const mark = safeMark(marks[seriesIndex])
    if (mark) replaceOptionLine(next, "mark", mark)
    state.lastDataSeries = state.nextDataSeries
    state.nextDataSeries += 1
  }
  return next
}

/**
 * 生成 TikZ コードに色・マーカーを適用する。
 *
 * エンジンは \addplot ブロック内に `color=...` と `mark=...` を
 * それぞれ独立した行として出力するため、そのオプション行を置換する。
 * データ系列は mark のある \addplot、近似曲線は直前のデータ系列に対応する
 * forget plot の \addplot として判定する。
 */
export function applySeriesStyles(
  tikzCode: string,
  colors: string[],
  marks: string[],
  _fitMethods: string[],
): string {
  if (!colors.length && !marks.length) return tikzCode

  const output: string[] = []
  const state = { nextDataSeries: 0, lastDataSeries: -1 }
  let block: string[] | null = null
  let depth = 0

  for (const line of tikzCode.split("\n")) {
    if (block) {
      block.push(line)
      for (const ch of line) {
        if (ch === "[") depth += 1
        if (ch === "]") depth -= 1
      }
      if (depth <= 0) {
        output.push(...transformAddplotBlock(block, colors, marks, state))
        block = null
      }
      continue
    }

    if (/\\addplot\b/.test(line) && line.includes("[")) {
      block = [line]
      depth = 0
      const start = line.indexOf("[")
      for (let i = start; i < line.length; i++) {
        if (line[i] === "[") depth += 1
        if (line[i] === "]") depth -= 1
      }
      if (depth <= 0) {
        output.push(...transformAddplotBlock(block, colors, marks, state))
        block = null
      }
      continue
    }

    output.push(line)
  }

  if (block) output.push(...block)
  return output.join("\n")
}
