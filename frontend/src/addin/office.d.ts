export {}

declare global {
  const Office: {
    onReady: () => Promise<{ host?: string }>
  }

  namespace Excel {
    function run<T>(batch: (context: RequestContext) => Promise<T>): Promise<T>

    interface RequestContext {
      workbook: Workbook
      sync(): Promise<void>
    }

    interface Workbook {
      getSelectedRange(): Range
    }

    interface Range {
      address: string
      values: unknown[][]
      rowCount: number
      columnCount: number
      load(properties: string | string[]): void
    }
  }
}
