import { StockDataPoint, BacktestStats } from "../types.ts";

const API_BASE = "/api";

export const api = {
  async refreshData(ticker: string) {
    const res = await fetch(`${API_BASE}/refresh/${ticker}`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getChartData(ticker: string, timeframe = 'daily', days = 252): Promise<StockDataPoint[]> {
    const res = await fetch(`${API_BASE}/chart/${ticker}?timeframe=${timeframe}&days=${days}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async runBacktest(ticker: string, feeBps = 5): Promise<BacktestStats> {
    const res = await fetch(`${API_BASE}/backtest/sma`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, feeBps })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.stats;
  }
};
