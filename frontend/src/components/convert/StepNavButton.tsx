import { ChevronLeft, ChevronRight } from "lucide-react"

type StepNavButtonProps = {
  side: "left" | "right"
  /** アクセシブルラベル（前/次ステップ名を含む）。 */
  label: string
  /** アクティブ時に lg 以上で表示する遷移先ピル。 */
  pillLabel: string
  /** 入力ステップで内容があるときだけ強調表示する。 */
  active: boolean
  onClick: () => void
}

// 画面左右端のフルハイトのクリックゾーン。左右で位置・グラデ向き・アイコン・
// ピルの並び順だけが異なるので side で分岐し、共通構造を 1 箇所にまとめる。
export function StepNavButton({ side, label, pillLabel, active, onClick }: StepNavButtonProps) {
  const isLeft = side === "left"
  const Chevron = isLeft ? ChevronLeft : ChevronRight

  const edgeClasses = isLeft
    ? "left-0 justify-start gap-2 pl-0.5"
    : "right-0 justify-end gap-2 pr-0.5"
  const gradientDir = isLeft ? "hover:bg-gradient-to-r" : "hover:bg-gradient-to-l"
  const hoverGradient = active
    ? `${gradientDir} hover:from-primary/[0.08] hover:to-transparent`
    : `${gradientDir} hover:from-foreground/[0.05] hover:to-transparent`

  const iconCircle = (
    <span
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all group-hover:scale-105 ${
        active
          ? "border-primary bg-primary text-primary-foreground opacity-100"
          : "bg-background/80 text-muted-foreground opacity-60 group-hover:text-foreground group-hover:opacity-100"
      }`}
    >
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" aria-hidden="true" />
      )}
      <Chevron className="relative h-5 w-5" />
    </span>
  )

  const pill = active ? (
    <span className="hidden shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm lg:inline">
      {pillLabel}
    </span>
  ) : null

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`group fixed inset-y-0 z-20 flex w-10 items-center transition-colors sm:w-14 ${edgeClasses} ${hoverGradient}`}
    >
      {isLeft ? (
        <>
          {iconCircle}
          {pill}
        </>
      ) : (
        <>
          {pill}
          {iconCircle}
        </>
      )}
    </button>
  )
}
