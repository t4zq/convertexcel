import { Link } from "react-router-dom"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Privacy</p>
        <h1 className="text-2xl font-semibold tracking-tight">プライバシーポリシー</h1>
        <p className="text-muted-foreground text-sm">制定日: 2026年5月24日</p>
      </header>

      <Card>
        <CardHeader><CardTitle>はじめに / 収集する情報</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>本ポリシーは、converTeXcel の利用時に入力データや外部サービスがどのように扱われるかを説明します。</p>
          <p>本ツールは、氏名・メールアドレス・IPアドレスなど利用者個人を特定できる情報を独自に収集・保存しません。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>データの処理</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            入力された表データや数値データは、原則として利用者のブラウザ上(Rust/WebAssembly)で処理されます。
            計算のためにサーバーへ自動送信することはありません。
          </p>
          <p>
            入力内容や表示設定は、利便性のため利用者のブラウザ内の localStorage に保存される場合があります。
            これらの情報は本ツールのサーバーへ自動送信されません。
          </p>
          <p>
            共有リンクを作成した場合、入力内容はURL内に含まれます。共有リンクを第三者に送る場合は、
            個人情報や機密情報が含まれていないことを確認してください。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>外部サービスの利用</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>PDF プレビュー機能のため、以下の外部サービスを利用します。</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>サービス</TableHead>
                <TableHead>用途</TableHead>
                <TableHead>送信されるデータ</TableHead>
                <TableHead>利用タイミング</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <a className="underline" href="https://texlive.net" target="_blank" rel="noopener">texlive.net</a>
                </TableCell>
                <TableCell>PDF プレビューの作成</TableCell>
                <TableCell>表・グラフコードおよびグラフ用データ</TableCell>
                <TableCell>確認ダイアログで同意した後</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cookie・トラッキング / ポリシーの変更</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>本ツールは Cookie を使用せず、広告トラッキングも行いません。</p>
          <p>
            検索結果での表示状況を確認するため Google Search Console を利用する場合がありますが、
            本ツール上に利用者を追跡するためのタグやスクリプトを追加するものではありません。
          </p>
          <p>本ポリシーは必要に応じて更新され、変更時はこのページの内容を更新します。</p>
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link to="/" className="underline underline-offset-4">変換に戻る</Link>
      </p>
    </div>
  )
}
