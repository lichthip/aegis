import numpy as np
import pandas as pd
from services.market_data import get_returns

# ── CAPM Expected Return ──────────────────────────────────────────────────────
def capm_expected_return(returns_df: pd.DataFrame, weights: np.ndarray) -> float:
    """
    Weighted average of each asset's mean daily return, annualised.
    CAPM: E[R_p] = Σ w_i * E[R_i]
    """
    mean_daily_returns = returns_df.mean().values          # shape (n_assets,)
    portfolio_daily    = float(weights @ mean_daily_returns)
    return portfolio_daily * 252                            # annualise


# ── Portfolio Volatility ──────────────────────────────────────────────────────
def portfolio_volatility(returns_df: pd.DataFrame, weights: np.ndarray) -> float:
    """
    σ_p = sqrt(w^T Σ w), annualised.
    Σ = covariance matrix of daily returns.
    """
    cov_matrix = returns_df.cov().values                   # (n, n) daily cov
    variance   = float(weights @ cov_matrix @ weights)
    return np.sqrt(variance * 252)                         # annualise


# ── Sharpe Ratio ──────────────────────────────────────────────────────────────
def sharpe_ratio(port_daily_returns: np.ndarray, rf_daily: float = 0.05/252) -> float:
    """
    Sharpe = (E[R_p] - R_f) / σ_p  (annualised)
    """
    excess         = port_daily_returns - rf_daily
    mean_excess    = np.mean(excess) * 252
    std_annualised = np.std(port_daily_returns, ddof=1) * np.sqrt(252)
    if std_annualised == 0:
        return 0.0
    return float(mean_excess / std_annualised)


# ── Portfolio Beta vs SPY ─────────────────────────────────────────────────────
def portfolio_beta(
    tickers: list[str],
    weights: list[float],
    period: str,
    market_ticker: str = "SPY"
) -> float:
    """
    β_p = Σ w_i * β_i
    β_i = Cov(R_i, R_m) / Var(R_m)
    """
    try:
        all_tickers  = tickers + [market_ticker]
        all_returns  = get_returns(all_tickers, period)

        market_ret   = all_returns[market_ticker].values
        market_var   = float(np.var(market_ret, ddof=1))

        if market_var == 0:
            return 1.0

        portfolio_beta_val = 0.0
        for ticker, w in zip(tickers, weights):
            if ticker not in all_returns.columns:
                continue
            asset_ret = all_returns[ticker].values
            cov       = float(np.cov(asset_ret, market_ret, ddof=1)[0][1])
            beta_i    = cov / market_var
            portfolio_beta_val += w * beta_i

        return float(portfolio_beta_val)
    except Exception:
        return 1.0   # fallback: assume market beta


# ── Historical VaR ────────────────────────────────────────────────────────────
def var_historical(port_returns: np.ndarray, confidence: float = 0.95) -> float:
    """
    VaR at given confidence level using historical simulation.
    Returns a positive number representing the loss magnitude.
    e.g. VaR 95% = 0.018 means "1.8% daily loss at 95% confidence"
    """
    return float(-np.percentile(port_returns, (1 - confidence) * 100))


# ── Conditional VaR (Expected Shortfall) ─────────────────────────────────────
def cvar_historical(port_returns: np.ndarray, confidence: float = 0.95) -> float:
    """
    CVaR = E[loss | loss > VaR]
    Average of all returns below the VaR threshold.
    """
    threshold = np.percentile(port_returns, (1 - confidence) * 100)
    tail      = port_returns[port_returns <= threshold]
    if len(tail) == 0:
        return var_historical(port_returns, confidence)
    return float(-np.mean(tail))