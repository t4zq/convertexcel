import { Check, Copy } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

type CopyFeedbackProps = {
  copied: boolean
  idleLabel: string
  copiedLabel: string
  iconClassName?: string
  showLabel?: boolean
}

export function CopyFeedback({
  copied,
  idleLabel,
  copiedLabel,
  iconClassName,
  showLabel = true,
}: CopyFeedbackProps) {
  const reducedMotion = useReducedMotion()
  const offset = reducedMotion ? 0 : 4
  const duration = reducedMotion ? 0 : 0.16

  return (
    <>
      <span className={cn("relative inline-flex h-4 w-4 shrink-0 items-center justify-center", iconClassName)}>
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={copied ? "copied" : "copy"}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.7, rotate: reducedMotion ? 0 : -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.7, rotate: reducedMotion ? 0 : 12 }}
            transition={{ duration }}
          >
            {copied ? <Check className="h-full w-full text-success" /> : <Copy className="h-full w-full" />}
          </motion.span>
        </AnimatePresence>
      </span>
      {showLabel && (
        <span className="relative inline-grid overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={copied ? "copied" : "copy"}
              className="col-start-1 row-start-1"
              initial={{ opacity: 0, y: offset }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -offset }}
              transition={{ duration }}
            >
              {copied ? copiedLabel : idleLabel}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </>
  )
}
