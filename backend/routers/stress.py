from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.market_data import get_returns
from services.quant import var_historical, cvar_historical
import numpy as np
import pandas as pd
import yfinance as yf

router = APIRouter()

class PortfolioIn(BaseModel):
    tickers: list[str]
    weights: list[float]
    period:  str = "1y"

CRISIS_PERIODS = {
    "gfc_2008":     ("2008-09-01", "2009-03-31", "2008 Global Financial Crisis"),
    "covid_2020":   ("2020-02-19", "2020-03-23", "COVID-19 Flash Crash"),
    "dotcom_2000":  ("2000-03-24", "2002-10-09", "Dot-com Bubble Burst"),
    "rates_2022":   ("2022-01-01", "2022-12-31", "2022 Fed Rate Hike Cycle"),
    "eu_debt_2011": ("2011-07-01", "2011-10-04", "2011 EU Sovereign Debt Crisis"),
}

def _fetch_period_return(tickers: list[str], weights: np.ndarray, start: str, end: str) -> dict:
    try:
        all_t = list(set(tickers + ["SPY"]))
        raw   = yf.download(all_t, start=start, end=end, auto_adjust=True, progress=False, threads=True)

        if isinstance(raw.columns, pd.MultiIndex):
            prices = raw["Close"]
        else:
            prices = raw[["Close"]].copy()
            prices.columns = all_t[:1]

        prices = prices.dropna(axis=1, how="all").ffill().dropna()

        if len(prices) < 5:
            raise ValueError("Insufficient data")

        available = [t for t in tickers if t in prices.columns]
        if not available:
            raise ValueError("No ticker data")

        avail_w = np.array([weights[tickers.index(t)] for t in available])
        avail_w = avail_w / avail_w.sum()

        total_ret  = (prices[available].iloc[-1] / prices[available].iloc[0] - 1).values
        port_return = float(avail_w @ total_ret)

        daily      = np.log(prices[available] / prices[available].shift(1)).dropna()
        port_daily = daily.values @ avail_w
        worst_day  = float(np.min(port_daily))
        vol_period = float(np.std(port_daily, ddof=1) * np.sqrt(252))

        spy_return = None
        if "SPY" in prices.columns:
            spy_return = float(prices["SPY"].iloc[-1] / prices["SPY"].iloc[0] - 1)

        return {
            "portfolio_return":      port_return,
            "worst_single_day":      worst_day,
            "annualised_vol_during": vol_period,
            "spy_return":            spy_return,
            "data_available":        True,
            "n_trading_days":        len(prices),
        }
    except Exception:
        return {
            "portfolio_return":      None,
            "worst_single_day":      None,
            "annualised_vol_during": None,
            "spy_return":            None,
            "data_available":        False,
            "n_trading_days":        0,
        }


@router.post("/")
def run_stress_test(body: PortfolioIn):
    if abs(sum(body.weights) - 1.0) > 0.02:
        raise HTTPException(400, "Weights must sum to 1.0")

    weights = np.array(body.weights)

    # 1. Historical crisis scenarios
    crisis_results = []
    for key, (start, end, label) in CRISIS_PERIODS.items():
        data = _fetch_period_return(body.tickers, weights, start, end)
        crisis_results.append({"key": key, "label": label, "window": f"{start} → {end}", **data})

    # 2. Rate shock sensitivity (equity duration approximation)
    equity_duration = 18.0  # proxy for blended growth portfolio
    rate_shocks = []
    for bps, delta_r in [(100, 0.01), (200, 0.02), (300, 0.03), (-100, -0.01)]:
        impact = -equity_duration * delta_r / (1 + 0.05)
        rate_shocks.append({
            "label":             f"{'+' if bps > 0 else ''}{bps}bps",
            "delta_r":           delta_r,
            "estimated_impact":  impact,
        })

    # 3. Volatility sensitivity on VaR/CVaR
    try:
        returns_df   = get_returns(body.tickers, body.period)
        port_returns = returns_df.values @ weights
        base_var95   = float(var_historical(port_returns, 0.95))
        base_cvar95  = float(cvar_historical(port_returns, 0.95))
        base_vol     = float(np.std(port_returns, ddof=1) * np.sqrt(252))

        vol_sensitivity = []
        for mult, label in [(0.5, "−50% vol"), (1.5, "+50% vol"), (2.0, "+100% vol (crisis)")]:
            shocked = port_returns * mult
            vol_sensitivity.append({
                "label":          label,
                "var_95":         float(var_historical(shocked, 0.95)),
                "cvar_95":        float(cvar_historical(shocked, 0.95)),
                "annualised_vol": float(np.std(shocked, ddof=1) * np.sqrt(252)),
            })
    except Exception:
        base_var95 = base_cvar95 = base_vol = 0.0
        vol_sensitivity = []

    return {
        "crisis_scenarios": crisis_results,
        "rate_shocks":       rate_shocks,
        "vol_sensitivity":   vol_sensitivity,
        "base_var_95":       base_var95,
        "base_cvar_95":      base_cvar95,
        "base_vol":          base_vol,
    }