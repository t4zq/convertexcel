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

/**
 * 生成 TikZ コードに色・マーカーを適用する。
 *
 * エンジンは \addplot ブロック内に `  color=black,` と `  mark=*,` を
 * それぞれ独立した行として出力するため、その行を置換する。
 * 出現順は (data_i, fit_i?) × seriesCount なので fitMethods を参照して
 * どの出現が何番目の系列かを計算する。
 */
export function applySeriesStyles(
  tikzCode: string,
  colors: string[],
  marks: string[],
  fitMethods: string[],
): string {
  let result = tikzCode

  // ── 色 ──────────────────────────────────────────────────────────────────
  // \addplot [...] のオプションブロック内に限定して color=black を置換する。
  // axis 設定（tick style 等）の color=black は書き換えない。
  if (colors.some((c) => c && c !== "black")) {
    const map: number[] = []
    colors.forEach((_, si) => {
      map.push(si) // data plot
      const fm = fitMethods[si] ?? fitMethods[0] ?? "auto"
      if (fm && fm !== "none") map.push(si) // fit curve
    })

    let occ = 0
    let inAddplot = false
    let addplotDepth = 0

    result = result
      .split("\n")
      .map((line) => {
        if (!inAddplot) {
          // \addplot または \addplot+ の後に [ が出現 → オプションブロック開始を検出
          if (/\\addplot\b/.test(line)) {
            const start = line.indexOf("[")
            if (start !== -1) {
              let depth = 0
              for (let i = start; i < line.length; i++) {
                if (line[i] === "[") depth++
                else if (line[i] === "]") depth--
              }
              if (depth > 0) {
                inAddplot = true
                addplotDepth = depth
              }
            }
          }
          return line
        }

        // \addplot オプションブロック内：ブラケット深度を追跡
        for (const ch of line) {
          if (ch === "[") addplotDepth++
          else if (ch === "]") addplotDepth--
        }
        if (addplotDepth <= 0) inAddplot = false

        return line.replace(/^(\s+)(color=black)(,\s*)$/, (match, lead, _col, trail) => {
          const si = map[occ++]
          const color = si !== undefined ? colors[si] : undefined
          if (!color || color === "black") return match
          return `${lead}color=${color}${trail}`
        })
      })
      .join("\n")
  }

  // ── マーカー ─────────────────────────────────────────────────────────────
  // mark=* はデータ系列の \addplot にのみ出現（fit curve には mark がない）。
  if (marks.some((m) => m && m !== "*")) {
    let occ = 0
    result = result.replace(/^(\s+)(mark=\*)(,\s*)$/gm, (match, lead, _mk, trail) => {
      const mark = marks[occ++]
      if (!mark || mark === "*") return match
      return `${lead}mark=${mark}${trail}`
    })
  }

  return result
}
