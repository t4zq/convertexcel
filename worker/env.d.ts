// Keep this declaration synchronized with wrangler.jsonc.
// Regenerate it with: npx wrangler types worker/env.d.ts
interface Env {
  ASSETS: Fetcher
  AI: Ai
  PDF_PREVIEW_RATE_LIMIT: RateLimit
  EXPLAIN_RATE_LIMIT: RateLimit
  DOCS_PUBLISH_RATE_LIMIT: RateLimit
  EXPLAIN_ANALYTICS?: AnalyticsEngineDataset
  DOCS_ADMIN_TOKEN: string
  GITHUB_DOCS_TOKEN: string
  GITHUB_DOCS_OWNER: string
  GITHUB_DOCS_REPO: string
  GITHUB_DOCS_BRANCH: string
}
