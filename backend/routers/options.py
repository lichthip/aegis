from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
from scipy.stats import norm

router = APIRouter()

class OptionIn(BaseModel):
    S:     float   # Spot price
    K:     float   # Strike price
    T:     float   # Time to expiry in years
    r:     float   # Risk-free rate (annualised)
    sigma: float   # Implied volatility (annualised)

@router.post("/")
def price_option(body: OptionIn):
    S, K, T, r, sigma = body.S, body.K, body.T, body.r, body.sigma

    if T <= 0:
        raise HTTPException(400, "Time to expiry must be > 0")
    if sigma <= 0:
        raise HTTPException(400, "Volatility must be > 0")
    if S <= 0 or K <= 0:
        raise HTTPException(400, "Spot and strike must be > 0")

    # ── Black-Scholes d1 and d2 ───────────────────────────────────────────────
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    # ── Option prices ─────────────────────────────────────────────────────────
    call_price = S * norm.cdf(d1)  - K * np.exp(-r * T) * norm.cdf(d2)
    put_price  = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

    # ── Greeks ────────────────────────────────────────────────────────────────
    # Delta: sensitivity of option price to spot price
    delta_call = float(norm.cdf(d1))
    delta_put  = float(norm.cdf(d1) - 1)

    # Gamma: rate of change of delta (same for call and put)
    gamma = float(norm.pdf(d1) / (S * sigma * np.sqrt(T)))

    # Vega: sensitivity to volatility (per 1% move in sigma)
    vega = float(S * norm.pdf(d1) * np.sqrt(T) / 100)

    # Theta: time decay per calendar day
    theta_call = float(
        (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T))
         - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365
    )
    theta_put = float(
        (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T))
         + r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365
    )

    # Rho: sensitivity to risk-free rate (per 1% move in r)
    rho_call = float( K * T * np.exp(-r * T) * norm.cdf(d2)  / 100)
    rho_put  = float(-K * T * np.exp(-r * T) * norm.cdf(-d2) / 100)

    return {
        "call_price":  float(call_price),
        "put_price":   float(put_price),
        "delta_call":  delta_call,
        "delta_put":   delta_put,
        "gamma":       gamma,
        "vega":        vega,
        "theta_call":  theta_call,
        "theta_put":   theta_put,
        "rho_call":    rho_call,
        "rho_put":     rho_put,
        "d1":          float(d1),
        "d2":          float(d2),
    }