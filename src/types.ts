export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_upper: number | null;
  bb_mid: number | null;
  bb_lower: number | null;
}

export interface BacktestStats {
  pnl: number;
  sharpe: number;
  max_dd: number;
  trades: number;
  win_rate: number;
  curve: { date: string; value: number }[];
}
