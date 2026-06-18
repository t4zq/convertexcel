// API のベース URL。本番では Cloudflare Worker が同一オリジンの /api を処理する。
// dev (Vite) では vite.config.ts の proxy が /api を `wrangler dev` (:8787) に転送する。
// 別オリジンの Worker を叩きたい場合のみ VITE_API_BASE で上書きする。
export const API_BASE = import.meta.env.VITE_API_BASE ?? ""
