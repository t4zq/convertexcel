/// <reference lib="webworker" />

import init, {
  gen_csv_attachment,
  gen_csv_config,
  gen_gnuplot_config,
  gen_latex_config,
  gen_tikz_graph_config,
} from "./pkg/convertexcel_engine.js"

import type { EngineRequest, EngineResponse } from "./protocol"

const workerScope = self as unknown as DedicatedWorkerGlobalScope
let initialization: Promise<void> | null = null

function initialize() {
  initialization ??= init().then(() => undefined)
  return initialization
}

function asString(value: unknown) {
  return String(value ?? "")
}

function asNumber(value: unknown) {
  return Number(value)
}

function callOperation(operation: EngineRequest["operation"], args: unknown[]): unknown {
  switch (operation) {
    case "init":
      return true
    case "genLatex":
      return gen_latex_config(
        asString(args[0]), asNumber(args[1]), asNumber(args[2]), asNumber(args[3]),
        asNumber(args[4]), asNumber(args[5]), asNumber(args[6]), asNumber(args[7]),
      )
    case "genCsv":
      return gen_csv_config(
        asString(args[0]), asNumber(args[1]), asNumber(args[2]), asNumber(args[3]),
        asNumber(args[4]), asNumber(args[5]),
      )
    case "genTikz":
      return gen_tikz_graph_config(
        asString(args[0]), asString(args[1]), asNumber(args[2]), asString(args[3]),
        asString(args[4]), asString(args[5]), asNumber(args[6]), asNumber(args[7]),
        asNumber(args[8]), asString(args[9]), asString(args[10]), asString(args[11]),
        asString(args[12]), asNumber(args[13]), asNumber(args[14]),
      )
    case "genCsvAttachment":
      return gen_csv_attachment(asString(args[0]), asNumber(args[1]), asNumber(args[2]))
    case "genGnuplot":
      return gen_gnuplot_config(
        asString(args[0]), asString(args[1]), asNumber(args[2]), asNumber(args[3]),
        asString(args[4]), asString(args[5]), asString(args[6]), asString(args[7]),
        asNumber(args[8]), asNumber(args[9]), asNumber(args[10]), asString(args[11]),
      )
    case "convertAll": {
      const [latexArgs, csvArgs, tikzArgs, gnuplotArgs] = args as unknown[][]
      return {
        latex: callOperation("genLatex", latexArgs),
        csv: callOperation("genCsv", csvArgs),
        tikz: callOperation("genTikz", tikzArgs),
        gnuplot: callOperation("genGnuplot", gnuplotArgs),
      }
    }
  }
}

workerScope.addEventListener("message", (event: MessageEvent<EngineRequest>) => {
  const request = event.data
  void initialize()
    .then(() => callOperation(request.operation, request.args))
    .then((result) => {
      workerScope.postMessage({ id: request.id, ok: true, result } satisfies EngineResponse)
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      workerScope.postMessage({ id: request.id, ok: false, error: message } satisfies EngineResponse)
    })
})
