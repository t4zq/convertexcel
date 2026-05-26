# converTeXcel

## Local build

This project builds `src/convert.cpp` into `public/dist/convert.js` and `public/dist/convert.wasm`
with Emscripten.

## Project structure

```text
.
├── public/                 # static files served in production
│   ├── index.html          # data conversion tool
│   ├── stats.html          # statistics exploration tool
│   ├── privacy.html
│   ├── assets/
│   │   ├── css/style.css
│   │   ├── img/logo.png
│   │   └── js/
│   │       ├── script.js
│   │       └── stats.js
│   └── dist/               # generated WASM bundle
├── src/convert.cpp         # WASM conversion engine
└── scripts/                # build and local server helpers
```

## Build and serve locally

Build WASM and start a local server in one command:

```powershell
.\scripts\dev.ps1
```

Open:

```text
http://127.0.0.1:4173
```

Press `Ctrl+C` to stop the server.

Use a different port if needed:

```powershell
.\scripts\dev.ps1 -Port 4174
```

On macOS / Linux:

```bash
bash scripts/dev.sh
```

### Windows PowerShell

Install and activate Emscripten:

```powershell
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
.\emsdk install latest
.\emsdk activate latest
.\emsdk_env.ps1
```

Build from the project root:

```powershell
.\scripts\build-wasm.ps1
```

If `tools/emsdk` exists in this project, the script activates it automatically.

### macOS / Linux

Install and activate Emscripten:

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

Build from the project root:

```bash
bash scripts/build-wasm.sh
```

If `tools/emsdk` exists in this project, the script activates it automatically.

The GitHub Actions workflow uses the same shell script, so local builds and CI
builds export the same WASM functions.
