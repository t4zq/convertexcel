import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

// motion-primitives の Text Shimmer 風。muted-foreground のテキストの上を
// foreground の明るい帯が左→右へ繰り返し走る。生成中などの待機表示に使う。
// reduced-motion 環境ではアニメーションせず静的なテキストにフォールバックする。
type TextShimmerProps = {
  children: string
  className?: string
  /** 1 周にかかる秒数。小さいほど速い。 */
  duration?: number
}

const SHIMMER_GRADIENT =
  "linear-gradient(90deg, var(--color-muted-foreground) 0%, var(--color-muted-foreground) 40%, var(--color-foreground) 50%, var(--color-muted-foreground) 60%, var(--color-muted-foreground) 100%)"

export function TextShimmer({ children, className, duration = 1.6 }: TextShimmerProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <span className={cn("text-muted-foreground", className)}>{children}</span>
  }

  return (
    <motion.span
      className={cn("inline-block", className)}
      style={{
        color: "transparent",
        backgroundImage: SHIMMER_GRADIENT,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        backgroundSize: "300% 100%",
      }}
      initial={{ backgroundPosition: "150% 0%" }}
      animate={{ backgroundPosition: "-150% 0%" }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  )
}
