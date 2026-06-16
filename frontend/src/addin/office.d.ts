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
      getSelectedRanges(): RangeAreas
    }

    interface RangeAreas {
      address: string
      areas: RangeCollection
      load(properties: string | string[]): void
    }

    interface RangeCollection {
      items: Range[]
      load(properties: string | string[]): void
    }

    interface Range {
      address: string
      values: unknown[][]
      rowCount: number
      columnCount: number
      rowIndex: number
      columnIndex: number
      isNullObject?: boolean
      getUsedRangeOrNullObject(valuesOnly?: boolean): Range
      load(properties: string | string[]): void
    }
  }
}
