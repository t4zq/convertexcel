import { existsSync } from "node:fs"
import https from "node:https"
import { spawnSync } from "node:child_process"

const isWindows = process.platform === "win32"
const addinUrl = process.env.ADDIN_URL ?? "https://localhost:5174/addin.html"
const requiredFiles = [
  "addin/certs/convertexcel-dev-root-ca.crt",
  "addin/certs/localhost.crt",
  "addin/certs/localhost.key",
  "addin/manifest.xml",
]

function quoteArg(arg) {
  return /^[A-Za-z0-9_./:=@-]+$/.test(arg) ? arg : `"${arg.replace(/"/g, '\\"')}"`
}

function commandFor(command, args) {
  if (!isWindows) return { command, args }
  return {
    command: "cmd.exe",
    args: ["/d", "/s", "/c", [command, ...args].map(quoteArg).join(" ")],
  }
}

function run(label, command, args, options = {}) {
  console.log(`\n[addin-check] ${label}`)
  const cmd = commandFor(command, args)
  const result = spawnSync(cmd.command, cmd.args, {
    stdio: "inherit",
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`)
  }
}

function probeAddinServer() {
  return new Promise((resolve) => {
    const request = https.get(
      addinUrl,
      { rejectUnauthorized: false },
      (response) => {
        response.resume()
        const ok = response.statusCode && response.statusCode >= 200 && response.statusCode < 400
        resolve({ ok, statusCode: response.statusCode })
      },
    )
    request.on("error", (error) => resolve({ ok: false, error }))
    request.setTimeout(2500, () => {
      request.destroy(new Error("timeout"))
    })
  })
}

try {
  console.log("[addin-check] required files")
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`${file} is missing. Run npm run addin:cert:create if cert files are missing.`)
    }
    console.log(`[addin-check] ok: ${file}`)
  }

  run("frontend typecheck", "npm", ["--prefix", "frontend", "run", "lint"])
  run("addin production build", "npm", ["--prefix", "frontend", "run", "build:addin"])

  console.log(`\n[addin-check] optional dev server probe: ${addinUrl}`)
  const probe = await probeAddinServer()
  if (probe.ok) {
    console.log(`[addin-check] add-in dev server reachable: HTTP ${probe.statusCode}`)
  } else {
    console.log("[addin-check] add-in dev server is not reachable right now. This is OK if dev:addin is not running.")
    console.log("[addin-check] Start it with: npm run dev:addin")
    if (probe.error?.message) console.log(`[addin-check] detail: ${probe.error.message}`)
  }

  console.log("\n[addin-check] If Excel still shows an add-in error, trust the dev CA and restart Excel:")
  console.log("  npm run addin:cert:trust")
  console.log("\n[addin-check] done")
} catch (error) {
  console.error(`\n[addin-check] ${error.message}`)
  process.exit(1)
}
