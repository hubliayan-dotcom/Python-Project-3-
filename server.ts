import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDb, getDb } from "./src/lib/db.ts";
import { upsertMarketData } from "./src/lib/ingest.ts";
import { runSmaBacktest } from "./src/lib/backtest.ts";
import { aggregateCandles, calculateIndicators } from "./src/lib/indicators.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  console.log("Initializing database...");
  await initDb();
  console.log("Database initialized.");

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      const db = await getDb();
      res.json({ status: "ok", db: "connected" });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });

  // API Routes
  app.post("/api/refresh/:ticker", async (req, res) => {
    console.log(`POST /api/refresh/${req.params.ticker}`);
    try {
      const ticker = req.params.ticker.toUpperCase();
      const stats = await upsertMarketData(ticker);
      res.json({ ok: true, ticker, stats });
    } catch (error: any) {
      console.error(`Error refreshing ${req.params.ticker}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chart/:ticker", async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const timeframe = (req.query.timeframe as string) || 'daily';
    const days = parseInt(req.query.days as string) || 252;
    console.log(`GET /api/chart/${ticker} [${timeframe}]`);

    try {
      const db = await getDb();
      
      if (timeframe === 'daily') {
        const query = `
          SELECT c.date, c.open, c.high, c.low, c.close, c.volume, 
                 i.sma20, i.sma50, i.rsi14, i.macd, i.macd_signal, i.macd_hist,
                 i.bb_upper, i.bb_mid, i.bb_lower
          FROM candles_daily c
          LEFT JOIN indicators_daily i ON i.ticker = c.ticker AND i.date = c.date
          WHERE c.ticker = ?
          ORDER BY c.date DESC
          LIMIT ?
        `;

        const result = db.exec(query, [ticker, days]);
        if (result.length === 0 || !result[0].values) {
          return res.json([]);
        }

        const { columns, values } = result[0];
        const rows = values.map((v: any[]) => {
          const obj: any = {};
          columns.forEach((colIdx: string, i: number) => {
            obj[colIdx] = v[i];
          });
          return obj;
        });

        return res.json(rows.reverse());
      } else {
        const query = `SELECT * FROM candles_daily WHERE ticker = ? ORDER BY date ASC`;
        const result = db.exec(query, [ticker]);
        if (result.length === 0 || !result[0].values) {
          return res.json([]);
        }

        const colNames = result[0].columns;
        const dailyCandles = result[0].values.map((v: any[]) => {
          const obj: any = {};
          colNames.forEach((c: any, i: number) => obj[c] = v[i]);
          return obj;
        });

        const aggregated = aggregateCandles(dailyCandles, timeframe);
        const indicators = calculateIndicators(aggregated);

        const final = aggregated.map(c => {
          const ind = indicators.find(i => i.date === c.date);
          return {
            ...c,
            sma20: ind?.sma20 || null,
            sma50: ind?.sma50 || null,
            rsi14: ind?.rsi14 || null,
            macd: ind?.macd.macd || null,
            macd_signal: ind?.macd.signal || null,
            macd_hist: ind?.macd.histogram || null,
            bb_upper: ind?.bb.upper || null,
            bb_mid: ind?.bb.middle || null,
            bb_lower: ind?.bb.lower || null
          };
        });

        const limit = timeframe === 'weekly' ? Math.ceil(days / 5) : Math.ceil(days / 20);
        return res.json(final.slice(-(limit + 50)));
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/backtest/sma", async (req, res) => {
    const { ticker, feeBps } = req.body;
    console.log(`POST /api/backtest/sma for ${ticker}`);
    try {
      const stats = await runSmaBacktest(ticker.toUpperCase(), feeBps || 5);
      res.json({ stats });
    } catch (error: any) {
      console.error(`Error running backtest for ${ticker}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
