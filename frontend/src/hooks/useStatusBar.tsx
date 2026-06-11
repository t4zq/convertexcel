import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

export interface StatusData {
  errors: number
  warnings: number
  rows: number
  cols: number
  chars: number
  activeOutput: string
  engineReady: boolean | null
}

const DEFAULT: StatusData = {
  errors: 0,
  warnings: 0,
  rows: 0,
  cols: 0,
  chars: 0,
  activeOutput: "",
  engineReady: null,
}

// データ用とセッター用を分ける。ConvertPage はセッター（安定参照）だけを
// 購読するので、ステータス更新で不要に再レンダーされない。
const DataContext = createContext<StatusData>(DEFAULT)
const SetterContext = createContext<(patch: Partial<StatusData>) => void>(() => {})

export function StatusBarProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StatusData>(DEFAULT)
  const setStatus = useCallback((patch: Partial<StatusData>) => {
    setData((d) => ({ ...d, ...patch }))
  }, [])

  return (
    <SetterContext.Provider value={setStatus}>
      <DataContext.Provider value={data}>{children}</DataContext.Provider>
    </SetterContext.Provider>
  )
}

export const useStatusData = () => useContext(DataContext)
export const useStatusSetter = () => useContext(SetterContext)
