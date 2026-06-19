import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import "katex/dist/katex.min.css"

import { DocsComponentInserter } from "@/components/docs/DocsComponentInserter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  buildMdxDocument,
  DOCS_SNIPPETS,
  EMPTY_DOCS_DRAFT,
  parseMdxDocument,
  type DocsArticleDraft,
  validateDocsDraft,
} from "@/lib/mdx-document"

const STORAGE_KEY = "convertexcel:docs-draft"

type PublishState = "idle" | "publishing" | "success" | "error"
type PublishedArticle = { slug: string; sha?: string; url?: string }

function loadDraft(): DocsArticleDraft {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return EMPTY_DOCS_DRAFT
    const value = JSON.parse(saved) as Partial<DocsArticleDraft>
    return {
      title: typeof value.title === "string" ? value.title : "",
      slug: typeof value.slug === "string" ? value.slug : "",
      description: typeof value.description === "string" ? value.description : "",
      body: typeof value.body === "string" ? value.body : EMPTY_DOCS_DRAFT.body,
    }
  } catch {
    return EMPTY_DOCS_DRAFT
  }
}

export default function DocsAdminPage() {
  const [draft, setDraft] = useState<DocsArticleDraft>(loadDraft)
  const [adminToken, setAdminToken] = useState("")
  const [message, setMessage] = useState("下書きはこのブラウザへ自動保存されます。")
  const [publishState, setPublishState] = useState<PublishState>("idle")
  const [articles, setArticles] = useState<PublishedArticle[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const mdx = useMemo(() => buildMdxDocument(draft), [draft])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  function update<K extends keyof DocsArticleDraft>(key: K, value: DocsArticleDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setPublishState("idle")
  }

  function insertSnippet(value: string) {
    const textarea = bodyRef.current
    const start = textarea?.selectionStart ?? draft.body.length
    const end = textarea?.selectionEnd ?? start
    update("body", `${draft.body.slice(0, start)}${value}${draft.body.slice(end)}`)
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(start + value.length, start + value.length)
    })
  }

  function authorizationHeaders() {
    return { Authorization: `Bearer ${adminToken}` }
  }

  function startNewArticle() {
    setDraft({ ...EMPTY_DOCS_DRAFT })
    setSelectedSlug(null)
    setPublishState("idle")
    setMessage("新しい記事を作成します。")
  }

  async function loadArticles(showMessage = true) {
    if (!adminToken) {
      setMessage("公開用トークンを入力してください。")
      return
    }
    setArticlesLoading(true)
    try {
      const response = await fetch("/api/admin/docs", { headers: authorizationHeaders() })
      const result = await response.json() as { ok?: boolean; error?: string; articles?: PublishedArticle[] }
      if (!response.ok || !result.ok || !Array.isArray(result.articles)) throw new Error(result.error || "記事一覧の取得に失敗しました。")
      setArticles(result.articles)
      if (showMessage) setMessage(`${result.articles.length}件の公開中の記事を取得しました。`)
    } catch (errorValue) {
      setMessage(errorValue instanceof Error ? errorValue.message : "記事一覧の取得に失敗しました。")
    } finally {
      setArticlesLoading(false)
    }
  }

  async function editArticle(slug: string) {
    if (!adminToken) return setMessage("公開用トークンを入力してください。")
    setMessage(`${slug}.mdx を読み込んでいます…`)
    try {
      const response = await fetch(`/api/admin/docs/${encodeURIComponent(slug)}`, { headers: authorizationHeaders() })
      const result = await response.json() as { ok?: boolean; error?: string; article?: { slug?: string; content?: string } }
      if (!response.ok || !result.ok || typeof result.article?.content !== "string") throw new Error(result.error || "記事の取得に失敗しました。")
      setDraft(parseMdxDocument(slug, result.article.content))
      setSelectedSlug(slug)
      setPublishState("idle")
      setMessage(`${slug}.mdx を編集中です。「GitHubへ公開」で上書きできます。`)
    } catch (errorValue) {
      setMessage(errorValue instanceof Error ? errorValue.message : "記事の取得に失敗しました。")
    }
  }

  async function deleteArticle(slug: string) {
    if (!adminToken) return setMessage("公開用トークンを入力してください。")
    if (!window.confirm(`「${slug}」を削除しますか？\nGitHubへ削除コミットが作成されます。`)) return
    setDeletingSlug(slug)
    setMessage(`${slug}.mdx を削除しています…`)
    try {
      const response = await fetch(`/api/admin/docs/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: authorizationHeaders(),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error || "記事の削除に失敗しました。")
      setArticles((current) => current.filter((article) => article.slug !== slug))
      if (selectedSlug === slug) startNewArticle()
      setMessage(`${slug}.mdx を削除しました。Docsの再ビルド後に反映されます。`)
    } catch (errorValue) {
      setMessage(errorValue instanceof Error ? errorValue.message : "記事の削除に失敗しました。")
    } finally {
      setDeletingSlug(null)
    }
  }

  function downloadMdx() {
    const error = validateDocsDraft(draft)
    if (error) return setMessage(error)
    const url = URL.createObjectURL(new Blob([mdx], { type: "text/mdx;charset=utf-8" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${draft.slug}.mdx`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage(`${draft.slug}.mdx を生成しました。`)
  }

  async function publish() {
    const error = validateDocsDraft(draft)
    if (error) return setMessage(error)
    if (!adminToken) return setMessage("公開用トークンを入力してください。")

    setPublishState("publishing")
    setMessage("GitHubへ保存しています…")
    try {
      const response = await fetch("/api/admin/docs/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ slug: draft.slug, title: draft.title, content: mdx }),
      })
      const result = await response.json() as { ok?: boolean; error?: string; url?: string }
      if (!response.ok || !result.ok) throw new Error(result.error || "公開に失敗しました。")
      setPublishState("success")
      setMessage("MDXをGitHubへ保存しました。Docsの再ビルド後に公開されます。")
      setSelectedSlug(draft.slug)
      await loadArticles(false)
    } catch (errorValue) {
      setPublishState("error")
      setMessage(errorValue instanceof Error ? errorValue.message : "公開に失敗しました。")
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Admin / Docs</p>
          <h1 className="text-2xl font-semibold tracking-tight">MDX記事エディタ</h1>
          <p className="text-muted-foreground mt-1 text-sm">Fumadocs用の記事、数式、コード例を作成します。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadMdx}>MDXをダウンロード</Button>
          <Button onClick={publish} disabled={publishState === "publishing"}>
            {publishState === "publishing" ? "公開中…" : "GitHubへ公開"}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>公開中の記事</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">GitHub上のMDXを読み込み、編集または削除します。</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={startNewArticle}>新規作成</Button>
            <Button type="button" variant="outline" onClick={() => void loadArticles()} disabled={articlesLoading}>
              {articlesLoading ? "取得中…" : "一覧を取得"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <p className="text-muted-foreground text-sm">公開用トークンを入力して「一覧を取得」を押してください。</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <div key={article.slug} className={`flex items-center justify-between gap-3 rounded-md border p-3 ${selectedSlug === article.slug ? "border-primary bg-muted/50" : ""}`}>
                  <span className="min-w-0 truncate font-mono text-sm" title={article.slug}>{article.slug}</span>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void editArticle(article.slug)}>編集</Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => void deleteArticle(article.slug)} disabled={deletingSlug === article.slug}>
                      {deletingSlug === article.slug ? "削除中…" : "削除"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="docs-title">タイトル</Label>
            <Input id="docs-title" value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="ExcelからLaTeX表を作る" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docs-slug">slug</Label>
            <Input id="docs-slug" value={draft.slug} onChange={(event) => update("slug", event.target.value.toLowerCase())} placeholder="excel-to-latex" disabled={selectedSlug !== null} />
            {selectedSlug && <p className="text-muted-foreground text-xs">既存記事のslugは変更できません。</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="docs-token">公開用トークン</Label>
            <Input id="docs-token" type="password" autoComplete="off" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Worker Secret" />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-4">
            <Label htmlFor="docs-description">概要</Label>
            <Input id="docs-description" value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder="検索結果と記事冒頭に表示される説明" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="space-y-3">
            <CardTitle>本文</CardTitle>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Fumadocs Components</p>
              <DocsComponentInserter onInsert={insertSnippet} />
            </div>
            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium">Markdown・数式</p>
            <div className="flex flex-wrap gap-2">
              {DOCS_SNIPPETS.map((snippet) => (
                <Button key={snippet.label} type="button" variant="outline" size="sm" onClick={() => insertSnippet(snippet.value)}>{snippet.label}</Button>
              ))}
            </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea ref={bodyRef} value={draft.body} onChange={(event) => update("body", event.target.value)} className="min-h-[620px] resize-y font-mono text-sm leading-6" spellCheck={false} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader><CardTitle>Markdown・数式プレビュー</CardTitle></CardHeader>
          <CardContent>
            <article className="prose prose-neutral dark:prose-invert max-w-none overflow-x-auto text-sm leading-7">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{draft.body}</ReactMarkdown>
            </article>
            <p className="text-muted-foreground mt-6 border-t pt-4 text-xs">Markdownと数式はここで確認できます。Fumadocs Componentsの最終表示は公開画面で確認してください。</p>
          </CardContent>
        </Card>
      </div>

      <p className={`text-sm ${publishState === "error" ? "text-destructive" : "text-muted-foreground"}`} role="status">{message}</p>
    </div>
  )
}
