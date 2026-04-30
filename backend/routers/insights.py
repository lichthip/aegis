from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.market_data import get_returns
from services.quant import (
    capm_expected_return, portfolio_volatility, sharpe_ratio,
    portfolio_beta, var_historical, cvar_historical,
)
from services.ai_insights import generate_insights
import numpy as np

router = APIRouter()

class PortfolioIn(BaseModel):
    tickers: list[str]
    weights: list[float]
    period:  str = "1y"

@router.post("/")
def get_insights(body: PortfolioIn):
    if abs(sum(body.weights) - 1.0) > 0.02:
        raise HTTPException(400, "Weights must sum to 1.0")

    try:
        returns_df = get_returns(body.tickers, body.period)
    except Exception as e:
        raise HTTPException(502, f"Market data error: {e}")

    weights     = np.array(body.weights)
    port_returns = returns_df.values @ weights
    rf_daily    = 0.05 / 252

    metrics = {
        "tickers":               body.tickers,
        "weights":               body.weights,
        "period":                body.period,
        "expected_annual_return": float(capm_expected_return(returns_df, weights)),
        "volatility":             float(portfolio_volatility(returns_df, weights)),
        "sharpe_ratio":           float(sharpe_ratio(port_returns, rf_daily)),
        "portfolio_beta":         float(portfolio_beta(body.tickers, body.weights, body.period)),
        "var_95":                 float(var_historical(port_returns, 0.95)),
        "cvar_95":                float(cvar_historical(port_returns, 0.95)),
    }

    insight_text = generate_insights(metrics)

    return {
        "insights": insight_text,
        "metrics":  metrics,
    }