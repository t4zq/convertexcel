// 3実装(Rust / Rails / TS)で共通の統計結果スキーマ。

export interface ColumnStats {
  column: string
  n: number
  mean: number
  std: number // 標本標準偏差 (n-1)
  min: number
  q1: number
  median: number
  q3: number
  max: number
}

export interface CorrelationMatrix {
  columns: string[]
  matrix: number[][] // Pearson 相関係数
}

export interface StatsResult {
  descriptive: ColumnStats[]
  correlation: CorrelationMatrix
}

// 入力: 文字列セルの2次元配列 (1行目=ヘッダ)
export type Grid = string[][]

export type EngineSource = "wasm" | "api" | "ts"

// ─── フィット ──────────────────────────────────────────────
export interface FitCurve {
  x: number[]
  y: number[]
}

export interface FitModelResult {
  model: string
  label: string
  params: number[]
  r2: number
  rmse: number
  aic: number
  expression: string
  curve: FitCurve
  residuals: number[]
}

export interface FitOutput {
  results: FitModelResult[]
  recommended: string | null
}

// ─── Welch t 検定 ──────────────────────────────────────────
export interface TTestResult {
  mean_a: number
  mean_b: number
  var_a: number
  var_b: number
  n_a: number
  n_b: number
  t: number
  df: number
  p_value: number
}

// ─── 回路解析 ──────────────────────────────────────────────
export interface CircuitResult {
  mode: string
  cutoff_fc?: number
  max_gain_db?: number
  slope_db_per_decade?: number
  tau?: number
  final_value?: number
  z_min?: number
  z_max?: number
  resonance_fc?: number
}

export type SmoothMode =
  | "none"
  | "moving-avg"
  | "median"
  | "low-pass"
  | "fft-low-pass"
