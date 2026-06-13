import { Component, type ErrorInfo, type ReactNode } from "react"

type AddinErrorBoundaryState = {
  error: Error | null
}

export class AddinErrorBoundary extends Component<{ children: ReactNode }, AddinErrorBoundaryState> {
  state: AddinErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Excel add-in render failed", error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-semibold">アドイン画面の読み込みに失敗しました。</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{this.state.error.message}</pre>
        </div>
      </main>
    )
  }
}
