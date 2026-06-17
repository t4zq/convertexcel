export type MotionProfile = "precise" | "rich"

export const MOTION_PROFILE: MotionProfile = "precise"

const profiles = {
  precise: {
    quick: 0.16,
    standard: 0.24,
    spring: { type: "spring" as const, stiffness: 440, damping: 38, mass: 0.72 },
  },
  rich: {
    quick: 0.22,
    standard: 0.36,
    spring: { type: "spring" as const, stiffness: 300, damping: 25, mass: 0.88 },
  },
}

export const motionTokens = profiles[MOTION_PROFILE]

import type { Variants } from "motion/react"

// ステッパー（入力 / 変換）の横スライド遷移。動画と同じく
// 90% スケール → 100% + クロスフェードで入り、内部カードは stagger で続く。
// direction: 1 = 前進（右から入る）, -1 = 後退（左から入る）。
export function stepPageVariants(reduced: boolean | null): Variants {
  return {
    enter: (direction: number) => ({
      opacity: 0,
      x: reduced ? 0 : direction * 48,
      scale: reduced ? 1 : 0.96,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        ...motionTokens.spring,
        when: "beforeChildren",
        delayChildren: reduced ? 0 : 0.05,
        staggerChildren: reduced ? 0 : 0.07,
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: reduced ? 0 : direction * -28,
      scale: reduced ? 1 : 0.985,
      transition: { duration: motionTokens.quick },
    }),
  }
}
// ページ内の入れ子グループ（自身は動かず、子を stagger させるだけのコンテナ）。
export function stepGroupVariants(reduced: boolean | null): Variants {
  return {
    enter: {},
    center: {
      transition: {
        when: "beforeChildren",
        delayChildren: reduced ? 0 : 0.04,
        staggerChildren: reduced ? 0 : 0.07,
      },
    },
    exit: {},
  }
}

// ページ内カードの登場（親の center 状態を継承し stagger で順に現れる）。
export function stepItemVariants(reduced: boolean | null): Variants {
  return {
    enter: { opacity: 0, y: reduced ? 0 : 14, scale: reduced ? 1 : 0.985 },
    center: { opacity: 1, y: 0, scale: 1, transition: motionTokens.spring },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  }
}
