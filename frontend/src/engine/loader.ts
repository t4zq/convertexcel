import type { EngineOperation, EngineRequest, EngineResponse } from "./protocol"

export type RoundMode = 0 | 1 | 2

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

export interface GnuplotOptions {
  scaleMode: string
  hasHeader: boolean
  cleanInput: boolean
  xLabel: string
  yLabel: string
  fitMethod: string
  keyPos: string
  grid: boolean
  pointType: number
  pointSize: number
  title: string
}

export interface EngineConversionResult {
  latex: string
  csv: string
  tikz: string
  gnuplot: string
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
}

let worker: Worker | null = null
let requestId = 0
const pending = new Map<number, PendingRequest>()

function rejectPending(error: Error) {
  for (const request of pending.values()) request.reject(error)
  pending.clear()
}

function getWorker() {
  if (worker) return worker
  const instance = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" })
  instance.addEventListener("message", (event: MessageEvent<EngineResponse>) => {
    const response = event.data
    const request = pending.get(response.id)
    if (!request) return
    pending.delete(response.id)
    if (response.ok) request.resolve(response.result)
    else request.reject(new Error(response.error))
  })
  instance.addEventListener("error", (event) => {
    const error = new Error(event.message || "WASM Workerでエラーが発生しました")
    rejectPending(error)
    instance.terminate()
    if (worker === instance) worker = null
  })
  worker = instance
  return instance
}

function request<T>(operation: EngineOperation, args: unknown[] = []): Promise<T> {
  const id = ++requestId
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    })
    try {
      getWorker().postMessage({ id, operation, args } satisfies EngineRequest)
    } catch (error) {
      pending.delete(id)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

export async function loadEngine(): Promise<boolean> {
  return request<boolean>("init")
}

export async function isWasmAvailable(): Promise<boolean> {
  try {
    return await loadEngine()
  } catch (error) {
    console.warn("[engine] WASM Workerの読み込みに失敗しました。", error)
    return false
  }
}

const bool = (value: boolean) => (value ? 1 : 0)

function latexArgs(input: string, options: ConvertOptions): unknown[] {
  return [
    input, options.mode, options.decimals, options.sigFigs, bool(options.hasHeader),
    bool(options.cleanInput), bool(options.booktabs), bool(options.siunitx),
  ]
}

function csvArgs(input: string, options: ConvertOptions): unknown[] {
  return [
    input, options.mode, options.decimals, options.sigFigs,
    bool(options.hasHeader), bool(options.cleanInput),
  ]
}

function tikzArgs(input: string, options: TikzOptions): unknown[] {
  return [
    input, options.filename, options.sigFigs, options.legendPos, options.scaleMode,
    options.fitMethod, bool(options.hasHeader), bool(options.cleanInput), options.figureNumber,
    options.xLabel, options.yLabel, options.caption, options.label, bool(options.siunitx),
    options.uncSigFigs,
  ]
}

function gnuplotArgs(input: string, options: GnuplotOptions): unknown[] {
  return [
    input, options.scaleMode, bool(options.hasHeader), bool(options.cleanInput), options.xLabel,
    options.yLabel, options.fitMethod, options.keyPos, bool(options.grid), options.pointType,
    options.pointSize, options.title,
  ]
}

export function genLatex(input: string, options: ConvertOptions) {
  return request<string>("genLatex", latexArgs(input, options))
}

export function genCsv(input: string, options: ConvertOptions) {
  return request<string>("genCsv", csvArgs(input, options))
}

export function genTikz(input: string, options: TikzOptions) {
  return request<string>("genTikz", tikzArgs(input, options))
}

export function genCsvAttachment(input: string, hasHeader: boolean, cleanInput: boolean) {
  return request<string>("genCsvAttachment", [input, bool(hasHeader), bool(cleanInput)])
}

export function genGnuplot(input: string, options: GnuplotOptions) {
  return request<string>("genGnuplot", gnuplotArgs(input, options))
}

export function convertAll(
  input: string,
  table: ConvertOptions,
  tikz: TikzOptions,
  gnuplot: GnuplotOptions,
) {
  return request<EngineConversionResult>("convertAll", [
    latexArgs(input, table),
    csvArgs(input, table),
    tikzArgs(input, tikz),
    gnuplotArgs(input, gnuplot),
  ])
}
