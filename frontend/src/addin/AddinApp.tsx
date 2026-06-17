import { useExcelSelection } from "@/addin/useExcelSelection"
import { useWebAppLink } from "@/addin/useWebAppLink"
import { ImportCard } from "@/addin/components/ImportCard"
import { WebAppCard } from "@/addin/components/WebAppCard"

export function AddinApp() {
  const { officeReady, selection, loading, error, importSelection } = useExcelSelection()
  const input = selection?.tsv ?? ""
  const { shareUrl, hasContent, copied, openInWebApp, copyLink } = useWebAppLink(input)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl space-y-3 p-3">
        <header className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">Excel add-in</p>
          <h1 className="text-lg font-semibold tracking-tight">選択範囲を Web 版へ送る</h1>
          <p className="text-muted-foreground text-sm">
            Excel の表だけを取り込み、編集・プレビューは広い Web アプリで行います。
          </p>
        </header>

        <ImportCard
          officeReady={officeReady}
          selection={selection}
          loading={loading}
          error={error}
          hasContent={hasContent}
          onImport={importSelection}
        />

        <WebAppCard
          shareUrl={shareUrl}
          hasContent={hasContent}
          copied={copied}
          onOpen={openInWebApp}
          onCopy={copyLink}
        />
      </div>
    </main>
  )
}
