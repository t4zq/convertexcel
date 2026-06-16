// texlive.net が返す TeX ログを解析し、ユーザーに分かりやすい構造化エラーへ変換する。
//
// TeX のログはコンパイル失敗時に `.log` ファイルとして返ってくる（texlive.ts 参照）。
// 生ログは冗長で読みにくいので、ここで「種類・原因の記号・行番号・該当コード」を抽出する。
// 純粋関数なので単体で検証しやすい。

export type TexErrorKind =
  | "undefinedControlSequence" // 未定義のコマンド（\foo など）
  | "undefinedEnvironment" // 未定義の環境（\begin{foo}）
  | "mismatchedEnvironment" // \begin と \end の対応ずれ
  | "missingMath" // 数式モード外で _ や ^ を使った（Missing $）
  | "missingFile" // パッケージ/ファイルが見つからない
  | "runaway" // 引数の途中でファイルが終わった（閉じ括弧忘れなど）
  | "braces" // 括弧の過不足
  | "emergencyStop" // 復旧不能（多くは別エラーの巻き添え）
  | "generic" // 上記に当てはまらないエラー

export interface TexLogError {
  kind: TexErrorKind
  /** TeX が出力した生のメッセージ（末尾のピリオドは除去済み）。 */
  message: string
  /** コンパイルされた完全な文書での行番号。 */
  line: number | null
  /** プリアンブル分を差し引いた、ユーザーが編集している本文での行番号（算出できた場合）。 */
  sourceLine: number | null
  /** 原因となったコマンド名や環境名など。 */
  symbol: string | null
  /** ログに表示された該当コード（`l.N` 行の内容）。 */
  context: string | null
}

// ユーザー自身が原稿を直せば解消できるエラーの種類。
// これ以外（generic / emergencyStop のみ、または解析できず空）の場合は、
// ツール側の問題の可能性があるため問い合わせ導線を出す。
const USER_FIXABLE_KINDS: ReadonlySet<TexErrorKind> = new Set([
  "undefinedControlSequence",
  "undefinedEnvironment",
  "mismatchedEnvironment",
  "missingMath",
  "missingFile",
  "runaway",
  "braces",
])

/** ユーザーがコードを修正すれば直せるエラーが1つでもあるか。 */
export function hasUserFixableError(errors: TexLogError[]): boolean {
  return errors.some((e) => USER_FIXABLE_KINDS.has(e.kind))
}

export interface ParseTexLogOptions {
  /**
   * wrapLatexDocument / wrapTikzDocument が本文の前に付け足すプリアンブルの行数。
   * これを渡すと sourceLine（ユーザー視点の行番号）を算出する。
   */
  lineOffset?: number
}

function classify(message: string): TexErrorKind {
  if (/^Undefined control sequence/.test(message)) return "undefinedControlSequence"
  if (/^(LaTeX|Package \S+) Error: Environment \S+ undefined/.test(message)) return "undefinedEnvironment"
  if (/ ended by /.test(message)) return "mismatchedEnvironment"
  if (/^Missing \$ inserted/.test(message)) return "missingMath"
  if (/^File ended while scanning/.test(message)) return "runaway"
  if (/^(LaTeX Error: )?File `?[^']+'? not found/.test(message)) return "missingFile"
  if (/^Too many \}/.test(message) || /^Missing [{}] inserted/.test(message)) return "braces"
  if (/^Emergency stop/.test(message) || /^Fatal error occurred/.test(message)) return "emergencyStop"
  return "generic"
}

function extractSymbol(kind: TexErrorKind, message: string, context: string | null): string | null {
  switch (kind) {
    case "undefinedEnvironment": {
      const m = message.match(/Environment (\S+?) undefined/)
      return m?.[1] ?? null
    }
    case "mismatchedEnvironment": {
      const m = message.match(/\\begin\{(\w+)\}/)
      return m?.[1] ?? null
    }
    case "runaway": {
      const m = message.match(/scanning use of (\\[a-zA-Z@]+)/)
      return m?.[1] ?? null
    }
    case "undefinedControlSequence": {
      // 該当行の末尾に未定義コマンドが残る（例: `l.3 \undefinedcommand`）。
      const m = context?.match(/(\\[a-zA-Z@]+)\s*$/)
      return m?.[1] ?? null
    }
    case "missingFile": {
      const m = message.match(/File `?([^'\s]+)'? not found/)
      return m?.[1] ?? null
    }
    default:
      return null
  }
}

/**
 * texlive.net の TeX ログを構造化エラーの配列へ変換する。
 * 根本原因となるエラーを優先し、その巻き添えで出る Emergency stop は
 * （他に実質的なエラーがあれば）取り除く。
 */
export function parseTexLog(log: string, options: ParseTexLogOptions = {}): TexLogError[] {
  const offset = options.lineOffset ?? 0
  const lines = log.split(/\r?\n/)
  const errors: TexLogError[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    // TeX のエラーは "! " で始まる。"Runaway argument?" は直後の "! File ended..." で拾うのでスキップ。
    if (!raw.startsWith("! ")) continue
    const message = raw.slice(2).trim().replace(/\.$/, "")

    // 直後の `l.<N>` 行から行番号と該当コードを得る。
    let line: number | null = null
    let context: string | null = null
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const lm = lines[j].match(/^l\.(\d+)\s?(.*)$/)
      if (lm) {
        line = Number(lm[1])
        context = lm[2].trim() || null
        break
      }
    }
    // "on input line N" がある場合はそちらが実際に直すべき箇所であることが多い。
    const inputLine = message.match(/input line (\d+)/)
    if (inputLine) line = Number(inputLine[1])

    const kind = classify(message)
    const symbol = extractSymbol(kind, message, context)
    const sourceLine = line != null && line > offset ? line - offset : null
    errors.push({ kind, message, line, sourceLine, symbol, context })
  }

  // 同一エラーの重複（TeX は復旧時に同じ行を繰り返し出す）を除去。
  const seen = new Set<string>()
  const deduped = errors.filter((e) => {
    const key = `${e.kind}|${e.message}|${e.line}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // 実質的なエラーがあれば、巻き添えの Emergency stop は隠す。
  const substantive = deduped.filter((e) => e.kind !== "emergencyStop")
  return substantive.length > 0 ? substantive : deduped
}
