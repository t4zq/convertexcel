const GRID_STORAGE_KEY = 'convertexcel-circuit-grid';
const MIN_GRID_COLS = 3;
const MIN_GRID_ROWS = 3;
const DEFAULT_DATA_ROWS = 8;
const SAVE_STATUS_MS = 1500;
const CHART_THEME = {
  green: '#107c41',
  blue: '#005fb8',
  orange: '#c16800',
  ink: '#1a1a1c',
  grid: '#e3e8e4',
  axis: '#6b7280',
  panel: '#ffffff',
  font: { family: '"Segoe UI", system-ui, sans-serif', size: 12, color: '#1a1a1c' },
};

const chartAxis = (overrides = {}) => ({
  showline: true,
  linecolor: CHART_THEME.axis,
  linewidth: 1,
  ticks: 'outside',
  tickcolor: CHART_THEME.axis,
  gridcolor: CHART_THEME.grid,
  zeroline: false,
  ...overrides,
});

const chartConfig = {
  responsive: true,
  displayModeBar: true,
  scrollZoom: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
};

const MODE_CONFIG = {
  bode: {
    label: '周波数特性',
    hint: 'f[Hz], |H|[dB] または Vout/Vin, φ[°] を入力してください。',
    headers: ['f[Hz]', '|H|[dB]', 'φ[°]'],
    rows: [
      ['100', '-0.04', '-3.6'],
      ['500', '-0.97', '-17.4'],
      ['1000', '-3.01', '-32.1'],
      ['1592', '-6.02', '-45.0'],
      ['5000', '-14.9', '-72.3'],
      ['10000', '-20.1', '-81.0'],
    ],
    chartTitle: 'ボード線図',
    chartCaption: '振幅と位相を対数周波数軸で表示します。',
    fitCaption: '1次LPF/HPF、2次BPF/BEFを最小二乗で近似します。',
  },
  transient: {
    label: '過渡応答',
    hint: 't[ms], V[V] または I[A] を入力してください。',
    headers: ['t[ms]', 'V[V]'],
    rows: [
      ['0', '0.0'],
      ['0.5', '3.94'],
      ['1.0', '6.32'],
      ['2.0', '8.65'],
      ['3.0', '9.50'],
      ['5.0', '9.93'],
    ],
    chartTitle: '過渡応答',
    chartCaption: '測定値に指数応答フィットを重ねて表示します。',
    fitCaption: '指数応答 A(1-e^(-t/τ))+C または Ae^(-t/τ)+C を自動推定します。',
  },
  impedance: {
    label: 'インピーダンス',
    hint: 'f[Hz], |Z|[Ω], φ[°] または f[Hz], Re[Ω], Im[Ω] を入力してください。',
    headers: ['f[Hz]', '|Z|[Ω]', 'φ[°]'],
    rows: [
      ['100', '105.0', '-78.0'],
      ['300', '42.0', '-57.0'],
      ['600', '23.0', '-28.0'],
      ['1000', '15.0', '0.0'],
      ['1600', '23.0', '28.0'],
      ['3000', '42.0', '57.0'],
      ['6000', '105.0', '78.0'],
    ],
    chartTitle: 'Nyquist線図',
    chartCaption: '複素インピーダンス平面と |Z| の周波数特性を表示します。',
    fitCaption: '共振点からRLC等価パラメータの目安を推定します。',
  },
};

let activeMode = localStorage.getItem('convertexcel-circuit-mode') || 'bode';
if (!MODE_CONFIG[activeMode]) activeMode = 'bode';

let gridRows = [];
let gridChangeTimer = null;
let saveStatusTimer = null;
let lastAnalysis = null;
let lastFit = null;

const $ = (id) => document.getElementById(id);

const fmt = (value, unit = '') => {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const text = abs >= 10000 || (abs > 0 && abs < 0.001)
    ? value.toExponential(3)
    : Number(value.toPrecision(4)).toString();
  return unit ? `${text} ${unit}` : text;
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

const createRowsForMode = (mode) => {
  const config = MODE_CONFIG[mode];
  const rows = [config.headers, ...config.rows];
  while (rows.length < DEFAULT_DATA_ROWS + 1) rows.push(Array(config.headers.length).fill(''));
  return rows;
};

const normalizeGridRows = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : createRowsForMode(activeMode);
  const rowCount = Math.max(MIN_GRID_ROWS, safeRows.length);
  const colCount = Math.max(
    MIN_GRID_COLS,
    ...safeRows.map((row) => (Array.isArray(row) ? row.length : 0)),
  );

  return Array.from({ length: rowCount }, (_, r) => (
    Array.from({ length: colCount }, (_, c) => {
      const value = Array.isArray(safeRows[r]) ? safeRows[r][c] : '';
      return value == null ? '' : String(value);
    })
  ));
};

const readStoredGridRows = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GRID_STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object') return null;
    const modeRows = parsed[activeMode];
    if (!Array.isArray(modeRows?.headers) || !Array.isArray(modeRows?.rows)) return null;
    const hasContent = [...modeRows.headers, ...modeRows.rows.flat()].some((cell) => String(cell ?? '').trim());
    if (!hasContent) return null;
    return [modeRows.headers, ...modeRows.rows];
  } catch {
    return null;
  }
};

const persistRowsForMode = (rows) => {
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem(GRID_STORAGE_KEY) || '{}') || {};
  } catch {
    parsed = {};
  }
  const [headers = [], ...dataRows] = rows;
  parsed[activeMode] = { headers, rows: dataRows };
  localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(parsed));
};

const snapshotGridRows = () => {
  const table = $('data-grid');
  if (!table) return normalizeGridRows(gridRows);
  return [...table.rows].map((tr) => [...tr.cells].map((td) => td.querySelector('input')?.value ?? ''));
};

const getCellInput = (rowIdx, colIdx) => (
  document.querySelector(`#data-grid input[data-row="${rowIdx}"][data-col="${colIdx}"]`)
);

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

const readTable = () => {
  const rows = snapshotGridRows();
  const headers = (rows[0] || []).map((header, i) => header.trim() || `列${i + 1}`);
  const dataRows = rows.slice(1);
  const columns = headers.map((_, colIdx) => (
    dataRows.map((row) => {
      const raw = String(row[colIdx] ?? '').trim().normalize('NFKC');
      if (!raw) return null;
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    })
  ));
  return { headers, columns };
};

const pairColumns = (xCol, yCol, zCol = null) => {
  const rows = [];
  const max = Math.max(xCol?.length || 0, yCol?.length || 0, zCol?.length || 0);
  for (let i = 0; i < max; i += 1) {
    const x = xCol?.[i];
    const y = yCol?.[i];
    const z = zCol ? zCol[i] : undefined;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (zCol && !Number.isFinite(z)) continue;
    rows.push(zCol ? [x, y, z] : [x, y]);
  }
  return rows;
};

const trimRowsForSpreadsheet = (rows) => {
  const isFilled = (cell) => String(cell ?? '').trim() !== '';
  let lastRow = rows.length - 1;
  while (lastRow >= 0 && !rows[lastRow].some(isFilled)) lastRow -= 1;
  if (lastRow < 0) return [];

  let lastCol = 0;
  rows.slice(0, lastRow + 1).forEach((row) => {
    row.forEach((cell, idx) => {
      if (isFilled(cell)) lastCol = Math.max(lastCol, idx);
    });
  });

  return rows.slice(0, lastRow + 1).map((row) => row.slice(0, lastCol + 1));
};

const writeClipboardText = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Continue to fallback.
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
  const tsv = rows.map((row) => row.map((cell) => String(cell ?? '')).join('\t')).join('\r\n');
  try {
    await writeClipboardText(tsv);
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
      if (ch === '"' && str[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && str[i + 1] === '\n')) {
      if (ch === '\r') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ''));
};

const resizeGrid = (rowDelta, colDelta) => {
  const nextRows = normalizeGridRows(snapshotGridRows());
  const rowCount = Math.max(MIN_GRID_ROWS, nextRows.length + rowDelta);
  const colCount = Math.max(MIN_GRID_COLS, (nextRows[0]?.length || MIN_GRID_COLS) + colDelta);
  const resized = Array.from({ length: rowCount }, (_, r) => (
    Array.from({ length: colCount }, (_, c) => nextRows[r]?.[c] ?? '')
  ));
  renderDataGrid(resized);
  onGridChange();
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
    const prevRow = colIdx === 0 ? Math.max(rowIdx - 1, 0) : rowIdx;
    const prevCol = colIdx === 0 ? colCount - 1 : colIdx - 1;
    focusCell(prevRow, prevCol);
    return;
  }

  const nextRow = colIdx === colCount - 1 ? Math.min(rowIdx + 1, rowCount - 1) : rowIdx;
  const nextCol = colIdx === colCount - 1 ? 0 : colIdx + 1;
  focusCell(nextRow, nextCol);
};

function onGridInput() {
  window.clearTimeout(gridChangeTimer);
  gridChangeTimer = window.setTimeout(onGridChange, 250);
}

const complex = (re = 0, im = 0) => ({
  re,
  im,
  add(other) { return complex(this.re + other.re, this.im + other.im); },
  mul(other) { return complex(this.re * other.re - this.im * other.im, this.re * other.im + this.im * other.re); },
  div(other) {
    const denom = other.re * other.re + other.im * other.im;
    return complex((this.re * other.re + this.im * other.im) / denom, (this.im * other.re - this.re * other.im) / denom);
  },
  abs() { return Math.hypot(this.re, this.im); },
  arg() { return Math.atan2(this.im, this.re); },
  conj() { return complex(this.re, -this.im); },
});

const toDb = (linear) => 20 * Math.log10(Math.max(Math.abs(linear), 1e-15));
const fromDb = (db) => 10 ** (db / 20);

const linReg = (xs, ys) => {
  const n = xs.length;
  if (n < 2) return { slope: NaN, intercept: NaN };
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, b) => a + b * b, 0);
  const sxy = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-14) return { slope: NaN, intercept: NaN };
  const slope = (n * sxy - sx * sy) / denom;
  return { slope, intercept: (sy - slope * sx) / n };
};

const detectCutoff = (freqs, dbs) => {
  const pairs = pairColumns(freqs, dbs).filter(([f]) => f > 0).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 2) return null;
  const maxGain = Math.max(...pairs.map(([, db]) => db));
  const target = maxGain - 3;
  let best = null;

  for (let i = 1; i < pairs.length; i += 1) {
    const [f0, d0] = pairs[i - 1];
    const [f1, d1] = pairs[i];
    if ((d0 - target) * (d1 - target) > 0 || d0 === d1) continue;
    const ratio = (target - d0) / (d1 - d0);
    const logF = Math.log10(f0) + ratio * (Math.log10(f1) - Math.log10(f0));
    const fc = 10 ** logF;
    best = { fc, gainAtFc: target, referenceGain: maxGain };
    break;
  }

  return best;
};

const detectPhaseCutoff = (freqs, phases) => {
  const pairs = pairColumns(freqs, phases).filter(([f]) => f > 0).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 2) return null;
  const firstFinite = pairs.find(([, p]) => Number.isFinite(p))?.[1] ?? 0;
  const target = firstFinite <= 0 ? -45 : 45;

  for (let i = 1; i < pairs.length; i += 1) {
    const [f0, p0] = pairs[i - 1];
    const [f1, p1] = pairs[i];
    if (!Number.isFinite(p0) || !Number.isFinite(p1) || p0 === p1) continue;
    if ((p0 - target) * (p1 - target) > 0) continue;
    const ratio = (target - p0) / (p1 - p0);
    const logF = Math.log10(f0) + ratio * (Math.log10(f1) - Math.log10(f0));
    return { fc: 10 ** logF, gainAtFc: target, referenceGain: firstFinite, source: 'phase' };
  }
  return null;
};

const slopeDbPerDecade = (freqs, dbs) => {
  const pairs = pairColumns(freqs, dbs)
    .filter(([f]) => f > 0)
    .sort((a, b) => a[0] - b[0]);
  if (pairs.length < 3) return NaN;
  const tailStart = Math.max(0, Math.floor(pairs.length * 0.55));
  const tail = pairs.slice(tailStart);
  const reg = linReg(tail.map(([f]) => Math.log10(f)), tail.map(([, db]) => db));
  return reg.slope;
};

const detectResonance = (freqs, dbs) => {
  const pairs = pairColumns(freqs, dbs).filter(([f]) => f > 0).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 3) return null;
  let peakIdx = 0;
  pairs.forEach(([, db], i) => {
    if (db > pairs[peakIdx][1]) peakIdx = i;
  });
  if (peakIdx === 0 || peakIdx === pairs.length - 1) return { fr: pairs[peakIdx][0], Q: NaN, peakDb: pairs[peakIdx][1] };

  const peakDb = pairs[peakIdx][1];
  const target = peakDb - 3;
  const interpolate = (a, b) => {
    const [f0, d0] = a;
    const [f1, d1] = b;
    if (d0 === d1) return NaN;
    const ratio = (target - d0) / (d1 - d0);
    return 10 ** (Math.log10(f0) + ratio * (Math.log10(f1) - Math.log10(f0)));
  };
  let fLow = NaN;
  let fHigh = NaN;
  for (let i = peakIdx; i > 0; i -= 1) {
    if ((pairs[i][1] - target) * (pairs[i - 1][1] - target) <= 0) {
      fLow = interpolate(pairs[i], pairs[i - 1]);
      break;
    }
  }
  for (let i = peakIdx; i < pairs.length - 1; i += 1) {
    if ((pairs[i][1] - target) * (pairs[i + 1][1] - target) <= 0) {
      fHigh = interpolate(pairs[i], pairs[i + 1]);
      break;
    }
  }
  const fr = pairs[peakIdx][0];
  const Q = Number.isFinite(fLow) && Number.isFinite(fHigh) && fHigh > fLow ? fr / (fHigh - fLow) : NaN;
  return { fr, Q, peakDb };
};

const goldenSection = (fn, lo, hi, tol = 1e-5) => {
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = lo;
  let b = hi;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  let fc = fn(c);
  let fd = fn(d);
  let guard = 0;

  while (Math.abs(b - a) > tol && guard < 160) {
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - gr * (b - a);
      fc = fn(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + gr * (b - a);
      fd = fn(d);
    }
    guard += 1;
  }
  const x = (a + b) / 2;
  return { x, value: fn(x) };
};

const mse = (actual, predicted) => {
  const vals = actual.map((v, i) => (Number.isFinite(v) && Number.isFinite(predicted[i]) ? (v - predicted[i]) ** 2 : null)).filter((v) => v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : Infinity;
};

const firstOrderDb = (freq, fc, type) => {
  const x = Math.max(freq / fc, 1e-15);
  const linear = type === 'hp' ? x / Math.sqrt(1 + x * x) : 1 / Math.sqrt(1 + x * x);
  return toDb(linear);
};

const fitFirstOrder = (freqs, dbs, type) => {
  const pairs = pairColumns(freqs, dbs).filter(([f]) => f > 0).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 3) return null;
  const fs = pairs.map(([f]) => f);
  const ys = pairs.map(([, db]) => db);
  const logMin = Math.log10(Math.min(...fs));
  const logMax = Math.log10(Math.max(...fs));
  const objective = (logFc) => {
    const fc = 10 ** logFc;
    const model = fs.map((f) => firstOrderDb(f, fc, type));
    const offset = ys.reduce((sum, y, i) => sum + y - model[i], 0) / ys.length;
    return mse(ys, model.map((v) => v + offset));
  };
  const result = goldenSection(objective, logMin, logMax, 1e-5);
  const fc = 10 ** result.x;
  const model = fs.map((f) => firstOrderDb(f, fc, type));
  const offsetDb = ys.reduce((sum, y, i) => sum + y - model[i], 0) / ys.length;
  return {
    type,
    fc,
    tau: 1 / (2 * Math.PI * fc),
    offsetDb,
    mse: result.value,
    predicted: fs.map((f, i) => [f, model[i] + offsetDb]),
  };
};

const secondOrderDb = (freq, f0, q, type) => {
  const x = Math.max(freq / f0, 1e-12);
  const denom = Math.sqrt((1 - x * x) ** 2 + (x / q) ** 2);
  const linear = type === 'be' ? Math.abs(1 - x * x) / Math.max(denom, 1e-15) : (x / q) / Math.max(denom, 1e-15);
  return toDb(linear);
};

const fitSecondOrder = (freqs, dbs, type) => {
  const pairs = pairColumns(freqs, dbs).filter(([f]) => f > 0).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 4) return null;
  const fs = pairs.map(([f]) => f);
  const ys = pairs.map(([, db]) => db);
  const logMin = Math.log10(Math.min(...fs));
  const logMax = Math.log10(Math.max(...fs));
  const objectiveForF0 = (logF0) => {
    const f0 = 10 ** logF0;
    const qResult = goldenSection((logQ) => {
      const q = 10 ** logQ;
      const model = fs.map((f) => secondOrderDb(f, f0, q, type));
      const offset = ys.reduce((sum, y, i) => sum + y - model[i], 0) / ys.length;
      return mse(ys, model.map((v) => v + offset));
    }, Math.log10(0.2), Math.log10(20), 1e-4);
    return qResult.value;
  };
  const f0Result = goldenSection(objectiveForF0, logMin, logMax, 1e-4);
  const f0 = 10 ** f0Result.x;
  const qResult = goldenSection((logQ) => {
    const q = 10 ** logQ;
    const model = fs.map((f) => secondOrderDb(f, f0, q, type));
    const offset = ys.reduce((sum, y, i) => sum + y - model[i], 0) / ys.length;
    return mse(ys, model.map((v) => v + offset));
  }, Math.log10(0.2), Math.log10(20), 1e-5);
  const Q = 10 ** qResult.x;
  const model = fs.map((f) => secondOrderDb(f, f0, Q, type));
  const offsetDb = ys.reduce((sum, y, i) => sum + y - model[i], 0) / ys.length;
  return {
    type,
    f0,
    Q,
    offsetDb,
    mse: qResult.value,
    predicted: fs.map((f, i) => [f, model[i] + offsetDb]),
  };
};

const fitExponential = (times, values) => {
  const pairs = pairColumns(times, values).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 4) return null;
  const ts = pairs.map(([t]) => t);
  const ys = pairs.map(([, y]) => y);
  const t0 = ts[0];
  const xs = ts.map((t) => Math.max(0, t - t0));
  const start = ys[0];
  const end = ys[ys.length - 1];
  const rising = end >= start;
  const minT = Math.max(1e-9, (Math.max(...xs) - Math.min(...xs)) / 1000);
  const maxT = Math.max(...xs) * 10 || 1;
  const objective = (logTau) => {
    const tau = 10 ** logTau;
    const e = xs.map((x) => Math.exp(-x / tau));
    const basis = rising ? e.map((v) => 1 - v) : e;
    const reg = linReg(basis, ys);
    const predicted = basis.map((b) => reg.intercept + reg.slope * b);
    return mse(ys, predicted);
  };
  const result = goldenSection(objective, Math.log10(minT), Math.log10(maxT), 1e-5);
  const tau = 10 ** result.x;
  const e = xs.map((x) => Math.exp(-x / tau));
  const basis = rising ? e.map((v) => 1 - v) : e;
  const reg = linReg(basis, ys);
  const predicted = basis.map((b) => reg.intercept + reg.slope * b);
  return {
    A: reg.slope,
    tau,
    C: reg.intercept,
    mse: mse(ys, predicted),
    rising,
    predicted: ts.map((t, i) => [t, predicted[i]]),
  };
};

const crossingTime = (times, values, level) => {
  for (let i = 1; i < times.length; i += 1) {
    const y0 = values[i - 1];
    const y1 = values[i];
    if (!Number.isFinite(y0) || !Number.isFinite(y1) || y0 === y1) continue;
    if ((y0 - level) * (y1 - level) <= 0) {
      const ratio = (level - y0) / (y1 - y0);
      return times[i - 1] + ratio * (times[i] - times[i - 1]);
    }
  }
  return NaN;
};

const riseTime = (times, values) => {
  const pairs = pairColumns(times, values).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 2) return NaN;
  const ts = pairs.map(([t]) => t);
  const ys = pairs.map(([, y]) => y);
  const y0 = ys[0];
  const y1 = ys[ys.length - 1];
  const low = y0 + (y1 - y0) * 0.1;
  const high = y0 + (y1 - y0) * 0.9;
  const t10 = crossingTime(ts, ys, low);
  const t90 = crossingTime(ts, ys, high);
  return Number.isFinite(t10) && Number.isFinite(t90) ? Math.abs(t90 - t10) : NaN;
};

const settlingTime = (times, values, band = 0.02) => {
  const pairs = pairColumns(times, values).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 2) return NaN;
  const final = pairs[pairs.length - 1][1];
  const initial = pairs[0][1];
  const tol = Math.max(Math.abs(final - initial) * band, Math.abs(final) * band, 1e-12);
  for (let i = 0; i < pairs.length; i += 1) {
    const settled = pairs.slice(i).every(([, y]) => Math.abs(y - final) <= tol);
    if (settled) return pairs[i][0];
  }
  return NaN;
};

const nyquistData = (freqs, zMag, zPhase) => (
  pairColumns(freqs, zMag, zPhase).map(([f, mag, phase]) => {
    const rad = phase * Math.PI / 180;
    return { f, re: mag * Math.cos(rad), im: mag * Math.sin(rad), mag, phase };
  })
);

const estimateQFromImpedanceMinimum = (points, minIdx) => {
  if (!points?.length || minIdx <= 0 || minIdx >= points.length - 1) return NaN;
  const fr = points[minIdx].f;
  const target = points[minIdx].mag * Math.sqrt(2);
  const interp = (a, b) => {
    if (a.mag === b.mag) return NaN;
    const ratio = (target - a.mag) / (b.mag - a.mag);
    return 10 ** (Math.log10(a.f) + ratio * (Math.log10(b.f) - Math.log10(a.f)));
  };
  let fLow = NaN;
  let fHigh = NaN;
  for (let i = minIdx; i > 0; i -= 1) {
    if ((points[i].mag - target) * (points[i - 1].mag - target) <= 0) {
      fLow = interp(points[i], points[i - 1]);
      break;
    }
  }
  for (let i = minIdx; i < points.length - 1; i += 1) {
    if ((points[i].mag - target) * (points[i + 1].mag - target) <= 0) {
      fHigh = interp(points[i], points[i + 1]);
      break;
    }
  }
  return Number.isFinite(fLow) && Number.isFinite(fHigh) && fHigh > fLow ? fr / (fHigh - fLow) : NaN;
};

const estimateRLC = (fr, Q, Zmin) => {
  if (![fr, Q, Zmin].every(Number.isFinite) || fr <= 0 || Q <= 0 || Zmin <= 0) return null;
  const w0 = 2 * Math.PI * fr;
  const R = Zmin;
  const L = Q * R / w0;
  const C = 1 / (w0 * w0 * L);
  return { R, L, C };
};

const analyzeBode = ({ columns }) => {
  const triples = pairColumns(columns[0], columns[1], columns[2]).filter(([f]) => f > 0);
  const freqs = triples.map(([f]) => f);
  const rawMag = triples.map(([, m]) => m);
  const phase = triples.map(([, , p]) => p);
  if (freqs.length < 2) return null;
  const looksLinear = rawMag.every((v) => v >= 0) && Math.max(...rawMag) <= 10;
  const dbs = looksLinear ? rawMag.map(toDb) : rawMag;
  return {
    mode: 'bode',
    freqs,
    dbs,
    phase,
    cutoff: detectPhaseCutoff(freqs, phase) || detectCutoff(freqs, dbs),
    slope: slopeDbPerDecade(freqs, dbs),
    resonance: detectResonance(freqs, dbs),
  };
};

const analyzeTransient = ({ columns }) => {
  const pairs = pairColumns(columns[0], columns[1]).sort((a, b) => a[0] - b[0]);
  if (pairs.length < 2) return null;
  const times = pairs.map(([t]) => t);
  const values = pairs.map(([, v]) => v);
  const fit = fitExponential(times, values);
  return {
    mode: 'transient',
    times,
    values,
    fit,
    rise: riseTime(times, values),
    settling: settlingTime(times, values, 0.02),
  };
};

const analyzeImpedance = ({ columns }) => {
  const hasPhaseShape = columns.length < 4 || (columns[2] || []).some((v) => Number.isFinite(v) && Math.abs(v) <= 180);
  let points;
  if (hasPhaseShape) {
    points = nyquistData(columns[0], columns[1], columns[2]);
  } else {
    points = pairColumns(columns[0], columns[1], columns[2]).map(([f, re, im]) => ({
      f,
      re,
      im,
      mag: Math.hypot(re, im),
      phase: Math.atan2(im, re) * 180 / Math.PI,
    }));
  }
  points = points.filter((p) => p.f > 0 && [p.re, p.im, p.mag].every(Number.isFinite)).sort((a, b) => a.f - b.f);
  if (points.length < 2) return null;
  let minIdx = 0;
  points.forEach((p, i) => {
    if (p.mag < points[minIdx].mag) minIdx = i;
  });
  const magDbs = points.map((p) => toDb(p.mag));
  const resonance = detectResonance(points.map((p) => p.f), magDbs);
  const Q = estimateQFromImpedanceMinimum(points, minIdx) || (resonance?.Q && Number.isFinite(resonance.Q) ? resonance.Q : NaN);
  const rlc = estimateRLC(points[minIdx].f, Q, points[minIdx].mag);
  return {
    mode: 'impedance',
    points,
    fr: points[minIdx].f,
    zmin: points[minIdx].mag,
    dcResistance: points[0].mag,
    Q,
    rlc,
  };
};

const renderMetricGrid = (target, metrics) => {
  const container = $(target);
  if (!container) return;
  container.textContent = '';
  const grid = document.createElement('div');
  grid.className = 'circuit-metrics';
  metrics.forEach(({ label, value, note, tone = 'good' }) => {
    const item = document.createElement('div');
    item.className = 'circuit-metric';
    const labelEl = document.createElement('span');
    labelEl.className = 'ttest-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.className = 'ttest-val';
    valueEl.textContent = value;
    item.appendChild(labelEl);
    item.appendChild(valueEl);
    if (note) {
      const badge = document.createElement('span');
      badge.className = `cv-badge badge--${tone}`;
      badge.textContent = note;
      item.appendChild(badge);
    }
    grid.appendChild(item);
  });
  container.appendChild(grid);
};

const renderAnalysisResult = () => {
  if (!lastAnalysis) {
    $('analysis-result').innerHTML = '<p class="stats-empty">データを入力すると表示されます。</p>';
    return;
  }
  if (lastAnalysis.mode === 'bode') {
    renderMetricGrid('analysis-result', [
      { label: 'カットオフ周波数 fc', value: fmt(lastAnalysis.cutoff?.fc, 'Hz'), note: lastAnalysis.cutoff?.source === 'phase' ? 'φ=-45°' : (lastAnalysis.cutoff ? '-3 dB' : '未検出'), tone: lastAnalysis.cutoff ? 'good' : 'warn' },
      { label: '高周波傾き', value: fmt(lastAnalysis.slope, 'dB/dec'), note: Math.abs(lastAnalysis.slope) > 15 ? '典型的' : '緩やか', tone: Math.abs(lastAnalysis.slope) > 15 ? 'good' : 'warn' },
      { label: '共振周波数 fr', value: fmt(lastAnalysis.resonance?.fr, 'Hz'), note: Number.isFinite(lastAnalysis.resonance?.Q) ? `Q=${fmt(lastAnalysis.resonance.Q)}` : 'Q未推定', tone: Number.isFinite(lastAnalysis.resonance?.Q) ? 'good' : 'warn' },
    ]);
    return;
  }
  if (lastAnalysis.mode === 'transient') {
    renderMetricGrid('analysis-result', [
      { label: '時定数 τ', value: fmt(lastAnalysis.fit?.tau, 'ms'), note: '指数fit', tone: 'good' },
      { label: '10%→90%立ち上がり', value: fmt(lastAnalysis.rise, 'ms'), note: Number.isFinite(lastAnalysis.rise) ? '検出' : '未検出', tone: Number.isFinite(lastAnalysis.rise) ? 'good' : 'warn' },
      { label: '±2%整定時間', value: fmt(lastAnalysis.settling, 'ms'), note: Number.isFinite(lastAnalysis.settling) ? '検出' : '未検出', tone: Number.isFinite(lastAnalysis.settling) ? 'good' : 'warn' },
    ]);
    return;
  }
  renderMetricGrid('analysis-result', [
    { label: '共振周波数', value: fmt(lastAnalysis.fr, 'Hz'), note: '|Z|最小', tone: 'good' },
    { label: 'DC抵抗 R', value: fmt(lastAnalysis.dcResistance, 'Ω'), note: '最低周波数', tone: 'good' },
    { label: 'Q値', value: fmt(lastAnalysis.Q), note: Number.isFinite(lastAnalysis.Q) ? '推定' : '未推定', tone: Number.isFinite(lastAnalysis.Q) ? 'good' : 'warn' },
    { label: '等価 L', value: fmt(lastAnalysis.rlc?.L, 'H'), note: 'RLC', tone: lastAnalysis.rlc ? 'good' : 'warn' },
    { label: '等価 C', value: fmt(lastAnalysis.rlc?.C, 'F'), note: 'RLC', tone: lastAnalysis.rlc ? 'good' : 'warn' },
  ]);
};

const renderFitResult = () => {
  if (!lastAnalysis) {
    $('fit-result').innerHTML = '<p class="stats-empty">フィット結果がここに表示されます。</p>';
    return;
  }
  if (lastAnalysis.mode === 'bode') {
    if (!lastFit) {
      $('fit-result').innerHTML = '<p class="stats-empty">モデルを選んでフィット更新を押してください。</p>';
      return;
    }
    const isSecond = lastFit.type === 'bp' || lastFit.type === 'be';
    renderMetricGrid('fit-result', [
      { label: isSecond ? '中心周波数 f0' : 'カットオフ fc', value: fmt(isSecond ? lastFit.f0 : lastFit.fc, 'Hz'), note: lastFit.type.toUpperCase(), tone: 'good' },
      { label: isSecond ? 'Q値' : '時定数 τ', value: fmt(isSecond ? lastFit.Q : lastFit.tau, isSecond ? '' : 's'), note: '推定', tone: 'good' },
      { label: 'MSE', value: fmt(lastFit.mse, 'dB²'), note: lastFit.mse < 2 ? '良好' : '確認', tone: lastFit.mse < 2 ? 'good' : 'warn' },
    ]);
    return;
  }
  if (lastAnalysis.mode === 'transient') {
    const fit = lastAnalysis.fit;
    renderMetricGrid('fit-result', [
      { label: 'A', value: fmt(fit?.A), note: fit?.rising ? '上昇' : '減衰', tone: 'good' },
      { label: 'τ', value: fmt(fit?.tau, 'ms'), note: 'MSE最小', tone: 'good' },
      { label: 'C', value: fmt(fit?.C), note: 'オフセット', tone: 'good' },
      { label: 'MSE', value: fmt(fit?.mse), note: fit?.mse < 0.1 ? '良好' : '確認', tone: fit?.mse < 0.1 ? 'good' : 'warn' },
    ]);
    return;
  }
  renderMetricGrid('fit-result', [
    { label: 'R', value: fmt(lastAnalysis.rlc?.R, 'Ω'), note: '|Z|min', tone: lastAnalysis.rlc ? 'good' : 'warn' },
    { label: 'L', value: fmt(lastAnalysis.rlc?.L, 'H'), note: 'Q R / ω0', tone: lastAnalysis.rlc ? 'good' : 'warn' },
    { label: 'C', value: fmt(lastAnalysis.rlc?.C, 'F'), note: '1/(ω0²L)', tone: lastAnalysis.rlc ? 'good' : 'warn' },
  ]);
};

const plotLayoutBase = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: CHART_THEME.panel,
  margin: { t: 22, l: 64, r: 64, b: 58 },
  font: CHART_THEME.font,
  hovermode: 'closest',
  legend: { orientation: 'h', y: -0.2, x: 0, font: { size: 11 } },
};

const renderBodePlot = () => {
  const el = $('circuit-chart');
  if (!el || !lastAnalysis) return;
  const traces = [
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: '|H| [dB]',
      x: lastAnalysis.freqs,
      y: lastAnalysis.dbs,
      line: { color: CHART_THEME.green, width: 2.4 },
      marker: { size: 7, symbol: 'circle', line: { width: 1.1, color: '#ffffff' } },
      hovertemplate: 'f=%{x}<br>|H|=%{y} dB<extra>%{fullData.name}</extra>',
    },
  ];
  if (lastAnalysis.phase.some(Number.isFinite)) {
    traces.push({
      type: 'scatter',
      mode: 'lines+markers',
      name: 'φ [°]',
      x: lastAnalysis.freqs,
      y: lastAnalysis.phase,
      yaxis: 'y2',
      line: { color: CHART_THEME.blue, width: 2.2, dash: 'dot' },
      marker: { size: 7, symbol: 'square', line: { width: 1.1, color: '#ffffff' } },
      hovertemplate: 'f=%{x}<br>phase=%{y}°<extra>%{fullData.name}</extra>',
    });
  }
  if (lastFit?.predicted) {
    traces.push({
      type: 'scatter',
      mode: 'lines',
      name: 'fit',
      x: lastFit.predicted.map(([f]) => f),
      y: lastFit.predicted.map(([, y]) => y),
      line: { color: CHART_THEME.orange, width: 2.3, dash: 'dash' },
      hovertemplate: 'f=%{x}<br>fit=%{y} dB<extra>%{fullData.name}</extra>',
    });
  }
  Plotly.newPlot(el, traces, {
    ...plotLayoutBase,
    xaxis: chartAxis({ title: 'f [Hz]', type: 'log' }),
    yaxis: chartAxis({ title: '|H| [dB]' }),
    yaxis2: chartAxis({ title: 'φ [°]', overlaying: 'y', side: 'right', showgrid: false }),
  }, chartConfig);
};

const renderTransientPlot = () => {
  const el = $('circuit-chart');
  if (!el || !lastAnalysis) return;
  const traces = [
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: '測定値',
      x: lastAnalysis.times,
      y: lastAnalysis.values,
      line: { color: CHART_THEME.green, width: 2.4 },
      marker: { size: 8, symbol: 'circle', line: { width: 1.1, color: '#ffffff' } },
      hovertemplate: 't=%{x}<br>value=%{y}<extra>%{fullData.name}</extra>',
    },
  ];
  if (lastAnalysis.fit?.predicted) {
    traces.push({
      type: 'scatter',
      mode: 'lines',
      name: '指数fit',
      x: lastAnalysis.fit.predicted.map(([t]) => t),
      y: lastAnalysis.fit.predicted.map(([, y]) => y),
      line: { color: CHART_THEME.orange, width: 2.3, dash: 'dash' },
      hovertemplate: 't=%{x}<br>fit=%{y}<extra>%{fullData.name}</extra>',
    });
  }
  Plotly.newPlot(el, traces, {
    ...plotLayoutBase,
    xaxis: chartAxis({ title: 't [ms]' }),
    yaxis: chartAxis({ title: '応答' }),
  }, chartConfig);
};

const renderNyquistPlot = () => {
  const el = $('circuit-chart');
  if (!el || !lastAnalysis) return;
  const points = lastAnalysis.points;
  Plotly.newPlot(el, [
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Nyquist',
      x: points.map((p) => p.re),
      y: points.map((p) => p.im),
      text: points.map((p) => `${fmt(p.f, 'Hz')}<br>|Z|=${fmt(p.mag, 'Ω')}`),
      hovertemplate: 'Re=%{x:.4g} Ω<br>Im=%{y:.4g} Ω<br>%{text}<extra></extra>',
      line: { color: CHART_THEME.green, width: 2.4 },
      marker: { size: 8, symbol: 'circle', line: { width: 1.1, color: '#ffffff' } },
    },
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: '|Z|',
      x: points.map((p) => p.f),
      y: points.map((p) => p.mag),
      xaxis: 'x2',
      yaxis: 'y2',
      line: { color: CHART_THEME.blue, width: 2.2, dash: 'dot' },
      marker: { size: 6, symbol: 'square', line: { width: 1, color: '#ffffff' } },
    },
  ], {
    ...plotLayoutBase,
    grid: { rows: 1, columns: 2, pattern: 'independent' },
    xaxis: chartAxis({ title: 'Re[Ω]', zeroline: true, zerolinecolor: CHART_THEME.axis }),
    yaxis: chartAxis({ title: 'Im[Ω]', zeroline: true, zerolinecolor: CHART_THEME.axis, scaleanchor: 'x', scaleratio: 1 }),
    xaxis2: chartAxis({ title: 'f [Hz]', type: 'log' }),
    yaxis2: chartAxis({ title: '|Z| [Ω]' }),
  }, chartConfig);
};

const renderPlot = () => {
  const empty = !lastAnalysis;
  if (empty) {
    $('circuit-chart').innerHTML = '<p class="stats-empty circuit-empty">有効な数値データを入力してください。</p>';
    return;
  }
  if (activeMode === 'bode') renderBodePlot();
  if (activeMode === 'transient') renderTransientPlot();
  if (activeMode === 'impedance') renderNyquistPlot();
};

const runFit = () => {
  lastFit = null;
  if (!lastAnalysis || lastAnalysis.mode !== 'bode') {
    renderFitResult();
    renderPlot();
    return;
  }
  const type = $('fit-type')?.value || 'lp';
  lastFit = type === 'lp' || type === 'hp'
    ? fitFirstOrder(lastAnalysis.freqs, lastAnalysis.dbs, type)
    : fitSecondOrder(lastAnalysis.freqs, lastAnalysis.dbs, type);
  renderFitResult();
  renderPlot();
};

function onGridChange() {
  const rows = snapshotGridRows();
  persistRowsForMode(rows);
  const table = readTable();
  if (activeMode === 'bode') lastAnalysis = analyzeBode(table);
  if (activeMode === 'transient') lastAnalysis = analyzeTransient(table);
  if (activeMode === 'impedance') lastAnalysis = analyzeImpedance(table);
  if (activeMode !== 'bode') lastFit = null;
  renderAnalysisResult();
  renderFitResult();
  renderPlot();
  showGridStatus('保存済み');
}

const switchMode = (mode) => {
  if (!MODE_CONFIG[mode]) return;
  if ($('data-grid')?.rows.length) {
    persistRowsForMode(snapshotGridRows());
  }
  activeMode = mode;
  localStorage.setItem('convertexcel-circuit-mode', activeMode);
  lastFit = null;
  document.querySelectorAll('.mode-tab').forEach((button) => {
    const active = button.dataset.mode === activeMode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const config = MODE_CONFIG[activeMode];
  $('mode-hint').textContent = config.hint;
  $('chart-title').textContent = config.chartTitle;
  $('chart-caption').textContent = config.chartCaption;
  $('fit-caption').textContent = config.fitCaption;
  $('fit-controls').hidden = activeMode !== 'bode';
  renderDataGrid(readStoredGridRows() || createRowsForMode(activeMode));
  onGridChange();
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mode-tab').forEach((button) => {
    button.addEventListener('click', () => switchMode(button.dataset.mode));
  });

  $('grid-wrap')?.addEventListener('paste', (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text');
    if (!text) return;

    const pastedRows = text.split(/\r?\n/).filter((line) => line !== '').map((line) => (
      line.includes('\t') ? line.split('\t') : line.split(',')
    ));
    if (pastedRows.length === 0) return;

    const active = document.activeElement;
    const startRow = parseInt(active?.dataset?.row ?? '0', 10);
    const startCol = parseInt(active?.dataset?.col ?? '0', 10);
    const currentRows = snapshotGridRows();
    const newRowCount = Math.max(currentRows.length, startRow + pastedRows.length);
    const newColCount = Math.max(currentRows[0]?.length ?? 0, startCol + Math.max(...pastedRows.map((r) => r.length)));
    const merged = Array.from({ length: newRowCount }, (_, r) => (
      Array.from({ length: newColCount }, (_, c) => currentRows[r]?.[c] ?? '')
    ));
    pastedRows.forEach((row, dr) => {
      row.forEach((value, dc) => {
        merged[startRow + dr][startCol + dc] = value;
      });
    });
    renderDataGrid(merged);
    onGridChange();
  });

  $('add-row-btn')?.addEventListener('click', () => resizeGrid(1, 0));
  $('add-col-btn')?.addEventListener('click', () => resizeGrid(0, 1));
  $('del-row-btn')?.addEventListener('click', () => resizeGrid(-1, 0));
  $('del-col-btn')?.addEventListener('click', () => resizeGrid(0, -1));
  $('clear-btn')?.addEventListener('click', () => {
    renderDataGrid(createRowsForMode(activeMode));
    onGridChange();
  });
  $('copy-excel-btn')?.addEventListener('click', copyGridForExcel);
  $('run-fit-btn')?.addEventListener('click', runFit);
  $('fit-type')?.addEventListener('change', runFit);

  $('save-csv-btn')?.addEventListener('click', () => {
    const rows = snapshotGridRows();
    const csvText = rows.map((row) => (
      row.map((cell) => {
        const s = String(cell);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    )).join('\r\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit-${activeMode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  $('load-csv-input')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(String(e.target.result || ''));
      if (parsed.length === 0) return;
      renderDataGrid(parsed);
      onGridChange();
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  });

  $('send-to-convert-btn')?.addEventListener('click', () => {
    const rows = trimRowsForSpreadsheet(snapshotGridRows());
    const tsv = rows.map((row) => row.join('\t')).join('\n');
    localStorage.setItem('convertexcel-transfer-data', tsv);
    window.location.href = 'convert.html';
  });

  switchMode(activeMode);
});
