import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[app] render error", error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <h1 className="text-lg font-semibold">画面の表示でエラーが発生しました</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            サーバーを再起動しても直らない場合は、以下のエラー内容を確認してください。
          </p>
          <pre className="mt-4 overflow-auto rounded-md bg-background p-3 text-xs">
            {this.state.error.message}
          </pre>
        </div>
      </main>
    )
  }
}
