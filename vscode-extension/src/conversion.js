"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

let enginePromise;

const bool = (value) => (value ? 1 : 0);

async function loadEngine(extensionPath) {
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const engineDir = path.join(extensionPath, "engine");
    const modulePath = path.join(engineDir, "convertexcel_engine.js");
    const wasmPath = path.join(engineDir, "convertexcel_engine_bg.wasm");
    const [engineModule, wasmBytes] = await Promise.all([
      import(pathToFileURL(modulePath).href),
      fs.readFile(wasmPath),
    ]);
    engineModule.initSync({ module: wasmBytes });
    return engineModule;
  })();

  return enginePromise;
}

function roundModeValue(roundMode) {
  if (roundMode === "decimal") return 1;
  if (roundMode === "sig-figs") return 2;
  return 0;
}

function applyTableAlignment(latexCode, columnAlign, siunitx) {
  if (siunitx || columnAlign === "center") return latexCode;
  const align = columnAlign === "left" ? "l" : columnAlign === "right" ? "r" : "c";
  return latexCode.replace(/\\begin\{tabular\}\{([lcr]+)\}/, (match, colspec) => {
    return colspec ? `\\begin{tabular}{${align.repeat(colspec.length)}}` : match;
  });
}

const SERIES_COLORS = new Set(["black", "blue", "red", "teal", "orange", "purple", "brown", "cyan", "olive", "violet"]);
const SERIES_MARKS = new Set(["*", "o", "square*", "square", "triangle*", "triangle", "diamond*", "x"]);

function safeColor(value) {
  return value && SERIES_COLORS.has(value) ? value : undefined;
}

function safeMark(value) {
  return value && SERIES_MARKS.has(value) ? value : undefined;
}

function replaceOptionLine(lines, option, value) {
  const pattern = option === "color"
    ? /^(\s*)color=[^,\]]+(,?\s*)$/
    : /^(\s*)mark=[^,\]]+(,?\s*)$/;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(pattern);
    if (match) {
      lines[index] = `${match[1]}${option}=${value}${match[2]}`;
      return;
    }
  }
}

function transformAddplotBlock(lines, colors, marks, state) {
  const body = lines.join("\n");
  const isDataPlot = /^\s*mark=/m.test(body);
  const isFitPlot = !isDataPlot && /\\addplot\b/.test(body) && /^\s*forget plot,?$/m.test(body);
  const seriesIndex = isDataPlot ? state.nextDataSeries : isFitPlot ? state.lastDataSeries : -1;
  if (seriesIndex < 0) return lines;

  const next = [...lines];
  const color = safeColor(colors[seriesIndex]);
  if (color) replaceOptionLine(next, "color", color);
  if (isDataPlot) {
    const mark = safeMark(marks[seriesIndex]);
    if (mark) replaceOptionLine(next, "mark", mark);
    state.lastDataSeries = state.nextDataSeries;
    state.nextDataSeries += 1;
  }
  return next;
}

function applySeriesStyles(tikzCode, colors, marks) {
  if (!colors.length && !marks.length) return tikzCode;

  const output = [];
  const state = { nextDataSeries: 0, lastDataSeries: -1 };
  let block = null;
  let depth = 0;

  for (const line of tikzCode.split("\n")) {
    if (block) {
      block.push(line);
      for (const char of line) {
        if (char === "[") depth += 1;
        if (char === "]") depth -= 1;
      }
      if (depth <= 0) {
        output.push(...transformAddplotBlock(block, colors, marks, state));
        block = null;
      }
      continue;
    }

    if (/\\addplot\b/.test(line) && line.includes("[")) {
      block = [line];
      depth = 0;
      const start = line.indexOf("[");
      for (let index = start; index < line.length; index += 1) {
        if (line[index] === "[") depth += 1;
        if (line[index] === "]") depth -= 1;
      }
      if (depth <= 0) {
        output.push(...transformAddplotBlock(block, colors, marks, state));
        block = null;
      }
      continue;
    }

    output.push(line);
  }

  if (block) output.push(...block);
  return output.join("\n");
}

function fitMethod(tikz) {
  const methods = Array.isArray(tikz.fitMethods) && tikz.fitMethods.length ? tikz.fitMethods : ["auto"];
  return methods.join(",");
}

async function convertLatexTable(extensionPath, shareState) {
  const engine = await loadEngine(extensionPath);
  const table = shareState.table;
  const latex = engine.gen_latex_config(
    shareState.input,
    roundModeValue(table.roundMode),
    table.decimals,
    table.sigFigs,
    bool(table.hasHeader),
    bool(table.cleanInput),
    bool(table.booktabs),
    bool(table.siunitx),
  );
  return applyTableAlignment(latex, table.columnAlign, table.siunitx);
}

async function convertTikzGraph(extensionPath, shareState) {
  const engine = await loadEngine(extensionPath);
  const table = shareState.table;
  const tikz = shareState.tikz;
  const output = engine.gen_tikz_graph_config(
    shareState.input,
    tikz.filename || "data",
    table.sigFigs,
    tikz.legendPos,
    tikz.scaleMode,
    fitMethod(tikz),
    bool(table.hasHeader),
    bool(table.cleanInput),
    Number(tikz.figureNumber) || 0,
    tikz.xLabel,
    tikz.yLabel,
    tikz.caption,
    tikz.label,
    bool(table.siunitx),
    tikz.uncSigFigs || 0,
  );
  return applySeriesStyles(output, tikz.seriesColors || [], tikz.seriesMarks || []);
}

module.exports = {
  convertLatexTable,
  convertTikzGraph,
};
