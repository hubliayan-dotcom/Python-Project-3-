import { getDb } from './db.ts';

export interface BacktestResult {
  pnl: number;
  sharpe: number;
  max_dd: number;
  trades: number;
  win_rate: number;
  curve: { date: string; value: number }[];
}

export async function runSmaBacktest(ticker: string, feeBps = 5): Promise<BacktestResult> {
  const db = await getDb();
  
  const query = `
    SELECT c.date, c.close, i.sma20, i.sma50
    FROM candles_daily c
    JOIN indicators_daily i ON i.ticker = c.ticker AND i.date = c.date
    WHERE c.ticker = ?
    ORDER BY c.date ASC
  `;

  const res = db.exec(query, [ticker]);
  if (res.length === 0 || !res[0].values) {
    throw new Error('No data found for backtest');
  }

  const { columns, values } = res[0];
  const rows = values.map((v: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = v[i];
    });
    return obj;
  });

  let equity = 1.0;
  let position = 0; // 0 or 1
  let trades = 0;
  let wins = 0;
  const curve: { date: string; value: number }[] = [];
  const returns: number[] = [];

  for (let i = 1; i < rows.length; i++) {
    const prevRow = rows[i - 1];
    const currentRow = rows[i];
    
    // Signal is based on prev day data to avoid look-ahead bias
    const prevSignal = prevRow.sma20 > prevRow.sma50 ? 1 : 0;
    
    const priceReturn = (currentRow.close - prevRow.close) / prevRow.close;
    
    // Transaction cost if position flips
    let cost = 0;
    if (prevSignal !== position) {
      cost = feeBps / 10000;
      trades++;
    }
    
    position = prevSignal;
    
    const dailyReturn = position * priceReturn - cost;
    equity *= (1 + dailyReturn);
    
    if (dailyReturn > 0) wins++; 
    
    returns.push(dailyReturn);
    curve.push({ date: currentRow.date, value: equity });
  }

  // Calculate Sharpe (annualized)
  const meanRet = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const stdRet = Math.sqrt(returns.map(r => Math.pow(r - meanRet, 2)).reduce((a, b) => a + b, 0) / (returns.length || 1));
  const sharpe = (meanRet / (stdRet || 1e-9)) * Math.sqrt(252);

  // Max Drawdown
  let peak = 1.0;
  let max_dd = 0;
  curve.forEach(p => {
    if (p.value > peak) peak = p.value;
    const dd = (p.value / peak) - 1;
    if (dd < max_dd) max_dd = dd;
  });

  return {
    pnl: equity - 1,
    sharpe,
    max_dd,
    trades,
    win_rate: wins / (returns.length || 1),
    curve
  };
}
