// 言語別の翻訳を動的 import で分割し、アクティブな1言語だけを読み込む。
// 全言語を entry chunk に同梱すると初期ロードで余分な eval が発生し TBT を悪化させるため、
// パスから確定した言語だけを描画前に読み込む（main.tsx で await）。
import type { Language } from "@/lib/i18n"
import type { Translations } from "./ja"

export type { Translations }

const loaders: Record<Language, () => Promise<{ default: Translations }>> = {
  ja: () => import("./ja"),
  en: () => import("./en"),
  zh: () => import("./zh"),
  "zh-Hant": () => import("./zh-Hant"),
  ko: () => import("./ko"),
  es: () => import("./es"),
  de: () => import("./de"),
}

const cache = new Map<Language, Translations>()

export function getCachedTranslations(language: Language): Translations | undefined {
  return cache.get(language)
}

export async function loadTranslations(language: Language): Promise<Translations> {
  const cached = cache.get(language)
  if (cached) return cached
  const mod = await loaders[language]()
  cache.set(language, mod.default)
  return mod.default
}

// 初回ロード後のアイドル時に残りの言語を先読みし、言語切替を即時化する。
// アイドル実行なので TBT には影響しない。
export function preloadOtherTranslations(except: Language): void {
  if (typeof window === "undefined") return
  const run = () => {
    for (const language of Object.keys(loaders) as Language[]) {
      if (language !== except && !cache.has(language)) void loadTranslations(language)
    }
  }
  const ric = (window as typeof window & {
    requestIdleCallback?: (callback: () => void) => void
  }).requestIdleCallback
  if (ric) ric(run)
  else window.setTimeout(run, 1500)
}
