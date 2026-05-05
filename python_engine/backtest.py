import pandas as pd

def run_sma_crossover(df, short_window=20, long_window=50, initial_capital=10000.0, fee=0.001):
    """
    Backtests a simple SMA crossover strategy.
    """
    signals = pd.DataFrame(index=df.index)
    signals['price'] = df['Close']
    signals['short_mavg'] = df[f'SMA_{short_window}']
    signals['long_mavg'] = df[f'SMA_{long_window}']
    
    # Create signals
    signals['signal'] = 0.0
    signals.iloc[short_window:, signals.columns.get_loc('signal')] = np.where(
        signals['short_mavg'][short_window:] > signals['long_mavg'][short_window:], 1.0, 0.0
    )
    
    # Generate trading orders
    signals['positions'] = signals['signal'].diff()
    
    # Backtest
    capital = initial_capital
    position = 0
    history = []
    
    for date, row in signals.iterrows():
        if row['positions'] == 1: # Buy
            shares_to_buy = capital // row['price']
            cost = shares_to_buy * row['price']
            transaction_fee = cost * fee
            capital -= (cost + transaction_fee)
            position += shares_to_buy
        elif row['positions'] == -1: # Sell
            revenue = position * row['price']
            transaction_fee = revenue * fee
            capital += (revenue - transaction_fee)
            position = 0
            
        total_value = capital + (position * row['price'])
        history.append(total_value)
        
    signals['total_value'] = history
    signals['returns'] = signals['total_value'].pct_change()
    
    final_return = (signals['total_value'].iloc[-1] - initial_capital) / initial_capital
    
    return {
        'final_value': signals['total_value'].iloc[-1],
        'total_return_pct': final_return * 100,
        'signals': signals
    }

import numpy as np # Needed for the np.where call above
