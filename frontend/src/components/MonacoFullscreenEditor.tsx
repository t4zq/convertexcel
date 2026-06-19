import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Editor, { DiffEditor, loader, type BeforeMount, type DiffOnMount, type OnMount } from "@monaco-editor/react"
import { FileCode2, Minimize2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js"
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"

import type { CodeAssistKind, OriginRect } from "@/components/convert/panels"
import { Button } from "@/components/ui/button"
import type { TexLogError } from "@/lib/texlive-log"

type MonacoGlobal = typeof globalThis & {
  MonacoEnvironment?: {
    getWorker: (_moduleId: string, _label: string) => Worker
  }
}

// @monaco-editor/react otherwise uses its CDN loader. Supplying the bundled
// ESM build and worker keeps every Monaco request on this site's origin.
;(globalThis as MonacoGlobal).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}
loader.config({ monaco })

const languageIds: Record<CodeAssistKind, string> = {
  latex: "convertexcel-latex",
  tikz: "convertexcel-tikz",
  gnuplot: "convertexcel-gnuplot",
}

const latexCommands = [
  ["begin", "\\\\begin{${1:environment}}\n\t$0\n\\\\end{${1:environment}}", "environment"],
  ["frac", "\\\\frac{${1:numerator}}{${2:denominator}}", "fraction"],
  ["caption", "\\\\caption{${1:caption}}", "caption"],
  ["label", "\\\\label{${1:label}}", "cross-reference label"],
  ["ref", "\\\\ref{${1:label}}", "cross-reference"],
  ["si", "\\\\si{${1:unit}}", "siunitx unit"],
  ["toprule", "\\\\toprule", "booktabs rule"],
  ["midrule", "\\\\midrule", "booktabs rule"],
  ["bottomrule", "\\\\bottomrule", "booktabs rule"],
] as const

const tikzCommands = [
  ["tikzpicture", "\\\\begin{tikzpicture}\n\t$0\n\\\\end{tikzpicture}", "TikZ picture"],
  ["axis", "\\\\begin{axis}[\n\txlabel={${1:x}},\n\tylabel={${2:y}},\n\tgrid=major,\n]\n\t$0\n\\\\end{axis}", "PGFPlots axis"],
  ["addplot", "\\\\addplot table[x=${1:x}, y=${2:y}] {${3:data.csv}};", "PGFPlots data series"],
  ["addlegendentry", "\\\\addlegendentry{${1:label}}", "legend entry"],
  ["draw", "\\\\draw (${1:0,0}) -- (${2:1,1});", "TikZ path"],
] as const

const gnuplotCommands = [
  ["plot", "plot ${1:'data.csv'} using ${2:1:2} with ${3:linespoints} title '${4:series}'", "plot data"],
  ["set xlabel", "set xlabel \"${1:x label}\"", "x-axis label"],
  ["set ylabel", "set ylabel \"${1:y label}\"", "y-axis label"],
  ["set title", "set title \"${1:title}\"", "plot title"],
  ["set grid", "set grid", "show grid"],
  ["set logscale", "set logscale ${1:xy}", "logarithmic axis"],
  ["set key", "set key ${1:left top}", "legend position"],
  ["fit", "fit ${1:f(x)} ${2:'data.csv'} using ${3:1:2} via ${4:a,b}", "fit model"],
] as const

const commandDocs: Record<string, string> = {
  begin: "環境を開始します。対応する \\end が必要です。",
  end: "現在のLaTeX環境を終了します。",
  frac: "2つの引数を分数として組版します。",
  caption: "表または図のキャプションを設定します。",
  label: "相互参照に使うラベルを定義します。",
  ref: "\\label で定義した位置を参照します。",
  si: "siunitx形式で単位を組版します。",
  addplot: "PGFPlotsのデータ系列を追加します。",
  addlegendentry: "直前の系列に凡例を追加します。",
  draw: "TikZのパスを描画します。",
}

function formatSource(source: string, kind: CodeAssistKind) {
  if (kind === "gnuplot") return source.split("\n").map((line) => line.trimEnd()).join("\n")

  let depth = 0
  return source.split("\n").map((line) => {
    const text = line.trim()
    if (/^\\end\{/.test(text)) depth = Math.max(0, depth - 1)
    const formatted = text ? `${"  ".repeat(depth)}${text}` : ""
    const begins = (text.match(/\\begin\{/g) ?? []).length
    const ends = (text.match(/\\end\{/g) ?? []).length
    depth = Math.max(0, depth + begins - ends - (/^\\end\{/.test(text) ? -1 : 0))
    return formatted
  }).join("\n")
}

function syntaxMarkers(model: monaco.editor.ITextModel, kind: CodeAssistKind): monaco.editor.IMarkerData[] {
  if (kind === "gnuplot") return []
  const markers: monaco.editor.IMarkerData[] = []
  const environments: Array<{ name: string; line: number; column: number }> = []
  let braceBalance = 0

  for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber += 1) {
    const raw = model.getLineContent(lineNumber)
    const line = raw.replace(/(?<!\\)%.*/, "")
    for (let index = 0; index < line.length; index += 1) {
      if (line[index] === "\\") {
        index += 1
        continue
      }
      if (line[index] === "{") braceBalance += 1
      if (line[index] === "}") {
        braceBalance -= 1
        if (braceBalance < 0) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: "対応する開き波括弧がありません。",
            startLineNumber: lineNumber,
            endLineNumber: lineNumber,
            startColumn: index + 1,
            endColumn: index + 2,
          })
          braceBalance = 0
        }
      }
    }

    for (const match of line.matchAll(/\\(begin|end)\{([^{}]+)\}/g)) {
      const [, token, name] = match
      if (token === "begin") {
        environments.push({ name, line: lineNumber, column: (match.index ?? 0) + 1 })
      } else {
        const current = environments.at(-1)
        if (!current || current.name !== name) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: current ? `\\begin{${current.name}} に対して \\end{${name}} が使われています。` : `対応する \\begin{${name}} がありません。`,
            startLineNumber: lineNumber,
            endLineNumber: lineNumber,
            startColumn: (match.index ?? 0) + 1,
            endColumn: (match.index ?? 0) + match[0].length + 1,
          })
        } else {
          environments.pop()
        }
      }
    }
  }

  for (const environment of environments) {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: `\\end{${environment.name}} がありません。`,
      startLineNumber: environment.line,
      endLineNumber: environment.line,
      startColumn: environment.column,
      endColumn: environment.column + environment.name.length + 8,
    })
  }
  if (braceBalance > 0) {
    const line = model.getLineCount()
    markers.push({
      severity: monaco.MarkerSeverity.Warning,
      message: `閉じ波括弧が ${braceBalance} 個不足しています。`,
      startLineNumber: line,
      endLineNumber: line,
      startColumn: model.getLineMaxColumn(line) - 1,
      endColumn: model.getLineMaxColumn(line),
    })
  }
  return markers
}

let languagesRegistered = false

function registerLanguages(api: typeof monaco) {
  if (languagesRegistered) return
  languagesRegistered = true

  for (const id of Object.values(languageIds)) api.languages.register({ id })

  for (const kind of Object.keys(languageIds) as CodeAssistKind[]) {
    api.languages.setLanguageConfiguration(languageIds[kind], {
      comments: { lineComment: kind === "gnuplot" ? "#" : "%" },
      brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
      ],
    })
  }

  const latexTokenizer: monaco.languages.IMonarchLanguage = {
    defaultToken: "",
    tokenizer: {
      root: [
        [/%.*$/, "comment"],
        [/\\\\(?:begin|end)(?=\s*\{)/, "keyword"],
        [/\\\\[a-zA-Z@]+\*?/, "keyword"],
        [/\\\\./, "string.escape"],
        [/\$\$?/, { token: "delimiter", next: "@math" }],
        [/[{}[\]()]/, "delimiter.bracket"],
        [/[&_^#~]/, "operator"],
        [/\d+(?:\.\d+)?/, "number"],
      ],
      math: [
        [/%.*$/, "comment"],
        [/\\\\[a-zA-Z@]+\*?/, "keyword"],
        [/\$\$?/, { token: "delimiter", next: "@pop" }],
        [/[{}[\]()]/, "delimiter.bracket"],
        [/[+\-*/=<>_^]/, "operator"],
        [/\d+(?:\.\d+)?/, "number"],
      ],
    },
  }

  api.languages.setMonarchTokensProvider(languageIds.latex, latexTokenizer)
  api.languages.setMonarchTokensProvider(languageIds.tikz, latexTokenizer)
  api.languages.setMonarchTokensProvider(languageIds.gnuplot, {
    ignoreCase: true,
    tokenizer: {
      root: [
        [/#.*$/, "comment"],
        [/\b(?:set|unset|plot|splot|replot|fit|using|with|title|notitle|via|every|index)\b/, "keyword"],
        [/\b(?:lines|points|linespoints|errorbars|boxes|filledcurves)\b/, "type"],
        [/\b(?:sin|cos|tan|exp|log|sqrt|abs)\b(?=\s*\()/, "predefined"],
        [/[a-zA-Z_]\w*(?=\s*=)/, "variable"],
        [/-?\d+(?:\.\d+)?(?:e[+\-]?\d+)?/, "number.float"],
        [/"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'/, "string"],
        [/[+\-*/=<>]/, "operator"],
      ],
    },
  })

  const completionSets = {
    latex: latexCommands,
    tikz: [...latexCommands, ...tikzCommands],
    gnuplot: gnuplotCommands,
  } as const

  for (const kind of Object.keys(languageIds) as CodeAssistKind[]) {
    api.languages.registerCompletionItemProvider(languageIds[kind], {
      triggerCharacters: kind === "gnuplot" ? [" "] : ["\\"],
      provideCompletionItems(model, position) {
        if (kind !== "gnuplot") {
          const prefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)
          const reference = prefix.match(/\\(?:ref|pageref|autoref)\{([^{}]*)$/)
          if (reference) {
            const labels = Array.from(model.getValue().matchAll(/\\label\{([^{}]+)\}/g), (match) => match[1])
            return {
              suggestions: [...new Set(labels)].map((label) => ({
                label,
                detail: "document label",
                insertText: label,
                range: new api.Range(position.lineNumber, position.column - reference[1].length, position.lineNumber, position.column),
                kind: api.languages.CompletionItemKind.Reference,
              })),
            }
          }
        }
        const word = model.getWordUntilPosition(position)
        const line = model.getLineContent(position.lineNumber)
        const slashColumn = kind !== "gnuplot" && line[word.startColumn - 2] === "\\" ? word.startColumn - 1 : word.startColumn
        const range = new api.Range(position.lineNumber, slashColumn, position.lineNumber, word.endColumn)
        return {
          suggestions: completionSets[kind].map(([label, insertText, detail]) => ({
            label,
            detail,
            insertText,
            range,
            kind: api.languages.CompletionItemKind.Snippet,
            insertTextRules: api.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          })),
        }
      },
    })

    api.languages.registerDocumentFormattingEditProvider(languageIds[kind], {
      provideDocumentFormattingEdits(model) {
        return [{ range: model.getFullModelRange(), text: formatSource(model.getValue(), kind) }]
      },
    })
  }

  for (const kind of ["latex", "tikz"] as const) {
    api.languages.registerHoverProvider(languageIds[kind], {
      provideHover(model, position) {
        const line = model.getLineContent(position.lineNumber)
        const offset = position.column - 1
        for (const match of line.matchAll(/\\([a-zA-Z@]+)\*?/g)) {
          const start = match.index ?? 0
          const end = start + match[0].length
          if (offset < start || offset > end || !commandDocs[match[1]]) continue
          return {
            range: new api.Range(position.lineNumber, start + 1, position.lineNumber, end + 1),
            contents: [{ value: `**${match[0]}**` }, { value: commandDocs[match[1]] }],
          }
        }
        return null
      },
    })
  }
}

interface MonacoFullscreenEditorProps {
  kind: CodeAssistKind
  value: string
  onChange: (value: string) => void
  onClose: () => void
  closeLabel: string
  originalValue: string
  compileErrors?: TexLogError[]
  originRect?: OriginRect | null
}

export function MonacoFullscreenEditor({
  kind,
  value,
  onChange,
  onClose,
  closeLabel,
  originalValue,
  compileErrors = [],
  originRect = null,
}: MonacoFullscreenEditorProps) {
  const reducedMotion = useReducedMotion()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))
  const [minimap, setMinimap] = useState(true)
  const [wordWrap, setWordWrap] = useState(true)
  const [showDiff, setShowDiff] = useState(false)
  const [closing, setClosing] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const disposablesRef = useRef<monaco.IDisposable[]>([])

  // SheetEditor の全画面と同じく、エディタの箱から伸び縮みするトランジション。
  // 別エディタ(CodeMirror→Monaco)・portal をまたぐため layoutId ではなく
  // クリック時に測った矩形への transform で再現する。
  const animate = !reducedMotion && originRect != null
  const collapsed = originRect
    ? {
        x: originRect.left,
        y: originRect.top,
        scaleX: originRect.width / Math.max(1, window.innerWidth),
        scaleY: originRect.height / Math.max(1, window.innerHeight - 24),
        opacity: 0.5,
      }
    : { opacity: 0 }
  const expanded = { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 }

  const requestClose = useCallback(() => {
    if (!animate) {
      onClose()
      return
    }
    setClosing(true)
  }, [animate, onClose])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose()
    }
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    window.addEventListener("keydown", onKeyDown, true)
    return () => {
      observer.disconnect()
      window.removeEventListener("keydown", onKeyDown, true)
    }
  }, [requestClose])

  useEffect(() => () => {
    disposablesRef.current.forEach((disposable) => disposable.dispose())
    disposablesRef.current = []
  }, [])

  const beforeMount: BeforeMount = (api) => registerLanguages(api)

  const updateMarkers = useCallback((model: monaco.editor.ITextModel, includeCompiler = true) => {
    const compilerMarkers: monaco.editor.IMarkerData[] = (includeCompiler ? compileErrors : []).flatMap((error) => {
      if (error.sourceLine == null || error.sourceLine < 1 || error.sourceLine > model.getLineCount()) return []
      const endColumn = model.getLineMaxColumn(error.sourceLine)
      return [{
        severity: monaco.MarkerSeverity.Error,
        message: error.message,
        source: "texlive.net",
        startLineNumber: error.sourceLine,
        endLineNumber: error.sourceLine,
        startColumn: 1,
        endColumn,
      }]
    })
    monaco.editor.setModelMarkers(model, "convertexcel", [
      ...syntaxMarkers(model, kind),
      ...compilerMarkers,
    ])
  }, [compileErrors, kind])

  useEffect(() => {
    const model = editorRef.current?.getModel()
    if (model) updateMarkers(model)
  }, [updateMarkers])

  const attachEditor = useCallback((editor: monaco.editor.IStandaloneCodeEditor, syncValue: boolean) => {
    disposablesRef.current.forEach((disposable) => disposable.dispose())
    disposablesRef.current = []
    editorRef.current = editor
    const model = editor.getModel()
    if (!model) return

    let autoClosingEnvironment = false
    updateMarkers(model)
    disposablesRef.current.push(model.onDidChangeContent((event) => {
      // コンパイル後に編集した時点でtexlive.netの位置情報は古くなるため、
      // ローカル構文診断だけを残す。再コンパイル時に新しいマーカーが入る。
      updateMarkers(model, false)
      if (syncValue) onChange(model.getValue())

      if (kind !== "gnuplot" && !autoClosingEnvironment && event.changes.length === 1 && event.changes[0].text === "}") {
        const position = editor.getPosition()
        if (!position) return
        const beforeCursor = model.getLineContent(position.lineNumber).slice(0, position.column - 1)
        const begin = beforeCursor.match(/\\begin\{([^{}]+)\}\s*$/)
        if (!begin) return
        const tail = model.getValueInRange(new monaco.Range(position.lineNumber, position.column, model.getLineCount(), model.getLineMaxColumn(model.getLineCount())))
        if (tail.includes(`\\end{${begin[1]}}`)) return
        autoClosingEnvironment = true
        editor.executeEdits("close-latex-environment", [{
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          text: `\n  \n\\end{${begin[1]}}`,
        }])
        editor.setPosition({ lineNumber: position.lineNumber + 1, column: 3 })
        autoClosingEnvironment = false
      }
    }))

    // ツールバーの各操作にショートカットを割り当てる。addAction なので
    // キーバインドに加えて F1 コマンドパレットと右クリックメニューにも出る。
    disposablesRef.current.push(
      editor.addAction({
        id: "convertexcel.toggleMinimap",
        label: "ミニマップ表示の切り替え",
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyM],
        contextMenuGroupId: "convertexcel",
        contextMenuOrder: 1,
        run: () => setMinimap((current) => !current),
      }),
      editor.addAction({
        id: "convertexcel.toggleWordWrap",
        label: "折り返しの切り替え",
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],
        contextMenuGroupId: "convertexcel",
        contextMenuOrder: 2,
        run: () => setWordWrap((current) => !current),
      }),
      editor.addAction({
        id: "convertexcel.toggleDiff",
        label: "変更差分の切り替え",
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyD],
        contextMenuGroupId: "convertexcel",
        contextMenuOrder: 3,
        run: () => setShowDiff((current) => !current),
      }),
      editor.addAction({
        id: "convertexcel.jumpToFirstError",
        label: "最初のコンパイルエラーへ移動",
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyE],
        contextMenuGroupId: "convertexcel",
        contextMenuOrder: 4,
        run: (instance) => {
          const line = compileErrors.find((error) => error.sourceLine != null)?.sourceLine
          if (!line) return
          instance.revealLineInCenter(line)
          instance.setPosition({ lineNumber: line, column: 1 })
        },
      }),
    )

    const firstError = compileErrors.find((error) => error.sourceLine != null)?.sourceLine
    if (firstError) {
      editor.revealLineInCenter(firstError)
      editor.setPosition({ lineNumber: firstError, column: 1 })
    }
    window.setTimeout(() => editor.focus(), 0)
  }, [compileErrors, kind, onChange, updateMarkers])

  const handleMount: OnMount = useCallback((editor) => attachEditor(editor, false), [attachEditor])
  const handleDiffMount: DiffOnMount = useCallback((editor) => {
    attachEditor(editor.getModifiedEditor(), true)
  }, [attachEditor])

  const formatDocument = () => {
    void editorRef.current?.getAction("editor.action.formatDocument")?.run()
  }

  const jumpToError = () => {
    const line = compileErrors.find((error) => error.sourceLine != null)?.sourceLine
    if (!line || !editorRef.current) return
    editorRef.current.revealLineInCenter(line)
    editorRef.current.setPosition({ lineNumber: line, column: 1 })
    editorRef.current.focus()
  }

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    automaticLayout: true,
    minimap: { enabled: minimap },
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: wordWrap ? "on" : "off",
    scrollBeyondLastLine: false,
    suggestOnTriggerCharacters: true,
    formatOnPaste: true,
    formatOnType: false,
    folding: true,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    renderWhitespace: "selection",
  }

  const fileName = kind === "latex" ? "table.tex" : kind === "tikz" ? "plot.pgfplots" : "plot.gp"

  return createPortal(
    <motion.section
      style={{ transformOrigin: "0 0" }}
      initial={animate ? collapsed : false}
      animate={animate ? (closing ? collapsed : expanded) : expanded}
      transition={{ duration: animate ? 0.3 : 0, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        if (closing) onClose()
      }}
      className="fixed inset-x-0 top-0 bottom-6 z-50 flex flex-col overflow-hidden bg-background"
      aria-label={`${kind} code editor`}
    >
      {/* VSCode 風のタブバー。タブは左端に密着し、操作系は右側にまとめる。 */}
      <header className="flex min-h-[2.75rem] shrink-0 items-stretch justify-between gap-2 border-b bg-muted/40 pr-2">
        <div className="flex items-stretch">
          <div className="flex items-center gap-2 border-r border-t-2 border-t-primary bg-background px-3">
            <FileCode2 className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-medium">{fileName}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 py-1.5">
          <Button type="button" variant={minimap ? "secondary" : "ghost"} size="sm" onClick={() => setMinimap((value) => !value)} title="ミニマップ (Alt+M)">
            ミニマップ
          </Button>
          <Button type="button" variant={wordWrap ? "secondary" : "ghost"} size="sm" onClick={() => setWordWrap((value) => !value)} title="折り返し (Alt+Z)">
            折り返し
          </Button>
          <Button type="button" variant={showDiff ? "secondary" : "ghost"} size="sm" onClick={() => setShowDiff((value) => !value)} title="変更差分 (Alt+D)">
            変更差分
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={formatDocument} title="整形 (Shift+Alt+F)">
            整形
          </Button>
          {compileErrors.some((error) => error.sourceLine != null) ? (
            <Button type="button" variant="destructive" size="sm" onClick={jumpToError} title="最初のエラー (Alt+E)">
              最初のエラー
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={requestClose} title={`${closeLabel} (Esc)`} aria-label={closeLabel}>
            <motion.span
              initial={{ opacity: 0, rotate: reducedMotion ? 0 : 90, scale: reducedMotion ? 1 : 0.75 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.16 }}
            >
              <Minimize2 className="h-4 w-4" />
            </motion.span>
            <span>{closeLabel}</span>
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {showDiff ? (
          <DiffEditor
            beforeMount={beforeMount}
            onMount={handleDiffMount}
            original={originalValue}
            modified={value}
            language={languageIds[kind]}
            theme={dark ? "vs-dark" : "light"}
            keepCurrentOriginalModel
            keepCurrentModifiedModel
            options={{ ...editorOptions, originalEditable: false, renderSideBySide: true }}
          />
        ) : (
          <Editor
            beforeMount={beforeMount}
            onMount={handleMount}
            path={`convertexcel://${kind}/output`}
            language={languageIds[kind]}
            value={value}
            onChange={(next) => onChange(next ?? "")}
            saveViewState
            theme={dark ? "vs-dark" : "light"}
            options={editorOptions}
          />
        )}
      </div>
    </motion.section>,
    document.body,
  )
}
