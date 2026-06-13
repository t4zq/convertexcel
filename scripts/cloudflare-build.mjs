import { homedir } from "node:os"
import { delimiter, join } from "node:path"
import { spawnSync } from "node:child_process"

const wasmPackVersion = process.env.WASM_PACK_VERSION ?? "0.15.0"
const isWindows = process.platform === "win32"
let engineBuilt = false

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: isWindows,
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`)
  }
}

function output(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: isWindows,
  })
  return result.status === 0 ? result.stdout.trim() : ""
}

function hasCommand(command) {
  return output(command, ["--version"]) !== ""
}

if (!hasCommand("cargo")) {
  if (isWindows) {
    run("docker", ["compose", "run", "--rm", "engine"])
    engineBuilt = true
  } else {
    run("sh", ["-c", "curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal"])
    process.env.PATH = `${join(homedir(), ".cargo", "bin")}${delimiter}${process.env.PATH ?? ""}`
  }
}

if (!engineBuilt) {
  run("rustup", ["target", "add", "wasm32-unknown-unknown"])

  if (!output("wasm-pack", ["--version"]).includes(wasmPackVersion)) {
    run("cargo", ["install", "wasm-pack", "--version", wasmPackVersion, "--locked"])
  }

  run("wasm-pack", ["build", "--target", "web", "--out-dir", "../frontend/src/engine/pkg"], {
    cwd: "engine",
  })
}

run("npm", ["ci"], { cwd: "frontend" })
run("npm", ["run", "build"], { cwd: "frontend" })
// Excel アドインを frontend/dist/addin に同梱する。メインの build が dist を
// 空にするため、必ずその後に実行する。
run("npm", ["run", "build:addin"], { cwd: "frontend" })
