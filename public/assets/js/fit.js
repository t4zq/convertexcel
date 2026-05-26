const GRID_STORAGE_KEY = 'convertexcel-fit-grid';
const MIN_GRID_COLS = 2;
const MIN_GRID_ROWS = 3;
const DEFAULT_HEADERS = ['x', 'y'];
const DEFAULT_ROWS = [
  ['0', '2.0'],
  ['1', '2.7'],
  ['2', '3.6'],
  ['3', '4.9'],
  ['4', '6.6'],
  ['5', '8.9'],
  ['6', '12.1'],
];
const SAVE_STATUS_MS = 1500;
const CHART_THEME = {
  ink: '#1a1a1c',
  grid: '#e3e8e4',
  axis: '#6b7280',
  panel: '#ffffff',
  font: { family: '"Segoe UI", system-ui, sans-serif', size: 12, color: '#1a1a1c' },
};

const chartLayout = (overrides = {}) => ({
  paper_bgcolor: 'transparent',
  plot_bgcolor: CHART_THEME.panel,
  font: CHART_THEME.font,
  hovermode: 'closest',
  margin: { t: 22, l: 62, r: 24, b: 58 },
  legend: { orientation: 'h', y: -0.2, x: 0, font: { size: 11 } },
  xaxis: {
    showline: true,
    linecolor: CHART_THEME.axis,
    linewidth: 1,
    ticks: 'outside',
    tickcolor: CHART_THEME.axis,
    gridcolor: CHART_THEME.grid,
    zeroline: false,
  },
  yaxis: {
    showline: true,
    linecolor: CHART_THEME.axis,
    linewidth: 1,
    ticks: 'outside',
    tickcolor: CHART_THEME.axis,
    gridcolor: CHART_THEME.grid,
    zeroline: false,
  },
  ...overrides,
});

const chartConfig = {
  responsive: true,
  displayModeBar: true,
  scrollZoom: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
};

let gridRows = [];
let gridChangeTimer = null;
let saveStatusTimer = null;
let fitResults = [];

const MODEL_META = {
  linear: { label: '線形', k: 2, color: '#107c41', dash: 'solid' },
  poly: { label: '多項式', color: '#005fb8', dash: 'solid' },
  exp: { label: '指数', k: 2, color: '#c16800', dash: 'dash' },
  power: { label: 'べき乗', k: 2, color: '#8c6c00', dash: 'dot' },
  logistic: { label: 'ロジスティック', k: 3, color: '#7f52b8', dash: 'dashdot' },
  sin: { label: '正弦', k: 4, color: '#008bf2', dash: 'longdash' },
};

const $ = (id) => document.getElementById(id);
const finite = (v) => Number.isFinite(v);

const fmt = (value) => {
  if (!finite(value)) return '—';
  const abs = Math.abs(value);
  return abs >= 10000 || (abs > 0 && abs < 0.001)
    ? value.toExponential(3)
    : Number(value.toPrecision(5)).toString();
};

const showGridStatus = (message) => {
  const status = $('save-status');
  if (!status) return;
  status.textContent = message;
  window.clearTimeout(saveStatusTimer);
  saveStatusTimer = window.setTimeout(() => {
    status.textContent = '';
  }, SAVE_STATUS_MS);
};

const createInitialGridRows = () => {
  const rows = [[...DEFAULT_HEADERS], ...DEFAULT_ROWS.map((row) => [...row])];
  while (rows.length < 9) rows.push(Array(DEFAULT_HEADERS.length).fill(''));
  return rows;
};

const normalizeGridRows = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : createInitialGridRows();
  const rowCount = Math.max(MIN_GRID_ROWS, safeRows.length);
  const colCount = Math.max(MIN_GRID_COLS, ...safeRows.map((row) => (Array.isArray(row) ? row.length : 0)));
  return Array.from({ length: rowCount }, (_, r) => (
    Array.from({ length: colCount }, (_, c) => {
      const value = Array.isArray(safeRows[r]) ? safeRows[r][c] : '';
      return value == null ? '' : String(value);
    })
  ));
};

const readStoredGridRows = () => {
  try {
    const raw = localStorage.getItem(GRID_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.headers) || !Array.isArray(parsed?.rows)) return null;
    const hasContent = [...parsed.headers, ...parsed.rows.flat()].some((cell) => String(cell ?? '').trim());
    return hasContent ? [parsed.headers, ...parsed.rows] : null;
  } catch {
    return null;
  }
};

const snapshotGridRows = () => {
  const table = $('data-grid');
  if (!table) return normalizeGridRows(gridRows);
  return [...table.rows].map((tr) => [...tr.cells].map((td) => td.querySelector('input')?.value ?? ''));
};

const saveGridToStorage = () => {
  const rows = snapshotGridRows();
  const [headers = [], ...dataRows] = rows;
  localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify({ headers, rows: dataRows }));
  showGridStatus('保存済み');
};

const getCellInput = (rowIdx, colIdx) => document.querySelector(`#data-grid input[data-row="${rowIdx}"][data-col="${colIdx}"]`);

const focusCell = (rowIdx, colIdx) => {
  const input = getCellInput(rowIdx, colIdx);
  if (!input) return;
  input.focus();
  input.select();
};

const renderDataGrid = (rows = gridRows) => {
  const table = $('data-grid');
  if (!table) return;
  gridRows = normalizeGridRows(rows);
  table.textContent = '';
  gridRows.forEach((row, rowIdx) => {
    const tr = document.createElement('tr');
    row.forEach((value, colIdx) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = value;
      input.dataset.row = String(rowIdx);
      input.dataset.col = String(colIdx);
      input.addEventListener('input', onGridInput);
      input.addEventListener('keydown', onGridKeydown);
      td.appendChild(input);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
};

const readGridData = () => {
  const rows = snapshotGridRows();
  const headers = (rows[0] || []).map((h, i) => h.trim() || `列${i + 1}`);
  const dataRows = rows.slice(1);
  const columns = headers.map((_, colIdx) => (
    dataRows.map((row) => {
      const raw = String(row[colIdx] ?? '').trim().normalize('NFKC');
      if (!raw) return null;
      const value = Number(raw);
      return finite(value) ? value : null;
    })
  ));
  return { headers, columns };
};

const updateColumnSelectors = () => {
  const { headers } = readGridData();
  [
    { el: $('x-col-select'), fallback: 0 },
    { el: $('y-col-select'), fallback: Math.min(1, headers.length - 1) },
  ].forEach(({ el, fallback }) => {
    if (!el) return;
    const prev = el.value;
    el.textContent = '';
    headers.forEach((header, i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = header;
      el.appendChild(option);
    });
    el.value = [...el.options].some((o) => o.value === prev) ? prev : String(fallback);
  });
};

const selectedXY = () => {
  const { columns } = readGridData();
  const xi = parseInt($('x-col-select')?.value ?? '0', 10);
  const yi = parseInt($('y-col-select')?.value ?? '1', 10);
  const pairs = (columns[xi] || [])
    .map((x, i) => [x, (columns[yi] || [])[i]])
    .filter(([x, y]) => finite(x) && finite(y))
    .sort((a, b) => a[0] - b[0]);
  return { xs: pairs.map(([x]) => x), ys: pairs.map(([, y]) => y) };
};

const onGridKeydown = (event) => {
  if (event.key !== 'Tab' && event.key !== 'Enter') return;
  event.preventDefault();
  const rowIdx = parseInt(event.currentTarget.dataset.row, 10);
  const colIdx = parseInt(event.currentTarget.dataset.col, 10);
  const colCount = gridRows[0]?.length || MIN_GRID_COLS;
  const rowCount = gridRows.length;
  if (event.key === 'Enter') {
    focusCell(Math.min(rowIdx + 1, rowCount - 1), colIdx);
    return;
  }
  if (event.shiftKey) {
    focusCell(colIdx === 0 ? Math.max(rowIdx - 1, 0) : rowIdx, colIdx === 0 ? colCount - 1 : colIdx - 1);
    return;
  }
  focusCell(colIdx === colCount - 1 ? Math.min(rowIdx + 1, rowCount - 1) : rowIdx, colIdx === colCount - 1 ? 0 : colIdx + 1);
};

function onGridInput() {
  window.clearTimeout(gridChangeTimer);
  gridChangeTimer = window.setTimeout(() => {
    saveGridToStorage();
    updateColumnSelectors();
  }, 250);
}

const resizeGrid = (rowDelta, colDelta) => {
  const nextRows = normalizeGridRows(snapshotGridRows());
  const rowCount = Math.max(MIN_GRID_ROWS, nextRows.length + rowDelta);
  const colCount = Math.max(MIN_GRID_COLS, (nextRows[0]?.length || MIN_GRID_COLS) + colDelta);
  renderDataGrid(Array.from({ length: rowCount }, (_, r) => Array.from({ length: colCount }, (_, c) => nextRows[r]?.[c] ?? '')));
  saveGridToStorage();
  updateColumnSelectors();
};

const trimRowsForSpreadsheet = (rows) => {
  const isFilled = (cell) => String(cell ?? '').trim() !== '';
  let lastRow = rows.length - 1;
  while (lastRow >= 0 && !rows[lastRow].some(isFilled)) lastRow -= 1;
  if (lastRow < 0) return [];
  let lastCol = 0;
  rows.slice(0, lastRow + 1).forEach((row) => row.forEach((cell, idx) => {
    if (isFilled(cell)) lastCol = Math.max(lastCol, idx);
  }));
  return rows.slice(0, lastRow + 1).map((row) => row.slice(0, lastCol + 1));
};

const writeClipboardText = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fallback below.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  textarea.remove();
  if (!ok) throw new Error('copy failed');
};

const copyGridForExcel = async () => {
  const rows = trimRowsForSpreadsheet(snapshotGridRows());
  if (rows.length === 0) {
    showGridStatus('コピーするデータがありません');
    return;
  }
  try {
    await writeClipboardText(rows.map((row) => row.join('\t')).join('\r\n'));
    showGridStatus('Excelに貼り付けできます');
  } catch {
    showGridStatus('コピーできませんでした');
  }
};

const parseCSV = (str) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    if (inQuotes) {
      if (ch === '"' && str[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || (ch === '\r' && str[i + 1] === '\n')) {
      if (ch === '\r') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ''));
};

const solveLinearSystem = (A, b) => {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const div = M[col][col];
    for (let c = col; c <= n; c += 1) M[col][c] /= div;
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c += 1) M[r][c] -= factor * M[col][c];
    }
  }
  return M.map((row) => row[n]);
};

const solveOLS = (X, y) => {
  const p = X[0]?.length || 0;
  const XtX = Array.from({ length: p }, () => Array(p).fill(0));
  const Xty = Array(p).fill(0);
  X.forEach((row, i) => {
    for (let a = 0; a < p; a += 1) {
      Xty[a] += row[a] * y[i];
      for (let b = 0; b < p; b += 1) XtX[a][b] += row[a] * row[b];
    }
  });
  return solveLinearSystem(XtX, Xty);
};

const fitLinear = (xs, ys) => {
  const beta = solveOLS(xs.map((x) => [x, 1]), ys);
  if (!beta) return null;
  const [a, b] = beta;
  return { model: 'linear', params: { a, b }, formula: 'y = ax + b', predict: (x) => a * x + b };
};

const fitPolynomial = (xs, ys, degree) => {
  const d = Math.min(degree, xs.length - 1);
  const beta = solveOLS(xs.map((x) => Array.from({ length: d + 1 }, (_, i) => x ** i)), ys);
  if (!beta) return null;
  return {
    model: 'poly',
    params: Object.fromEntries(beta.map((v, i) => [`a${i}`, v])),
    degree: d,
    formula: `y = a0 + ... + a${d}x^${d}`,
    predict: (x) => beta.reduce((sum, c, i) => sum + c * x ** i, 0),
  };
};

const gaussNewton = (fn, jacobian, params0, xs, ys, maxIter = 80) => {
  let params = [...params0];
  let lambda = 1e-6;
  for (let iter = 0; iter < maxIter; iter += 1) {
    const J = [];
    const r = [];
    xs.forEach((x, i) => {
      const pred = fn(x, params);
      if (!finite(pred)) return;
      J.push(jacobian(x, params));
      r.push(ys[i] - pred);
    });
    const JTJ = Array.from({ length: params.length }, () => Array(params.length).fill(0));
    const JTr = Array(params.length).fill(0);
    J.forEach((row, i) => {
      row.forEach((v, a) => {
        JTr[a] += v * r[i];
        row.forEach((w, b) => { JTJ[a][b] += v * w; });
      });
    });
    for (let i = 0; i < params.length; i += 1) JTJ[i][i] += lambda;
    const delta = solveLinearSystem(JTJ, JTr);
    if (!delta) break;
    const next = params.map((p, i) => p + delta[i]);
    if (delta.every((d) => Math.abs(d) < 1e-8)) { params = next; break; }
    params = next.map((v) => (finite(v) ? v : 0));
  }
  return params;
};

const fitExponential = (xs, ys) => {
  const logPairs = xs.map((x, i) => [x, ys[i]]).filter(([, y]) => y > 0);
  if (logPairs.length < 2) return null;
  const beta = solveOLS(logPairs.map(([x]) => [x, 1]), logPairs.map(([, y]) => Math.log(y)));
  if (!beta) return null;
  const initial = [Math.exp(beta[1]), beta[0]];
  const params = gaussNewton(
    (x, [a, b]) => a * Math.exp(b * x),
    (x, [a, b]) => {
      const e = Math.exp(b * x);
      return [e, a * x * e];
    },
    initial,
    xs,
    ys,
  );
  const [a, b] = params;
  return { model: 'exp', params: { a, b }, formula: 'y = a e^(bx)', predict: (x) => a * Math.exp(b * x) };
};

const fitPower = (xs, ys) => {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => x > 0 && y > 0);
  if (pairs.length < 2) return null;
  const beta = solveOLS(pairs.map(([x]) => [Math.log(x), 1]), pairs.map(([, y]) => Math.log(y)));
  if (!beta) return null;
  const [b, logA] = beta;
  const a = Math.exp(logA);
  return { model: 'power', params: { a, b }, formula: 'y = a x^b', predict: (x) => (x > 0 ? a * x ** b : NaN) };
};

const fitLogistic = (xs, ys) => {
  const yMax = Math.max(...ys);
  const model = (x, [L, k, x0]) => L / (1 + Math.exp(-k * (x - x0)));
  const jac = (x, [L, k, x0]) => {
    const e = Math.exp(-k * (x - x0));
    const d = 1 + e;
    return [1 / d, L * e * (x - x0) / (d * d), -L * k * e / (d * d)];
  };
  const score = (params) => ys.reduce((sum, y, i) => sum + (y - model(xs[i], params)) ** 2, 0);
  const starts = [1.01, 1.05, 1.2, 1.6, 2.2].map((scale) => {
    const L = Math.max(yMax * scale, yMax + 1e-6);
    const logitPairs = xs.map((x, i) => {
      const y = Math.min(Math.max(ys[i], 1e-9), L - 1e-9);
      return [x, Math.log(L / y - 1)];
    }).filter(([, z]) => finite(z));
    const beta = solveOLS(logitPairs.map(([x]) => [x, 1]), logitPairs.map(([, z]) => z));
    if (!beta) return [L, 1, xs[Math.floor(xs.length / 2)]];
    const k = Math.max(Math.min(-beta[0], 20), -20);
    const x0 = Math.abs(k) > 1e-9 ? beta[1] / k : xs[Math.floor(xs.length / 2)];
    return [L, k, x0];
  });
  let bestParams = starts[0];
  let bestScore = Infinity;
  starts.forEach((start) => {
    const candidate = gaussNewton(
      model,
      jac,
      start,
      xs,
      ys,
    );
    const safeCandidate = candidate.every(finite) && Math.abs(candidate[1]) < 100 ? candidate : start;
    const chosen = score(safeCandidate) <= score(start) ? safeCandidate : start;
    const s = score(chosen);
    if (s < bestScore) {
      bestScore = s;
      bestParams = chosen;
    }
  });
  const [L, k, x0] = bestParams;
  return { model: 'logistic', params: { L, k, x0 }, formula: 'y = L/(1+e^(-k(x-x0)))', predict: (x) => model(x, bestParams) };
};

const fft = (re, im) => {
  const n = re.length;
  if (n <= 1) return;
  const evenRe = [], evenIm = [], oddRe = [], oddIm = [];
  for (let i = 0; i < n; i += 2) {
    evenRe.push(re[i]); evenIm.push(im[i]);
    oddRe.push(re[i + 1] || 0); oddIm.push(im[i + 1] || 0);
  }
  fft(evenRe, evenIm); fft(oddRe, oddIm);
  for (let k = 0; k < n / 2; k += 1) {
    const angle = -2 * Math.PI * k / n;
    const cr = Math.cos(angle), ci = Math.sin(angle);
    const tr = cr * oddRe[k] - ci * oddIm[k];
    const ti = cr * oddIm[k] + ci * oddRe[k];
    re[k] = evenRe[k] + tr; im[k] = evenIm[k] + ti;
    re[k + n / 2] = evenRe[k] - tr; im[k + n / 2] = evenIm[k] - ti;
  }
};

const fitSinusoidal = (xs, ys) => {
  if (xs.length < 4) return null;
  const n = 2 ** Math.ceil(Math.log2(xs.length));
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const re = Array.from({ length: n }, (_, i) => (ys[i] ?? mean) - mean);
  const im = Array(n).fill(0);
  fft(re, im);
  let peak = 1;
  for (let i = 2; i < n / 2; i += 1) {
    if (Math.hypot(re[i], im[i]) > Math.hypot(re[peak], im[peak])) peak = i;
  }
  const span = Math.max(...xs) - Math.min(...xs) || 1;
  const omega0 = 2 * Math.PI * peak / span;
  const amp0 = (Math.max(...ys) - Math.min(...ys)) / 2 || 1;
  const params = gaussNewton(
    (x, [A, omega, phi, C]) => A * Math.sin(omega * x + phi) + C,
    (x, [A, omega, phi]) => {
      const arg = omega * x + phi;
      return [Math.sin(arg), A * x * Math.cos(arg), A * Math.cos(arg), 1];
    },
    [amp0, omega0, 0, mean],
    xs,
    ys,
  );
  const [A, omega, phi, C] = params;
  return { model: 'sin', params: { A, omega, phi, C }, formula: 'y = A sin(ωx+φ)+C', predict: (x) => A * Math.sin(omega * x + phi) + C };
};

const calcR2 = (ys, predicted) => {
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((s, y) => s + (y - mean) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - predicted[i]) ** 2, 0);
  return ssTot > 0 ? 1 - ssRes / ssTot : NaN;
};

const calcRMSE = (ys, predicted) => Math.sqrt(ys.reduce((s, y, i) => s + (y - predicted[i]) ** 2, 0) / ys.length);
const calcAIC = (n, k, ssRes) => n * Math.log(Math.max(ssRes / n, 1e-15)) + 2 * k;

const evaluateFit = (fit, xs, ys) => {
  if (!fit?.predict) return null;
  const predicted = xs.map((x) => fit.predict(x));
  if (predicted.some((v) => !finite(v))) return null;
  const ssRes = ys.reduce((s, y, i) => s + (y - predicted[i]) ** 2, 0);
  const k = fit.model === 'poly' ? Object.keys(fit.params).length : MODEL_META[fit.model].k;
  return {
    ...fit,
    predicted,
    r2: calcR2(ys, predicted),
    rmse: calcRMSE(ys, predicted),
    aic: calcAIC(xs.length, k, ssRes),
  };
};

const selectedModels = () => [...document.querySelectorAll('.fit-model-select input:checked')].map((input) => input.value);

const runFits = () => {
  const { xs, ys } = selectedXY();
  if (xs.length < 2) {
    fitResults = [];
    renderAll(xs, ys);
    return;
  }
  const degree = parseInt($('poly-degree')?.value || '2', 10);
  fitResults = selectedModels().map((model) => {
    try {
      if (model === 'linear') return evaluateFit(fitLinear(xs, ys), xs, ys);
      if (model === 'poly') return evaluateFit(fitPolynomial(xs, ys, degree), xs, ys);
      if (model === 'exp') return evaluateFit(fitExponential(xs, ys), xs, ys);
      if (model === 'power') return evaluateFit(fitPower(xs, ys), xs, ys);
      if (model === 'logistic') return evaluateFit(fitLogistic(xs, ys), xs, ys);
      if (model === 'sin') return evaluateFit(fitSinusoidal(xs, ys), xs, ys);
    } catch {
      return null;
    }
    return null;
  }).filter(Boolean).sort((a, b) => a.aic - b.aic);
  renderAll(xs, ys);
};

const renderFitChart = (xs, ys) => {
  const el = $('fit-chart');
  if (!el) return;
  if (xs.length < 2) {
    el.innerHTML = '<p class="stats-empty fit-empty">X/Y列に数値データを入力してください。</p>';
    return;
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const plotXs = Array.from({ length: 160 }, (_, i) => minX + (maxX - minX) * i / 159);
  const traces = [{
    type: 'scatter',
    mode: 'markers',
    name: '実測値',
    x: xs,
    y: ys,
    marker: { size: 8, color: CHART_THEME.ink, symbol: 'circle', line: { width: 1.2, color: '#ffffff' } },
    hovertemplate: 'x=%{x}<br>y=%{y}<extra>%{fullData.name}</extra>',
  }];
  fitResults.forEach((result) => {
    traces.push({
      type: 'scatter',
      mode: 'lines',
      name: MODEL_META[result.model].label,
      x: plotXs,
      y: plotXs.map((x) => result.predict(x)),
      line: { width: 2.4, color: MODEL_META[result.model].color, dash: MODEL_META[result.model].dash },
      hovertemplate: 'x=%{x}<br>fit=%{y}<extra>%{fullData.name}</extra>',
    });
  });
  const base = chartLayout();
  Plotly.newPlot(el, traces, chartLayout({
    xaxis: { ...base.xaxis, title: 'x' },
    yaxis: { ...base.yaxis, title: 'y' },
  }), chartConfig);
};

const renderResidualChart = (xs, ys) => {
  const el = $('residual-chart');
  if (!el) return;
  if (fitResults.length === 0) {
    el.innerHTML = '<p class="stats-empty fit-empty">フィットを実行すると残差が表示されます。</p>';
    return;
  }
  const traces = fitResults.map((result) => ({
    type: 'scatter',
    mode: 'lines+markers',
    name: MODEL_META[result.model].label,
    x: xs,
    y: ys.map((y, i) => y - result.predicted[i]),
    line: { width: 2.2, color: MODEL_META[result.model].color, dash: MODEL_META[result.model].dash },
    marker: { size: 6, symbol: 'circle', line: { width: 1, color: '#ffffff' } },
    hovertemplate: 'x=%{x}<br>residual=%{y}<extra>%{fullData.name}</extra>',
  }));
  const base = chartLayout();
  Plotly.newPlot(el, traces, chartLayout({
    xaxis: { ...base.xaxis, title: 'x' },
    yaxis: { ...base.yaxis, title: '残差', zeroline: true, zerolinecolor: CHART_THEME.axis },
  }), chartConfig);
};

const paramsText = (params) => Object.entries(params).map(([key, value]) => `${key}=${fmt(value)}`).join(', ');

const renderFitResults = () => {
  const target = $('fit-results');
  const summary = $('fit-summary');
  if (!target || !summary) return;
  if (fitResults.length === 0) {
    target.innerHTML = '<p class="stats-empty">結果がここに表示されます。</p>';
    summary.innerHTML = '<p class="stats-empty">フィットを実行すると表示されます。</p>';
    return;
  }
  const best = fitResults[0];
  summary.innerHTML = `<div class="fit-best-summary"><span class="fit-best-label">推奨</span><strong>${MODEL_META[best.model].label}</strong><span>R² ${fmt(best.r2)} / RMSE ${fmt(best.rmse)} / AIC ${fmt(best.aic)}</span></div>`;
  const rows = fitResults.map((r, i) => `
    <tr class="${i === 0 ? 'fit-best' : ''}">
      <td>${MODEL_META[r.model].label}</td>
      <td>${r.formula}</td>
      <td><span class="fit-param-badge">${paramsText(r.params)}</span></td>
      <td>${fmt(r.r2)}</td>
      <td>${fmt(r.rmse)}</td>
      <td>${fmt(r.aic)}</td>
      <td>${i === 0 ? '<span class="cv-badge badge--good">推奨</span>' : ''}</td>
    </tr>
  `).join('');
  target.innerHTML = `<div class="stats-table-wrap"><table class="stats-table fit-table"><thead><tr><th>モデル</th><th>式</th><th>パラメータ</th><th>R²</th><th>RMSE</th><th>AIC</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
};

const renderAll = (xs, ys) => {
  renderFitChart(xs, ys);
  renderResidualChart(xs, ys);
  renderFitResults();
};

document.addEventListener('DOMContentLoaded', () => {
  renderDataGrid(readStoredGridRows() || createInitialGridRows());
  updateColumnSelectors();
  saveGridToStorage();
  renderAll(...Object.values(selectedXY()));

  $('grid-wrap')?.addEventListener('paste', (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text');
    if (!text) return;
    const pastedRows = text.split(/\r?\n/).filter((line) => line !== '').map((line) => (line.includes('\t') ? line.split('\t') : line.split(',')));
    const active = document.activeElement;
    const startRow = parseInt(active?.dataset?.row ?? '0', 10);
    const startCol = parseInt(active?.dataset?.col ?? '0', 10);
    const currentRows = snapshotGridRows();
    const rowCount = Math.max(currentRows.length, startRow + pastedRows.length);
    const colCount = Math.max(currentRows[0]?.length ?? 0, startCol + Math.max(...pastedRows.map((r) => r.length)));
    const merged = Array.from({ length: rowCount }, (_, r) => Array.from({ length: colCount }, (_, c) => currentRows[r]?.[c] ?? ''));
    pastedRows.forEach((row, dr) => row.forEach((value, dc) => { merged[startRow + dr][startCol + dc] = value; }));
    renderDataGrid(merged);
    saveGridToStorage();
    updateColumnSelectors();
  });

  $('add-row-btn')?.addEventListener('click', () => resizeGrid(1, 0));
  $('add-col-btn')?.addEventListener('click', () => resizeGrid(0, 1));
  $('del-row-btn')?.addEventListener('click', () => resizeGrid(-1, 0));
  $('del-col-btn')?.addEventListener('click', () => resizeGrid(0, -1));
  $('clear-btn')?.addEventListener('click', () => {
    renderDataGrid(createInitialGridRows());
    saveGridToStorage();
    updateColumnSelectors();
  });
  $('copy-excel-btn')?.addEventListener('click', copyGridForExcel);
  $('run-fit-btn')?.addEventListener('click', runFits);
  $('x-col-select')?.addEventListener('change', runFits);
  $('y-col-select')?.addEventListener('change', runFits);
  document.querySelectorAll('.fit-model-select input').forEach((input) => input.addEventListener('change', runFits));
  $('poly-degree')?.addEventListener('input', () => {
    $('poly-degree-value').textContent = $('poly-degree').value;
    runFits();
  });

  $('save-csv-btn')?.addEventListener('click', () => {
    const rows = snapshotGridRows();
    const csvText = rows.map((row) => row.map((cell) => {
      const s = String(cell);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\r\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  $('load-csv-input')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(String(e.target.result || ''));
      if (!parsed.length) return;
      renderDataGrid(parsed);
      saveGridToStorage();
      updateColumnSelectors();
      runFits();
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  });

  $('send-to-convert-btn')?.addEventListener('click', () => {
    const rows = trimRowsForSpreadsheet(snapshotGridRows());
    localStorage.setItem('convertexcel-transfer-data', rows.map((row) => row.join('\t')).join('\n'));
    window.location.href = 'convert.html';
  });

  runFits();
});
