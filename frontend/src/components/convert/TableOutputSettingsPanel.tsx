import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/hooks/useI18n"
import type { TableSettings } from "@/lib/convert-settings"
import { tableAlignmentLabels } from "@/lib/table-alignment-labels"

interface TableOutputSettingsPanelProps {
  value: TableSettings
  onChange: (patch: Partial<TableSettings>) => void
}

export function TableOutputSettingsPanel({ value, onChange }: TableOutputSettingsPanelProps) {
  const { language, t } = useI18n()
  const alignText = tableAlignmentLabels[language]

  return (
    <div className="grid gap-4 rounded-md border bg-muted/30 p-3 sm:[grid-template-columns:minmax(180px,1fr)_minmax(180px,1fr)]">
      <div className="space-y-1">
        <Label>{alignText.columnAlign}</Label>
        <Select
          value={value.columnAlign}
          onValueChange={(v) => onChange({ columnAlign: v as TableSettings["columnAlign"] })}
          disabled={value.siunitx}
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">{alignText.alignLeft}</SelectItem>
            <SelectItem value="center">{alignText.alignCenter}</SelectItem>
            <SelectItem value="right">{alignText.alignRight}</SelectItem>
          </SelectContent>
        </Select>
        {value.siunitx && (
          <p className="text-muted-foreground text-xs">{alignText.siunitxHint}</p>
        )}
      </div>
      <div className="grid content-start gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={value.booktabs} onCheckedChange={(v) => onChange({ booktabs: v })} />
          {t.settings.booktabs}
        </label>
      </div>
    </div>
  )
}
