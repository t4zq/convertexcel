import { useCallback, useId, useState } from "react"
import { Plus, X } from "lucide-react"

import { useI18n } from "@/hooks/useI18n"
import { parseTsv, serializeTsv } from "@/lib/tsv"

interface DataEntryFormProps {
  initialValue: string
  onChange: (tsv: string) => void
}

interface GridState {
  headers: string[]
  rows: string[][]
}

const DEFAULT_GRID: GridState = {
  headers: ["x", "y1"],
  rows: [
    ["", ""],
    ["", ""],
    ["", ""],
  ],
}

function parseGrid(tsv: string): GridState {
  const rows = parseTsv(tsv)
  if (rows.length === 0) return DEFAULT_GRID

  if (rows.length === 1) {
    return {
      headers: rows[0],
      rows: Array.from({ length: 3 }, () => Array<string>(rows[0].length).fill("")),
    }
  }
  return { headers: rows[0], rows: rows.slice(1) }
}

export function DataEntryForm({ initialValue, onChange }: DataEntryFormProps) {
  const uid = useId()
  const { t } = useI18n()
  const [grid, setGrid] = useState<GridState>(() => parseGrid(initialValue))

  const update = useCallback(
    (next: GridState) => {
      setGrid(next)
      onChange(serializeTsv([next.headers, ...next.rows]))
    },
    [onChange],
  )

  const setHeader = (col: number, value: string) => {
    const headers = [...grid.headers]
    headers[col] = value
    update({ ...grid, headers })
  }

  const setCell = (row: number, col: number, value: string) => {
    const rows = grid.rows.map((r) => [...r])
    rows[row][col] = value
    update({ ...grid, rows })
  }

  const addRow = () => {
    update({ ...grid, rows: [...grid.rows, Array<string>(grid.headers.length).fill("")] })
  }

  const removeRow = (i: number) => {
    const rows = grid.rows.filter((_, idx) => idx !== i)
    update({ ...grid, rows: rows.length > 0 ? rows : [Array<string>(grid.headers.length).fill("")] })
  }

  const addColumn = () => {
    const n = grid.headers.length
    update({
      headers: [...grid.headers, `y${n}`],
      rows: grid.rows.map((r) => [...r, ""]),
    })
  }

  const removeColumn = (col: number) => {
    if (grid.headers.length <= 1) return
    update({
      headers: grid.headers.filter((_, i) => i !== col),
      rows: grid.rows.map((r) => r.filter((_, i) => i !== col)),
    })
  }

  const cellId = (row: number, col: number) => `${uid}-cell-${row}-${col}`

  const handleCellKey = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const nextId = cellId(row + 1, col)
      const el = document.getElementById(nextId)
      if (el) {
        el.focus()
      } else if (row === grid.rows.length - 1) {
        // Enter on last row → add a new row then focus it
        const newRows = [...grid.rows, Array<string>(grid.headers.length).fill("")]
        update({ ...grid, rows: newRows })
        // Focus happens after re-render; use a microtask
        const targetId = cellId(row + 1, col)
        setTimeout(() => document.getElementById(targetId)?.focus(), 0)
      }
    }
  }

  const colCount = grid.headers.length

  return (
    <div className="space-y-2 overflow-x-auto">
      <table className="border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            {grid.headers.map((header, col) => (
              <th key={col} className="p-0">
                <div className="group relative flex items-center">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => setHeader(col, e.target.value)}
                    placeholder={col === 0 ? "x" : `y${col}`}
                    className="h-7 w-20 rounded border border-input bg-muted px-1.5 text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label={t.dataForm.headerLabel(col + 1)}
                  />
                  {colCount > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColumn(col)}
                      title={t.dataForm.removeColumn}
                      className="absolute -right-2 -top-2 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground group-hover:flex"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </th>
            ))}
            <th className="p-0">
              <button
                type="button"
                onClick={addColumn}
                title={t.dataForm.addColumn}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, col) => (
                <td key={col} className="p-0">
                  <input
                    id={cellId(rowIndex, col)}
                    type="text"
                    inputMode="decimal"
                    value={cell}
                    onChange={(e) => setCell(rowIndex, col, e.target.value)}
                    onKeyDown={(e) => handleCellKey(e, rowIndex, col)}
                    placeholder="0"
                    className="h-7 w-20 rounded border border-input bg-background px-1.5 text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label={t.dataForm.cellLabel(rowIndex + 1, grid.headers[col], col + 1)}
                  />
                </td>
              ))}
              {/* spacer for +col button column */}
              <td />
              <td className="p-0 pl-0.5">
                <button
                  type="button"
                  onClick={() => removeRow(rowIndex)}
                  title={t.dataForm.removeRow}
                  disabled={grid.rows.length <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1 px-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        {t.dataForm.addRow}
      </button>
    </div>
  )
}
