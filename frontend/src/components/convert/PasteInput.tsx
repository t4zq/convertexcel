import { useMemo, useRef, useState } from "react"
import { Check, ClipboardPaste, Pencil, X } from "lucide-react"

import { InputAlerts } from "@/components/convert/InputAlerts"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/hooks/useI18n"
import type { InputDiagnostics } from "@/lib/input-diagnostics"

interface PasteInputProps {
  value: string
  onChange: (next: string) => void
  diagnostics: InputDiagnostics
  placeholder: string
}

// 入力テキストを改行で分割しつつ、空行を除いた行の「生インデックス」を返す。
// 診断（input-diagnostics）は空行を除外した順序で line 番号を振るため、
// この対応表があれば診断 line → 生テキストの該当行へ正しく書き戻せる。
function useLineModel(value: string) {
  return useMemo(() => {
    const rawLines = value.replace(/\r\n?/g, "\n").split("\n")
    const nonEmptyRawIndex = rawLines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim() !== "")
      .map(({ index }) => index)
    return { rawLines, nonEmptyRawIndex }
  }, [value])
}

export function PasteInput({ value, onChange, diagnostics, placeholder }: PasteInputProps) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const justPasted = useRef(false)

  const isEmpty = value.trim() === ""
  // 空のときは貼り付け先が必要なので必ず textarea。中身があり編集中でなければサマリに畳む。
  const showTextarea = editing || isEmpty

  const { rawLines, nonEmptyRawIndex } = useLineModel(value)

  // 行に紐づくエラー/警告だけを、行番号ごとにまとめる（修正対象の行を1つずつ出す）。
  const errorLines = useMemo(() => {
    const byLine = new Map<number, string[]>()
    for (const p of diagnostics.problems ?? []) {
      if (p.line == null || (p.severity !== "error" && p.severity !== "warning")) continue
      const messages = byLine.get(p.line) ?? []
      messages.push(t.diagnostics.messages[p.code as keyof typeof t.diagnostics.messages] ?? p.message)
      byLine.set(p.line, messages)
    }
    return [...byLine.entries()]
      .map(([line, messages]) => ({ line, rawIndex: nonEmptyRawIndex[line - 1], messages }))
      .filter((entry) => entry.rawIndex != null)
      .sort((a, b) => a.line - b.line)
  }, [diagnostics.problems, nonEmptyRawIndex, t.diagnostics])

  const setRawLine = (rawIndex: number, next: string) => {
    const lines = [...rawLines]
    lines[rawIndex] = next
    onChange(lines.join("\n"))
  }

  const handleChange = (next: string) => {
    onChange(next)
    if (justPasted.current) {
      justPasted.current = false
      setEditing(false)
    }
  }

  return (
    <div className="space-y-3">
      {showTextarea ? (
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={() => {
              justPasted.current = true
            }}
            placeholder={placeholder}
            spellCheck={false}
            className="field-sizing-fixed h-40 max-h-72 resize-y overflow-auto font-mono text-xs"
          />
          {!isEmpty && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Check className="h-3.5 w-3.5" />
                {t.convert.pasteDone}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
          <span className="inline-flex items-center gap-2 text-sm text-foreground/90">
            <ClipboardPaste className="h-4 w-4 shrink-0 text-success" />
            {t.convert.pasteSummary(diagnostics.rowCount, diagnostics.maxCols)}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t.convert.pasteEdit}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("")
                setEditing(false)
              }}
              title={t.convert.pasteClear}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <InputAlerts diagnostics={diagnostics} />

      {errorLines.length > 0 && (
        <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground/80">{t.convert.fixErrorLines}</p>
          <ul className="space-y-1.5">
            {errorLines.map(({ line, rawIndex, messages }) => (
              <li key={line} className="flex items-center gap-2">
                <span className="w-16 shrink-0 whitespace-nowrap text-right font-mono text-xs text-info/80">
                  {t.diagnostics.line(line)}
                </span>
                <input
                  type="text"
                  value={rawLines[rawIndex]}
                  onChange={(e) => setRawLine(rawIndex, e.target.value)}
                  spellCheck={false}
                  aria-label={`${t.diagnostics.line(line)}: ${messages.join(" / ")}`}
                  title={messages.join("\n")}
                  className="h-7 flex-1 rounded border border-input bg-background px-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
