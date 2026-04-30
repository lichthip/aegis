from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.market_data import get_returns
from services.quant import portfolio_volatility
import numpy as np

router = APIRouter()

class SimulateIn(BaseModel):
    tickers:       list[str]
    weights:       list[float]
    period:        str   = "1y"
    days:          int   = 252
    simulations:   int   = 500
    initial_value: float = 10000.0

@router.post("/")
def run_simulation(body: SimulateIn):
    if abs(sum(body.weights) - 1.0) > 0.02:
        raise HTTPException(400, "Weights must sum to 1.0")
    if body.simulations > 2000:
        raise HTTPException(400, "Max 2000 simulations")

    try:
        returns_df = get_returns(body.tickers, body.period)
    except Exception as e:
        raise HTTPException(502, f"Market data error: {e}")

    weights = np.array(body.weights)
    port_returns = returns_df.values @ weights

    # Calibrate GBM parameters from historical data
    mu    = float(np.mean(port_returns))       # daily mean return
    sigma = float(np.std(port_returns, ddof=1))# daily volatility

    dt = 1  # 1 trading day per step
    N  = body.days
    M  = body.simulations
    S0 = body.initial_value

    # Geometric Brownian Motion:
    # S(t+1) = S(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
    rng = np.random.default_rng(42)
    Z   = rng.standard_normal((M, N))

    drift     = (mu - 0.5 * sigma ** 2) * dt
    diffusion = sigma * np.sqrt(dt) * Z

    log_returns = drift + diffusion                   # (M, N)
    cum_returns = np.exp(np.cumsum(log_returns, axis=1))  # (M, N)

    # Prepend S0 to each path → shape (M, N+1)
    paths = np.hstack([
        np.full((M, 1), S0),
        S0 * cum_returns
    ])

    final_values = paths[:, -1]

    # Downsample paths to 200 for response size
    sample_idx = np.random.choice(M, min(200, M), replace=False)
    sampled_paths = paths[sample_idx].tolist()

    return {
        "paths":          sampled_paths,
        "mean_final":     float(np.mean(final_values)),
        "median_final":   float(np.median(final_values)),
        "percentile_5":   float(np.percentile(final_values, 5)),
        "percentile_95":  float(np.percentile(final_values, 95)),
        "prob_loss":      float(np.mean(final_values < S0)),
        "initial_value":  S0,
        "mu_daily":       mu,
        "sigma_daily":    sigma,
        "days":           N,
        "simulations":    M,
    }