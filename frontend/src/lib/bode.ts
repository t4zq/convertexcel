import type { BodeSettings, TableSettings, TikzSettings } from "@/lib/convert-settings"

export type BodeColumnOption = {
  value: string
  label: string
}

const AUTO = "auto"
const NONE = "none"
// 系列ごとの近似手法のうち、ボード線図の折れ線（漸近線）近似を表す値。
export const ASYMPTOTE_FIT = "asymptote"

function splitRows(input: string): string[][] {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : ","
      return line.split(delimiter).map((cell) => cell.trim())
    })
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function isHeaderMatch(header: string, patterns: RegExp[]): boolean {
  const normalized = normalizeHeader(header)
  return patterns.some((pattern) => pattern.test(normalized))
}

const FREQUENCY_PATTERNS = [/^frequency\s*\[hz\]$/, /^freq(?:uency)?(?:\s*\[hz\])?$/, /^f\s*\[hz\]$/]
const VIN_PATTERNS = [/^v(?:in|i|_?in)(?:\s*\[v\])?$/, /^input\s+voltage(?:\s*\[v\])?$/]
const VOUT_PATTERNS = [/^v(?:out|o|_?out)(?:\s*\[v\])?$/, /^output\s+voltage(?:\s*\[v\])?$/]
const GAIN_PATTERNS = [/^gain\s*\[db\]$/, /^g\s*\[db\]$/]
const PHASE_PATTERNS = [/^phase\s*\[deg\]$/, /^phase(?:\s*\[degree\])?$/]
const DELAY_PATTERNS = [
  /^delay\s*\[(?:s|ms)\]$/,
  /^time\s*delay\s*\[(?:s|ms)\]$/,
  /^dt\s*\[(?:s|ms)\]$/,
]

function detectColumn(headers: string[], patterns: RegExp[]): number | null {
  const index = headers.findIndex((header) => isHeaderMatch(header, patterns))
  return index >= 0 ? index : null
}

function delayScale(header: string | undefined): number {
  return /\[ms\]/i.test(header ?? "") ? 1e-3 : 1
}

function resolveColumn(value: string | undefined, headers: string[], patterns: RegExp[]): number | null {
  if (!value || value === AUTO) return detectColumn(headers, patterns)
  if (value === NONE) return null
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : null
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "nan"
  return Number(value.toPrecision(10)).toString()
}

function cellNumber(row: string[], index: number | null): number | null {
  if (index === null) return null
  const value = Number(row[index])
  return Number.isFinite(value) ? value : null
}

type BodePoint = {
  frequency: number
  gain: number
  phase: number | null
}

// ローパス（低周波が通過域）かハイパス（高周波が通過域）かでフィルタの形状を切り替える。
type FilterShape = "lowpass" | "highpass"

type CutoffEstimate = { cutoff: number; passbandGain: number; shape: FilterShape }

function estimateCutoff(points: BodePoint[]): CutoffEstimate | null {
  const ordered = points
    .filter((point) => point.frequency > 0 && Number.isFinite(point.gain))
    .sort((a, b) => a.frequency - b.frequency)
  if (ordered.length < 2) return null

  const edgeCount = Math.max(1, Math.min(3, Math.ceil(ordered.length / 4)))
  const lowGain = ordered.slice(0, edgeCount).reduce((sum, point) => sum + point.gain, 0) / edgeCount
  const highGain = ordered.slice(-edgeCount).reduce((sum, point) => sum + point.gain, 0) / edgeCount
  // 通過域は利得が大きい側。高域の方が大きければハイパス。
  const shape: FilterShape = highGain > lowGain ? "highpass" : "lowpass"
  const passbandGain = shape === "highpass"
    ? Math.max(highGain, ...ordered.slice(-(edgeCount + 2)).map((point) => point.gain))
    : Math.max(lowGain, ...ordered.slice(0, edgeCount + 2).map((point) => point.gain))
  const target = passbandGain - 3

  for (let i = 1; i < ordered.length; i += 1) {
    const prev = ordered[i - 1]
    const next = ordered[i]
    if (prev.frequency <= 0 || next.frequency <= 0) continue
    // ハイパスは低域→高域で利得が target を上向きに、ローパスは下向きに横切る点を遮断周波数とみなす。
    const crosses = shape === "highpass"
      ? prev.gain <= target && next.gain >= target
      : prev.gain >= target && next.gain <= target
    if (crosses) {
      if (prev.gain === next.gain) return { cutoff: next.frequency, passbandGain, shape }
      const ratio = (target - prev.gain) / (next.gain - prev.gain)
      const logCutoff = Math.log10(prev.frequency) + ratio * (Math.log10(next.frequency) - Math.log10(prev.frequency))
      return { cutoff: 10 ** logCutoff, passbandGain, shape }
    }
  }

  const closest = ordered.reduce((best, point) =>
    Math.abs(point.gain - target) < Math.abs(best.gain - target) ? point : best,
  )
  return { cutoff: closest.frequency, passbandGain, shape }
}

function gainAsymptote(frequency: number, cutoff: number, passbandGain: number, shape: FilterShape): number {
  if (shape === "highpass") {
    // 遮断周波数以上で一定（通過域）、以下では 1 decade あたり +20 dB で増加する折れ線。
    return frequency >= cutoff ? passbandGain : passbandGain - 20 * Math.log10(cutoff / frequency)
  }
  // ローパス：遮断周波数以下で一定、以上で 1 decade あたり -20 dB。
  return frequency <= cutoff ? passbandGain : passbandGain - 20 * Math.log10(frequency / cutoff)
}

function phaseAsymptote(frequency: number, cutoff: number, shape: FilterShape): number {
  if (shape === "highpass") {
    // ハイパス：低域 +90°、高域 0°、遮断周波数で +45°。
    if (frequency <= cutoff / 10) return 90
    if (frequency >= cutoff * 10) return 0
    return 45 - 45 * Math.log10(frequency / cutoff)
  }
  // ローパス：低域 0°、高域 -90°、遮断周波数で -45°。
  if (frequency <= cutoff / 10) return 0
  if (frequency >= cutoff * 10) return -90
  return -45 * (Math.log10(frequency / cutoff) + 1)
}

export function getBodeColumnOptions(input: string, table: TableSettings): BodeColumnOption[] {
  const rows = splitRows(input)
  const headers = table.hasHeader ? rows[0] ?? [] : rows[0]?.map((_, index) => `col${index + 1}`) ?? []
  return headers.map((header, index) => ({
    value: String(index),
    label: table.hasHeader && header ? `${index + 1}: ${header}` : `col${index + 1}`,
  }))
}

export function getAutoBodeSettings(input: string, table: TableSettings): Partial<BodeSettings> | null {
  if (!table.hasHeader) return null
  const headers = splitRows(input)[0] ?? []
  const frequencyColumn = detectColumn(headers, FREQUENCY_PATTERNS)
  const gainColumn = detectColumn(headers, GAIN_PATTERNS)
  const phaseColumn = detectColumn(headers, PHASE_PATTERNS)
  const vinColumn = detectColumn(headers, VIN_PATTERNS)
  const voutColumn = detectColumn(headers, VOUT_PATTERNS)
  const delayColumn = detectColumn(headers, DELAY_PATTERNS)
  const hasGain = gainColumn !== null || (vinColumn !== null && voutColumn !== null)
  if (frequencyColumn === null || !hasGain) return null
  return {
    enabled: true,
    frequencyColumn: String(frequencyColumn),
    gainColumn: gainColumn === null ? AUTO : String(gainColumn),
    phaseColumn: phaseColumn === null ? AUTO : String(phaseColumn),
    vinColumn: vinColumn === null ? AUTO : String(vinColumn),
    voutColumn: voutColumn === null ? AUTO : String(voutColumn),
    delayColumn: delayColumn === null ? AUTO : String(delayColumn),
  }
}

export function makeBodeGraphInput(input: string, table: TableSettings, tikz: TikzSettings): string | null {
  const bode = tikz.bode
  if (!bode?.enabled) return null

  const rows = splitRows(input)
  if (rows.length === 0) return null
  const headers = table.hasHeader ? rows[0] : rows[0].map((_, index) => `col${index + 1}`)
  const dataRows = table.hasHeader ? rows.slice(1) : rows

  const frequencyColumn = resolveColumn(bode.frequencyColumn, headers, FREQUENCY_PATTERNS)
  const gainColumn = resolveColumn(bode.gainColumn, headers, GAIN_PATTERNS)
  const phaseColumn = resolveColumn(bode.phaseColumn, headers, PHASE_PATTERNS)
  const vinColumn = resolveColumn(bode.vinColumn, headers, VIN_PATTERNS)
  const voutColumn = resolveColumn(bode.voutColumn, headers, VOUT_PATTERNS)
  const delayColumn = resolveColumn(bode.delayColumn, headers, DELAY_PATTERNS)
  const delayMultiplier = delayScale(delayColumn === null ? undefined : headers[delayColumn])
  if (frequencyColumn === null) return null
  if (gainColumn === null && (vinColumn === null || voutColumn === null)) return null

  const includePhase = phaseColumn !== null || delayColumn !== null
  const points: BodePoint[] = []

  for (const row of dataRows) {
    const frequency = cellNumber(row, frequencyColumn)
    const gain =
      cellNumber(row, gainColumn) ??
      (() => {
        const vin = cellNumber(row, vinColumn)
        const vout = cellNumber(row, voutColumn)
        if (vin === null || vout === null || vin === 0 || vout === 0) return null
        return 20 * Math.log10(Math.abs(vout / vin))
      })()
    if (frequency === null || gain === null) continue
    const phase =
      cellNumber(row, phaseColumn) ??
      (() => {
        const delay = cellNumber(row, delayColumn)
        return delay === null ? null : -360 * frequency * delay * delayMultiplier
      })()
    points.push({ frequency, gain, phase })
  }

  // 折れ線近似は系列ごとの近似手法で選ぶ。styleIndex 0 = gain, 1 = phase
  // （TikzSettingsPanel の bodeStyleIndexForColumn と一致させる）。
  const methods = Array.isArray(tikz.fitMethods) ? tikz.fitMethods : []
  const fitAt = (index: number) => methods[index] ?? methods[0]
  const wantGainAsymptote = fitAt(0) === ASYMPTOTE_FIT
  const wantPhaseAsymptote = includePhase && fitAt(1) === ASYMPTOTE_FIT
  const cutoff = wantGainAsymptote || wantPhaseAsymptote ? estimateCutoff(points) : null
  const includeGainAsymptote = cutoff !== null && wantGainAsymptote
  const includePhaseAsymptote = cutoff !== null && wantPhaseAsymptote
  const headersOut = [
    "frequency [Hz]",
    "gain [dB]",
    ...(includePhase ? ["phase [deg]"] : []),
    ...(includeGainAsymptote ? ["gain asymptote [dB]"] : []),
    ...(includePhaseAsymptote ? ["phase asymptote [deg]"] : []),
  ]
  const pointByFrequency = new Map<string, BodePoint>()
  for (const point of points) pointByFrequency.set(formatNumber(point.frequency), point)
  if (cutoff) {
    const frequencies = points.map((point) => point.frequency).filter((frequency) => frequency > 0)
    const minFrequency = Math.min(...frequencies)
    const maxFrequency = Math.max(...frequencies)
    for (const frequency of [minFrequency, cutoff.cutoff / 10, cutoff.cutoff, cutoff.cutoff * 10, maxFrequency]) {
      if (Number.isFinite(frequency) && frequency > 0) {
        pointByFrequency.set(formatNumber(frequency), pointByFrequency.get(formatNumber(frequency)) ?? {
          frequency,
          gain: Number.NaN,
          phase: null,
        })
      }
    }
  }
  const out: string[][] = [headersOut]
  for (const point of [...pointByFrequency.values()].sort((a, b) => a.frequency - b.frequency)) {
    out.push([
      formatNumber(point.frequency),
      Number.isFinite(point.gain) ? formatNumber(point.gain) : "nan",
      ...(includePhase ? [point.phase === null ? "nan" : formatNumber(point.phase)] : []),
      ...(includeGainAsymptote && cutoff
        ? [formatNumber(gainAsymptote(point.frequency, cutoff.cutoff, cutoff.passbandGain, cutoff.shape))]
        : []),
      ...(includePhaseAsymptote && cutoff
        ? [formatNumber(phaseAsymptote(point.frequency, cutoff.cutoff, cutoff.shape))]
        : []),
    ])
  }
  return out.length > 1 ? out.map((row) => row.join("\t")).join("\n") : null
}
