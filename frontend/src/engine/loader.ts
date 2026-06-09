import type {
  FitOutput,
  Grid,
  SmoothMode,
  StatsResult,
  TTestResult,
} from "@/lib/types"
import { computeStatsTS } from "@/lib/parse"

// Rust→WASM エンジンの読み込み。
// `docker compose run --rm engine` が wasm-pack(--target web) の出力を
// `frontend/src/engine/pkg/` に生成する。Vite に処理させるため通常の
// 動的 import で読み込む (glue 内の `new URL(..._bg.wasm, import.meta.url)`
// を Vite がアセットとして解決する)。
// ※ そのため frontend ビルド前に必ず engine ビルドを実行すること。

// wasm-bindgen が公開する関数群。
export interface EngineModule {
  default: (input?: unknown) => Promise<unknown>
  compute_stats: (json: string) => string
  fit_curves: (json: string) => string
  welch_ttest: (json: string) => string
  smooth_series: (json: string) => string
  lttb_downsample: (json: string) => string
  // convert
  gen_latex: (input: string) => string
  gen_csv: (input: string) => string
  gen_latex_config: (
    input: string,
    mode: number,
    decimals: number,
    sig_figs: number,
    has_header: number,
    clean_input: number
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
    figure_number: number
  ) => string
  gen_csv_attachment: (input: string, has_header: number, clean_input: number) => string
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

// ─── 統計 ──────────────────────────────────────────────────

/** WASM が使えれば Rust、無理なら TS フォールバックで記述統計+相関。 */
export async function computeStatsWASM(grid: Grid): Promise<StatsResult> {
  const engine = await loadEngine()
  if (!engine) return computeStatsTS(grid)
  return JSON.parse(engine.compute_stats(JSON.stringify(grid))) as StatsResult
}

export interface FitRequest {
  x: number[]
  y: number[]
  models: string[]
  poly_degree?: number
  samples?: number
}

export async function fitCurves(req: FitRequest): Promise<FitOutput> {
  const e = await require_engine()
  return JSON.parse(e.fit_curves(JSON.stringify(req))) as FitOutput
}

export async function welchTtest(a: number[], b: number[]): Promise<TTestResult> {
  const e = await require_engine()
  return JSON.parse(e.welch_ttest(JSON.stringify({ a, b }))) as TTestResult
}

// ─── 信号処理 ──────────────────────────────────────────────

export async function smoothSeries(
  y: number[],
  mode: SmoothMode,
  window: number,
  cutoff: number
): Promise<number[]> {
  if (mode === "none") return y
  const e = await loadEngine()
  if (!e) return y
  return JSON.parse(e.smooth_series(JSON.stringify({ y, mode, window, cutoff }))) as number[]
}

export async function lttbDownsample(
  x: number[],
  y: number[],
  threshold: number
): Promise<{ x: number[]; y: number[] }> {
  const e = await loadEngine()
  if (!e) return { x, y }
  return JSON.parse(e.lttb_downsample(JSON.stringify({ x, y, threshold }))) as {
    x: number[]
    y: number[]
  }
}

// ─── 変換 (convert) ────────────────────────────────────────

export type RoundMode = 0 | 1 | 2 // none / decimal / sig-figs

export interface ConvertOptions {
  mode: RoundMode
  decimals: number
  sigFigs: number
  hasHeader: boolean
  cleanInput: boolean
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
}

const bool = (b: boolean) => (b ? 1 : 0)

export async function genLatex(input: string, o: ConvertOptions): Promise<string> {
  const e = await require_engine()
  return e.gen_latex_config(input, o.mode, o.decimals, o.sigFigs, bool(o.hasHeader), bool(o.cleanInput))
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
    o.figureNumber
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
