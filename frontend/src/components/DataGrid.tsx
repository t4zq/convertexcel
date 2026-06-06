import { useCallback, useRef } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { parseGrid } from "@/lib/parse"
import type { Grid } from "@/lib/types"

interface DataGridProps {
  value: Grid
  onChange: (grid: Grid) => void
  /** 1行目をヘッダとして強調する */
  headerRow?: boolean
  className?: string
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => [...row])
}

function normalize(g: Grid): Grid {
  const cols = Math.max(1, ...g.map((r) => r.length))
  return g.map((row) => {
    const r = [...row]
    while (r.length < cols) r.push("")
    return r
  })
}

export function DataGrid({ value, onChange, headerRow = true, className }: DataGridProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const grid = value.length ? value : [[""]]

  const setCell = useCallback(
    (r: number, c: number, v: string) => {
      const next = cloneGrid(grid)
      next[r][c] = v
      onChange(next)
    },
    [grid, onChange]
  )

  const handlePaste = useCallback(
    (r: number, c: number, e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text")
      if (!text.includes("\t") && !text.includes("\n")) return // 単一セルは通常貼付
      e.preventDefault()
      const block = parseGrid(text)
      const next = cloneGrid(grid)
      for (let i = 0; i < block.length; i++) {
        const rr = r + i
        if (!next[rr]) next[rr] = []
        for (let j = 0; j < block[i].length; j++) {
          next[rr][c + j] = block[i][j]
        }
      }
      onChange(normalize(next))
    },
    [grid, onChange]
  )

  const resize = (rowDelta: number, colDelta: number) => {
    let next = cloneGrid(grid)
    if (rowDelta > 0) next.push(new Array(next[0].length).fill(""))
    if (rowDelta < 0 && next.length > 1) next.pop()
    if (colDelta > 0) next = next.map((row) => [...row, ""])
    if (colDelta < 0 && next[0].length > 1) next = next.map((row) => row.slice(0, -1))
    onChange(next)
  }

  const clear = () => {
    const rows = Math.max(grid.length, 1)
    const cols = Math.max(grid[0].length, 1)
    onChange(Array.from({ length: rows }, () => new Array(cols).fill("")))
  }

  const copyTsv = async () => {
    const tsv = grid.map((row) => row.join("\t")).join("\n")
    await navigator.clipboard.writeText(tsv)
  }

  const downloadCsv = () => {
    const csv = grid.map((row) => row.map((c) => c ?? "").join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(normalize(parseGrid(String(reader.result))))
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => resize(1, 0)}>+ 行</Button>
        <Button size="sm" variant="secondary" onClick={() => resize(0, 1)}>+ 列</Button>
        <Button size="sm" variant="secondary" onClick={() => resize(-1, 0)}>− 末尾行</Button>
        <Button size="sm" variant="secondary" onClick={() => resize(0, -1)}>− 末尾列</Button>
        <Button size="sm" variant="ghost" onClick={clear}>クリア</Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button size="sm" variant="secondary" onClick={copyTsv}>Excelへコピー</Button>
        <Button size="sm" variant="secondary" onClick={downloadCsv}>CSV保存</Button>
        <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}>CSV読込</Button>
        <input ref={fileInput} type="file" accept=".csv" hidden onChange={loadCsv} />
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="border-collapse text-sm">
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border p-0">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onPaste={(e) => handlePaste(r, c, e)}
                      className={cn(
                        "h-8 w-24 bg-transparent px-2 outline-none focus:bg-accent/50",
                        headerRow && r === 0 && "font-medium bg-muted/50"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
