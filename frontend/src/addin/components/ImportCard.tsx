import { ClipboardPaste, LoaderCircle } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

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
  const reducedMotion = useReducedMotion()
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
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={loading ? "loading" : "idle"}
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.75 }}
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
            </motion.span>
          </AnimatePresence>
          選択範囲を取り込む
        </Button>

        <div className="overflow-hidden rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <AnimatePresence initial={false} mode="wait">
          {hasContent ? (
            <motion.div key="imported" className="space-y-1" {...contentMotion(reducedMotion)}>
              <p className="font-medium">取り込み済み</p>
              <p className="text-muted-foreground text-xs">
                {selection ? `${selection.rowCount} 行 / ${selection.columnCount} 列` : "Web 版に渡せる入力があります。"}
              </p>
            </motion.div>
          ) : (
            <motion.p key="empty" className="text-muted-foreground" {...contentMotion(reducedMotion)}>まだ範囲を取り込んでいません。</motion.p>
          )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
        {error && (
          <motion.p
            className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive"
            initial={{ opacity: 0, height: 0, y: reducedMotion ? 0 : -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: reducedMotion ? 0 : -4 }}
          >
            {error}
          </motion.p>
        )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function contentMotion(reducedMotion: boolean | null) {
  return {
    initial: { opacity: 0, x: reducedMotion ? 0 : -5 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: reducedMotion ? 0 : 5 },
  }
}
