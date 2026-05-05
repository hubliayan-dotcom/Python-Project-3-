import pandas as pd
import numpy as np
import ta

def add_indicators(df):
    """
    Adds SMA, RSI, MACD, and Bollinger Bands using the 'ta' library.
    """
    df = df.copy()
    
    # Moving Averages
    df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
    df['SMA_50'] = ta.trend.sma_indicator(df['Close'], window=50)
    
    # RSI
    df['RSI_14'] = ta.momentum.rsi(df['Close'], window=14)
    
    # MACD
    macd = ta.trend.MACD(df['Close'])
    df['MACD'] = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    df['MACD_Hist'] = macd.macd_diff()
    
    # Bollinger Bands
    bb = ta.volatility.BollingerBands(df['Close'])
    df['BB_Upper'] = bb.bollinger_hband()
    df['BB_Middle'] = bb.bollinger_mavg()
    df['BB_Lower'] = bb.bollinger_lband()
    
    # Volatility (Rolling Std Dev)
    df['Volatility_30'] = df['Daily_Return'].rolling(window=30).std() * np.sqrt(252)
    
    return df
