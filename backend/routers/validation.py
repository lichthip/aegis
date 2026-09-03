from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.market_data import get_returns
from services.quant import (
    capm_expected_return, portfolio_volatility, sharpe_ratio,
    portfolio_beta, var_historical, cvar_historical,
)
from services.ai_insights import generate_validation_report
import numpy as np
from scipy.stats import norm, kstest, jarque_bera

router = APIRouter()

class PortfolioIn(BaseModel):
    tickers: list[str]
    weights: list[float]
    period:  str = "1y"

@router.post("/")
def get_validation(body: PortfolioIn):
    if abs(sum(body.weights) - 1.0) > 0.02:
        raise HTTPException(400, "Weights must sum to 1.0")

    try:
        returns_df = get_returns(body.tickers, body.period)
    except Exception as e:
        raise HTTPException(502, f"Market data error: {e}")

    weights      = np.array(body.weights)
    port_returns = returns_df.values @ weights
    rf_daily     = 0.05 / 252
    n            = len(port_returns)
    mu           = float(np.mean(port_returns))
    sigma        = float(np.std(port_returns, ddof=1))

    # ── Historical VaR/CVaR ───────────────────────────────────────────────────
    hist_var95  = var_historical(port_returns, 0.95)
    hist_var99  = var_historical(port_returns, 0.99)
    hist_cvar95 = cvar_historical(port_returns, 0.95)

    # ── Parametric VaR (normal distribution assumption) ───────────────────────
    param_var95 = float(-(mu + norm.ppf(0.05) * sigma))
    param_var99 = float(-(mu + norm.ppf(0.01) * sigma))

    # ── Kupiec POF Backtesting ────────────────────────────────────────────────
    breaches_95   = int(np.sum(port_returns < -hist_var95))
    breaches_99   = int(np.sum(port_returns < -hist_var99))
    breach_rate_95 = breaches_95 / n
    breach_rate_99 = breaches_99 / n
    var95_pass    = abs(breach_rate_95 - 0.05) < 0.025
    var99_pass    = abs(breach_rate_99 - 0.01) < 0.005

    # ── Normality Tests ───────────────────────────────────────────────────────
    standardised        = (port_returns - mu) / sigma
    ks_stat, ks_pvalue  = kstest(standardised, "norm")
    jb_stat, jb_pvalue  = jarque_bera(port_returns)
    normality_rejected  = bool(ks_pvalue < 0.05)

    # ── Rolling 30-day VaR ────────────────────────────────────────────────────
    window  = 30
    rolling = []
    for i in range(window, n):
        w_ret = port_returns[i - window:i]
        rolling.append({
            "day":    i,
            "ret":    round(float(port_returns[i]), 6),
            "var_95": round(float(var_historical(w_ret, 0.95)), 6),
        })

    metrics = {
        "tickers":                body.tickers,
        "weights":                body.weights,
        "period":                 body.period,
        "n":                      n,
        "expected_annual_return": float(capm_expected_return(returns_df, weights)),
        "volatility":             float(portfolio_volatility(returns_df, weights)),
        "sharpe_ratio":           float(sharpe_ratio(port_returns, rf_daily)),
        "portfolio_beta":         float(portfolio_beta(body.tickers, body.weights, body.period)),
        "hist_var95":             float(hist_var95),
        "hist_var99":             float(hist_var99),
        "hist_cvar95":            float(hist_cvar95),
        "param_var95":            param_var95,
        "param_var99":            param_var99,
        "breaches_95":            breaches_95,
        "breach_rate_95":         breach_rate_95,
        "var95_pass":             var95_pass,
        "var99_pass":             var99_pass,
        "ks_stat":                float(ks_stat),
        "ks_pvalue":              float(ks_pvalue),
        "jb_stat":                float(jb_stat),
        "jb_pvalue":              float(jb_pvalue),
        "normality_rejected":     normality_rejected,
    }

    report = generate_validation_report(metrics)

    return {"report": report, "metrics": metrics, "rolling_var": rolling}