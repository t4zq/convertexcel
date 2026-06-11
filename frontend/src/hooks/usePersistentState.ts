import { useEffect, useRef, useState } from "react"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// localStorage に同期する useState。設定オブジェクトは保存済みの値を
// デフォルトへマージするため、後から項目が増えても壊れない。
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return initial
      const parsed = JSON.parse(raw)
      if (isPlainObject(initial) && isPlainObject(parsed)) {
        return { ...initial, ...parsed } as T
      }
      return parsed as T
    } catch {
      return initial
    }
  })

  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(state))
    } catch {
      // 容量超過 / localStorage 不可の環境では黙って無視する。
    }
  }, [state])

  return [state, setState] as const
}
