// Rust→WASM エンジンの読み込み。
// `docker compose run --rm engine` が wasm-pack(--target web) の出力を
// `frontend/src/engine/pkg/` に生成する。Vite に処理させるため通常の
// 動的 import で読み込む (glue 内の `new URL(..._bg.wasm, import.meta.url)`
// を Vite がアセットとして解決する)。
// ※ そのため frontend ビルド前に必ず engine ビルドを実行すること。

// wasm-bindgen が公開する関数群。
export interface EngineModule {
  default: (input?: unknown) => Promise<unknown>
  gen_latex: (input: string) => string
  gen_csv: (input: string) => string
  gen_latex_config: (
    input: string,
    mode: number,
    decimals: number,
    sig_figs: number,
    has_header: number,
    clean_input: number,
    booktabs: number,
    siunitx: number
  ) => string
  gen_csv_config: (
    input: string,
    mode: number,
    decimals: number,
    sig_figs: number,
    has_header: number,
    clean_input: number
  ) => string
  gen_tikz_graph_config: (
    input: string,
    filename: string,
    sig_figs: number,
    legend_pos: string,
    scale_mode: string,
    fit_method: string,
    has_header: number,
    clean_input: number,
    figure_number: number,
    x_label: string,
    y_label: string,
    caption: string,
    label: string,
    siunitx: number,
    unc_sig_figs: number
  ) => string
  gen_csv_attachment: (input: string, has_header: number, clean_input: number) => string
  gen_gnuplot_config: (
    input: string,
    scale_mode: string,
    has_header: number,
    clean_input: number,
    x_label: string,
    y_label: string
  ) => string
}

let enginePromise: Promise<EngineModule | null> | null = null

export async function loadEngine(): Promise<EngineModule | null> {
  if (enginePromise) return enginePromise
  enginePromise = (async () => {
    try {
      const mod = (await import("./pkg/convertexcel_engine.js")) as unknown as EngineModule
      await mod.default()
      return mod
    } catch (err) {
      console.warn("[engine] WASM の読み込みに失敗しました。", err)
      return null
    }
  })()
  return enginePromise
}

export async function isWasmAvailable(): Promise<boolean> {
  return (await loadEngine()) !== null
}

async function require_engine(): Promise<EngineModule> {
  const e = await loadEngine()
  if (!e) throw new Error("WASM エンジンが利用できません (docker compose run --rm engine を実行してください)")
  return e
}

// ─── 変換 (convert) ────────────────────────────────────────

export type RoundMode = 0 | 1 | 2 // none / decimal / sig-figs

export interface ConvertOptions {
  mode: RoundMode
  decimals: number
  sigFigs: number
  hasHeader: boolean
  cleanInput: boolean
  booktabs: boolean
  siunitx: boolean
}

export interface TikzOptions {
  filename: string
  sigFigs: number
  legendPos: string
  scaleMode: string
  fitMethod: string
  hasHeader: boolean
  cleanInput: boolean
  figureNumber: number
  xLabel: string
  yLabel: string
  caption: string
  label: string
  siunitx: boolean
  uncSigFigs: number
}

const bool = (b: boolean) => (b ? 1 : 0)

export async function genLatex(input: string, o: ConvertOptions): Promise<string> {
  const e = await require_engine()
  return e.gen_latex_config(
    input,
    o.mode,
    o.decimals,
    o.sigFigs,
    bool(o.hasHeader),
    bool(o.cleanInput),
    bool(o.booktabs),
    bool(o.siunitx)
  )
}

export async function genCsv(input: string, o: ConvertOptions): Promise<string> {
  const e = await require_engine()
  return e.gen_csv_config(input, o.mode, o.decimals, o.sigFigs, bool(o.hasHeader), bool(o.cleanInput))
}

export async function genTikz(input: string, o: TikzOptions): Promise<string> {
  const e = await require_engine()
  return e.gen_tikz_graph_config(
    input,
    o.filename,
    o.sigFigs,
    o.legendPos,
    o.scaleMode,
    o.fitMethod,
    bool(o.hasHeader),
    bool(o.cleanInput),
    o.figureNumber,
    o.xLabel,
    o.yLabel,
    o.caption,
    o.label,
    bool(o.siunitx),
    o.uncSigFigs
  )
}

export async function genCsvAttachment(
  input: string,
  hasHeader: boolean,
  cleanInput: boolean
): Promise<string> {
  const e = await require_engine()
  return e.gen_csv_attachment(input, bool(hasHeader), bool(cleanInput))
}

export interface GnuplotOptions {
  scaleMode: string
  hasHeader: boolean
  cleanInput: boolean
  xLabel: string
  yLabel: string
}

export async function genGnuplot(input: string, o: GnuplotOptions): Promise<string> {
  const e = await require_engine()
  return e.gen_gnuplot_config(
    input,
    o.scaleMode,
    bool(o.hasHeader),
    bool(o.cleanInput),
    o.xLabel,
    o.yLabel
  )
}
