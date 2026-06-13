import type { Language } from "@/lib/i18n"

export const tableAlignmentLabels: Record<Language, {
  columnAlign: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  siunitxHint: string
}> = {
  ja: {
    columnAlign: "列揃え",
    alignLeft: "左揃え",
    alignCenter: "中央揃え",
    alignRight: "右揃え",
    siunitxHint: "siunitx 有効時は数値列の桁揃えを優先します。",
  },
  en: {
    columnAlign: "Column alignment",
    alignLeft: "Left",
    alignCenter: "Center",
    alignRight: "Right",
    siunitxHint: "siunitx keeps numeric columns aligned by value.",
  },
  zh: {
    columnAlign: "列对齐",
    alignLeft: "左对齐",
    alignCenter: "居中",
    alignRight: "右对齐",
    siunitxHint: "启用 siunitx 时会优先按数值列对齐。",
  },
  "zh-Hant": {
    columnAlign: "欄對齊",
    alignLeft: "靠左",
    alignCenter: "置中",
    alignRight: "靠右",
    siunitxHint: "啟用 siunitx 時會優先依數值欄對齊。",
  },
  ko: {
    columnAlign: "열 정렬",
    alignLeft: "왼쪽",
    alignCenter: "가운데",
    alignRight: "오른쪽",
    siunitxHint: "siunitx가 켜져 있으면 숫자 열 정렬을 우선합니다.",
  },
  es: {
    columnAlign: "Alineación de columnas",
    alignLeft: "Izquierda",
    alignCenter: "Centro",
    alignRight: "Derecha",
    siunitxHint: "Con siunitx, se prioriza la alineación numérica.",
  },
  de: {
    columnAlign: "Spaltenausrichtung",
    alignLeft: "Links",
    alignCenter: "Zentriert",
    alignRight: "Rechts",
    siunitxHint: "Bei siunitx bleibt die numerische Ausrichtung vorrangig.",
  },
}
