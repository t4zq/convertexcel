const textareas = {
  input: document.getElementById('input'),
  latex: document.getElementById('latex'),
  csv: document.getElementById('csv'),
  tikz: document.getElementById('tikz'),
};

const createAceField = (textarea, { mode = 'text', readOnly = false, minLines = 8 } = {}) => {
  if (!window.ace || !textarea) {
    return textarea;
  }

  const editorElement = document.createElement('div');
  editorElement.className = 'ace-field';
  editorElement.style.minHeight = `${minLines * 22}px`;
  textarea.insertAdjacentElement('afterend', editorElement);
  textarea.classList.add('ace-source');

  const editor = ace.edit(editorElement);
  editor.setTheme('ace/theme/textmate');
  editor.session.setMode(`ace/mode/${mode}`);
  editor.session.setUseWrapMode(true);
  editor.setShowPrintMargin(false);
  editor.setReadOnly(readOnly);
  editor.setOptions({
    fontSize: '13px',
    tabSize: 2,
    useWorker: false,
  });
  editor.setValue(textarea.value || '', -1);
  editor.session.on('change', () => {
    textarea.value = editor.getValue();
  });

  return {
    get value() {
      return editor.getValue();
    },
    set value(nextValue) {
      const value = nextValue || '';
      editor.setValue(value, -1);
      textarea.value = value;
    },
    editor,
  };
};

const elements = {
  input: createAceField(textareas.input, { mode: 'text', minLines: 7 }),
  latex: createAceField(textareas.latex, { mode: 'latex', readOnly: true, minLines: 10 }),
  csv: createAceField(textareas.csv, { mode: 'text', readOnly: true, minLines: 10 }),
  tikz: createAceField(textareas.tikz, { mode: 'latex', minLines: 12 }),
  decimals: document.getElementById('decimals'),
  sigFigs: document.getElementById('sig-figs'),
  hasHeader: document.getElementById('has-header'),
  cleanInput: document.getElementById('clean-input'),
  autoPreviewCooldownStatus: document.getElementById('auto-preview-cooldown-status'),
  filename: document.getElementById('filename'),
  figureNumber: document.getElementById('figure-number'),
  legendPos: document.getElementById('legend-pos'),
  scaleMode: document.getElementById('scale-mode'),
  fitMethodsBySeries: document.getElementById('fit-methods-by-series'),
  latexPreviewBtn: document.getElementById('latex-preview-btn'),
  latexLoading: document.getElementById('latex-loading'),
  latexStatus: document.getElementById('latex-status'),
  latexLog: document.getElementById('latex-log'),
  latexPdfPreview: document.getElementById('latex-pdf-preview'),
  latexIframe: document.getElementById('latex-iframe'),
  tikzPreviewBtn: document.getElementById('tikz-preview-btn'),
  tikzLoading: document.getElementById('tikz-loading'),
  tikzStatus: document.getElementById('tikz-status'),
  tikzLog: document.getElementById('tikz-log'),
  tikzPdfPreview: document.getElementById('tikz-pdf-preview'),
  tikzIframe: document.getElementById('tikz-iframe'),
  pdfConsentModal: document.getElementById('pdf-consent-modal'),
  pdfConsentAccept: document.getElementById('pdf-consent-accept'),
  pdfConsentCancel: document.getElementById('pdf-consent-cancel'),
};

const initWorkbenchNavigation = () => {
  const controls = [...document.querySelectorAll('[data-workbench-target]')];
  if (!controls.length) return;

  const allPanels = [...document.querySelectorAll('.ide-panel')];

  /** 指定パネル内の Ace エディタを再描画する */
  const refreshAceInPanel = (panelId) => {
    if (!window.ace) return;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    // ace-field (.ace_editor) を持つ要素を resize
    panel.querySelectorAll('.ace-field, .ace_editor').forEach((el) => {
      try { ace.edit(el).resize(true); } catch (_) { /* ignore */ }
    });
  };

  /** 指定 id のパネルだけ表示し、他を隠す */
  const showPanel = (panelId) => {
    allPanels.forEach((p) => {
      p.hidden = p.id !== panelId;
    });
    // hidden 解除後、レイアウト確定を待って Ace を再描画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => refreshAceInPanel(panelId));
    });
  };

  /** タブ / アクティビティアイコンのアクティブ状態を更新 */
  const setActive = (button) => {
    if (button.classList.contains('editor-tab')) {
      document.querySelectorAll('.editor-tab').forEach((tab) =>
        tab.classList.toggle('is-active', tab === button),
      );
    }
    if (button.classList.contains('activity-icon')) {
      document.querySelectorAll('.activity-icon').forEach((icon) =>
        icon.classList.toggle('is-active', icon === button),
      );
    }
  };

  controls.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.workbenchTarget;
      const target = document.getElementById(targetId);
      if (!target) return;

      setActive(button);

      if (target.classList.contains('ide-panel')) {
        // エディタ内パネルの切り替え
        showPanel(targetId);

        // アクティビティアイコン → 対応するエディタタブも同期
        if (button.classList.contains('activity-icon')) {
          const tab = document.querySelector(
            `.editor-tab[data-workbench-target="${targetId}"]`,
          );
          if (tab) {
            document.querySelectorAll('.editor-tab').forEach((t) =>
              t.classList.toggle('is-active', t === tab),
            );
          }
        }
      } else {
        // PDF プレビューペイン等はスクロールで移動
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 初期表示: is-active なタブのパネルだけ見せる
  const activeTab = document.querySelector('.editor-tab.is-active');
  if (activeTab) {
    showPanel(activeTab.dataset.workbenchTarget);
  } else if (allPanels.length) {
    showPanel(allPanels[0].id);
  }
};

initWorkbenchNavigation();

const readNumber = (element, fallback) => parseInt(element.value, 10) || fallback;

const getRoundMode = () => {
  const selected = document.querySelector('input[name="round-mode"]:checked');
  return selected ? selected.value : 'none';
};

const getDataOptions = () => ({
  hasHeader: Boolean(elements.hasHeader?.checked),
  cleanInput: Boolean(elements.cleanInput?.checked),
});

const AUTO_PREVIEW_COOLDOWN_SECONDS = 15;
const AUTO_PREVIEW_COOLDOWN_MS = AUTO_PREVIEW_COOLDOWN_SECONDS * 1000;
let pdfPreviewCooldownActive = false;

const fitMethodOptions = [
  ['none', 'なし（近似なし）'],
  ['auto', '自動（R²最大）'],
  ['linear', '線形'],
  ['quadratic', '2次多項式'],
  ['cubic', '3次多項式'],
  ['exponential', '指数'],
  ['logarithmic', '対数'],
  ['power', '累乗'],
];

const computeStats = (rawData, hasHeader, cleanInput) => {
  let text = rawData;
  if (cleanInput) text = text.normalize('NFKC');
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  let headers = null;
  let dataLines = lines;
  if (hasHeader && lines.length > 1) {
    headers = lines[0].split(delimiter).map((h) => h.trim());
    dataLines = lines.slice(1);
  }
  if (dataLines.length === 0) return [];
  const numCols = dataLines[0].split(delimiter).length;
  const columns = Array.from({ length: numCols }, () => []);
  for (const line of dataLines) {
    const cells = line.split(delimiter);
    for (let c = 0; c < numCols; c += 1) {
      const val = parseFloat((cells[c] || '').trim());
      if (Number.isFinite(val)) columns[c].push(val);
    }
  }
  return columns.map((vals, i) => {
    const colName = headers ? (headers[i] || `列${i + 1}`) : `列${i + 1}`;
    if (vals.length === 0) return { colName, n: 0, mean: null, stddev: null, min: null, max: null };
    const n = vals.length;
    const mean = vals.reduce((s, v) => s + v, 0) / n;
    const variance = n > 1 ? vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
    return { colName, n, mean, stddev: Math.sqrt(variance), min: Math.min(...vals), max: Math.max(...vals) };
  });
};

const formatStat = (val) => {
  if (val === null || !Number.isFinite(val)) return '—';
  return Number(val.toPrecision(4)).toString();
};

const updateStatsDisplay = () => {
  const statsDetails = document.getElementById('stats-details');
  const container = document.getElementById('stats-table-container');
  if (!statsDetails || !container) return;
  const rawData = elements.input.value.trim();
  if (!rawData) { statsDetails.hidden = true; return; }
  const { hasHeader, cleanInput } = getDataOptions();
  const stats = computeStats(rawData, hasHeader, cleanInput);
  if (stats.length === 0) { statsDetails.hidden = true; return; }
  statsDetails.hidden = false;
  const rows = stats.map(({ colName, n, mean, stddev, min, max }) => `<tr><td>${colName}</td><td>${n}</td><td>${formatStat(mean)}</td><td>${formatStat(stddev)}</td><td>${formatStat(min)}</td><td>${formatStat(max)}</td></tr>`).join('');
  container.innerHTML = `<table class="stats-table"><thead><tr><th>列</th><th>n</th><th>平均</th><th>標準偏差</th><th>最小</th><th>最大</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const detectSeriesCount = () => {
  const firstLine = elements.input.value.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  if (!firstLine) return 0;
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  return Math.max(0, firstLine.split(delimiter).length - 1);
};

const getFitMethodsBySeries = () => {
  const selects = [...(elements.fitMethodsBySeries?.querySelectorAll('select[data-fit-series]') || [])];
  if (selects.length === 0) {
    return 'auto';
  }
  return selects.map((select) => select.value || 'auto').join(',');
};

const updateFitMethodControls = () => {
  if (!elements.fitMethodsBySeries) return;
  const seriesCount = detectSeriesCount();
  const defaultMethod = 'auto';
  const previous = new Map(
    [...elements.fitMethodsBySeries.querySelectorAll('select[data-fit-series]')]
      .map((select) => [select.dataset.fitSeries, select.value]),
  );

  elements.fitMethodsBySeries.innerHTML = '';
  if (seriesCount === 0) {
    const empty = document.createElement('div');
    empty.className = 'fit-methods-empty';
    empty.textContent = '入力データから系列を検出すると表示されます';
    elements.fitMethodsBySeries.appendChild(empty);
    return;
  }

  for (let i = 0; i < seriesCount; i += 1) {
    const row = document.createElement('label');
    row.className = 'fit-series-row';

    const name = document.createElement('span');
    name.className = 'fit-series-name';
    name.textContent = `data ${i + 1}`;

    const select = document.createElement('select');
    select.dataset.fitSeries = String(i);
    fitMethodOptions.forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = previous.get(String(i)) || defaultMethod;
    row.appendChild(name);
    row.appendChild(select);
    elements.fitMethodsBySeries.appendChild(row);
  }
};

const getGraphOptions = () => ({
  sigFigs: readNumber(elements.sigFigs, 3),
  figureNumber: readNumber(elements.figureNumber, 0),
  legendPos: elements.legendPos.value || 'north west',
  scaleMode: elements.scaleMode.value || 'linear',
  fitMethods: getFitMethodsBySeries(),
});

const getRoundModeValue = () => {
  const mode = getRoundMode();
  if (mode === 'decimal') return 1;
  if (mode === 'sig-figs') return 2;
  return 0;
};

const applyFigureNumber = (tikzCode, figureNumber) => {
  const codeWithoutCounter = tikzCode.replace(/^[ \t]*\\setcounter\{figure\}\{[^}]*\}\r?\n?/m, '');
  if (figureNumber <= 0) {
    return codeWithoutCounter;
  }

  const counterLine = `\\setcounter{figure}{${figureNumber - 1}}`;
  const captionPattern = /^([ \t]*)\\caption\{/m;
  if (captionPattern.test(codeWithoutCounter)) {
    return codeWithoutCounter.replace(captionPattern, `$1${counterLine}\n$1\\caption{`);
  }

  return `${codeWithoutCounter.trimEnd()}\n${counterLine}\n`;
};

const engineRegex = /% *!TEX.*[^a-zA-Z](((pdf|xe|lua|u?p)?latex(-dev)?)|uplatex|platex|asy|context|(pdf|xe|lua|[ou]?p)?tex) *\n/i;
const bibRegex = /% *!TEX.*[^a-zA-Z](p?bibtex8?|biber) *\n/i;
const makeGlossariesRegex = /% *!TEX.*[^a-zA-Z](makeglossaries(-light)?) *\n/i;

const defaultEngineFromContent = (texCode) => {
  if (texCode.includes('\\usepackage{lua') || texCode.includes('\\directlua')) {
    return 'lualatex';
  }
  if (texCode.includes('fontspec')) {
    return 'xelatex';
  }
  if (texCode.includes('pstricks')) {
    return 'latex';
  }
  return null;
};

const extractEngineFromTeX = (texCode) => {
  const match = texCode.match(engineRegex);
  return match ? match[1].toLowerCase() : defaultEngineFromContent(texCode);
};

const extractBibCmd = (texCode) => {
  const match = texCode.match(bibRegex);
  return match ? match[1].toLowerCase() : null;
};

const extractMakeGlossaries = (texCode) => {
  const match = texCode.match(makeGlossariesRegex);
  return match ? match[1].toLowerCase() : null;
};

const appendHiddenField = (form, name, value, tagName = 'input') => {
  const field = document.createElement(tagName);
  field.name = name;
  if (tagName === 'textarea') {
    field.textContent = value;
  } else {
    field.type = 'hidden';
    field.value = value;
  }
  form.appendChild(field);
};

const submitLatexForm = (formId, texCode, engine = 'uplatex', extraFiles = []) => {
  const form = document.getElementById(formId);
  if (!form) return;

  const detectedEngine = extractEngineFromTeX(texCode);
  form.innerHTML = '';

  appendHiddenField(form, 'filecontents[]', texCode, 'textarea');
  appendHiddenField(form, 'filename[]', 'document.tex');
  extraFiles.forEach((file) => {
    appendHiddenField(form, 'filecontents[]', file.contents, 'textarea');
    appendHiddenField(form, 'filename[]', file.name);
  });
  appendHiddenField(form, 'engine', detectedEngine || engine);
  appendHiddenField(form, 'return', 'pdfjs');

  const bibCmd = extractBibCmd(texCode);
  if (bibCmd) {
    appendHiddenField(form, 'bibcmd', bibCmd);
  }

  const makeGlossaries = extractMakeGlossaries(texCode);
  if (makeGlossaries) {
    appendHiddenField(form, 'makeglossaries', makeGlossaries);
  }

  form.submit();
};

const compileErrorPatterns = [
  /(^|\n)! /,
  /Emergency stop/i,
  /Timeout\/Error status/i,
  /No pages of output/i,
  /Fatal error/i,
  /LaTeX Error/i,
  /Package .* Error/i,
];

const setCompileStatus = (statusElement, state, message) => {
  if (!statusElement) return;
  statusElement.className = `compile-status ${state ? `compile-status--${state}` : ''}`;
  statusElement.textContent = message || '';
};

const setCompileLog = (logElement, text) => {
  if (!logElement) return;
  const value = (text || '').trim();
  logElement.textContent = value;
  logElement.hidden = !value;
};

const setPreviewBusy = (previewButton, deleteButton, isBusy) => {
  if (previewButton) previewButton.disabled = isBusy || pdfPreviewCooldownActive;
  if (deleteButton) deleteButton.disabled = isBusy;
};

const readIframeText = (iframe) => {
  try {
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
    return doc?.body?.innerText || '';
  } catch (error) {
    return null;
  }
};

const looksLikeCompileError = (text) => (
  Boolean(text) && compileErrorPatterns.some((pattern) => pattern.test(text))
);

const finishPdfPreview = ({ iframe, loading, previewButton, deleteButton, status, log }) => {
  if (loading) loading.classList.remove('active');
  setPreviewBusy(previewButton, deleteButton, false);

  const iframeText = readIframeText(iframe);
  if (iframeText === null) {
    setCompileStatus(status, 'unknown', '結果を表示しました');
    setCompileLog(log, 'iframe内の結果を確認してください。');
    return;
  }

  if (looksLikeCompileError(iframeText)) {
    setCompileStatus(status, 'error', 'コンパイル失敗');
    setCompileLog(log, iframeText);
    return;
  }

  setCompileStatus(status, 'success', 'コンパイル完了');
  setCompileLog(log, iframeText);
};

const showPdfPreview = ({ preview, iframe, loading, previewButton, deleteButton, status, log }) => {
  if (loading) loading.classList.add('active');
  if (preview) preview.style.display = 'block';
  if (deleteButton) deleteButton.style.display = 'inline-block';
  setPreviewBusy(previewButton, deleteButton, true);
  setCompileStatus(status, 'running', 'コンパイル中');
  setCompileLog(log, '');

  if (iframe) {
    iframe.onload = () => {
      finishPdfPreview({ iframe, loading, previewButton, deleteButton, status, log });
    };
  }
  setTimeout(() => preview?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
};

const clearPdfPreview = ({ preview, iframe, deleteButton, loading, previewButton, status, log }) => {
  if (preview) preview.style.display = 'none';
  if (iframe) {
    iframe.onload = null;
    iframe.src = 'about:blank';
  }
  if (deleteButton) deleteButton.style.display = 'none';
  if (loading) loading.classList.remove('active');
  setPreviewBusy(previewButton, deleteButton, false);
  setCompileStatus(status, '', '');
  setCompileLog(log, '');
};

const wrapLatexDocument = (body) => `% !TEX uplatex
\\documentclass[uplatex,a4paper,12pt]{jsarticle}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{float}
\\usepackage{xcolor}
\\usepackage[dvipdfmx]{hyperref}
\\usepackage[dvipdfmx]{geometry}
\\geometry{a4paper,margin=25mm}
\\begin{document}
${body}
\\end{document}`;

const wrapTikzDocument = (tikzCode) => `% !TEX uplatex
\\documentclass[uplatex,a4paper,12pt,dvipdfmx]{jsarticle}
\\usepackage{amsmath,amssymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\usepackage{float}
\\usepackage{xcolor}
\\usepackage{pxpgfmark}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikzCode}
\\end{document}`;

const extractCsvReferences = (tikzCode) => {
  const references = new Set();
  const tableRegex = /\{([^{}]+\.csv)\}/g;
  let match;
  while ((match = tableRegex.exec(tikzCode)) !== null) {
    references.add(match[1]);
  }
  return Array.from(references);
};

document.querySelectorAll('.copy-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const target = elements[button.dataset.target];
    if (!target || !target.value) return;

    navigator.clipboard.writeText(target.value).then(() => {
      const originalText = button.textContent;
      button.textContent = 'コピー済み';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1500);
    });
  });
});

elements.latexPreviewBtn?.addEventListener('click', () => {
  const texCode = elements.latex.value.trim();
  if (!texCode) {
    alert('LaTeX code is empty. Run LaTeX conversion first.');
    return;
  }

  showPdfPreview({
    preview: elements.latexPdfPreview,
    iframe: elements.latexIframe,
    loading: elements.latexLoading,
    previewButton: elements.latexPreviewBtn,
    status: elements.latexStatus,
    log: elements.latexLog,
  });
  submitLatexForm('latex-form', wrapLatexDocument(texCode), 'uplatex');
});

const updateInputDependents = () => { updateFitMethodControls(); updateStatsDisplay(); };
elements.input.editor?.session.on('change', updateInputDependents);
textareas.input?.addEventListener('input', updateInputDependents);
elements.hasHeader?.addEventListener('change', updateStatsDisplay);
elements.cleanInput?.addEventListener('change', updateStatsDisplay);
updateFitMethodControls();
updateStatsDisplay();

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
    latexConfig: wrapExport('gen_latex_config', 'number', ['string', 'number', 'number', 'number', 'number', 'number']),
    csvConfig: wrapExport('gen_csv_config', 'number', ['string', 'number', 'number', 'number', 'number', 'number']),
    tikzGraphConfig: wrapExport('gen_tikz_graph_config', 'number', ['string', 'string', 'number', 'string', 'string', 'string', 'number', 'number', 'number']),
    csvAttachment: wrapExport('gen_csv_attachment', 'number', ['string', 'number', 'number']),
  };
  let lastGeneratedTikz = '';
  let autoPreviewTimer = null;
  let autoPreviewCooldownTimer = null;
  let autoPreviewCountdownTimer = null;
  let autoPreviewConsented = false;
  let autoPreviewRejected = false;

  const setInputLocked = (locked) => {
    elements.input.editor?.setReadOnly(locked);
    if (textareas.input) textareas.input.disabled = locked;
    elements.tikzPreviewBtn && (elements.tikzPreviewBtn.disabled = locked || pdfPreviewCooldownActive);
  };

  const setCooldownStatus = (message) => {
    if (elements.autoPreviewCooldownStatus) {
      elements.autoPreviewCooldownStatus.textContent = message || '';
      elements.autoPreviewCooldownStatus.closest('.auto-preview-consent').hidden = !message;
    }
  };

  const startPdfCooldown = () => {
    clearTimeout(autoPreviewCooldownTimer);
    clearInterval(autoPreviewCountdownTimer);
    pdfPreviewCooldownActive = true;
    setInputLocked(true);
    let remainingSeconds = AUTO_PREVIEW_COOLDOWN_SECONDS;
    setCooldownStatus(`クールダウン中: ${remainingSeconds}秒`);
    autoPreviewCountdownTimer = setInterval(() => {
      remainingSeconds -= 1;
      setCooldownStatus(remainingSeconds > 0 ? `クールダウン中: ${remainingSeconds}秒` : '');
    }, 1000);
    autoPreviewCooldownTimer = setTimeout(() => {
      clearInterval(autoPreviewCountdownTimer);
      pdfPreviewCooldownActive = false;
      setInputLocked(false);
      setCooldownStatus('');
    }, AUTO_PREVIEW_COOLDOWN_MS);
  };

  const showConsentDialog = () => new Promise((resolve) => {
    if (!elements.pdfConsentModal || !elements.pdfConsentAccept || !elements.pdfConsentCancel) {
      resolve(window.confirm('PDF プレビューのため、入力データと生成コードを texlive.net へ送信します。同意しますか？'));
      return;
    }

    const close = (approved) => {
      elements.pdfConsentModal.hidden = true;
      elements.pdfConsentAccept.removeEventListener('click', approve);
      elements.pdfConsentCancel.removeEventListener('click', cancel);
      document.removeEventListener('keydown', onKeyDown);
      resolve(approved);
    };
    const approve = () => close(true);
    const cancel = () => close(false);
    const onKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        approve();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    };

    elements.pdfConsentModal.hidden = false;
    elements.pdfConsentAccept.addEventListener('click', approve);
    elements.pdfConsentCancel.addEventListener('click', cancel);
    document.addEventListener('keydown', onKeyDown);
    elements.pdfConsentAccept.focus();
  });

  const ensureAutoPreviewConsent = async () => {
    if (autoPreviewConsented) return true;
    if (autoPreviewRejected) return false;
    const approved = await showConsentDialog();
    autoPreviewConsented = approved;
    autoPreviewRejected = !approved;
    if (!approved) {
      setInputLocked(true);
      setCooldownStatus('texlive.net への送信に同意が必要です。再度使用するにはページを再読み込みしてください。');
    }
    return approved;
  };

  const runWithInput = (handler) => {
    const data = elements.input.value.trim();
    if (!data) return;
    handler(data);
  };

  const getWasmOptions = () => {
    const { hasHeader, cleanInput } = getDataOptions();
    return {
      mode: getRoundModeValue(),
      decimals: readNumber(elements.decimals, 0),
      sigFigs: readNumber(elements.sigFigs, 1),
      hasHeader: hasHeader ? 1 : 0,
      cleanInput: cleanInput ? 1 : 0,
    };
  };

  const generateLatexFromInput = (data) => {
    const options = getWasmOptions();
    elements.latex.value = takeString(wasm.latexConfig(
      data,
      options.mode,
      options.decimals,
      options.sigFigs,
      options.hasHeader,
      options.cleanInput,
    ));
    return elements.latex.value;
  };

  const generateCsvFromInput = (data) => {
    const options = getWasmOptions();
    elements.csv.value = takeString(wasm.csvConfig(
      data,
      options.mode,
      options.decimals,
      options.sigFigs,
      options.hasHeader,
      options.cleanInput,
    ));
    return elements.csv.value;
  };

  const generateTikzFromInput = (data) => {
    const { sigFigs, figureNumber, legendPos, scaleMode, fitMethods } = getGraphOptions();
    const { hasHeader, cleanInput } = getDataOptions();
    const filename = elements.filename.value.trim() || 'data';
    const tikzCode = takeString(wasm.tikzGraphConfig(
      data,
      filename,
      sigFigs,
      legendPos,
      scaleMode,
      fitMethods,
      hasHeader ? 1 : 0,
      cleanInput ? 1 : 0,
      figureNumber,
    ));
    elements.tikz.value = tikzCode;
    lastGeneratedTikz = tikzCode;
    return tikzCode;
  };

  const shouldRegenerateTikzForPreview = (sourceData, currentTikz) => {
    if (!sourceData || !lastGeneratedTikz) return false;
    const currentBaseTikz = applyFigureNumber(currentTikz, 0).trim();
    const lastBaseTikz = applyFigureNumber(lastGeneratedTikz.trim(), 0).trim();
    return currentBaseTikz === lastBaseTikz;
  };

  const buildCsvAttachments = (tikzCode, showAlerts = true) => {
    const csvReferences = extractCsvReferences(tikzCode);
    const extraFiles = [];
    if (csvReferences.length === 0) return extraFiles;

    const data = elements.input.value.trim();
    if (!data) {
      if (showAlerts) {
        alert('This PGFPlots code references a CSV file. Keep the source data in the input editor before previewing.');
      }
      return null;
    }

    const { hasHeader, cleanInput } = getDataOptions();
    const csvData = takeString(wasm.csvAttachment(data, hasHeader ? 1 : 0, cleanInput ? 1 : 0));
    csvReferences.forEach((name) => {
      extraFiles.push({ name, contents: csvData });
    });
    return extraFiles;
  };

  const previewTikzPdf = ({ showAlerts = true, forceRegenerate = false } = {}) => {
    const { figureNumber } = getGraphOptions();
    const sourceData = elements.input.value.trim();
    const currentTikz = elements.tikz.value.trim();
    const shouldRegenerate = forceRegenerate || shouldRegenerateTikzForPreview(sourceData, currentTikz);
    const baseTikzCode = shouldRegenerate && sourceData ? generateTikzFromInput(sourceData) : currentTikz;
    const tikzCode = applyFigureNumber(baseTikzCode.trim(), figureNumber);

    if (!tikzCode) {
      if (showAlerts) alert('TikZ code is empty. Generate or edit PGFPlots code first.');
      return false;
    }

    elements.tikz.value = tikzCode;
    lastGeneratedTikz = tikzCode;

    const extraFiles = buildCsvAttachments(tikzCode, showAlerts);
    if (extraFiles === null) return false;

    showPdfPreview({
      preview: elements.tikzPdfPreview,
      iframe: elements.tikzIframe,
      loading: elements.tikzLoading,
      previewButton: elements.tikzPreviewBtn,
      status: elements.tikzStatus,
      log: elements.tikzLog,
    });
    submitLatexForm('tikz-form', wrapTikzDocument(tikzCode), 'uplatex', extraFiles);
    return true;
  };

  const isAutoPreviewCandidate = (data) => {
    const lines = data.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return false;
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    return lines[0].split(delimiter).length >= 2;
  };

  const runAutoOutputAndPreview = async () => {
    const data = elements.input.value.trim();
    if (!isAutoPreviewCandidate(data)) return;
    if (!(await ensureAutoPreviewConsent())) return;

    generateLatexFromInput(data);
    generateCsvFromInput(data);
    generateTikzFromInput(data);
    if (previewTikzPdf({ showAlerts: false, forceRegenerate: true })) {
      startPdfCooldown();
    }
  };

  const scheduleAutoOutputAndPreview = () => {
    clearTimeout(autoPreviewTimer);
    autoPreviewTimer = setTimeout(runAutoOutputAndPreview, 700);
  };

  elements.fitMethodsBySeries?.addEventListener('change', () => {
    const sourceData = elements.input.value.trim();
    if (sourceData) {
      generateTikzFromInput(sourceData);
      scheduleAutoOutputAndPreview();
    }
  });

  elements.tikzPreviewBtn?.addEventListener('click', async () => {
    if (pdfPreviewCooldownActive) return;
    runWithInput(async (data) => {
      if (!(await ensureAutoPreviewConsent())) return;
      generateLatexFromInput(data);
      generateCsvFromInput(data);
      generateTikzFromInput(data);
      if (previewTikzPdf({ showAlerts: true, forceRegenerate: true })) {
        startPdfCooldown();
      }
    });
  });

  elements.input.editor?.session.on('change', scheduleAutoOutputAndPreview);
  textareas.input?.addEventListener('input', scheduleAutoOutputAndPreview);
  [elements.hasHeader, elements.cleanInput, elements.decimals, elements.sigFigs, elements.filename, elements.figureNumber, elements.legendPos, elements.scaleMode]
    .filter(Boolean)
    .forEach((element) => element.addEventListener('change', scheduleAutoOutputAndPreview));
  document.querySelectorAll('input[name="round-mode"]').forEach((element) => {
    element.addEventListener('change', scheduleAutoOutputAndPreview);
  });
  window.dispatchEvent(new Event('convertexcel-converter-ready'));
});

// 統計ページからのデータ転送を受け取る
(() => {
  const transferred = localStorage.getItem('convertexcel-transfer-data');
  if (!transferred) return;
  localStorage.removeItem('convertexcel-transfer-data');

  // Ace Editor が初期化されていれば setValue、なければ textarea に直接セット
  const setInputValue = (value) => {
    if (elements?.input?.value !== undefined) {
      elements.input.value = value;
    } else {
      const ta = document.getElementById('input');
      if (ta) ta.value = value;
    }
  };

  // ConvertModule の初期化を待ってから適用
  const applyTransfer = () => {
    setInputValue(transferred);
    if (typeof scheduleAutoOutputAndPreview === 'function') {
      scheduleAutoOutputAndPreview();
    } else {
      textareas?.input?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  window.addEventListener('convertexcel-converter-ready', applyTransfer, { once: true });
})();
