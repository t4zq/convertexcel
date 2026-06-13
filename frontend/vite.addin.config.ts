import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const addinDir = path.resolve(__dirname, "../addin")
const certDir = path.join(addinDir, "certs")
const certKey = path.join(certDir, "localhost.key")
const certFile = path.join(certDir, "localhost.crt")
const prodManifest = path.join(addinDir, "manifest.prod.xml")

function devHttpsOptions() {
  if (!fs.existsSync(certKey) || !fs.existsSync(certFile)) {
    throw new Error("Run .\\addin\\scripts\\create-dev-cert.ps1 before starting the Excel add-in dev server.")
  }
  return {
    key: fs.readFileSync(certKey),
    cert: fs.readFileSync(certFile),
  }
}

// ビルド後、配布用 manifest を dist/addin/manifest.xml として同梱する。
// 利用者は /excel-addin ページからこの URL をダウンロードして sideload する。
function copyManifestPlugin(outDir: string): Plugin {
  return {
    name: "copy-addin-manifest",
    apply: "build",
    closeBundle() {
      fs.copyFileSync(prodManifest, path.join(outDir, "manifest.xml"))
    },
  }
}

const outDir = path.resolve(__dirname, "dist/addin")

export default defineConfig(({ command }) => ({
  root: __dirname,
  // 開発サーバーはルート直下 (https://localhost:5174/addin.html)。
  // 本番はメインサイトの dist に /addin/ サブパスとして同梱する。
  base: command === "serve" ? "/" : "/addin/",
  plugins: [react(), tailwindcss(), copyManifestPlugin(outDir)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
    https: command === "serve" ? devHttpsOptions() : undefined,
  },
  build: {
    // メインの build (frontend/dist) を空にした後で実行し、その配下に書き出す。
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "addin.html"),
    },
  },
}))
