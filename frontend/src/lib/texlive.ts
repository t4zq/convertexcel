// texlive.net への PDF プレビュー送信まわり。

const TEXLIVE_URL = "https://texlive.net/cgi-bin/latexcgi"

export const COOLDOWN_SECONDS = 15

// 旧 script.js の document ラッパを踏襲
export const wrapLatexDocument = (body: string) => `% !TEX uplatex
\\documentclass[uplatex,a4paper,12pt]{jsarticle}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{siunitx}
\\usepackage{float}
\\usepackage{xcolor}
\\usepackage[dvipdfmx]{hyperref}
\\usepackage[dvipdfmx]{geometry}
\\geometry{a4paper,margin=25mm}
\\begin{document}
${body}
\\end{document}`

export const wrapTikzDocument = (tikz: string) => `% !TEX uplatex
\\documentclass[uplatex,a4paper,12pt,dvipdfmx]{jsarticle}
\\usepackage{amsmath,amssymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\usepackage{float}
\\usepackage{xcolor}
\\usepackage{pxpgfmark}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikz}
\\end{document}`

export interface ExtraFile {
  name: string
  contents: string
}

// 動的にフォームを生成し texlive.net へ POST、結果を iframe に表示する。
export function submitToTexlive(
  iframeName: string,
  texCode: string,
  extraFiles: ExtraFile[]
) {
  const form = document.createElement("form")
  form.method = "post"
  form.action = TEXLIVE_URL
  form.target = iframeName
  form.enctype = "multipart/form-data"
  form.style.display = "none"

  const add = (name: string, value: string, asTextarea = false) => {
    const el = document.createElement(asTextarea ? "textarea" : "input")
    el.name = name
    if (asTextarea) el.textContent = value
    else (el as HTMLInputElement).value = value
    form.appendChild(el)
  }

  add("filecontents[]", texCode, true)
  add("filename[]", "document.tex")
  for (const f of extraFiles) {
    add("filecontents[]", f.contents, true)
    add("filename[]", f.name)
  }
  add("engine", "uplatex")
  add("return", "pdfjs")

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}
