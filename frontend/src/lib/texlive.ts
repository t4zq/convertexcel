// texlive.net への PDF プレビュー送信まわり。
//
// texlive.net の CGI は結果へ 301 リダイレクトするが、その 301 に CORS ヘッダが
// 無いためブラウザから直接は追えない。そのため Worker の /api/tex-preview を
// 経由してサーバ側でリダイレクトを解決し、成功/失敗とログを受け取る。

import { API_BASE } from "@/api/client"

export const COOLDOWN_SECONDS = 15

// wrapLatexDocument / wrapTikzDocument が本文の前に付けるプリアンブルの行数。
// TeX ログの行番号からこれを引くと、ユーザーが編集している本文の行番号になる。
// ラッパ本体を変更したら、この値も合わせて更新すること。
export const LATEX_PREAMBLE_LINES = 12
export const TIKZ_PREAMBLE_LINES = 10

// LuaLaTeX + luatexja (ltjsarticle) でコンパイルする。dvipdfmx 経由ではなく
// lualatex が直接 PDF を生成するため、ドライバ指定 (dvipdfmx) や
// pxpgfmark (pLaTeX+dvipdfmx 専用) は不要。
export const wrapLatexDocument = (body: string) => `% !TEX lualatex
\\documentclass[a4paper,12pt]{ltjsarticle}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{siunitx}
\\usepackage{float}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{a4paper,margin=25mm}
\\begin{document}
${body}
\\end{document}`

export const wrapTikzDocument = (tikz: string) => `% !TEX lualatex
\\documentclass[a4paper,12pt]{ltjsarticle}
\\usepackage{amsmath,amssymb}
\\usepackage{siunitx}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\usepackage{float}
\\usepackage{xcolor}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikz}
\\end{document}`

export interface ExtraFile {
  name: string
  contents: string
}

export type TexliveResult =
  | { ok: true; pdf: Blob }
  // コンパイル失敗。texlive.net から返ってきた生ログ。解析は parseTexLog に渡す。
  | { ok: false; reason: "compile"; log: string }
  // 通信自体に失敗（オフライン・CORS・予期しないレスポンスなど）。
  | { ok: false; reason: "network"; detail: string }

type TexPreviewResponse =
  { ok: false; reason?: "compile" | "network"; log: string }

// Worker の /api/tex-preview 経由でコンパイルし、成功なら PDF バイナリを、
// 失敗なら TeX ログ（parseTexLog に渡す）を返す。
export async function submitToTexlive(
  texCode: string,
  extraFiles: ExtraFile[],
): Promise<TexliveResult> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/tex-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tex: texCode, files: extraFiles }),
    })
  } catch (error) {
    return { ok: false, reason: "network", detail: error instanceof Error ? error.message : String(error) }
  }

  const contentType = response.headers.get("Content-Type") ?? ""
  if (response.ok && contentType.toLowerCase().includes("application/pdf")) {
    const pdf = await response.blob()
    if (pdf.size > 0) return { ok: true, pdf }
    return { ok: false, reason: "network", detail: "空のPDFを受信しました" }
  }

  let data: TexPreviewResponse
  try {
    data = (await response.json()) as TexPreviewResponse
  } catch {
    return { ok: false, reason: "network", detail: `HTTP ${response.status}` }
  }

  if (data.reason === "network") {
    return { ok: false, reason: "network", detail: data.log }
  }
  return { ok: false, reason: "compile", log: data.log }
}
