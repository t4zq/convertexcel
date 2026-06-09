import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Copy, Download, FileText, Settings2 } from "lucide-react"

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
  const [showInput, setShowInput] = useState(true)
  const [inputHeight, setInputHeight] = useState(260)
  const [isInputResizing, setIsInputResizing] = useState(false)
  const [showInputSettings, setShowInputSettings] = useState(false)

  const [filename, setFilename] = useState("data")
  const [figureNumber, setFigureNumber] = useState("")
  const [legendPos, setLegendPos] = useState("north west")
  const [scaleMode, setScaleMode] = useState("linear")
  const [fitMethod, setFitMethod] = useState("auto")
  const [xLabel, setXLabel] = useState("x軸")
  const [yLabel, setYLabel] = useState("y軸")
  const [graphCaption, setGraphCaption] = useState("図題")
  const [graphLabel, setGraphLabel] = useState("fig:label")
  const [showTikzSettings, setShowTikzSettings] = useState(false)

  const [latexOut, setLatexOut] = useState("")
  const [csvOut, setCsvOut] = useState("")
  const [tikzOut, setTikzOut] = useState("")

  const [cooldown, setCooldown] = useState(0)
  const [pending, setPending] = useState<null | "latex" | "tikz">(null)
  const [resultWidth, setResultWidth] = useState(56)
  const [isResizing, setIsResizing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const splitRef = useRef<HTMLDivElement>(null)
  const inputResizeYRef = useRef(0)

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

  function updateSplit(clientX: number) {
    const rect = splitRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = ((clientX - rect.left) / rect.width) * 100
    setResultWidth(Math.min(75, Math.max(35, Math.round(next))))
  }

  function startResize(e: PointerEvent<HTMLDivElement>) {
    setIsResizing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    updateSplit(e.clientX)
  }

  function resize(e: PointerEvent<HTMLDivElement>) {
    if (!isResizing) return
    updateSplit(e.clientX)
  }

  function stopResize(e: PointerEvent<HTMLDivElement>) {
    setIsResizing(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function resizeWithKeyboard(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    setResultWidth((value) => {
      const next = value + (e.key === "ArrowRight" ? 2 : -2)
      return Math.min(75, Math.max(35, next))
    })
  }

  function startInputResize(e: PointerEvent<HTMLDivElement>) {
    setIsInputResizing(true)
    if (!showInput) {
      setShowInput(true)
      setInputHeight(120)
    }
    inputResizeYRef.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function resizeInput(e: PointerEvent<HTMLDivElement>) {
    if (!isInputResizing) return
    const delta = e.clientY - inputResizeYRef.current
    inputResizeYRef.current = e.clientY
    setInputHeight((value) => {
      const next = Math.min(520, Math.max(90, value + delta))
      if (next <= 105) {
        setShowInput(false)
        return 120
      }
      return Math.round(next)
    })
  }

  function stopInputResize(e: PointerEvent<HTMLDivElement>) {
    setIsInputResizing(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function resizeInputWithKeyboard(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    e.preventDefault()
    if (!showInput && e.key === "ArrowDown") {
      setShowInput(true)
      setInputHeight(120)
      return
    }
    setInputHeight((value) => {
      const next = Math.min(520, Math.max(90, value + (e.key === "ArrowDown" ? 20 : -20)))
      if (next <= 105) {
        setShowInput(false)
        return 120
      }
      return next
    })
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>入力データ</CardTitle>
                <CardDescription>タブ区切り / カンマ区切りの表を貼り付けてください。</CardDescription>
              </div>
            </div>
          </CardHeader>
          {showInput && (
            <CardContent
              className="space-y-4 overflow-auto"
              style={{ maxHeight: `${inputHeight}px` }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                spellCheck={false}
                className="min-h-[120px] font-mono text-xs xl:min-h-[150px]"
              />
              <InputDiagnosticsPanel diagnostics={diagnostics} />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowInputSettings((v) => !v)}
                  title={showInputSettings ? "入力設定を隠す" : "入力設定を表示"}
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only">{showInputSettings ? "入力設定を隠す" : "入力設定を表示"}</span>
                </Button>
              </div>
              {showInputSettings && (
                <div className="grid gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1fr)_minmax(220px,0.8fr)]">
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
                  <div className="grid gap-2">
                    <label className="flex items-center gap-2 text-sm"><Switch checked={hasHeader} onCheckedChange={setHasHeader} /> ヘッダー行あり</label>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={cleanInput} onCheckedChange={setCleanInput} /> 入力を正規化</label>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={booktabs} onCheckedChange={setBooktabs} /> booktabs 表</label>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <div
          role="separator"
          aria-label="入力データと作業エリアの高さを調整"
          aria-orientation="horizontal"
          aria-valuemin={90}
          aria-valuemax={520}
          aria-valuenow={showInput ? inputHeight : 0}
          tabIndex={0}
          onPointerDown={startInputResize}
          onPointerMove={resizeInput}
          onPointerUp={stopInputResize}
          onPointerCancel={stopInputResize}
          onKeyDown={resizeInputWithKeyboard}
          className={`flex h-5 cursor-row-resize touch-none items-center justify-center rounded-md transition-colors ${
            isInputResizing ? "bg-primary/15" : "hover:bg-accent"
          }`}
          title="下にドラッグして入力欄を表示、上下にドラッグして高さを調整"
        >
          <span className="h-1 w-full max-w-5xl rounded-full bg-border" />
        </div>

        <div
          ref={splitRef}
          className="grid gap-4 xl:[grid-template-columns:minmax(460px,var(--result-width))_0.75rem_minmax(360px,var(--pdf-width))]"
          style={{
            "--result-width": `${resultWidth}%`,
            "--pdf-width": `${100 - resultWidth}%`,
          } as CSSProperties}
        >
        <Card>
          <CardHeader>
            <CardTitle>変換結果</CardTitle>
            <CardDescription>生成コードは編集できます。PDF プレビューには編集後の内容を使います。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CsvActions value={csvOut} />
            <Tabs defaultValue="latex">
              <TabsList className="flex w-full justify-start overflow-x-auto">
                <TabsTrigger value="latex">table.tex</TabsTrigger>
                <TabsTrigger value="tikz">plot.pgfplots</TabsTrigger>
              </TabsList>
              <TabsContent value="latex" className="space-y-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button size="icon" onClick={() => requestPreview("latex")} disabled={cooldown > 0 || !latexOut.trim()} title="表PDFを作成">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">表PDFを作成</span>
                  </Button>
                  <CopyButton value={latexOut} label="table.texをコピー" />
                  {cooldown > 0 && <span className="text-muted-foreground self-center text-sm">次の送信まで {cooldown} 秒</span>}
                </div>
                <OutputArea kind="latex" value={latexOut} onChange={setLatexOut} rows={13} showCopy={false} />
              </TabsContent>
              <TabsContent value="tikz" className="space-y-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => setShowTikzSettings((v) => !v)}
                    title={showTikzSettings ? "簡易設定を隠す" : "簡易設定を表示"}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">{showTikzSettings ? "簡易設定を隠す" : "簡易設定を表示"}</span>
                  </Button>
                  <Button size="icon" onClick={() => requestPreview("tikz")} disabled={cooldown > 0 || !tikzOut.trim()} title="グラフPDFを作成">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">グラフPDFを作成</span>
                  </Button>
                  <CopyButton value={tikzOut} label="plot.pgfplotsをコピー" />
                  {cooldown > 0 && <span className="text-muted-foreground self-center text-sm">次の送信まで {cooldown} 秒</span>}
                </div>
                {showTikzSettings && (
                  <div className="space-y-3">
                    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor="fn">ファイル名</Label>
                        <Input id="fn" value={filename} onChange={(e) => setFilename(e.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor="fig">図番号</Label>
                        <Input id="fig" type="number" min={1} placeholder="自動" value={figureNumber} onChange={(e) => setFigureNumber(e.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label>凡例位置</Label>
                        <Select value={legendPos} onValueChange={setLegendPos}>
                          <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LEGEND_POS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label>軸スケール</Label>
                        <Select value={scaleMode} onValueChange={setScaleMode}>
                          <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">線形</SelectItem>
                            <SelectItem value="semilog">片対数</SelectItem>
                            <SelectItem value="loglog">両対数</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label>近似</Label>
                        <Select value={fitMethod} onValueChange={setFitMethod}>
                          <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
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
                    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor="xlabel">x軸ラベル</Label>
                        <Input id="xlabel" value={xLabel} onChange={(e) => setXLabel(e.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor="ylabel">y軸ラベル</Label>
                        <Input id="ylabel" value={yLabel} onChange={(e) => setYLabel(e.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor="caption">キャプション</Label>
                        <Input id="caption" value={graphCaption} onChange={(e) => setGraphCaption(e.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor="label">ラベル</Label>
                        <Input id="label" value={graphLabel} onChange={(e) => setGraphLabel(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
                <OutputArea kind="tikz" value={tikzOut} onChange={setTikzOut} rows={13} showCopy={false} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div
          role="separator"
          aria-label="変換結果とPDFプレビューの幅を調整"
          aria-orientation="vertical"
          aria-valuemin={35}
          aria-valuemax={75}
          aria-valuenow={resultWidth}
          tabIndex={0}
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={stopResize}
          onPointerCancel={stopResize}
          onKeyDown={resizeWithKeyboard}
          className={`hidden cursor-col-resize touch-none items-stretch justify-center rounded-md transition-colors xl:flex ${
            isResizing ? "bg-primary/15" : "hover:bg-accent"
          }`}
          title="左右にドラッグして幅を調整"
        >
          <span className="my-4 w-1 rounded-full bg-border" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>PDF プレビュー</CardTitle>
            <CardDescription>左の生成コードを texlive.net で PDF にします。</CardDescription>
          </CardHeader>
          <CardContent>
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

function CsvActions({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([value], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "table.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
      <span className="mr-1 font-medium">CSV</span>
      <div className="flex flex-wrap gap-2">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copy} disabled={!value} title={copied ? "コピー済み" : "CSVをコピー"}>
          <Copy className="h-3.5 w-3.5" />
          <span className="sr-only">{copied ? "コピー済み" : "CSVをコピー"}</span>
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={download} disabled={!value} title="CSVをダウンロード">
          <Download className="h-3.5 w-3.5" />
          <span className="sr-only">CSVをダウンロード</span>
        </Button>
      </div>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button size="icon" variant="secondary" onClick={copy} disabled={!value} title={copied ? "コピー済み" : label}>
      <Copy className="h-4 w-4" />
      <span className="sr-only">{copied ? "コピー済み" : label}</span>
    </Button>
  )
}

function InputDiagnosticsPanel({ diagnostics }: { diagnostics: InputDiagnostics }) {
  if (diagnostics.warnings.length === 0) return null

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <ul className="list-disc space-y-1 pl-5">
        {diagnostics.warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  )
}

function OutputArea({
  kind,
  value,
  onChange,
  rows,
  showCopy = true,
}: {
  kind: CodeKind
  value: string
  onChange: (value: string) => void
  rows: number
  showCopy?: boolean
}) {
  return (
    <div className="space-y-2">
      {showCopy && (
        <div className="flex justify-end">
          <CopyButton value={value} label="コードをコピー" />
        </div>
      )}
      <CodeAssistEditor
        kind={kind}
        value={value}
        onChange={onChange}
        minHeight={rows * 21}
      />
    </div>
  )
}
