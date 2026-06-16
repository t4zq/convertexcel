import { spawnSync } from "node:child_process"

const isWindows = process.platform === "win32"
const frontendPort = process.env.FRONTEND_PORT ?? "5173"
const workerPort = process.env.WORKER_PORT ?? "8787"

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
  console.log(`\n[check] ${label}`)
  const cmd = commandFor(command, args)
  const result = spawnSync(cmd.command, cmd.args, {
    stdio: "inherit",
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`)
  }
}

async function probe(label, url, requiredText) {
  try {
    const response = await fetch(url)
    const text = await response.text()
    if (!response.ok) {
      console.warn(`[check] ${label}: HTTP ${response.status}`)
      return false
    }
    if (requiredText && !text.includes(requiredText)) {
      console.warn(`[check] ${label}: response did not include ${JSON.stringify(requiredText)}`)
      return false
    }
    console.log(`[check] ${label}: ok`)
    return true
  } catch {
    console.warn(`[check] ${label}: not running (${url})`)
    return false
  }
}

try {
  run("worker typecheck", "npm", ["run", "typecheck:worker"])
  run("frontend typecheck", "npm", ["--prefix", "frontend", "run", "lint"])

  console.log("\n[check] Optional smoke checks for running dev servers")
  await probe("frontend", `http://localhost:${frontendPort}`, "<!doctype html")
  await probe("worker", `http://localhost:${workerPort}/api/health`, "\"status\":\"ok\"")
  console.log("\n[check] done")
} catch (error) {
  console.error(`\n[check] ${error.message}`)
  process.exit(1)
}
