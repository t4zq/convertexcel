import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"

interface CollapsibleHeightOptions {
  min?: number
  max?: number
  initial?: number
  step?: number
  // この高さ以下までドラッグすると領域を折りたたむ
  collapseBelow?: number
  // 折りたたみ状態から再表示するときの高さ
  reopenHeight?: number
}

// 上下ドラッグ / 矢印キーで高さ (px) を調整し、小さくしすぎると
// 折りたたまれる領域のためのフック。separatorProps をセパレータ要素に渡す。
export function useCollapsibleHeight({
  min = 90,
  max = 520,
  initial = 260,
  step = 20,
  collapseBelow = 105,
  reopenHeight = 120,
}: CollapsibleHeightOptions = {}) {
  const [height, setHeight] = useState(initial)
  const [visible, setVisible] = useState(true)
  const [isResizing, setIsResizing] = useState(false)
  const lastYRef = useRef(0)

  function applyDelta(delta: number) {
    setHeight((value) => {
      const next = Math.min(max, Math.max(min, value + delta))
      if (next <= collapseBelow) {
        setVisible(false)
        return reopenHeight
      }
      return Math.round(next)
    })
  }

  function reopen() {
    setVisible(true)
    setHeight(reopenHeight)
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
      if (!visible) reopen()
      lastYRef.current = e.clientY
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      if (!isResizing) return
      const delta = e.clientY - lastYRef.current
      lastYRef.current = e.clientY
      applyDelta(delta)
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
      e.preventDefault()
      if (!visible && e.key === "ArrowDown") {
        reopen()
        return
      }
      applyDelta(e.key === "ArrowDown" ? step : -step)
    },
  }

  return { height, visible, isResizing, separatorProps, min, max }
}
