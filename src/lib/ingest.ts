import YahooFinance from 'yahoo-finance2';
import { getDb, saveDb } from './db.ts';
import { calculateIndicators, Candle } from './indicators.ts';

const yahooFinance = new (YahooFinance as any)();

export async function fetchStockData(ticker: string, period = '10y'): Promise<Candle[]> {
  // Normalize ticker: remove accidental trailing dots or whitespace
  const cleanTicker = ticker.trim().replace(/\.+$/, '').toUpperCase();
  try {
    const result = (await yahooFinance.historical(cleanTicker, {
      period1: '2015-01-01',
      period2: new Date().toISOString().split('T')[0], // Use today's date string
      interval: '1d'
    })) as any[];

    if (!result || result.length === 0) {
      throw new Error(`No data found for ${cleanTicker}. The symbol might be delisted or incorrect.`);
    }

    return result.map(q => ({
      date: q.date instanceof Date ? q.date.toISOString().split('T')[0] : String(q.date),
      open: typeof q.open === 'number' ? q.open : (q.open !== null && q.open !== undefined ? Number(q.open) : null),
      high: typeof q.high === 'number' ? q.high : (q.high !== null && q.high !== undefined ? Number(q.high) : null),
      low: typeof q.low === 'number' ? q.low : (q.low !== null && q.low !== undefined ? Number(q.low) : null),
      close: typeof q.close === 'number' ? q.close : (q.close !== null && q.close !== undefined ? Number(q.close) : null),
      volume: typeof q.volume === 'number' ? q.volume : (q.volume !== null && q.volume !== undefined ? Number(q.volume) : null),
      adj_close: typeof (q.adjClose ?? q.close) === 'number' ? (q.adjClose ?? q.close) : ((q.adjClose ?? q.close) !== null && (q.adjClose ?? q.close) !== undefined ? Number(q.adjClose ?? q.close) : null)
    }));
  } catch (error: any) {
    console.error(`Error fetching data for ${cleanTicker}:`, error);
    if (error.message && error.message.includes("No data found")) {
      throw new Error(`Symbol "${cleanTicker}" not found. Please check the ticker symbol (e.g., AAPL, BTC-USD).`);
    }
    if (error.errors) {
       console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
    }
    throw error;
  }
}

const safeBind = (vals: any[]) => {
  return vals.map(v => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'number' && !Number.isFinite(v)) return null;
    return v;
  });
};

export async function upsertMarketData(ticker: string) {
  const cleanTicker = ticker.trim().replace(/\.+$/, '').toUpperCase();
  const candles = await fetchStockData(cleanTicker);
  const indicators = calculateIndicators(candles);
  const db = await getDb();

  try {
    db.run("BEGIN TRANSACTION");

    const stmtCandle = `
      INSERT OR REPLACE INTO candles_daily (ticker, date, open, high, low, close, adj_close, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const c of candles) {
      const params = safeBind([cleanTicker, c.date, c.open, c.high, c.low, c.close, c.adj_close, c.volume]);
      try {
        db.run(stmtCandle, params);
      } catch (e) {
        console.error(`Error inserting candle for ${cleanTicker} on ${c.date}. Params:`, JSON.stringify(params), e);
        throw e;
      }
    }

    const stmtInd = `
      INSERT OR REPLACE INTO indicators_daily (ticker, date, sma20, sma50, rsi14, macd, macd_signal, macd_hist, bb_upper, bb_mid, bb_lower)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const ind of indicators) {
      const params = safeBind([
        cleanTicker, ind.date, ind.sma20, ind.sma50, ind.rsi14, 
        ind.macd.macd, ind.macd.signal, ind.macd.histogram,
        ind.bb.upper, ind.bb.middle, ind.bb.lower
      ]);
      try {
        db.run(stmtInd, params);
      } catch (e) {
        console.error(`Error inserting indicators for ${cleanTicker} on ${ind.date}. Params:`, JSON.stringify(params), e);
        throw e;
      }
    }

    db.run("COMMIT");
    saveDb();
    
    return { candles: candles.length, indicators: indicators.length };
  } catch (err) {
    try { db.run("ROLLBACK"); } catch(e) {}
    throw err;
  }
}
