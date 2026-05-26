// ─── HTML Safety ──────────────────────────────────────────────

const escHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// ─── Grid Data ────────────────────────────────────────────────

const GRID_STORAGE_KEY = 'convertexcel-stats-grid';
const MIN_GRID_COLS = 3;
const MIN_GRID_ROWS = 3;
const DEFAULT_HEADERS = ['x', 'A', 'B', 'C'];
const DEFAULT_DATA_ROWS = 5;
const SAVE_STATUS_MS = 1500;
const LARGE_DATA_THRESHOLD = 300;  // rows (including header) above which grid editing is disabled
const LTTB_DISPLAY_MAX = 5000;     // max points per series shown in chart (LTTB applied above this)
const CHART_THEME = {
  colors: ['#107c41', '#005fb8', '#c16800', '#8c6c00', '#7f52b8'],
  markers: ['circle', 'square', 'diamond', 'triangle-up', 'cross'],
  grid: '#e3e8e4',
  axis: '#6b7280',
  text: '#1a1a1c',
  panel: '#ffffff',
  font: { family: '"Segoe UI", system-ui, sans-serif', size: 12, color: '#1a1a1c' },
};

const chartLayout = (overrides = {}) => ({
  paper_bgcolor: 'transparent',
  plot_bgcolor: CHART_THEME.panel,
  font: CHART_THEME.font,
  hovermode: 'closest',
  margin: { t: 22, l: 62, r: 24, b: 58 },
  legend: {
    orientation: 'h',
    y: -0.2,
    x: 0,
    font: { size: 11 },
  },
  xaxis: {
    showline: true,
    linecolor: CHART_THEME.axis,
    linewidth: 1,
    mirror: false,
    ticks: 'outside',
    tickcolor: CHART_THEME.axis,
    gridcolor: CHART_THEME.grid,
    zeroline: false,
  },
  yaxis: {
    showline: true,
    linecolor: CHART_THEME.axis,
    linewidth: 1,
    mirror: false,
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

let isLargeDataMode = false;
let largeDataRows = [];

let smoothingMode = 'none';
let smoothingWindow = 5;
let filterCutoff = 30;

const showGridStatus = (message) => {
  const status = document.getElementById('save-status');
  if (!status) return;
  status.textContent = message;
  window.clearTimeout(saveStatusTimer);
  saveStatusTimer = window.setTimeout(() => {
    status.textContent = '';
  }, SAVE_STATUS_MS);
};

const createInitialGridRows = () => [
  [...DEFAULT_HEADERS],
  ...Array.from({ length: DEFAULT_DATA_ROWS }, () => Array(DEFAULT_HEADERS.length).fill('')),
];

const normalizeGridRows = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : createInitialGridRows();
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
    const raw = localStorage.getItem(GRID_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.headers) || !Array.isArray(parsed?.rows)) return null;
    return [parsed.headers, ...parsed.rows];
  } catch {
    return null;
  }
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

const snapshotGridRows = () => {
  if (isLargeDataMode) return largeDataRows;
  const table = document.getElementById('data-grid');
  if (!table) return normalizeGridRows(gridRows);
  return [...table.rows].map((tr) => [...tr.cells].map((td) => td.querySelector('input')?.value ?? ''));
};

const renderLargeDataBanner = (numDataRows, numCols) => {
  const wrap = document.getElementById('grid-wrap');
  if (!wrap) return;
  let banner = document.getElementById('large-data-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'large-data-banner';
    banner.className = 'large-data-banner';
    wrap.prepend(banner);
  }
  banner.textContent = `大容量データ: ${numDataRows} 行 × ${numCols} 列 — グリッド編集は無効です（CSV読み込みで置き換えできます）`;
};

const removeLargeDataBanner = () => {
  document.getElementById('large-data-banner')?.remove();
};

const updateToolbarForLargeData = (large) => {
  const editIds = ['add-row-btn', 'add-col-btn', 'del-row-btn', 'del-col-btn'];
  editIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = large;
  });
};

const renderLargeDataPreview = (rows, table) => {
  const PREVIEW = 8;
  const numCols = rows[0]?.length || 0;
  const numDataRows = rows.length - 1;

  renderLargeDataBanner(numDataRows, numCols);

  table.textContent = '';
  table.className = 'data-grid data-grid--preview';

  const headerRow = rows[0] || [];
  const thead = document.createElement('thead');
  const thTr = document.createElement('tr');
  headerRow.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    thTr.appendChild(th);
  });
  thead.appendChild(thTr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.slice(1, PREVIEW + 1).forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  if (numDataRows > PREVIEW) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = numCols;
    td.className = 'large-data-more';
    td.textContent = `… さらに ${numDataRows - PREVIEW} 行`;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
};

const normalizeRawRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const colCount = Math.max(...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
  return rows.map((row) => Array.from({ length: colCount }, (_, c) => {
    const v = Array.isArray(row) ? row[c] : '';
    return v == null ? '' : String(v);
  }));
};

const renderDataGrid = (rows = gridRows) => {
  const table = document.getElementById('data-grid');
  if (!table) return;

  // Use raw normalization (no min-col padding) for large data detection
  const rawNorm = normalizeRawRows(Array.isArray(rows) ? rows : []);
  if (rawNorm.length > LARGE_DATA_THRESHOLD) {
    isLargeDataMode = true;
    largeDataRows = rawNorm;
    gridRows = rawNorm;
    updateToolbarForLargeData(true);
    renderLargeDataPreview(rawNorm, table);
    return;
  }

  isLargeDataMode = false;
  largeDataRows = [];
  removeLargeDataBanner();
  updateToolbarForLargeData(false);

  const normalized = normalizeGridRows(rows);
  gridRows = normalized;
  table.textContent = '';
  table.className = 'data-grid';

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
  const headers = (rows[0] || []).map((h, i) => {
    const trimmed = h.trim();
    return trimmed || `列${i + 1}`;
  });
  const dataRows = rows.slice(1);
  const columns = headers.map((_, colIdx) => (
    dataRows.map((row) => {
      const raw = (row[colIdx] ?? '').trim();
      const normalized = raw.normalize('NFKC');
      if (!normalized) return null;
      const val = Number(normalized);
      return Number.isFinite(val) ? val : null;
    })
  ));

  return { headers, columns };
};

const saveGridToStorage = () => {
  if (isLargeDataMode) {
    showGridStatus(`${largeDataRows.length - 1} 行（ローカル保存なし）`);
    return;
  }
  const rows = snapshotGridRows();
  const [headers = [], ...dataRows] = rows;
  localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify({ headers, rows: dataRows }));
  showGridStatus('保存済み');
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
      // Continue to the textarea fallback below.
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

const onGridChange = () => {
  const { headers, columns } = readGridData();
  getSmoothingSettings();
  const smoothed = applySmoothing(columns);
  state = { headers, columns: smoothed };
  saveGridToStorage();
  updateColumnSelectors();
  renderDescStats(headers, smoothed);
  renderCorrHeatmap(headers, smoothed);
  onChartOptionsChange();
  runFits();
};

const onGridInput = () => {
  window.clearTimeout(gridChangeTimer);
  gridChangeTimer = window.setTimeout(onGridChange, 300);
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

// ─── Statistical Utilities ────────────────────────────────────

const finiteVals = (arr) => (arr || []).filter((v) => v !== null && Number.isFinite(v));

const mean = (arr) => {
  const v = finiteVals(arr);
  return v.length === 0 ? NaN : v.reduce((s, x) => s + x, 0) / v.length;
};

const sampleVariance = (arr) => {
  const v = finiteVals(arr);
  if (v.length < 2) return NaN;
  const m = mean(v);
  return v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1);
};

const median = (arr) => {
  const v = [...finiteVals(arr)].sort((a, b) => a - b);
  if (v.length === 0) return NaN;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? (v[mid - 1] + v[mid]) / 2 : v[mid];
};

const quartiles = (arr) => {
  const v = [...finiteVals(arr)].sort((a, b) => a - b);
  if (v.length < 4) return { q1: NaN, q3: NaN };
  const mid = Math.floor(v.length / 2);
  const lower = v.slice(0, mid);
  const upper = v.length % 2 === 0 ? v.slice(mid) : v.slice(mid + 1);
  return { q1: median(lower), q3: median(upper) };
};

const pearsonR = (a, b) => {
  const pairs = (a || [])
    .map((v, i) => [v, (b || [])[i]])
    .filter(([x, y]) => x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 2) return NaN;
  const xs = pairs.map(([x]) => x);
  const ys = pairs.map(([, y]) => y);
  const mx = mean(xs);
  const my = mean(ys);
  const num = pairs.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
  const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  if (dx < 1e-14 || dy < 1e-14) return NaN;
  return num / (dx * dy);
};

// Lanczos lgamma (Numerical Recipes)
const lgamma = (x) => {
  const C = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  const z = x - 1;
  let a = C[0];
  const t = z + 7.5;
  for (let i = 1; i < 9; i += 1) a += C[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
};

// Regularized incomplete beta (Numerical Recipes betacf)
const betacf = (a, b, x) => {
  const FPMIN = 1e-30;
  const EPS = 3e-7;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m += 1) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) <= EPS) break;
  }
  return h;
};

const ibeta = (a, b, x) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = lgamma(a + b) - lgamma(a) - lgamma(b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta);
  return x < (a + 1) / (a + b + 2)
    ? front * betacf(a, b, x) / a
    : 1 - front * betacf(b, a, 1 - x) / b;
};

// Two-tailed p-value from t statistic and degrees of freedom
const tPValue = (t, df) => ibeta(df / 2, 0.5, df / (df + t * t));

const welchT = (a, b) => {
  const va = finiteVals(a);
  const vb = finiteVals(b);
  if (va.length < 2 || vb.length < 2) return null;
  const ma = mean(va); const mb = mean(vb);
  const s2a = sampleVariance(va); const s2b = sampleVariance(vb);
  const na = va.length; const nb = vb.length;
  const se2 = s2a / na + s2b / nb;
  const se = Math.sqrt(se2);
  if (se < 1e-14) return null;
  const tStat = (ma - mb) / se;
  const df = se2 ** 2 / ((s2a / na) ** 2 / (na - 1) + (s2b / nb) ** 2 / (nb - 1));
  const pooledSD = Math.sqrt((s2a * (na - 1) + s2b * (nb - 1)) / (na + nb - 2));
  const cohensD = Math.abs(ma - mb) / pooledSD;
  const effectSize = cohensD < 0.2 ? 'small' : cohensD < 0.5 ? 'medium' : 'large';
  return {
    t: tStat,
    df,
    pValue: tPValue(tStat, df),
    meanA: ma,
    meanB: mb,
    nA: na,
    nB: nb,
    cohensD,
    effectSize,
  };
};

// ─── Noise Smoothing ──────────────────────────────────────────

const applyMovingAverage = (arr, w) => {
  if (w <= 1 || arr.length === 0) return arr;
  const half = Math.floor(w / 2);
  return arr.map((_, i) => {
    const from = Math.max(0, i - half);
    const to = Math.min(arr.length - 1, i + half);
    const vals = arr.slice(from, to + 1).filter((v) => v !== null && Number.isFinite(v));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });
};

const applyMedianFilter = (arr, w) => {
  if (w <= 1 || arr.length === 0) return arr;
  const half = Math.floor(w / 2);
  return arr.map((_, i) => {
    const from = Math.max(0, i - half);
    const to = Math.min(arr.length - 1, i + half);
    const vals = arr.slice(from, to + 1)
      .filter((v) => v !== null && Number.isFinite(v))
      .sort((a, b) => a - b);
    if (vals.length === 0) return null;
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 === 0 ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid];
  });
};

const applyLowPassFilter = (arr, cutoffPercent) => {
  if (arr.length === 0) return arr;
  const cutoff = Math.min(99, Math.max(1, cutoffPercent)) / 100;
  const fc = cutoff * 0.5;
  const alpha = 1 / ((1 / (2 * Math.PI * fc)) + 1);
  let prev = null;

  return arr.map((v) => {
    if (v === null || !Number.isFinite(v)) return null;
    prev = prev === null ? v : prev + alpha * (v - prev);
    return prev;
  });
};

const fftTransform = (re, im, inverse = false) => {
  const n = re.length;
  if (n <= 1) return;
  const evenRe = [], evenIm = [], oddRe = [], oddIm = [];
  for (let i = 0; i < n; i += 2) {
    evenRe.push(re[i]);
    evenIm.push(im[i]);
    oddRe.push(re[i + 1] ?? 0);
    oddIm.push(im[i + 1] ?? 0);
  }
  fftTransform(evenRe, evenIm, inverse);
  fftTransform(oddRe, oddIm, inverse);
  const direction = inverse ? 1 : -1;
  for (let k = 0; k < n / 2; k += 1) {
    const angle = direction * 2 * Math.PI * k / n;
    const cr = Math.cos(angle);
    const ci = Math.sin(angle);
    const tr = cr * oddRe[k] - ci * oddIm[k];
    const ti = cr * oddIm[k] + ci * oddRe[k];
    re[k] = evenRe[k] + tr;
    im[k] = evenIm[k] + ti;
    re[k + n / 2] = evenRe[k] - tr;
    im[k + n / 2] = evenIm[k] - ti;
  }
};

const nextPowerOfTwo = (n) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));

const fillMissingForFilter = (arr) => {
  const finite = arr.filter((v) => v !== null && Number.isFinite(v));
  const fallback = finite.length ? finite.reduce((a, b) => a + b, 0) / finite.length : 0;
  let last = fallback;
  return arr.map((v) => {
    if (v !== null && Number.isFinite(v)) {
      last = v;
      return v;
    }
    return last;
  });
};

const applyFftLowPassFilter = (arr, cutoffPercent) => {
  if (arr.length < 4) return arr;
  const n = nextPowerOfTwo(arr.length);
  const filled = fillMissingForFilter(arr);
  const mean = filled.reduce((a, b) => a + b, 0) / filled.length;
  const re = Array.from({ length: n }, (_, i) => (filled[i] ?? mean) - mean);
  const im = Array(n).fill(0);
  fftTransform(re, im, false);

  const cutoffBin = Math.max(1, Math.floor((Math.min(99, Math.max(1, cutoffPercent)) / 100) * (n / 2)));
  for (let i = cutoffBin + 1; i < n - cutoffBin; i += 1) {
    re[i] = 0;
    im[i] = 0;
  }

  fftTransform(re, im, true);
  return arr.map((v, i) => (v === null || !Number.isFinite(v) ? null : (re[i] / n) + mean));
};

const getSmoothingSettings = () => {
  smoothingMode = document.getElementById('smooth-mode')?.value || 'none';
  smoothingWindow = parseInt(document.getElementById('smooth-window')?.value || '5', 10);
  filterCutoff = parseInt(document.getElementById('filter-cutoff')?.value || '30', 10);
};

const applySmoothing = (columns) => {
  if (smoothingMode === 'none') return columns;
  const fn = {
    median: (col) => applyMedianFilter(col, smoothingWindow),
    'moving-avg': (col) => applyMovingAverage(col, smoothingWindow),
    'low-pass': (col) => applyLowPassFilter(col, filterCutoff),
    'fft-low-pass': (col) => applyFftLowPassFilter(col, filterCutoff),
  }[smoothingMode];
  if (!fn) return columns;
  return columns.map((col, idx) => (idx === 0 ? col : fn(col)));
};

// ─── LTTB Downsampling ────────────────────────────────────────

// Largest-Triangle-Three-Buckets: reduces N points to `threshold` while preserving shape
const lttbDownsample = (xs, ys, threshold) => {
  const n = xs.length;
  if (n <= threshold) return { xs, ys };

  const outX = [xs[0]];
  const outY = [ys[0]];
  const bucketSize = (n - 2) / (threshold - 2);
  let a = 0;

  for (let i = 0; i < threshold - 2; i += 1) {
    const avgStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);
    const avgLen = avgEnd - avgStart;
    let avgX = 0;
    let avgY = 0;
    for (let j = avgStart; j < avgEnd; j += 1) { avgX += xs[j]; avgY += ys[j]; }
    avgX /= avgLen; avgY /= avgLen;

    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, n);
    let maxArea = -1;
    let selected = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j += 1) {
      const area = Math.abs(
        (xs[a] - avgX) * (ys[j] - ys[a]) - (xs[a] - xs[j]) * (avgY - ys[a]),
      );
      if (area > maxArea) { maxArea = area; selected = j; }
    }
    outX.push(xs[selected]);
    outY.push(ys[selected]);
    a = selected;
  }

  outX.push(xs[n - 1]);
  outY.push(ys[n - 1]);
  return { xs: outX, ys: outY };
};

// ─── Rendering ────────────────────────────────────────────────

const fmt = (v) => (Number.isFinite(v) ? Number(v.toPrecision(4)).toString() : '—');

const renderDescStats = (headers, columns) => {
  const container = document.getElementById('desc-stats-container');
  if (!container) return;

  const rows = headers.map((h, i) => {
    const v = finiteVals(columns[i]);
    if (v.length === 0) return null;
    const m = mean(v);
    const s = Math.sqrt(sampleVariance(v));
    const med = median(v);
    const { q1, q3 } = quartiles(v);
    const cv = Number.isFinite(m) && Math.abs(m) > 0 && Number.isFinite(s)
      ? Math.abs(s / m) * 100
      : NaN;
    return { name: h, n: v.length, mean: m, stddev: s, cv, median: med, q1, q3, min: Math.min(...v), max: Math.max(...v) };
  }).filter(Boolean);

  container.textContent = '';

  if (rows.length === 0) {
    container.textContent = '数値データが見つかりません';
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'stats-table-wrap';
  const table = document.createElement('table');
  table.className = 'stats-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  [
    ['列', ''],
    ['n', '標本の個数'],
    ['平均', ''],
    ['標準偏差', ''],
    ['CV', '変動係数 = 標準偏差/平均 × 100%'],
    ['中央値', ''],
    ['Q1', ''],
    ['Q3', ''],
    ['最小', ''],
    ['最大', ''],
  ].forEach(([label, title]) => {
    const th = document.createElement('th');
    th.textContent = label;
    if (title) th.title = title;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    const values = [
      r.name,
      r.n,
      fmt(r.mean),
      fmt(r.stddev),
      null,
      fmt(r.median),
      fmt(r.q1),
      fmt(r.q3),
      fmt(r.min),
      fmt(r.max),
    ];

    values.forEach((value, idx) => {
      const td = document.createElement('td');
      if (idx === 1 && r.n < 5) td.className = 'cell--warn';
      if (idx === 4) {
        if (Number.isFinite(r.cv)) {
          const badge = document.createElement('span');
          const badgeClass = r.cv < 10 ? 'badge--good' : r.cv < 30 ? 'badge--warn' : 'badge--bad';
          badge.className = `cv-badge ${badgeClass}`;
          badge.textContent = `${fmt(r.cv)}%`;
          td.appendChild(badge);
        } else {
          td.textContent = '—';
        }
      } else {
        td.textContent = value;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);
};

const renderCorrHeatmap = (headers, columns) => {
  const el = document.getElementById('corr-chart');
  if (!el) return;

  const numericCols = headers.map((h, i) => ({ h, i })).filter(({ i }) => finiteVals(columns[i]).length >= 2);
  el.textContent = '';
  if (numericCols.length < 2) {
    el.textContent = '数値列が 2 列以上必要です';
    return;
  }

  const labels = numericCols.map((c) => c.h);
  const z = numericCols.map((ci) => numericCols.map((cj) => {
    const r = pearsonR(columns[ci.i], columns[cj.i]);
    return Number.isFinite(r) ? Math.round(r * 1000) / 1000 : 0;
  }));

  Plotly.newPlot(el, [{
    type: 'heatmap',
    z,
    x: labels,
    y: labels,
    zmin: -1,
    zmax: 1,
    colorscale: [[0, '#005fb8'], [0.5, '#ffffff'], [1, '#107c41']],
    text: z.map((row) => row.map((v) => v.toFixed(3))),
    texttemplate: '%{text}',
    hovertemplate: '%{y} / %{x}<br>r=%{z:.3f}<extra></extra>',
    showscale: true,
    colorbar: { thickness: 10, len: 0.76, outlinewidth: 0, tickfont: { size: 10 } },
  }], chartLayout({
    margin: { t: 8, l: 72, r: 30, b: 76 },
    xaxis: { tickangle: -30, showgrid: false, showline: false, zeroline: false },
    yaxis: { showgrid: false, showline: false, zeroline: false },
  }), chartConfig);
};

const renderMainChart = (headers, columns, xIdx, yIdxList, chartType) => {
  const el = document.getElementById('main-chart');
  if (!el || yIdxList.length === 0) return;
  el.textContent = '';

  const xVals = columns[xIdx] || [];
  const traces = yIdxList.map((yi, ti) => {
    const yVals = columns[yi] || [];
    const pairs = xVals
      .map((x, i) => [x, yVals[i]])
      .filter(([x, y]) => x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y))
      .sort((a, b) => a[0] - b[0]);

    let dispX = pairs.map((p) => p[0]);
    let dispY = pairs.map((p) => p[1]);

    // LTTB downsampling for display when point count is very large
    if (dispX.length > LTTB_DISPLAY_MAX) {
      const down = lttbDownsample(dispX, dispY, LTTB_DISPLAY_MAX);
      dispX = down.xs;
      dispY = down.ys;
    }

    // Use WebGL-accelerated scattergl for large datasets
    const useWebGL = dispX.length > 2000;
    const markerSize = dispX.length > 1000 ? 3 : 8;

    return {
      x: dispX,
      y: dispY,
      mode: chartType === 'line' ? 'lines' : 'markers',
      type: useWebGL ? 'scattergl' : 'scatter',
      name: headers[yi] || `列${yi + 1}`,
      marker: {
        size: markerSize,
        color: CHART_THEME.colors[ti % CHART_THEME.colors.length],
        symbol: CHART_THEME.markers[ti % CHART_THEME.markers.length],
        line: { width: markerSize > 4 ? 1.2 : 0, color: '#ffffff' },
      },
      line: {
        color: CHART_THEME.colors[ti % CHART_THEME.colors.length],
        width: 1.6,
      },
      hovertemplate: `${headers[xIdx] || 'x'}=%{x}<br>${headers[yi] || 'y'}=%{y}<extra>%{fullData.name}</extra>`,
    };
  });

  const base = chartLayout();
  Plotly.newPlot(el, traces, chartLayout({
    xaxis: { ...base.xaxis, title: headers[xIdx] || '' },
    yaxis: { ...base.yaxis },
  }), chartConfig);
};

const setMainChartDragMode = (mode) => {
  const el = document.getElementById('main-chart');
  if (!el || !window.Plotly) return;
  Plotly.relayout(el, { dragmode: mode });
  document.querySelectorAll('[data-chart-action="zoom"], [data-chart-action="pan"]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.chartAction === mode);
  });
};

const resetMainChartScale = () => {
  const el = document.getElementById('main-chart');
  if (!el || !window.Plotly) return;
  Plotly.relayout(el, {
    'xaxis.autorange': true,
    'yaxis.autorange': true,
  });
};

// ─── UI State ─────────────────────────────────────────────────

let state = { headers: [], columns: [] };

const updateColumnSelectors = () => {
  const { headers } = state;

  [
    { el: document.getElementById('x-col-select'), defaultIdx: 0 },
    { el: document.getElementById('fit-x-col-select'), defaultIdx: 0 },
    { el: document.getElementById('fit-y-col-select'), defaultIdx: Math.min(1, headers.length - 1) },
    { el: document.getElementById('ttest-a'), defaultIdx: 0 },
    { el: document.getElementById('ttest-b'), defaultIdx: Math.min(1, headers.length - 1) },
  ].forEach(({ el, defaultIdx }) => {
    if (!el) return;
    const prev = el.value;
    el.textContent = '';
    headers.forEach((h, i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = h;
      el.appendChild(option);
    });
    el.value = [...el.options].some((o) => o.value === prev) ? prev : String(defaultIdx);
  });

  const yCb = document.getElementById('y-col-checkboxes');
  if (yCb) {
    yCb.innerHTML = '';
    headers.forEach((h, i) => {
      const label = document.createElement('label');
      label.className = 'y-col-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = String(i);
      cb.checked = i > 0;
      cb.addEventListener('change', onChartOptionsChange);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(` ${h}`));
      yCb.appendChild(label);
    });
  }
};

const getYIndices = () => {
  const yCb = document.getElementById('y-col-checkboxes');
  if (!yCb) return [1];
  return [...yCb.querySelectorAll('input[type=checkbox]:checked')].map((cb) => parseInt(cb.value, 10));
};

const onChartOptionsChange = () => {
  if (state.columns.length === 0) return;
  const xIdx = parseInt(document.getElementById('x-col-select')?.value ?? '0', 10);
  const yIdxList = getYIndices();
  const chartType = document.getElementById('chart-type')?.value ?? 'scatter';
  renderMainChart(state.headers, state.columns, xIdx, yIdxList, chartType);
};

// ─── T-test Result Rendering ──────────────────────────────────

const buildTTestResult = (result, aLabel, bLabel) => {
  const frag = document.createDocumentFragment();
  const grid = document.createElement('div');
  grid.className = 'ttest-result-grid';

  const isSignificant = result.pValue < 0.05;
  const pFmt = result.pValue < 0.0001
    ? result.pValue.toExponential(3)
    : result.pValue.toFixed(4);

  const cells = [
    ['t 値', result.t.toFixed(4)],
    ['自由度（Welch）', result.df.toFixed(2)],
    ['p 値（両側）', pFmt],
    ['判定（α = 0.05）', null],
    [`平均 A（${aLabel}）`, `${fmt(result.meanA)}　n = ${result.nA}`],
    [`平均 B（${bLabel}）`, `${fmt(result.meanB)}　n = ${result.nB}`],
    ['効果量（Cohen\'s d）', null],
  ];

  cells.forEach(([label, value], i) => {
    const stat = document.createElement('div');
    stat.className = 'ttest-stat';
    if (i === 2) {
      if (result.pValue < 0.001) {
        stat.classList.add('ttest-stat--strong');
      } else if (result.pValue < 0.05) {
        stat.classList.add('ttest-stat--sig');
      } else {
        stat.classList.add('ttest-stat--ns');
      }
    }
    const lEl = document.createElement('span');
    lEl.className = 'ttest-label';
    lEl.textContent = label;
    stat.appendChild(lEl);
    const vEl = document.createElement('span');
    vEl.className = 'ttest-val';
    if (i === 3) {
      const badge = document.createElement('span');
      badge.className = isSignificant ? 'ttest-sig' : 'ttest-nosig';
      badge.textContent = isSignificant ? '有意差あり（p < 0.05）' : '有意差なし（p ≥ 0.05）';
      vEl.appendChild(badge);
    } else if (i === 6) {
      const effectLabel = { small: '小', medium: '中', large: '大' }[result.effectSize] || '—';
      const effectClass = { small: 'badge--good', medium: 'badge--warn', large: 'badge--bad' }[result.effectSize] || 'badge--warn';
      const badge = document.createElement('span');
      badge.className = `cv-badge ${effectClass}`;
      badge.textContent = Number.isFinite(result.cohensD) ? `${fmt(result.cohensD)}（${effectLabel}）` : '—';
      vEl.appendChild(badge);
    } else {
      vEl.textContent = value;
    }
    stat.appendChild(vEl);
    grid.appendChild(stat);
  });

  frag.appendChild(grid);
  return frag;
};

// ─── Init ─────────────────────────────────────────────────────

let fitResults = [];

const FIT_MODEL_META = {
  linear: { label: '線形', k: 2, color: '#107c41', dash: 'solid' },
  poly: { label: '多項式', color: '#005fb8', dash: 'solid' },
  exp: { label: '指数', k: 2, color: '#c16800', dash: 'dash' },
  power: { label: 'べき乗', k: 2, color: '#8c6c00', dash: 'dot' },
  sin: { label: '三角関数', k: 4, color: '#008bf2', dash: 'longdash' },
};

const fitFinite = (value) => Number.isFinite(value);
const fitFmt = (value) => {
  if (!fitFinite(value)) return '—';
  const abs = Math.abs(value);
  return abs >= 10000 || (abs > 0 && abs < 0.001) ? value.toExponential(3) : Number(value.toPrecision(5)).toString();
};

const selectedFitXY = () => {
  const xi = parseInt(document.getElementById('fit-x-col-select')?.value ?? '0', 10);
  const yi = parseInt(document.getElementById('fit-y-col-select')?.value ?? '1', 10);
  const xCol = state.columns[xi] || [];
  const yCol = state.columns[yi] || [];
  const pairs = xCol.map((x, i) => [x, yCol[i]]).filter(([x, y]) => fitFinite(x) && fitFinite(y)).sort((a, b) => a[0] - b[0]);
  return { xs: pairs.map(([x]) => x), ys: pairs.map(([, y]) => y) };
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
  return { model: 'poly', params: Object.fromEntries(beta.map((v, i) => [`a${i}`, v])), formula: `y = a0 + ... + a${d}x^${d}`, predict: (x) => beta.reduce((sum, c, i) => sum + c * x ** i, 0) };
};

const fitExponential = (xs, ys) => {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([, y]) => y > 0);
  if (pairs.length < 2) return null;
  const beta = solveOLS(pairs.map(([x]) => [x, 1]), pairs.map(([, y]) => Math.log(y)));
  if (!beta) return null;
  const [b, logA] = beta;
  const a = Math.exp(logA);
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

const gaussNewtonFit = (fn, jacobian, params0, xs, ys, maxIter = 80) => {
  let params = [...params0];
  let lambda = 1e-6;
  for (let iter = 0; iter < maxIter; iter += 1) {
    const J = [];
    const r = [];
    xs.forEach((x, i) => {
      const pred = fn(x, params);
      if (!fitFinite(pred)) return;
      J.push(jacobian(x, params));
      r.push(ys[i] - pred);
    });
    if (J.length < params.length) break;
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
    if (delta.every((d) => Math.abs(d) < 1e-8)) {
      params = next;
      break;
    }
    params = next.map((v) => (fitFinite(v) ? v : 0));
  }
  return params;
};

const fitSinusoidal = (xs, ys) => {
  if (xs.length < 4) return null;
  const n = nextPowerOfTwo(xs.length);
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const re = Array.from({ length: n }, (_, i) => (ys[i] ?? mean) - mean);
  const im = Array(n).fill(0);
  fftTransform(re, im, false);

  let peak = 1;
  for (let i = 2; i < n / 2; i += 1) {
    if (Math.hypot(re[i], im[i]) > Math.hypot(re[peak], im[peak])) peak = i;
  }

  const span = Math.max(...xs) - Math.min(...xs) || 1;
  const omega0 = 2 * Math.PI * peak / span;
  const amp0 = (Math.max(...ys) - Math.min(...ys)) / 2 || 1;
  const params = gaussNewtonFit(
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
  return {
    model: 'sin',
    params: { A, omega, phi, C },
    formula: 'y = A sin(ωx + φ) + C',
    predict: (x) => A * Math.sin(omega * x + phi) + C,
  };
};

const calcR2 = (ys, predicted) => {
  const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((sum, y) => sum + (y - avg) ** 2, 0);
  const ssRes = ys.reduce((sum, y, i) => sum + (y - predicted[i]) ** 2, 0);
  return ssTot > 0 ? 1 - ssRes / ssTot : NaN;
};

const calcRMSE = (ys, predicted) => Math.sqrt(ys.reduce((sum, y, i) => sum + (y - predicted[i]) ** 2, 0) / ys.length);
const calcAIC = (n, k, ssRes) => n * Math.log(Math.max(ssRes / n, 1e-15)) + 2 * k;

const evaluateFit = (fit, xs, ys) => {
  if (!fit?.predict) return null;
  const predicted = xs.map((x) => fit.predict(x));
  if (predicted.some((v) => !fitFinite(v))) return null;
  const ssRes = ys.reduce((sum, y, i) => sum + (y - predicted[i]) ** 2, 0);
  const k = fit.model === 'poly' ? Object.keys(fit.params).length : FIT_MODEL_META[fit.model].k;
  return { ...fit, predicted, r2: calcR2(ys, predicted), rmse: calcRMSE(ys, predicted), aic: calcAIC(xs.length, k, ssRes) };
};

const selectedFitModels = () => [...document.querySelectorAll('.fit-model-select input:checked')].map((input) => input.value);
const paramsText = (params) => Object.entries(params).map(([key, value]) => `${key}=${fitFmt(value)}`).join(', ');

const renderFitResults = () => {
  const target = document.getElementById('fit-results');
  const summary = document.getElementById('fit-summary');
  if (!target || !summary) return;
  if (fitResults.length === 0) {
    target.innerHTML = '<p class="stats-empty">結果がここに表示されます。</p>';
    summary.innerHTML = '<p class="stats-empty">フィットを実行すると表示されます。</p>';
    return;
  }
  const best = fitResults[0];
  summary.innerHTML = `<div class="fit-best-summary"><span class="fit-best-label">推奨</span><strong>${FIT_MODEL_META[best.model].label}</strong><span>R² ${fitFmt(best.r2)} / RMSE ${fitFmt(best.rmse)} / AIC ${fitFmt(best.aic)}</span></div>`;
  const rows = fitResults.map((r, i) => `<tr class="${i === 0 ? 'fit-best' : ''}"><td>${FIT_MODEL_META[r.model].label}</td><td>${r.formula}</td><td><span class="fit-param-badge">${paramsText(r.params)}</span></td><td>${fitFmt(r.r2)}</td><td>${fitFmt(r.rmse)}</td><td>${fitFmt(r.aic)}</td><td>${i === 0 ? '<span class="cv-badge badge--good">推奨</span>' : ''}</td></tr>`).join('');
  target.innerHTML = `<div class="stats-table-wrap"><table class="stats-table fit-table"><thead><tr><th>モデル</th><th>式</th><th>パラメータ</th><th>R²</th><th>RMSE</th><th>AIC</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
};

const renderFitChart = (xs, ys) => {
  const el = document.getElementById('fit-chart');
  if (!el) return;
  if (xs.length < 2) {
    el.innerHTML = '<p class="stats-empty fit-empty">X/Y列に数値データを入力してください。</p>';
    return;
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const plotXs = Array.from({ length: 160 }, (_, i) => minX + (maxX - minX) * i / 159);
  const traces = [{ type: 'scatter', mode: 'markers', name: '実測値', x: xs, y: ys, marker: { size: 8, color: CHART_THEME.text, symbol: 'circle', line: { width: 1.2, color: '#ffffff' } }, hovertemplate: 'x=%{x}<br>y=%{y}<extra>%{fullData.name}</extra>' }];
  fitResults.forEach((result) => {
    traces.push({ type: 'scatter', mode: 'lines', name: FIT_MODEL_META[result.model].label, x: plotXs, y: plotXs.map((x) => result.predict(x)), line: { width: 2.4, color: FIT_MODEL_META[result.model].color, dash: FIT_MODEL_META[result.model].dash }, hovertemplate: 'x=%{x}<br>fit=%{y}<extra>%{fullData.name}</extra>' });
  });
  const base = chartLayout();
  Plotly.newPlot(el, traces, chartLayout({ xaxis: { ...base.xaxis, title: 'x' }, yaxis: { ...base.yaxis, title: 'y' } }), chartConfig);
};

const renderResidualChart = (xs, ys) => {
  const el = document.getElementById('residual-chart');
  if (!el) return;
  if (fitResults.length === 0) {
    el.innerHTML = '<p class="stats-empty fit-empty">フィットを実行すると残差が表示されます。</p>';
    return;
  }
  const traces = fitResults.map((result) => ({ type: 'scatter', mode: 'lines+markers', name: FIT_MODEL_META[result.model].label, x: xs, y: ys.map((y, i) => y - result.predicted[i]), line: { width: 2.2, color: FIT_MODEL_META[result.model].color, dash: FIT_MODEL_META[result.model].dash }, marker: { size: 6, symbol: 'circle', line: { width: 1, color: '#ffffff' } }, hovertemplate: 'x=%{x}<br>residual=%{y}<extra>%{fullData.name}</extra>' }));
  const base = chartLayout();
  Plotly.newPlot(el, traces, chartLayout({ xaxis: { ...base.xaxis, title: 'x' }, yaxis: { ...base.yaxis, title: '残差', zeroline: true, zerolinecolor: CHART_THEME.axis } }), chartConfig);
};

const renderFitAll = (xs, ys) => {
  renderFitChart(xs, ys);
  renderResidualChart(xs, ys);
  renderFitResults();
};

const runFits = () => {
  const { xs, ys } = selectedFitXY();
  if (xs.length < 2) {
    fitResults = [];
    renderFitAll(xs, ys);
    return;
  }
  const degree = parseInt(document.getElementById('poly-degree')?.value || '2', 10);
  fitResults = selectedFitModels().map((model) => {
    try {
      if (model === 'linear') return evaluateFit(fitLinear(xs, ys), xs, ys);
      if (model === 'poly') return evaluateFit(fitPolynomial(xs, ys, degree), xs, ys);
      if (model === 'exp') return evaluateFit(fitExponential(xs, ys), xs, ys);
      if (model === 'power') return evaluateFit(fitPower(xs, ys), xs, ys);
      if (model === 'sin') return evaluateFit(fitSinusoidal(xs, ys), xs, ys);
    } catch {
      return null;
    }
    return null;
  }).filter(Boolean).sort((a, b) => a.aic - b.aic);
  renderFitAll(xs, ys);
};

document.addEventListener('DOMContentLoaded', () => {
  renderDataGrid(readStoredGridRows() || createInitialGridRows());
  onGridChange();

  document.getElementById('grid-wrap')?.addEventListener('paste', (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text');
    if (!text) return;

    const pastedRows = text.split(/\r?\n/).filter((l) => l !== '').map((l) => l.split('\t'));
    if (pastedRows.length === 0) return;

    // If pasted data itself is large, merge starting from row 0 and switch to large data mode
    if (pastedRows.length > LARGE_DATA_THRESHOLD) {
      renderDataGrid(pastedRows);
      onGridChange();
      return;
    }

    const active = document.activeElement;
    const startRow = isLargeDataMode ? 0 : parseInt(active?.dataset?.row ?? '0', 10);
    const startCol = isLargeDataMode ? 0 : parseInt(active?.dataset?.col ?? '0', 10);

    const currentRows = isLargeDataMode ? [] : snapshotGridRows();
    const newRowCount = Math.max(currentRows.length, startRow + pastedRows.length);
    const newColCount = Math.max(
      currentRows[0]?.length ?? 0,
      startCol + Math.max(...pastedRows.map((r) => r.length)),
    );

    const merged = Array.from({ length: newRowCount }, (_, r) => (
      Array.from({ length: newColCount }, (_, c) => currentRows[r]?.[c] ?? '')
    ));

    pastedRows.forEach((row, dr) => {
      row.forEach((val, dc) => {
        merged[startRow + dr][startCol + dc] = val;
      });
    });

    renderDataGrid(merged);
    onGridChange();
  });

  document.getElementById('add-row-btn')?.addEventListener('click', () => resizeGrid(1, 0));
  document.getElementById('add-col-btn')?.addEventListener('click', () => resizeGrid(0, 1));
  document.getElementById('del-row-btn')?.addEventListener('click', () => resizeGrid(-1, 0));
  document.getElementById('del-col-btn')?.addEventListener('click', () => resizeGrid(0, -1));
  document.getElementById('clear-btn')?.addEventListener('click', () => {
    localStorage.removeItem(GRID_STORAGE_KEY);
    renderDataGrid(createInitialGridRows());
    onGridChange();
    localStorage.removeItem(GRID_STORAGE_KEY);
  });
  document.getElementById('copy-excel-btn')?.addEventListener('click', copyGridForExcel);

  // CSV 保存
  document.getElementById('save-csv-btn')?.addEventListener('click', () => {
    const rows = snapshotGridRows();
    const csvText = rows.map((row) => (
      row.map((cell) => {
        const s = String(cell);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    )).join('\r\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stats-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  // CSV 読み込み
  document.getElementById('load-csv-input')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      // CSV パース（RFC 4180 簡易対応: ダブルクォート、カンマ区切り）
      const parseCSV = (str) => {
        const rows = [];
        let row = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if (inQuotes) {
            if (ch === '"' && str[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') inQuotes = false;
            else cell += ch;
          } else if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            row.push(cell);
            cell = '';
          } else if (ch === '\n' || (ch === '\r' && str[i + 1] === '\n')) {
            if (ch === '\r') i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
          } else {
            cell += ch;
          }
        }
        if (cell || row.length) { row.push(cell); rows.push(row); }
        return rows.filter((r) => r.some((c) => c !== ''));
      };

      const parsed = parseCSV(text);
      if (parsed.length === 0) return;
      renderDataGrid(parsed);
      onGridChange();
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  });

  document.getElementById('send-to-convert-btn')?.addEventListener('click', () => {
    const rows = snapshotGridRows();
    const tsv = rows.map((row) => row.join('\t')).join('\n');
    localStorage.setItem('convertexcel-transfer-data', tsv);
    window.location.href = 'convert.html';
  });

  document.getElementById('smooth-mode')?.addEventListener('change', () => {
    const windowField = document.getElementById('smooth-window-field');
    const cutoffField = document.getElementById('filter-cutoff-field');
    const mode = document.getElementById('smooth-mode').value;
    if (windowField) windowField.hidden = !['moving-avg', 'median'].includes(mode);
    if (cutoffField) cutoffField.hidden = !['low-pass', 'fft-low-pass'].includes(mode);
    onGridChange();
  });
  document.getElementById('smooth-window')?.addEventListener('input', () => {
    const val = document.getElementById('smooth-window').value;
    const display = document.getElementById('smooth-window-value');
    if (display) display.textContent = val;
    onGridChange();
  });
  document.getElementById('filter-cutoff')?.addEventListener('input', () => {
    const val = document.getElementById('filter-cutoff').value;
    const display = document.getElementById('filter-cutoff-value');
    if (display) display.textContent = val;
    onGridChange();
  });
  document.querySelectorAll('[data-chart-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.chartAction === 'reset') {
        resetMainChartScale();
      } else {
        setMainChartDragMode(button.dataset.chartAction);
      }
    });
  });

  document.getElementById('x-col-select')?.addEventListener('change', onChartOptionsChange);
  document.getElementById('chart-type')?.addEventListener('change', onChartOptionsChange);
  document.getElementById('fit-x-col-select')?.addEventListener('change', runFits);
  document.getElementById('fit-y-col-select')?.addEventListener('change', runFits);
  document.getElementById('run-fit-btn')?.addEventListener('click', runFits);
  document.querySelectorAll('.fit-model-select input').forEach((input) => input.addEventListener('change', runFits));
  document.getElementById('poly-degree')?.addEventListener('input', () => {
    const valueEl = document.getElementById('poly-degree-value');
    if (valueEl) valueEl.textContent = document.getElementById('poly-degree').value;
    runFits();
  });

  document.getElementById('run-ttest-btn')?.addEventListener('click', () => {
    const aIdx = parseInt(document.getElementById('ttest-a')?.value ?? '0', 10);
    const bIdx = parseInt(document.getElementById('ttest-b')?.value ?? '1', 10);
    const el = document.getElementById('ttest-result');
    if (!el) return;

    el.textContent = '';

    if (aIdx === bIdx) {
      const p = document.createElement('p');
      p.className = 'stats-empty';
      p.textContent = '系列 A と B に異なる列を選択してください。';
      el.appendChild(p);
      return;
    }

    const result = welchT(state.columns[aIdx], state.columns[bIdx]);
    if (!result) {
      const p = document.createElement('p');
      p.className = 'stats-empty';
      p.textContent = '各系列に 2 点以上の数値データが必要です。';
      el.appendChild(p);
      return;
    }

    el.appendChild(buildTTestResult(result, state.headers[aIdx], state.headers[bIdx]));
  });
});
