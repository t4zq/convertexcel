import { motion, type Transition } from "motion/react"

import { cn } from "@/lib/utils"

const DOT_COUNT = 3

const dotTransition = (delay: number): Transition => ({
  duration: 0.6,
  repeat: Infinity,
  repeatType: "reverse",
  ease: "easeInOut",
  delay,
})

interface LoaderProps {
  /** ドットのサイズ(px)。 */
  size?: number
  className?: string
  /** ローダーの右に添えるテキスト。 */
  label?: string
}

// animate-ui 流の motion ベースのドットローダー。色は currentColor を継承するので、
// 呼び出し側で text-info / text-muted-foreground などを当てて使う。
export function Loader({ size = 6, className, label }: LoaderProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-live="polite">
      <span className="inline-flex items-center gap-1">
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <motion.span
            key={i}
            className="inline-block rounded-full bg-current"
            style={{ width: size, height: size }}
            initial={{ opacity: 0.25, y: 0 }}
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -size * 0.7, 0] }}
            transition={dotTransition(i * 0.15)}
          />
        ))}
      </span>
      {label && <span>{label}</span>}
    </span>
  )
}
