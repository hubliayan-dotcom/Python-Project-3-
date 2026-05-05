from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from python_engine.main import run_pipeline
import os

app = FastAPI(title="MarketMind API")

class BacktestRequest(BaseModel):
    ticker: str
    short_window: Optional[int] = 20
    long_window: Optional[int] = 50

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/analyze/{ticker}")
def analyze(ticker: str):
    df, bt = run_pipeline(ticker)
    if df is None:
        raise HTTPException(status_code=500, detail="Analysis failed")
    
    return {
        "ticker": ticker,
        "latest_close": float(df['Close'].iloc[-1]),
        "volatility": float(df['Volatility_30'].iloc[-1]),
        "backtest_return": float(bt['total_return_pct'])
    }

@app.get("/report/{ticker}")
def get_report(ticker: str):
    report_path = "reports/stock_analysis_report.md"
    if not os.path.exists(report_path):
        run_pipeline(ticker)
    
    with open(report_path, "r") as f:
        content = f.read()
    return {"report": content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
