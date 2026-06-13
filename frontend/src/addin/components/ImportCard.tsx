import { ClipboardPaste, LoaderCircle } from "lucide-react"

import type { ExcelSelection } from "@/addin/excelRangeReader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ImportCardProps {
  officeReady: boolean
  selection: ExcelSelection | null
  loading: boolean
  error: string | null
  hasContent: boolean
  onImport: () => void
}

/** Excel の選択範囲を取り込むカード。 */
export function ImportCard({
  officeReady,
  selection,
  loading,
  error,
  hasContent,
  onImport,
}: ImportCardProps) {
  return (
    <Card className="gap-3 rounded-lg py-3 shadow-xs">
      <CardHeader className="space-y-2 px-3.5">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardPaste className="h-4 w-4 text-muted-foreground" />
          入力
        </CardTitle>
        <CardDescription>
          {selection
            ? `${selection.address} (${selection.rowCount} 行 x ${selection.columnCount} 列)`
            : "Excel で範囲を選択してから取り込みます。"}
        </CardDescription>
        {!officeReady && (
          <p className="text-muted-foreground text-xs">
            Excel 外で開いている場合、選択範囲の取り込みは使えません。
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3 px-3.5">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={onImport}
          disabled={!officeReady || loading}
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
          選択範囲を取り込む
        </Button>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          {hasContent ? (
            <div className="space-y-1">
              <p className="font-medium">取り込み済み</p>
              <p className="text-muted-foreground text-xs">
                {selection ? `${selection.rowCount} 行 / ${selection.columnCount} 列` : "Web 版に渡せる入力があります。"}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">まだ範囲を取り込んでいません。</p>
          )}
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
