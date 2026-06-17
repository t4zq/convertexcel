import { animate, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { useEffect } from "react"
import { motion } from "motion/react"

import { motionTokens } from "@/lib/motion"

export function AnimatedNumber({ value }: { value: number }) {
  const reducedMotion = useReducedMotion()
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, (latest) => Math.round(latest))

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, { duration: motionTokens.standard })
    return controls.stop
  }, [motionValue, reducedMotion, value])

  return <motion.span>{rounded}</motion.span>
}
