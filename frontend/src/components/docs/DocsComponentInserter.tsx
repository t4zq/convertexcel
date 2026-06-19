import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Field = {
  key: string
  label: string
  defaultValue: string
  kind?: "input" | "textarea" | "select"
  options?: { label: string; value: string }[]
}

type ComponentDefinition = {
  id: string
  name: string
  description: string
  fields: Field[]
  build: (values: Record<string, string>) => string
}

const q = (value: string) => JSON.stringify(value.trim())
const block = (value: string) => value.trim() || "本文を入力します。"

const COMPONENTS: ComponentDefinition[] = [
  {
    id: "callout",
    name: "Callout",
    description: "補足・注意・警告を目立たせます。",
    fields: [
      { key: "type", label: "種類", defaultValue: "info", kind: "select", options: [
        { label: "情報", value: "info" }, { label: "アイデア", value: "idea" },
        { label: "成功", value: "success" }, { label: "注意", value: "warn" }, { label: "エラー", value: "error" },
      ] },
      { key: "title", label: "タイトル", defaultValue: "ポイント" },
      { key: "body", label: "本文", defaultValue: "ここに補足を書きます。", kind: "textarea" },
    ],
    build: (v) => `<Callout type=${q(v.type)} title=${q(v.title)}>\n${block(v.body)}\n</Callout>`,
  },
  {
    id: "tabs",
    name: "Tabs",
    description: "複数の例をタブで切り替えます。",
    fields: [
      { key: "firstTitle", label: "1つ目のタブ名", defaultValue: "LaTeX" },
      { key: "firstBody", label: "1つ目の内容", defaultValue: "```latex\n% LaTeX code\n```", kind: "textarea" },
      { key: "secondTitle", label: "2つ目のタブ名", defaultValue: "gnuplot" },
      { key: "secondBody", label: "2つ目の内容", defaultValue: "```gnuplot\n# gnuplot code\n```", kind: "textarea" },
    ],
    build: (v) => `<Tabs items={[${q(v.firstTitle)}, ${q(v.secondTitle)}]}>\n  <Tab value=${q(v.firstTitle)}>\n\n${block(v.firstBody)}\n\n  </Tab>\n  <Tab value=${q(v.secondTitle)}>\n\n${block(v.secondBody)}\n\n  </Tab>\n</Tabs>`,
  },
  {
    id: "cards",
    name: "Cards",
    description: "関連記事や機能へのリンクを並べます。",
    fields: [
      { key: "title", label: "カード名", defaultValue: "クイックスタート" },
      { key: "description", label: "説明", defaultValue: "基本的な使い方を確認します。" },
      { key: "href", label: "リンク先", defaultValue: "/docs/quick-start" },
    ],
    build: (v) => `<Cards>\n  <Card title=${q(v.title)} description=${q(v.description)} href=${q(v.href)} />\n</Cards>`,
  },
  {
    id: "accordions",
    name: "Accordions",
    description: "長い補足やFAQを折りたたみます。",
    fields: [
      { key: "firstTitle", label: "1つ目の見出し", defaultValue: "詳しい説明" },
      { key: "firstBody", label: "1つ目の内容", defaultValue: "ここに説明を書きます。", kind: "textarea" },
      { key: "secondTitle", label: "2つ目の見出し", defaultValue: "よくある問題" },
      { key: "secondBody", label: "2つ目の内容", defaultValue: "ここに解決方法を書きます。", kind: "textarea" },
    ],
    build: (v) => `<Accordions type="multiple">\n  <Accordion title=${q(v.firstTitle)}>\n${block(v.firstBody)}\n  </Accordion>\n  <Accordion title=${q(v.secondTitle)}>\n${block(v.secondBody)}\n  </Accordion>\n</Accordions>`,
  },
  {
    id: "steps",
    name: "Steps",
    description: "操作手順を番号付きで表示します。",
    fields: [
      { key: "firstTitle", label: "手順1の見出し", defaultValue: "データをコピーする" },
      { key: "firstBody", label: "手順1の説明", defaultValue: "Excelで範囲を選択してコピーします。", kind: "textarea" },
      { key: "secondTitle", label: "手順2の見出し", defaultValue: "貼り付ける" },
      { key: "secondBody", label: "手順2の説明", defaultValue: "変換画面へ貼り付けます。", kind: "textarea" },
    ],
    build: (v) => `<Steps>\n  <Step>\n\n### ${v.firstTitle.trim()}\n\n${block(v.firstBody)}\n\n  </Step>\n  <Step>\n\n### ${v.secondTitle.trim()}\n\n${block(v.secondBody)}\n\n  </Step>\n</Steps>`,
  },
  {
    id: "files",
    name: "Files",
    description: "ファイル構成をツリー風に表示します。",
    fields: [
      { key: "folder", label: "フォルダー名", defaultValue: "docs" },
      { key: "files", label: "ファイル名（1行に1つ）", defaultValue: "index.mdx\nmeta.json", kind: "textarea" },
    ],
    build: (v) => `<Files>\n  <Folder name=${q(v.folder)} defaultOpen>\n${v.files.split(/\r?\n/).map((name) => name.trim()).filter(Boolean).map((name) => `    <File name=${q(name)} />`).join("\n")}\n  </Folder>\n</Files>`,
  },
  {
    id: "before-after",
    name: "Before / After",
    description: "入力と出力を2列で比較します。",
    fields: [
      { key: "before", label: "入力", defaultValue: "入力例", kind: "textarea" },
      { key: "after", label: "出力", defaultValue: "出力例", kind: "textarea" },
    ],
    build: (v) => `<BeforeAfter\n  before={<pre>{${q(v.before)}}</pre>}\n  after={<pre>{${q(v.after)}}</pre>}\n/>`,
  },
  {
    id: "package-list",
    name: "Package List",
    description: "必要なLaTeXパッケージを案内します。",
    fields: [{ key: "body", label: "パッケージと説明", defaultValue: "`booktabs`と`siunitx`を使用します。", kind: "textarea" }],
    build: (v) => `<PackageList>\n${block(v.body)}\n</PackageList>`,
  },
  {
    id: "try-in-converter",
    name: "Converter Link",
    description: "変換画面へ誘導するボタンを置きます。",
    fields: [
      { key: "label", label: "ボタンの文言", defaultValue: "変換画面で試す" },
      { key: "href", label: "リンク先", defaultValue: "https://convertexcel.net/convert" },
    ],
    build: (v) => `<TryInConverter href=${q(v.href)}>${v.label.trim()}</TryInConverter>`,
  },
]

function defaultsFor(component: ComponentDefinition) {
  return Object.fromEntries(component.fields.map((field) => [field.key, field.defaultValue]))
}

export function DocsComponentInserter({ onInsert }: { onInsert: (value: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(() => COMPONENTS.find((item) => item.id === selectedId) ?? null, [selectedId])
  const [values, setValues] = useState<Record<string, string>>({})

  function open(component: ComponentDefinition) {
    setValues(defaultsFor(component))
    setSelectedId(component.id)
  }

  function insert() {
    if (!selected) return
    onInsert(`\n${selected.build(values)}\n`)
    setSelectedId(null)
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {COMPONENTS.map((component) => (
          <button
            key={component.id}
            type="button"
            className="hover:bg-muted focus-visible:ring-ring rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => open(component)}
          >
            <span className="block text-sm font-medium">{component.name}</span>
            <span className="text-muted-foreground mt-1 block text-xs leading-5">{component.description}</span>
          </button>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(openState) => !openState && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}を挿入</DialogTitle>
                <DialogDescription>{selected.description} 入力内容から有効なMDXを生成します。</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                {selected.fields.map((field) => (
                  <div key={field.key} className="grid gap-2">
                    <Label htmlFor={`docs-component-${field.key}`}>{field.label}</Label>
                    {field.kind === "textarea" ? (
                      <Textarea id={`docs-component-${field.key}`} className="min-h-24 font-mono text-sm" value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                    ) : field.kind === "select" ? (
                      <Select value={values[field.key] ?? field.defaultValue} onValueChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}>
                        <SelectTrigger id={`docs-component-${field.key}`} className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input id={`docs-component-${field.key}`} value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>キャンセル</Button>
                <Button type="button" onClick={insert}>カーソル位置へ挿入</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
