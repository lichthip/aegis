from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.market_data import get_returns
from services.quant import var_historical, cvar_historical
import numpy as np
from scipy.stats import skew, kurtosis

router = APIRouter()

class PortfolioIn(BaseModel):
    tickers: list[str]
    weights: list[float]
    period:  str = "1y"

# Historical stress scenario shocks (empirically estimated peak drawdowns)
STRESS_SCENARIOS = {
    "stress_2008":       -0.38,   # S&P 500 peak-to-trough ~38% in GFC window
    "stress_2020":       -0.34,   # COVID crash ~34% in ~33 days
    "stress_rate_hike":  -0.12,   # Equity repricing on +200bps (duration proxy)
}

@router.post("/")
def get_risk(body: PortfolioIn):
    if abs(sum(body.weights) - 1.0) > 0.02:
        raise HTTPException(400, "Weights must sum to 1.0")

    try:
        returns_df = get_returns(body.tickers, body.period)
    except Exception as e:
        raise HTTPException(502, f"Market data error: {e}")

    weights = np.array(body.weights)
    port_returns = returns_df.values @ weights

    # ── VaR / CVaR at 95% and 99% ────────────────────────────────────────────
    var95  = var_historical(port_returns, 0.95)
    var99  = var_historical(port_returns, 0.99)
    cvar95 = cvar_historical(port_returns, 0.95)
    cvar99 = cvar_historical(port_returns, 0.99)

    # ── Max drawdown ──────────────────────────────────────────────────────────
    cumulative = np.cumprod(1 + port_returns)
    rolling_max = np.maximum.accumulate(cumulative)
    drawdowns = (cumulative - rolling_max) / rolling_max
    max_drawdown = float(np.min(drawdowns))

    # ── Distribution statistics ───────────────────────────────────────────────
    daily_std  = float(np.std(port_returns, ddof=1))
    skewness   = float(skew(port_returns))
    # excess kurtosis (normal = 0 in scipy's fisher=True default)
    kurt       = float(kurtosis(port_returns, fisher=True))

    # ── Stress tests: apply scenario shock scaled by portfolio beta proxy ─────
    # Use portfolio volatility relative to market as a scaling factor
    market_vol_proxy = 0.20 / np.sqrt(252)  # ~20% annualised market vol
    port_vol_daily   = daily_std
    beta_proxy       = port_vol_daily / market_vol_proxy

    stress_results = {
        k: float(v * beta_proxy)
        for k, v in STRESS_SCENARIOS.items()
    }

    return {
        "var_95":           float(var95),
        "var_99":           float(var99),
        "cvar_95":          float(cvar95),
        "cvar_99":          float(cvar99),
        "max_drawdown":     max_drawdown,
        "daily_returns_std":daily_std,
        "skewness":         skewness,
        "kurtosis":         kurt,
        **stress_results,
    }