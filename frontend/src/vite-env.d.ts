/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_ADSENSE_CLIENT_ID?: string
  readonly VITE_ADSENSE_OUTPUT_SLOT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// gnuplot-wasm は型定義を同梱していないため最小限の宣言を与える。
declare module "gnuplot-wasm" {
  export interface GnuplotRenderOptions {
    width?: number
    height?: number
    background?: string
    data?: Record<string, string>
    term?: string
  }
  export interface GnuplotInstance {
    render: (
      script: string,
      options?: GnuplotRenderOptions,
    ) => { svg: string | null; stdout: string }
    version: () => string
  }
  const init: (options?: Record<string, unknown>) => Promise<GnuplotInstance>
  export default init
}
