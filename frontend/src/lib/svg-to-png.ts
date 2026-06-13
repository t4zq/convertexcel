// gnuplot プレビューの SVG 文字列を PNG に変換し、コピー/保存に使う。
// SVG を Image に読み込み canvas へ描画して PNG 化する。背景は白で塗る
// （gnuplot SVG は白背景前提のため、透過だと暗所で見えなくなる）。

function svgDimensions(svg: string): { width: number; height: number } {
  const w = svg.match(/width="(\d+(?:\.\d+)?)"/)
  const h = svg.match(/height="(\d+(?:\.\d+)?)"/)
  return { width: w ? Number(w[1]) : 700, height: h ? Number(h[1]) : 450 }
}

export async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  const { width, height } = svgDimensions(svg)
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = new Image()
    img.decoding = "async"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("failed to load svg image"))
      img.src = url
    })
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas 2d context unavailable")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
        "image/png",
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function copyPngToClipboard(blob: Blob): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("clipboard image write unsupported")
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
