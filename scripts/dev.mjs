import { existsSync } from "node:fs"
import { spawn, spawnSync } from "node:child_process"

const isWindows = process.platform === "win32"
const frontendPort = process.env.FRONTEND_PORT ?? "5173"
const workerPort = process.env.WORKER_PORT ?? "8787"
const enginePackage = "frontend/src/engine/pkg/package.json"
const forceEngineBuild = process.env.FORCE_ENGINE_BUILD === "1"

const processes = []

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

function runOnce(name, command, args, options = {}) {
  console.log(`[dev] ${name}`)
  const cmd = commandFor(command, args)
  const result = spawnSync(cmd.command, cmd.args, {
    stdio: "inherit",
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`${name} failed with exit code ${result.status}`)
  }
}

function start(name, command, args, options = {}) {
  const cmd = commandFor(command, args)
  const child = spawn(cmd.command, cmd.args, {
    stdio: "inherit",
    ...options,
  })

  child.on("exit", (code, signal) => {
    if (shuttingDown) return
    const reason = signal ? `signal ${signal}` : `exit code ${code}`
    console.error(`\n[${name}] stopped with ${reason}`)
    shutdown(code ?? 1)
  })

  processes.push(child)
}

let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of processes) {
    if (!child.killed) child.kill()
  }
  setTimeout(() => process.exit(code), 300)
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))

if (forceEngineBuild || !existsSync(enginePackage)) {
  runOnce("building Rust/WASM engine", "docker", ["compose", "run", "--rm", "engine"])
} else {
  console.log(`[dev] engine already exists (${enginePackage})`)
}

console.log("Starting local full-stack dev servers:")
console.log(`- Frontend: http://localhost:${frontendPort}`)
console.log(`- API health: http://localhost:${workerPort}/api/health`)
console.log("")

start("worker", "npx", ["wrangler", "dev", "--port", workerPort])
start("frontend", "npm", ["--prefix", "frontend", "run", "dev", "--", "--host", "127.0.0.1", "--port", frontendPort])
