// gnuplot-wasm をブラウザで遅延ロードし、スクリプト文字列 → SVG 文字列を返す。
// wasm バイナリ(~1.8MB)は重いので、プレビューが要求されたとき初回のみ初期化する。
// gnuplot-wasm の render() が `set term svg ...; set output` を自前で前置するため、
// 呼び出し側スクリプトに terminal/output 指定は不要。
//
// 返す SVG は dangerouslySetInnerHTML で DOM 挿入されるため、DOMPurify で
// サニタイズしてから返す（共有URL経由で他ユーザー由来のデータが渡る可能性への防御）。

import DOMPurify from "dompurify"
import type { GnuplotInstance } from "gnuplot-wasm"

// gnuplot は点マーカーを `<use xlink:href="#gpPt…">`（defs 内シンボル参照）で描く。
// DOMPurify は既定で <use> を除去するため、内部フラグメント参照に限り許可する。
// 外部参照（SSRF/情報漏えい）を避けるため `#…` 以外を持つ <use> は落とす。
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeName.toLowerCase() !== "use") return
  const href =
    node.getAttribute("xlink:href") ?? node.getAttribute("href") ?? ""
  if (!href.startsWith("#")) node.remove()
})

let instancePromise: Promise<GnuplotInstance> | null = null

async function getInstance(): Promise<GnuplotInstance> {
  if (!instancePromise) {
    instancePromise = (async () => {
      // Vite はパッケージ内 .wasm の解決に ?url を使う（locateFile へ渡す）。
      const [{ default: createGnuplot }, { default: wasmUrl }] = await Promise.all([
        import("gnuplot-wasm"),
        import("gnuplot-wasm/src/gnuplot.wasm?url"),
      ])
      return createGnuplot({ locateFile: () => wasmUrl })
    })()
  }
  return instancePromise
}

// スクリプトを描画し SVG 文字列を返す。SVG が得られない場合は gnuplot の stdout を例外にする。
export async function renderGnuplotSvg(
  script: string,
  options: { width?: number; height?: number } = {},
): Promise<string> {
  const { render } = await getInstance()
  const { svg, stdout } = render(script, {
    width: options.width ?? 700,
    height: options.height ?? 450,
    background: "white",
  })
  if (!svg) throw new Error(stdout || "gnuplot returned no SVG")
  // gnuplot の svg 端末は静的描画のみだが、念のため SVG プロファイルで
  // サニタイズし script/イベントハンドラ等を除去する。
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["use"],
    ADD_ATTR: ["xlink:href"],
  })
}
