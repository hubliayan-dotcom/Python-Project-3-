import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta

def fetch_data(ticker, period='2y', fallback_path='data/sample_stock_data.csv'):
    """
    Fetches data from Yahoo Finance with a CSV fallback.
    """
    print(f"Fetching data for {ticker}...")
    try:
        data = yf.download(ticker, period=period)
        if data.empty:
            raise ValueError("No data found via Yahoo Finance")
        
        # Flatten columns if multi-index (common in newer yfinance versions)
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)
            
        data.index.name = 'Date'
        return data
    except Exception as e:
        print(f"Yahoo Finance failed: {e}. Attempting CSV fallback...")
        if os.path.exists(fallback_path):
            df = pd.read_csv(fallback_path, index_col='Date', parse_dates=True)
            # Filter for specific ticker if CSV is a shared dataset, 
            # though here we assume it's a fallback for the requested symbol
            return df
        else:
            raise FileNotFoundError(f"No fallback data found at {fallback_path}")

def clean_data(df):
    """
    Cleans stock data: handles missing values and ensures numeric types.
    """
    df = df.copy()
    df = df.ffill().bfill()
    numeric_cols = ['Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Calculate daily returns
    df['Daily_Return'] = df['Close'].pct_change()
    return df
