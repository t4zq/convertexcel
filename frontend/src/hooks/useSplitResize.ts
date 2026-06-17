import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"

interface SplitResizeOptions {
  min?: number
  max?: number
  initial?: number
  step?: number
}

// 左右 2 ペインの分割比率 (%) をドラッグ / 矢印キーで調整するためのフック。
// containerRef を分割コンテナに、separatorProps をセパレータ要素に渡す。
export function useSplitResize({
  min = 35,
  max = 75,
  initial = 50,
  step = 2,
}: SplitResizeOptions = {}) {
  const [width, setWidth] = useState(initial)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const clamp = (value: number) => Math.min(max, Math.max(min, value))

  function updateFromPointer(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setWidth(clamp(Math.round(((clientX - rect.left) / rect.width) * 100)))
  }

  function stop(e: PointerEvent<HTMLDivElement>) {
    setIsResizing(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const separatorProps = {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      setIsResizing(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      updateFromPointer(e.clientX)
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      if (!isResizing) return
      updateFromPointer(e.clientX)
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      setWidth((value) => clamp(value + (e.key === "ArrowRight" ? step : -step)))
    },
  }

  return { width, isResizing, containerRef, separatorProps, min, max }
}
