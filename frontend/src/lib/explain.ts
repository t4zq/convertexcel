// Workers AI による TeX エラー解説の取得まわり。
//
// コンパイル失敗時に parseTexLog が作る構造化エラー（texlive-log.ts）を
// Worker の /api/explain-error に送り、LLM が生成した自然言語の解説を受け取る。
// この経路は「機械的な分類に失敗したエラー」だけが来る想定。AI は解説に加えて
// 「ユーザーが自分で直せるか（userFixable）」も返し、issues 誘導の出し分けに使う。
// AI 呼び出しは Worker 側に閉じているので、フロントは fetch するだけ。

import { API_BASE } from "@/api/client"
import type { Language } from "@/lib/i18n"
import type { TexLogError } from "@/lib/texlive-log"

export type ExplainResult =
  | { ok: true; explanation: string; userFixable: boolean }
  | { ok: false; error: string }

// プロンプトを小さく保つため、解説に必要なフィールドだけ送る。
type ExplainPayloadError = Pick<TexLogError, "kind" | "message" | "symbol" | "sourceLine" | "line" | "context">

type ExplainSuccess = { explanation: string; userFixable: boolean }

// 同一エラー（種類・メッセージ・行・言語が同じ）の解説はセッション中キャッシュして
// Neurons を節約する。成功結果のみ保存し、失敗は毎回やり直せるようにする。
const explanationCache = new Map<string, ExplainSuccess>()

function cacheKey(errors: TexLogError[], lang: Language, log: string): string {
  const sig =
    errors.length > 0
      ? errors.map((e) => `${e.kind}|${e.message}|${e.sourceLine ?? e.line ?? ""}`).join("§")
      : `log:${log.slice(0, 500)}`
  return `${lang}::${sig}`
}

export async function explainTexErrors(
  errors: TexLogError[],
  lang: Language,
  log: string,
): Promise<ExplainResult> {
  const key = cacheKey(errors, lang, log)
  const cached = explanationCache.get(key)
  if (cached !== undefined) return { ok: true, ...cached }

  const payload: ExplainPayloadError[] = errors.map((e) => ({
    kind: e.kind,
    message: e.message,
    symbol: e.symbol,
    sourceLine: e.sourceLine,
    line: e.line,
    context: e.context,
  }))

  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/explain-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors: payload, lang, log: log.slice(0, 6000) }),
    })
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  let data: { ok?: boolean; explanation?: string; userFixable?: boolean; error?: string }
  try {
    data = await response.json()
  } catch {
    return { ok: false, error: `HTTP ${response.status}` }
  }

  if (data.ok && typeof data.explanation === "string") {
    const result: ExplainSuccess = { explanation: data.explanation, userFixable: data.userFixable === true }
    explanationCache.set(key, result)
    return { ok: true, ...result }
  }
  return { ok: false, error: data.error ?? `HTTP ${response.status}` }
}
