import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(process.cwd(), 'market.db');

let dbInstance: any = null;
let SQL: any = null;

export async function initDb() {
  if (dbInstance) return dbInstance;

  // Try to find the wasm file in node_modules
  const wasmPath = path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
  
  SQL = await initSqlJs({
    locateFile: (file) => {
      if (file.endsWith('.wasm')) return wasmPath;
      return file;
    }
  });
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Create tables if they don't exist
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS candles_daily (
      ticker TEXT,
      date TEXT,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      adj_close REAL,
      volume INTEGER,
      PRIMARY KEY (ticker, date)
    );

    CREATE TABLE IF NOT EXISTS indicators_daily (
      ticker TEXT,
      date TEXT,
      sma20 REAL,
      sma50 REAL,
      rsi14 REAL,
      macd REAL,
      macd_signal REAL,
      macd_hist REAL,
      bb_upper REAL,
      bb_mid REAL,
      bb_lower REAL,
      PRIMARY KEY (ticker, date)
    );

    CREATE TABLE IF NOT EXISTS backtests (
      id TEXT PRIMARY KEY,
      ticker TEXT,
      strategy TEXT,
      pnl REAL,
      sharpe REAL,
      max_dd REAL,
      trades INTEGER,
      win_rate REAL,
      created_at TEXT
    );
  `);

  saveDb();
  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper to interact with dbInstance
export const getDb = async () => {
  if (!dbInstance) await initDb();
  return dbInstance;
};
