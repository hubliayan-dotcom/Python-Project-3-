import streamlit as st
import pandas as pd
from python_engine.main import run_pipeline
import os

st.set_page_config(page_title="MarketMind Analytics", layout="wide")

st.title("📈 MarketMind: Stock Analytics Dashboard")

ticker = st.sidebar.text_input("Enter Ticker Symbol", "AAPL").upper()
date_range = st.sidebar.date_input("Select Date Range", [])

if st.sidebar.button("Run Analysis"):
    with st.spinner(f"Analyzing {ticker}..."):
        df, bt = run_pipeline(ticker)
        
        if df is not None:
            col1, col2, col3 = st.columns(3)
            col1.metric("Latest Price", f"${df['Close'].iloc[-1]:.2f}")
            col2.metric("30d Volatility", f"{df['Volatility_30'].iloc[-1]:.2%}")
            col3.metric("Backtest Return", f"{bt['total_return_pct']:.2f}%")
            
            st.subheader("Closing Price and Moving Averages")
            st.line_chart(df[['Close', 'SMA_20', 'SMA_50']])
            
            st.subheader("Daily Returns")
            st.area_chart(df['Daily_Return'])
            
            with st.expander("View Summary Report"):
                report_path = "reports/stock_analysis_report.md"
                if os.path.exists(report_path):
                    with open(report_path, "r") as f:
                        st.markdown(f.read())
        else:
            st.error("Failed to fetch data for this ticker.")
else:
    st.info("Enter a ticker and click 'Run Analysis' to see results.")
