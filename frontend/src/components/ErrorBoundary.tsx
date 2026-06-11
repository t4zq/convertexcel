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
        <div className="overflow-hidden rounded-md border border-destructive/40 font-mono text-sm">
          <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-muted-foreground">
            <span className="flex gap-1">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-warning/60" />
              <span className="size-2.5 rounded-full bg-success/60" />
            </span>
            <span className="ml-1 tracking-widest uppercase">runtime error</span>
          </div>
          <div className="space-y-3 bg-card p-4">
            <p className="text-foreground/90">
              <span className="font-semibold text-destructive">error:</span> 画面の描画中に例外が発生しました。
            </p>
            <pre className="overflow-auto rounded-md bg-muted/50 p-3 text-xs text-foreground">
              {this.state.error.message}
            </pre>
            <p className="text-muted-foreground text-xs">
              <span className="text-success">$</span> サーバーを再起動しても直らない場合は、上のメッセージを添えて報告してください。
            </p>
          </div>
        </div>
      </main>
    )
  }
}
