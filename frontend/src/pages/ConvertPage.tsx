import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { CodeAssistEditor } from "@/components/CodeAssistEditor"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  genCsv,
  genCsvAttachment,
  genLatex,
  genTikz,
  type RoundMode,
} from "@/engine/loader"

const SAMPLE = `x\ty1\ty2
1\t2.3\t4.5
2\t3.1\t5.2
3\t4.8\t5.9
4\t6.0\t6.1
5\t7.2\t6.4`

const COOLDOWN_SECONDS = 15
const TEXLIVE_URL = "https://texlive.net/cgi-bin/latexcgi"

const LEGEND_POS = [
  "north west", "north east", "south west", "south east",
  "north", "south", "east", "west",
]

type CodeKind = "latex" | "csv" | "tikz"

interface InputDiagnostics {
  rows: string[][]
  rowCount: number
  maxCols: number
  expectedCols: number
  unevenRows: number[]
  numericColumns: { index: number; name: string; count: number; nonPositive: number }[]
  warnings: string[]
}

function parseDiagnosticRows(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop()
  }
  return lines
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : ","
      return line.split(delimiter).map((cell) => cell.trim())
    })
}

function isNumericCell(cell: string) {
  return cell !== "" && Number.isFinite(Number(cell))
}

function diagnoseInput(input: string, hasHeader: boolean, scaleMode: string): InputDiagnostics {
  const rows = parseDiagnosticRows(input)
  const expectedCols = rows[0]?.length ?? 0
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const unevenRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.length !== expectedCols)
    .map(({ index }) => index + 1)

  const dataStart = hasHeader ? 1 : 0
  const headers = hasHeader ? rows[0] ?? [] : []
  const numericColumns = Array.from({ length: maxCols }, (_, index) => {
    let count = 0
    let nonPositive = 0
    for (let r = dataStart; r < rows.length; r++) {
      const cell = rows[r]?.[index] ?? ""
      if (!isNumericCell(cell)) continue
      const value = Number(cell)
      count += 1
      if (value <= 0) nonPositive += 1
    }
    return {
      index,
      name: headers[index] || `col${index + 1}`,
      count,
      nonPositive,
    }
  }).filter((col) => col.count > 0)

  const warnings: string[] = []
  if (rows.length === 0) warnings.push("入力が空です。")
  if (expectedCols < 2) warnings.push("TikZ グラフには x 列と y 列の最低 2 列が必要です。")
  if (unevenRows.length > 0) warnings.push(`列数がそろっていない行: ${unevenRows.join(", ")}`)
  if (numericColumns.length < 2) warnings.push("数値列が 2 列未満のため、グラフ化できる系列が不足しています。")
  if (scaleMode !== "linear") {
    const xColumn = numericColumns.find((col) => col.index === 0)
    const yColumns = numericColumns.filter((col) => col.index > 0)
    if (scaleMode === "loglog" && xColumn?.nonPositive) {
      warnings.push("両対数では x 列に 0 以下の値を使えません。")
    }
    if ((scaleMode === "semilog" || scaleMode === "loglog") && yColumns.some((col) => col.nonPositive > 0)) {
      warnings.push("対数 y 軸では y 系列に 0 以下の値を使えません。")
    }
  }

  return {
    rows,
    rowCount: rows.length,
    maxCols,
    expectedCols,
    unevenRows,
    numericColumns,
    warnings,
  }
}

// 旧 script.js の document ラッパを踏襲
const wrapLatexDocument = (body: string) => `% !TEX uplatex
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
\\end{document}`

const wrapTikzDocument = (tikz: string) => `% !TEX uplatex
\\documentclass[uplatex,a4paper,12pt,dvipdfmx]{jsarticle}
\\usepackage{amsmath,amssymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\usepackage{float}
\\usepackage{xcolor}
\\usepackage{pxpgfmark}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikz}
\\end{document}`

interface ExtraFile {
  name: string
  contents: string
}

// 動的にフォームを生成し texlive.net へ POST、結果を iframe に表示する。
function submitToTexlive(
  iframeName: string,
  texCode: string,
  extraFiles: ExtraFile[]
) {
  const form = document.createElement("form")
  form.method = "post"
  form.action = TEXLIVE_URL
  form.target = iframeName
  form.enctype = "multipart/form-data"
  form.style.display = "none"

  const add = (name: string, value: string, asTextarea = false) => {
    const el = document.createElement(asTextarea ? "textarea" : "input")
    el.name = name
    if (asTextarea) el.textContent = value
    else (el as HTMLInputElement).value = value
    form.appendChild(el)
  }

  add("filecontents[]", texCode, true)
  add("filename[]", "document.tex")
  for (const f of extraFiles) {
    add("filecontents[]", f.contents, true)
    add("filename[]", f.name)
  }
  add("engine", "uplatex")
  add("return", "pdfjs")

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

export default function ConvertPage() {
  const [input, setInput] = useState(SAMPLE)
  const [roundMode, setRoundMode] = useState<"none" | "decimal" | "sig-figs">("none")
  const [decimals, setDecimals] = useState(2)
  const [sigFigs, setSigFigs] = useState(3)
  const [hasHeader, setHasHeader] = useState(true)
  const [cleanInput, setCleanInput] = useState(true)
  const [booktabs, setBooktabs] = useState(true)

  const [filename, setFilename] = useState("data")
  const [figureNumber, setFigureNumber] = useState("")
  const [legendPos, setLegendPos] = useState("north west")
  const [scaleMode, setScaleMode] = useState("linear")
  const [fitMethod, setFitMethod] = useState("auto")
  const [xLabel, setXLabel] = useState("x軸")
  const [yLabel, setYLabel] = useState("y軸")
  const [graphCaption, setGraphCaption] = useState("図題")
  const [graphLabel, setGraphLabel] = useState("fig:label")

  const [latexOut, setLatexOut] = useState("")
  const [csvOut, setCsvOut] = useState("")
  const [tikzOut, setTikzOut] = useState("")

  const [cooldown, setCooldown] = useState(0)
  const [pending, setPending] = useState<null | "latex" | "tikz">(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const mode: RoundMode = roundMode === "decimal" ? 1 : roundMode === "sig-figs" ? 2 : 0
  const diagnostics = useMemo(
    () => diagnoseInput(input, hasHeader, scaleMode),
    [input, hasHeader, scaleMode]
  )

  // 入力・オプション変更で出力を自動生成
  useEffect(() => {
    let alive = true
    const opts = { mode, decimals, sigFigs, hasHeader, cleanInput, booktabs }
    Promise.all([
      genLatex(input, opts).catch(() => ""),
      genCsv(input, opts).catch(() => ""),
      genTikz(input, {
        filename: filename || "data",
        sigFigs,
        legendPos,
        scaleMode,
        fitMethod,
        hasHeader,
        cleanInput,
        figureNumber: Number(figureNumber) || 0,
        xLabel,
        yLabel,
        caption: graphCaption,
        label: graphLabel,
      }).catch(() => ""),
    ]).then(([l, c, t]) => {
      if (!alive) return
      setLatexOut(l)
      setCsvOut(c)
      setTikzOut(t)
    })
    return () => {
      alive = false
    }
  }, [
    input,
    mode,
    decimals,
    sigFigs,
    hasHeader,
    cleanInput,
    booktabs,
    filename,
    legendPos,
    scaleMode,
    fitMethod,
    figureNumber,
    xLabel,
    yLabel,
    graphCaption,
    graphLabel,
  ])

  // クールダウン
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function doPreview(kind: "latex" | "tikz") {
    const iframeName = iframeRef.current?.name ?? "tex-iframe"
    if (kind === "latex") {
      if (!latexOut.trim()) return
      submitToTexlive(iframeName, wrapLatexDocument(latexOut), [])
    } else {
      if (!tikzOut.trim()) return
      const refs = Array.from(new Set([...tikzOut.matchAll(/\{([^{}]+\.csv)\}/g)].map((m) => m[1])))
      const csv = await genCsvAttachment(input, hasHeader, cleanInput)
      const extra = refs.map((name) => ({ name, contents: csv }))
      submitToTexlive(iframeName, wrapTikzDocument(tikzOut), extra)
    }
    setCooldown(COOLDOWN_SECONDS)
  }

  function requestPreview(kind: "latex" | "tikz") {
    setPending(kind)
  }

  async function acceptConsent() {
    const kind = pending
    setPending(null)
    if (kind) await doPreview(kind)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Table · CSV · PGFPlots
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">変換</h1>
        <p className="text-muted-foreground text-sm">
          貼り付けた表から LaTeX 表 / CSV / TikZ(PGFPlots) を生成します。変換後のコードはそのまま編集できます。
        </p>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>入力データ</CardTitle>
            <CardDescription>タブ区切り / カンマ区切りの表を貼り付けてください。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={12}
              spellCheck={false}
              className="min-h-[260px] font-mono text-xs xl:min-h-[360px]"
            />
            <InputDiagnosticsPanel diagnostics={diagnostics} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>丸め</Label>
                <RadioGroup
                  value={roundMode}
                  onValueChange={(v) => setRoundMode(v as typeof roundMode)}
                  className="flex flex-wrap gap-4"
                >
                  {[
                    ["none", "なし"],
                    ["decimal", "小数点"],
                    ["sig-figs", "有効数字"],
                  ].map(([v, label]) => (
                    <label key={v} className="flex items-center gap-1.5 text-sm">
                      <RadioGroupItem value={v} /> {label}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="decimals">小数点桁</Label>
                  <Input id="decimals" type="number" min={0} value={decimals} onChange={(e) => setDecimals(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sigfigs">有効数字</Label>
                  <Input id="sigfigs" type="number" min={1} value={sigFigs} onChange={(e) => setSigFigs(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm"><Switch checked={hasHeader} onCheckedChange={setHasHeader} /> ヘッダー行あり</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={cleanInput} onCheckedChange={setCleanInput} /> 入力を正規化</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={booktabs} onCheckedChange={setBooktabs} /> booktabs 表</label>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(560px,1fr)_minmax(420px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>変換結果</CardTitle>
            <CardDescription>生成コードは編集できます。PDF プレビューには編集後の内容を使います。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="latex">
              <TabsList className="flex w-full justify-start overflow-x-auto">
                <TabsTrigger value="latex">table.tex</TabsTrigger>
                <TabsTrigger value="csv">CSV</TabsTrigger>
                <TabsTrigger value="tikz">plot.pgfplots</TabsTrigger>
              </TabsList>
              <TabsContent value="latex" className="space-y-2">
                <OutputArea kind="latex" value={latexOut} onChange={setLatexOut} rows={13} />
              </TabsContent>
              <TabsContent value="csv" className="space-y-2">
                <OutputArea kind="csv" value={csvOut} onChange={setCsvOut} rows={13} />
              </TabsContent>
              <TabsContent value="tikz" className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-1">
                    <Label htmlFor="fn">ファイル名</Label>
                    <Input id="fn" value={filename} onChange={(e) => setFilename(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fig">図番号</Label>
                    <Input id="fig" type="number" min={1} placeholder="自動" value={figureNumber} onChange={(e) => setFigureNumber(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>凡例位置</Label>
                    <Select value={legendPos} onValueChange={setLegendPos}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEGEND_POS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>軸スケール</Label>
                    <Select value={scaleMode} onValueChange={setScaleMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">線形</SelectItem>
                        <SelectItem value="semilog">片対数</SelectItem>
                        <SelectItem value="loglog">両対数</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>近似</Label>
                    <Select value={fitMethod} onValueChange={setFitMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">なし</SelectItem>
                        <SelectItem value="auto">自動</SelectItem>
                        <SelectItem value="linear">線形</SelectItem>
                        <SelectItem value="quadratic">2次</SelectItem>
                        <SelectItem value="cubic">3次</SelectItem>
                        <SelectItem value="exponential">指数</SelectItem>
                        <SelectItem value="logarithmic">対数</SelectItem>
                        <SelectItem value="power">べき乗</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label htmlFor="xlabel">x軸ラベル</Label>
                    <Input id="xlabel" value={xLabel} onChange={(e) => setXLabel(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ylabel">y軸ラベル</Label>
                    <Input id="ylabel" value={yLabel} onChange={(e) => setYLabel(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="caption">キャプション</Label>
                    <Input id="caption" value={graphCaption} onChange={(e) => setGraphCaption(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="label">ラベル</Label>
                    <Input id="label" value={graphLabel} onChange={(e) => setGraphLabel(e.target.value)} />
                  </div>
                </div>
                <OutputArea kind="tikz" value={tikzOut} onChange={setTikzOut} rows={13} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDF プレビュー</CardTitle>
            <CardDescription>左の生成コードを texlive.net で PDF にします。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => requestPreview("latex")} disabled={cooldown > 0 || !latexOut.trim()}>
                表PDFを作成
              </Button>
              <Button onClick={() => requestPreview("tikz")} disabled={cooldown > 0 || !tikzOut.trim()}>
                グラフPDFを作成
              </Button>
              {cooldown > 0 && <span className="text-muted-foreground self-center text-sm">次の送信まで {cooldown} 秒</span>}
            </div>
            <iframe
              ref={iframeRef}
              name="tex-iframe"
              title="LaTeX PDF preview"
              className="h-[420px] w-full rounded-md border xl:h-[760px]"
            />
          </CardContent>
        </Card>
        </div>
      </div>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PDF プレビューの送信確認</DialogTitle>
            <DialogDescription>
              PDF を作成するため、入力データと生成コードを texlive.net へ送信します。
              連続送信を避けるため、送信後 {COOLDOWN_SECONDS} 秒のクールダウンを設けます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPending(null)}>キャンセル</Button>
            <Button onClick={acceptConsent}>同意して送信</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InputDiagnosticsPanel({ diagnostics }: { diagnostics: InputDiagnostics }) {
  const plotSeries = diagnostics.numericColumns.filter((col) => col.index > 0)
  const statusTone = diagnostics.warnings.length > 0
    ? "border-amber-200 bg-amber-50 text-amber-950"
    : "border-emerald-200 bg-emerald-50 text-emerald-950"

  return (
    <div className={`rounded-md border p-3 text-sm ${statusTone}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>行 {diagnostics.rowCount}</span>
        <span>列 {diagnostics.maxCols}</span>
        <span>数値列 {diagnostics.numericColumns.length}</span>
        <span>系列 {plotSeries.length}</span>
      </div>
      {diagnostics.numericColumns.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {diagnostics.numericColumns.map((col) => (
            <span
              key={col.index}
              className="rounded border border-current/20 bg-white/50 px-2 py-0.5 text-xs"
            >
              {col.name}: {col.count}
            </span>
          ))}
        </div>
      )}
      {diagnostics.warnings.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {diagnostics.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OutputArea({
  kind,
  value,
  onChange,
  rows,
}: {
  kind: CodeKind
  value: string
  onChange: (value: string) => void
  rows: number
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={copy} disabled={!value}>
          {copied ? "コピー済み" : "コピー"}
        </Button>
      </div>
      <CodeAssistEditor
        kind={kind}
        value={value}
        onChange={onChange}
        minHeight={rows * 21}
      />
    </div>
  )
}
