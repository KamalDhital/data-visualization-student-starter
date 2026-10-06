// One cleaned row from the finance CSV after parsing strings into chart-friendly values.
export interface FinanceDatum {
  date: Date;
  symbol: string;
  close: number;
  volume: number;
}

// A stock symbol and all of its daily values, sorted by date.
export interface FinanceSeries {
  symbol: string;
  values: FinanceDatum[];
}

// A finance row with its indexed value relative to the selected baseline date.
export interface IndexedPoint extends FinanceDatum {
  ratio: number;
}
