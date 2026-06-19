export type DocsArticleDraft = {
  title: string
  slug: string
  description: string
  body: string
}

export const EMPTY_DOCS_DRAFT: DocsArticleDraft = {
  title: "",
  slug: "",
  description: "",
  body: "## 概要\n\nここに記事本文を書きます。\n",
}

export const DOCS_SNIPPETS = [
  { label: "見出し", value: "\n## 見出し\n\n本文を入力します。\n" },
  { label: "インライン数式", value: "$E = mc^2$" },
  { label: "別行数式", value: "\n$$\ny = ax^2 + bx + c\n$$\n" },
  { label: "LaTeXコード", value: "\n```latex\n\\\\begin{table}\n  % code\n\\\\end{table}\n```\n" },
] as const

export function isValidDocsSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function buildMdxDocument(draft: DocsArticleDraft) {
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(draft.title.trim())}`,
    `description: ${JSON.stringify(draft.description.trim())}`,
    "---",
  ].join("\n")
  return `${frontmatter}\n\n${draft.body.trim()}\n`
}

function parseFrontmatterValue(frontmatter: string, key: string): string {
  const line = frontmatter.split(/\r?\n/).find((item) => item.startsWith(`${key}:`))
  if (!line) return ""
  const value = line.slice(key.length + 1).trim()
  try {
    const parsed = JSON.parse(value) as unknown
    return typeof parsed === "string" ? parsed : value
  } catch {
    return value.replace(/^['"]|['"]$/g, "")
  }
}

export function parseMdxDocument(slug: string, content: string): DocsArticleDraft {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) throw new Error("記事のfrontmatterを読み取れませんでした。")
  return {
    slug,
    title: parseFrontmatterValue(match[1], "title"),
    description: parseFrontmatterValue(match[1], "description"),
    body: match[2].trim(),
  }
}

export function validateDocsDraft(draft: DocsArticleDraft): string | null {
  if (!draft.title.trim()) return "タイトルを入力してください。"
  if (!isValidDocsSlug(draft.slug)) return "slugは半角英小文字・数字・ハイフンで入力してください。"
  if (!draft.description.trim()) return "概要を入力してください。"
  if (!draft.body.trim()) return "本文を入力してください。"
  return null
}
