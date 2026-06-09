import { useEffect, useMemo, useRef } from "react"
import { autocompletion, closeBrackets, type CompletionContext } from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands"
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldService,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language"
import { StreamLanguage } from "@codemirror/language"
import { stex } from "@codemirror/legacy-modes/mode/stex"
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search"
import { EditorState, type Extension } from "@codemirror/state"
import { tags as t } from "@lezer/highlight"
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view"

type CodeKind = "latex" | "csv" | "tikz"

interface EnvironmentToken {
  env: string
  type: "begin" | "end"
}

interface CodeAssistEditorProps {
  kind: CodeKind
  value: string
  onChange: (value: string) => void
  minHeight?: number
}

const LATEX_COMMANDS = [
  { label: "\\begin{table}", apply: "\\begin{table}[H]\n  \\centering\n  \n  \\caption{}\n  \\label{tab:}\n\\end{table}", detail: "表環境" },
  { label: "\\caption{}", apply: "\\caption{}", detail: "キャプション" },
  { label: "\\label{}", apply: "\\label{}", detail: "参照ラベル" },
  { label: "\\ref{}", apply: "\\ref{}", detail: "相互参照" },
  { label: "\\toprule", apply: "\\toprule", detail: "booktabs" },
  { label: "\\midrule", apply: "\\midrule", detail: "booktabs" },
  { label: "\\bottomrule", apply: "\\bottomrule", detail: "booktabs" },
  { label: "\\multicolumn{}{}{}", apply: "\\multicolumn{2}{c}{}", detail: "列結合" },
  { label: "\\si{}", apply: "\\si{}", detail: "単位" },
]

const TIKZ_COMMANDS = [
  ...LATEX_COMMANDS.filter((item) => ["\\caption{}", "\\label{}", "\\ref{}"].includes(item.label)),
  { label: "\\begin{figure}", apply: "\\begin{figure}[H]\n  \\centering\n  \n  \\caption{}\n  \\label{fig:}\n\\end{figure}", detail: "図環境" },
  { label: "\\begin{tikzpicture}", apply: "\\begin{tikzpicture}\n  \n\\end{tikzpicture}", detail: "TikZ 図" },
  { label: "\\begin{axis}", apply: "\\begin{axis}[\n  xlabel={},\n  ylabel={},\n  grid=major,\n]\n  \n\\end{axis}", detail: "PGFPlots 軸" },
  { label: "\\addplot table", apply: "\\addplot table[x=, y=] {data.csv};", detail: "CSV プロット" },
  { label: "\\addlegendentry{}", apply: "\\addlegendentry{}", detail: "凡例項目" },
  { label: "\\legend{}", apply: "\\legend{}", detail: "凡例" },
]

const PGFPLOTS_OPTIONS = [
  { label: "xlabel={}", apply: "xlabel={}", detail: "x 軸ラベル" },
  { label: "ylabel={}", apply: "ylabel={}", detail: "y 軸ラベル" },
  { label: "title={}", apply: "title={}", detail: "グラフタイトル" },
  { label: "grid=major", apply: "grid=major", detail: "主目盛グリッド" },
  { label: "legend pos=", apply: "legend pos=north west", detail: "凡例位置" },
  { label: "xmin=", apply: "xmin=", detail: "x 最小値" },
  { label: "xmax=", apply: "xmax=", detail: "x 最大値" },
  { label: "ymin=", apply: "ymin=", detail: "y 最小値" },
  { label: "ymax=", apply: "ymax=", detail: "y 最大値" },
  { label: "mark=", apply: "mark=*", detail: "プロット記号" },
  { label: "smooth", apply: "smooth", detail: "曲線化" },
]

const texHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#1d4ed8", fontWeight: "600" },
  { tag: t.controlKeyword, color: "#1d4ed8", fontWeight: "600" },
  { tag: t.atom, color: "#0f766e" },
  { tag: t.name, color: "#0f766e" },
  { tag: t.variableName, color: "#047857" },
  { tag: t.propertyName, color: "#9333ea" },
  { tag: t.number, color: "#b45309" },
  { tag: t.string, color: "#be123c" },
  { tag: t.escape, color: "#0369a1", fontWeight: "600" },
  { tag: t.operator, color: "#475569" },
  { tag: t.punctuation, color: "#64748b" },
  { tag: t.bracket, color: "#334155" },
  { tag: t.comment, color: "#64748b", fontStyle: "italic" },
  { tag: t.invalid, color: "#dc2626", textDecoration: "underline" },
])

function environmentToken(line: string): EnvironmentToken | null {
  const match = line.match(/\\(begin|end)\s*\{([^{}]+)\}/)
  if (!match) return null
  return {
    type: match[1] === "begin" ? "begin" : "end",
    env: match[2],
  }
}

const texEnvironmentFolding = foldService.of((state, lineStart, lineEnd) => {
  const doc = state.doc
  const startLine = doc.lineAt(lineStart)
  const token = environmentToken(startLine.text)

  if (!token || token.type !== "begin") return null

  let depth = 0
  for (let lineNumber = startLine.number; lineNumber <= doc.lines; lineNumber += 1) {
    const line = doc.line(lineNumber)
    const next = environmentToken(line.text)
    if (!next || next.env !== token.env) continue

    if (next.type === "begin") depth += 1
    if (next.type === "end") depth -= 1

    if (depth === 0 && lineNumber > startLine.number) {
      const from = lineEnd
      const to = line.from
      return from < to ? { from, to } : null
    }
  }

  return null
})

function codeCompletions(kind: CodeKind) {
  return (context: CompletionContext) => {
    if (kind === "csv") return null

    const slash = context.matchBefore(/\\[A-Za-z]*/)
    if (slash) {
      const options = (kind === "tikz" ? TIKZ_COMMANDS : LATEX_COMMANDS).map((item) => ({
        ...item,
        type: "function",
      }))
      return {
        from: slash.from,
        options,
        validFor: /^\\[A-Za-z]*$/,
      }
    }

    if (kind === "tikz") {
      const option = context.matchBefore(/[A-Za-z][A-Za-z -]*=?/)
      const line = context.state.doc.lineAt(context.pos).text
      if (option && /\[[^\]]*$/.test(line.slice(0, option.from))) {
        return {
          from: option.from,
          options: PGFPLOTS_OPTIONS.map((item) => ({ ...item, type: "property" })),
          validFor: /^[A-Za-z][A-Za-z -]*=?$/,
        }
      }
    }

    return null
  }
}

export function CodeAssistEditor({
  kind,
  value,
  onChange,
  minHeight = 260,
}: CodeAssistEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)

  onChangeRef.current = onChange
  valueRef.current = value

  const extensions = useMemo<Extension[]>(() => [
    lineNumbers(),
    foldGutter(),
    history(),
    highlightSelectionMatches(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    kind === "csv" ? [] : StreamLanguage.define(stex),
    kind === "csv" ? [] : texEnvironmentFolding,
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    syntaxHighlighting(texHighlightStyle),
    autocompletion({
      activateOnTyping: true,
      closeOnBlur: false,
      override: [codeCompletions(kind)],
    }),
    keymap.of([
      indentWithTab,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
    ]),
    EditorView.lineWrapping,
    EditorView.theme({
      "&": {
        minHeight: `${minHeight}px`,
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        fontSize: "12px",
      },
      ".cm-content": {
        minHeight: `${minHeight}px`,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      ".cm-scroller": {
        minHeight: `${minHeight}px`,
      },
      ".cm-gutters": {
        backgroundColor: "var(--muted)",
        color: "var(--muted-foreground)",
        borderRight: "1px solid var(--border)",
      },
      ".cm-activeLineGutter, .cm-activeLine": {
        backgroundColor: "var(--accent)",
      },
      ".cm-tooltip-autocomplete": {
        borderRadius: "0.375rem",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
        overflow: "hidden",
      },
    }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      const next = update.state.doc.toString()
      valueRef.current = next
      onChangeRef.current(next)
    }),
  ], [kind, minHeight])

  useEffect(() => {
    if (!hostRef.current) return
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions,
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [extensions])

  useEffect(() => {
    const view = viewRef.current
    if (!view || value === view.state.doc.toString()) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    })
  }, [value])

  return <div ref={hostRef} />
}
