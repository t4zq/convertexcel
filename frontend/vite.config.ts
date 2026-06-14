import path from "node:path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

function preloadEngineAssetsPlugin(): Plugin {
  return {
    name: "preload-engine-assets",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html, context) {
      const bundle = context.bundle
      if (!bundle) return html

      const engineChunk = Object.values(bundle).find(
        (item) => item.type === "chunk" && item.fileName.startsWith("assets/convertexcel_engine-")
      )
      const engineWasm = Object.values(bundle).find(
        (item) => item.type === "asset" && item.fileName.startsWith("assets/convertexcel_engine_bg-")
      )
      const links = [
        engineChunk
          ? `    <link rel="modulepreload" crossorigin href="/${engineChunk.fileName}">`
          : null,
        engineWasm
          ? `    <link rel="preload" href="/${engineWasm.fileName}" as="fetch" type="application/wasm" crossorigin>`
          : null,
      ].filter(Boolean)

      if (links.length === 0) return html
      return html.replace(
        /(\s*<script type="module")/,
        `\n${links.join("\n")}$1`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadEngineAssetsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
