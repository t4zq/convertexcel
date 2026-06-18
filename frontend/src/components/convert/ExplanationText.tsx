import { Fragment, type ReactNode } from "react"

// LLM が返す解説テキストを軽く整形して表示する。依存を増やさないため本格的な Markdown
// パーサは使わず、LaTeX 解説で実際に出てくる範囲（コードブロック・インラインコード・
// 太字・箇条書き）だけを自前で処理する。

const FENCE = /```[a-zA-Z0-9-]*\n?([\s\S]*?)```/g

// **太字** を <strong> に変換する。
function renderBold(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={`${keyPrefix}-b${i}`}>{part}</Fragment>
  })
}

// `インラインコード` を <code> に、それ以外は太字処理に回す。
function renderInline(text: string, keyPrefix: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={`${keyPrefix}-c${i}`} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={`${keyPrefix}-t${i}`}>{renderBold(part, `${keyPrefix}-t${i}`)}</Fragment>
  })
}

const BULLET = /^\s*[-*]\s+/
const ORDERED = /^\s*\d+\.\s+/

// 空行区切りで段落に分け、箇条書きブロックは <ul>/<ol> に、それ以外は <p> にする。
function renderProse(text: string, keyPrefix: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, bi) => {
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean)
      const key = `${keyPrefix}-${bi}`

      if (lines.length > 0 && lines.every((l) => BULLET.test(l))) {
        return (
          <ul key={key} className="ml-4 list-disc space-y-1 text-sm leading-relaxed text-foreground [&:not(:first-child)]:mt-2">
            {lines.map((l, li) => (
              <li key={`${key}-${li}`}>{renderInline(l.replace(BULLET, ""), `${key}-${li}`)}</li>
            ))}
          </ul>
        )
      }
      if (lines.length > 0 && lines.every((l) => ORDERED.test(l))) {
        return (
          <ol key={key} className="ml-4 list-decimal space-y-1 text-sm leading-relaxed text-foreground [&:not(:first-child)]:mt-2">
            {lines.map((l, li) => (
              <li key={`${key}-${li}`}>{renderInline(l.replace(ORDERED, ""), `${key}-${li}`)}</li>
            ))}
          </ol>
        )
      }
      return (
        <p key={key} className="whitespace-pre-wrap text-sm leading-relaxed text-foreground [&:not(:first-child)]:mt-2">
          {renderInline(block, key)}
        </p>
      )
    })
}

export function ExplanationText({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let block = 0

  FENCE.lastIndex = 0
  while ((match = FENCE.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index)
    if (before.trim()) nodes.push(<Fragment key={`pre-${block}`}>{renderProse(before, `pre-${block}`)}</Fragment>)
    nodes.push(
      <pre key={`code-${block}`} className="mt-2 overflow-x-auto rounded bg-muted px-2.5 py-2 text-xs leading-relaxed">
        <code className="font-mono">{match[1].replace(/\n$/, "")}</code>
      </pre>,
    )
    lastIndex = match.index + match[0].length
    block++
  }

  const rest = text.slice(lastIndex)
  if (rest.trim()) nodes.push(<Fragment key="rest">{renderProse(rest, "rest")}</Fragment>)

  return <div>{nodes}</div>
}
