import { useCallback, useEffect, useState } from "react"

import { readSelectedRange, type ExcelSelection } from "@/addin/excelRangeReader"

const IMPORT_ERROR_FALLBACK = "選択範囲の取り込みに失敗しました。"

export interface ExcelSelectionState {
  /** Office.onReady が解決済み（= Excel 内で開かれている）か。 */
  officeReady: boolean
  selection: ExcelSelection | null
  loading: boolean
  error: string | null
  importSelection: () => Promise<void>
}

/** Office の準備状態と、選択範囲の取り込みをまとめて扱うフック。 */
export function useExcelSelection(): ExcelSelectionState {
  const [officeReady, setOfficeReady] = useState(false)
  const [selection, setSelection] = useState<ExcelSelection | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof Office === "undefined") return
    void Office.onReady().then(() => setOfficeReady(true))
  }, [])

  const importSelection = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSelection(await readSelectedRange())
    } catch (err) {
      // 取り込み失敗時は直前の選択範囲を保持したままエラーだけ表示する。
      setError(err instanceof Error ? err.message : IMPORT_ERROR_FALLBACK)
    } finally {
      setLoading(false)
    }
  }, [])

  return { officeReady, selection, loading, error, importSelection }
}
