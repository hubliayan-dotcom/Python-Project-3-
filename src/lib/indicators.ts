import { SMA, RSI, MACD, BollingerBands } from 'technicalindicators';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adj_close?: number;
}

export interface Indicators {
  date: string;
  sma20: number;
  sma50: number;
  rsi14: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
}

export function calculateIndicators(candles: Candle[]): Indicators[] {
  const closes = candles.map(c => c.close);
  const dates = candles.map(c => c.date);

  const sma20 = SMA.calculate({ period: 20, values: closes });
  const sma50 = SMA.calculate({ period: 50, values: closes });
  const rsi14 = RSI.calculate({ period: 14, values: closes });
  const macd = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const bb = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });

  // Align dates (most indicators consume some initial data)
  const results: Indicators[] = [];
  
  // We need at least the slow period or max period for all to be ready
  // SMA50 is the longest lag here.
  for (let i = 0; i < dates.length; i++) {
    // Index mapping for indicators that start later
    const sma20Idx = i - (20 - 1);
    const sma50Idx = i - (50 - 1);
    const rsi14Idx = i - (14 - 1);
    const macdIdx = i - (26 + 9 - 2); // MACD lag is roughly slowPeriod + signalPeriod
    const bbIdx = i - (20 - 1);

    if (sma50Idx >= 0) {
      const m = macd[macdIdx];
      results.push({
        date: dates[i],
        sma20: sma20[sma20Idx],
        sma50: sma50[sma50Idx],
        rsi14: rsi14[rsi14Idx],
        macd: {
          macd: m?.MACD || 0,
          signal: m?.signal || 0,
          histogram: m?.histogram || 0
        },
        bb: bb[bbIdx] || { upper: 0, middle: 0, lower: 0 }
      });
    }
  }

  return results;
}

export function aggregateCandles(dailyCandles: Candle[], timeframe: string): Candle[] {
  if (timeframe === 'daily') return dailyCandles;
  
  const groups = new Map<string, Candle[]>();
  dailyCandles.forEach(c => {
    let key: string;
    const date = new Date(c.date);
    if (timeframe === 'weekly') {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      key = `${d.getUTCFullYear()}-W${weekNo}`;
    } else { // monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(c);
  });
  
  const aggregated: Candle[] = [];
  groups.forEach((items) => {
    items.sort((a,b) => a.date.localeCompare(b.date));
    const first = items[0];
    const last = items[items.length - 1];
    
    aggregated.push({
      date: last.date,
      open: first.open,
      high: Math.max(...items.map(i => i.high)),
      low: Math.min(...items.map(i => i.low)),
      close: last.close,
      volume: items.reduce((sum, i) => sum + i.volume, 0),
      adj_close: last.adj_close
    });
  });
  
  return aggregated.sort((a,b) => a.date.localeCompare(b.date));
}
