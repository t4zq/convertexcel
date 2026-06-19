export type EngineOperation =
  | "init"
  | "genLatex"
  | "genCsv"
  | "genTikz"
  | "genCsvAttachment"
  | "genGnuplot"
  | "convertAll"

export interface EngineRequest {
  id: number
  operation: EngineOperation
  args: unknown[]
}

export type EngineResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string }
