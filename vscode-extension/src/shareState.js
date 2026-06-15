"use strict";

const LEGACY_INPUT_PREFIX = "d=";
const SHARE_STATE_PREFIX = "s=";
const COMPACT_SHARE_STATE_PREFIX = "c=";

const DEFAULT_TABLE_SETTINGS = {
  roundMode: "none",
  decimals: 2,
  sigFigs: 3,
  columnAlign: "center",
  hasHeader: true,
  cleanInput: true,
  booktabs: true,
  siunitx: false,
};

const DEFAULT_TIKZ_SETTINGS = {
  filename: "data",
  figureNumber: "",
  legendPos: "north west",
  scaleMode: "linear",
  fitMethods: ["auto"],
  xLabel: "x軸",
  yLabel: "y軸",
  caption: "図題",
  label: "fig:label",
  seriesColors: [],
  seriesMarks: [],
  uncSigFigs: 0,
};

const DEFAULT_GNUPLOT_SETTINGS = {
  keyPos: "left top",
  grid: false,
  pointType: 0,
  pointSize: 0,
  title: "",
  autoPreview: false,
};

function decodeBase64Utf8(value) {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function decodeUrlSafeBase64Utf8(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return decodeBase64Utf8(padded);
}

function validActiveTab(value) {
  return value === "latex" || value === "tikz" || value === "gnuplot";
}

function decodeLegacyInput(hashValue) {
  const input = decodeBase64Utf8(hashValue);
  return input === null ? null : { input };
}

function decodeState(hashValue) {
  const raw = decodeBase64Utf8(hashValue);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.v !== 1 || typeof parsed.input !== "string") return null;
    if (!validActiveTab(parsed.activeTab)) return null;
    if (!parsed.table || !parsed.tikz) return null;

    return {
      input: parsed.input,
      table: { ...DEFAULT_TABLE_SETTINGS, ...parsed.table },
      tikz: { ...DEFAULT_TIKZ_SETTINGS, ...parsed.tikz },
      gnuplot: { ...DEFAULT_GNUPLOT_SETTINGS, ...(parsed.gnuplot || {}) },
      activeTab: parsed.activeTab,
    };
  } catch {
    return null;
  }
}

function decodeCompactState(hashValue) {
  const raw = decodeUrlSafeBase64Utf8(hashValue);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.v !== 2) return null;
    const activeTab = parsed.a || "latex";
    if (!validActiveTab(activeTab)) return null;

    return {
      input: typeof parsed.i === "string" ? parsed.i : "",
      table: { ...DEFAULT_TABLE_SETTINGS, ...(parsed.tb || {}) },
      tikz: { ...DEFAULT_TIKZ_SETTINGS, ...(parsed.tz || {}) },
      gnuplot: { ...DEFAULT_GNUPLOT_SETTINGS, ...(parsed.gp || {}) },
      activeTab,
    };
  } catch {
    return null;
  }
}

function parseShareHash(hash) {
  const normalized = hash.replace(/^#/, "");
  if (normalized.startsWith(COMPACT_SHARE_STATE_PREFIX)) {
    return decodeCompactState(normalized.slice(COMPACT_SHARE_STATE_PREFIX.length));
  }
  if (normalized.startsWith(SHARE_STATE_PREFIX)) {
    return decodeState(normalized.slice(SHARE_STATE_PREFIX.length));
  }
  if (normalized.startsWith(LEGACY_INPUT_PREFIX)) {
    return decodeLegacyInput(normalized.slice(LEGACY_INPUT_PREFIX.length));
  }
  return null;
}

function extractHash(text) {
  const trimmed = text.trim();
  const hashOnly = trimmed.match(/^#?(?:c|s|d)=\S+$/);
  if (hashOnly) return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/);
  const candidate = urlMatch ? urlMatch[0] : trimmed;
  try {
    const parsed = new URL(candidate);
    return parsed.hash || null;
  } catch {
    const hashMatch = candidate.match(/#(?:c|s|d)=[^\s"'<>]+/);
    return hashMatch ? hashMatch[0] : null;
  }
}

function parseShareUrl(text) {
  const hash = extractHash(text);
  return hash ? parseShareHash(hash) : null;
}

module.exports = {
  DEFAULT_TABLE_SETTINGS,
  DEFAULT_TIKZ_SETTINGS,
  DEFAULT_GNUPLOT_SETTINGS,
  parseShareHash,
  parseShareUrl,
};
