from python_engine.ingest import fetch_data, clean_data
from python_engine.indicators import add_indicators
from python_engine.backtest import run_sma_crossover
from python_engine.report import generate_charts, generate_markdown_report
import sys

def run_pipeline(ticker='AAPL'):
    try:
        # 1. Ingest
        df = fetch_data(ticker)
        df = clean_data(df)
        
        # 2. Indicators
        df = add_indicators(df)
        
        # 3. Backtest
        bt_results = run_sma_crossover(df)
        
        # 4. Report
        generate_charts(df, ticker)
        generate_markdown_report(df, bt_results, ticker)
        
        print(f"Pipeline completed successfully for {ticker}!")
        return df, bt_results
    except Exception as e:
        print(f"Pipeline failed: {e}")
        return None, None

if __name__ == "__main__":
    ticker = sys.argv[1] if len(sys.argv) > 1 else 'AAPL'
    run_pipeline(ticker)
