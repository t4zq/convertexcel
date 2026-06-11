import { useEffect, useState } from "react"

// 秒単位のクールダウンタイマー。start(秒) で開始し、毎秒カウントダウンする。
export function useCooldown() {
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  return { cooldown, startCooldown: setCooldown }
}
