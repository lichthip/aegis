from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.market_data import get_returns
from services.quant import (
    capm_expected_return,
    portfolio_volatility,
    sharpe_ratio,
    portfolio_beta,
    var_historical,
    cvar_historical,
)
import numpy as np

router = APIRouter()

class PortfolioIn(BaseModel):
    tickers: list[str]
    weights: list[float]
    period: str = "1y"

@router.post("/")
def get_metrics(body: PortfolioIn):
    if abs(sum(body.weights) - 1.0) > 0.02:
        raise HTTPException(400, "Weights must sum to 1.0")

    try:
        returns_df = get_returns(body.tickers, body.period)
    except Exception as e:
        raise HTTPException(502, f"Market data error: {e}")

    weights = np.array(body.weights)

    # Portfolio daily returns as weighted sum
    port_returns = returns_df.values @ weights

    # CAPM expected return (annualised)
    exp_return = capm_expected_return(returns_df, weights)

    # Annualised volatility
    vol = portfolio_volatility(returns_df, weights)

    # Sharpe ratio (risk-free rate ~5% / 252 daily)
    rf_daily = 0.05 / 252
    sharpe = sharpe_ratio(port_returns, rf_daily)

    # Beta vs SPY
    beta = portfolio_beta(body.tickers, body.weights, body.period)

    # Risk metrics
    var95  = var_historical(port_returns, 0.95)
    cvar95 = cvar_historical(port_returns, 0.95)

    return {
        "expected_annual_return": float(exp_return),
        "volatility":             float(vol),
        "sharpe_ratio":           float(sharpe),
        "portfolio_beta":         float(beta),
        "var_95":                 float(var95),
        "cvar_95":                float(cvar95),
        "tickers":                body.tickers,
        "weights":                body.weights,
        "period":                 body.period,
    }