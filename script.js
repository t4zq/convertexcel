const elements = {
  input: document.getElementById('input'),
  latex: document.getElementById('latex'),
  csv: document.getElementById('csv'),
  tikz: document.getElementById('tikz'),
  decimals: document.getElementById('decimals'),
  sigFigs: document.getElementById('sig-figs'),
  filename: document.getElementById('filename'),
  legendPos: document.getElementById('legend-pos'),
  scaleMode: document.getElementById('scale-mode'),
  previewBtn: document.getElementById('preview-btn'),
  tikzPreview: document.getElementById('tikz-preview'),
};

const readNumber = (element, fallback) => parseInt(element.value, 10) || fallback;

const getRoundMode = () => {
  const selected = document.querySelector('input[name="round-mode"]:checked');
  return selected ? selected.value : 'none';
};

const getGraphOptions = () => ({
  sigFigs: readNumber(elements.sigFigs, 3),
  legendPos: elements.legendPos.value || 'north west',
  scaleMode: elements.scaleMode.value || 'linear',
});

const isNumber = (value) => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value);

const roundNumber = (value, decimals) => {
  if (!isNumber(value)) return value;
  return Number(value).toFixed(Math.max(0, decimals));
};

const roundSignificantFigures = (value, sigFigs) => {
  if (!isNumber(value)) return value;
  const number = Number(value);
  if (number === 0) return '0';
  const rounded = Number(number.toPrecision(Math.max(1, sigFigs)));
  return rounded.toString();
};

const formatCsv = (data, formatCell) => data
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const delimiter = line.includes('\t') ? '\t' : ',';
    return line
      .split(delimiter)
      .map((cell) => formatCell(cell.trim()))
      .join(',');
  })
  .join('\n');

ConvertModule().then((module) => {
  const takeString = (ptr) => {
    const value = module.UTF8ToString(ptr);
    module._free(ptr);
    return value;
  };

  const wrapExport = (name, returnType, argTypes) => (
    typeof module[`_${name}`] === 'function' ? module.cwrap(name, returnType, argTypes) : null
  );

  const wasm = {
    latex: wrapExport('gen_latex', 'number', ['string']),
    csv: wrapExport('gen_csv', 'number', ['string']),
    latexRounded: wrapExport('gen_latex_rounded', 'number', ['string', 'number']),
    csvRounded: wrapExport('gen_csv_rounded', 'number', ['string', 'number']),
    latexSigFigs: wrapExport('gen_latex_sig_figs', 'number', ['string', 'number']),
    csvSigFigs: wrapExport('gen_csv_sig_figs', 'number', ['string', 'number']),
    tikzGraph: wrapExport('gen_tikz_graph', 'number', ['string', 'string', 'number', 'string', 'string']),
    tikzGraphPreview: wrapExport('gen_tikz_graph_preview', 'number', ['string', 'number', 'string', 'string']),
  };

  const runWithInput = (handler) => {
    const data = elements.input.value.trim();
    if (!data) return;
    handler(data);
  };

  const generateRoundedOutput = (generators, data) => {
    const mode = getRoundMode();
    if (mode === 'decimal') {
      const decimals = readNumber(elements.decimals, 0);
      return generators.decimal
        ? takeString(generators.decimal(data, decimals))
        : generators.decimalFallback(data, decimals);
    }
    if (mode === 'sig-figs') {
      const sigFigs = readNumber(elements.sigFigs, 1);
      return generators.sigFigs
        ? takeString(generators.sigFigs(data, sigFigs))
        : generators.sigFigsFallback(data, sigFigs);
    }
    return takeString(generators.default(data));
  };

  document.getElementById('latex-btn').onclick = () => runWithInput((data) => {
    elements.latex.value = generateRoundedOutput({
      default: wasm.latex,
      decimal: wasm.latexRounded,
      sigFigs: wasm.latexSigFigs,
    }, data);
  });

  document.getElementById('csv-btn').onclick = () => runWithInput((data) => {
    elements.csv.value = generateRoundedOutput({
      default: wasm.csv,
      decimal: wasm.csvRounded,
      sigFigs: wasm.csvSigFigs,
      decimalFallback: (data, decimals) => formatCsv(data, (cell) => roundNumber(cell, decimals)),
      sigFigsFallback: (data, sigFigs) => formatCsv(data, (cell) => roundSignificantFigures(cell, sigFigs)),
    }, data);
  });

  document.getElementById('tikz-btn').onclick = () => runWithInput((data) => {
    const { sigFigs, legendPos, scaleMode } = getGraphOptions();
    const filename = elements.filename.value.trim() || 'data';
    elements.tikz.value = takeString(wasm.tikzGraph(data, filename, sigFigs, legendPos, scaleMode));
  });

  elements.previewBtn.onclick = () => runWithInput((data) => {
    const { sigFigs, legendPos, scaleMode } = getGraphOptions();
    const previewCode = takeString(wasm.tikzGraphPreview(data, sigFigs, legendPos, scaleMode));

    elements.tikzPreview.innerHTML = '';
    const script = document.createElement('script');
    script.type = 'text/tikz';
    script.textContent = previewCode;
    elements.tikzPreview.appendChild(script);

    if (window.tikzjax) {
      window.tikzjax.processTikz();
    }
  });
});
