import yfinance as yf
import pandas as pd
import numpy as np

def get_prices(tickers: list[str], period: str = "1y") -> pd.DataFrame:
    """
    Fetch adjusted closing prices for a list of tickers via yfinance.
    Returns a DataFrame indexed by date, columns = tickers.
    """
    if not tickers:
        raise ValueError("No tickers provided")

    raw = yf.download(
        tickers,
        period=period,
        auto_adjust=True,
        progress=False,
        threads=True,
    )

    # yfinance returns MultiIndex when multiple tickers
    if isinstance(raw.columns, pd.MultiIndex):
        prices = raw["Close"]
    else:
        prices = raw[["Close"]] if "Close" in raw.columns else raw
        if len(tickers) == 1:
            prices.columns = tickers

    # Drop any columns that came back entirely empty
    prices = prices.dropna(axis=1, how="all")

    # Forward-fill minor gaps (weekends, holidays already excluded by yf)
    prices = prices.ffill().dropna()

    missing = [t for t in tickers if t not in prices.columns]
    if missing:
        raise ValueError(f"Could not fetch data for: {missing}")

    return prices


def get_returns(tickers: list[str], period: str = "1y") -> pd.DataFrame:
    """
    Compute simple daily log returns from adjusted close prices.
    Returns a DataFrame of daily returns with no NaNs.
    """
    prices  = get_prices(tickers, period)
    returns = np.log(prices / prices.shift(1)).dropna()
    return returns


def get_risk_free_rate() -> float:
    """
    Fetch the approximate US 3-month T-bill yield as a proxy for risk-free rate.
    Falls back to 5% if unavailable.
    """
    try:
        tbill = yf.Ticker("^IRX")
        hist  = tbill.history(period="5d")
        if not hist.empty:
            rate = float(hist["Close"].iloc[-1]) / 100
            return rate
    except Exception:
        pass
    return 0.05