import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ── Prompts ───────────────────────────────────────────────────────────────────
_INSIGHTS_SYSTEM = """You are a quantitative finance analyst at a top-tier investment bank.
Translate raw portfolio risk metrics into clear, context-aware insights.
Rules: reference actual numbers, flag biggest risks first, 4–6 sentences,
no bullet points, professional but accessible language."""

_VALIDATION_SYSTEM = """You are a model validation analyst at a risk management desk.
Produce a concise draft model validation report structured exactly as:
1. Executive Summary (2 sentences)
2. Model Assumptions & Limitations (3–4 bullet points)
3. Backtesting Results (2–3 sentences interpreting breach counts)
4. Statistical Findings (2 sentences on normality tests)
5. Recommendations (2–3 bullet points)
Be precise, reference actual numbers, use professional risk management language."""


# ── AI Insights ───────────────────────────────────────────────────────────────
def generate_insights(metrics: dict) -> str:
    tickers_str = ", ".join(
        f"{t} ({w*100:.1f}%)" for t, w in zip(metrics["tickers"], metrics["weights"])
    )
    prompt = f"""
Portfolio: {tickers_str}  |  Period: {metrics['period']}
Expected Annual Return (CAPM): {metrics['expected_annual_return']*100:.2f}%
Annualised Volatility:         {metrics['volatility']*100:.2f}%
Sharpe Ratio:                  {metrics['sharpe_ratio']:.3f}
Portfolio Beta (vs S&P 500):   {metrics['portfolio_beta']:.3f}
Daily VaR 95%:                 {metrics['var_95']*100:.3f}%
Daily CVaR 95%:                {metrics['cvar_95']*100:.3f}%
"""
    try:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": _INSIGHTS_SYSTEM},
                      {"role": "user",   "content": prompt}],
            temperature=0.4, max_tokens=400,
        )
        return r.choices[0].message.content.strip()
    except Exception:
        ret  = metrics["expected_annual_return"] * 100
        vol  = metrics["volatility"] * 100
        sr   = metrics["sharpe_ratio"]
        beta = metrics["portfolio_beta"]
        var  = metrics["var_95"] * 100
        cvar = metrics["cvar_95"] * 100
        q    = "strong" if sr > 1 else "moderate" if sr > 0.5 else "weak"
        rl   = "high" if beta > 1.3 else "moderate" if beta > 0.8 else "low"
        return (
            f"Your portfolio targets a {ret:.1f}% annualised return with {vol:.1f}% volatility, "
            f"yielding a {q} Sharpe ratio of {sr:.2f}. "
            f"With a market beta of {beta:.2f}, you carry {rl} systematic market exposure. "
            f"Your 95% daily VaR of {var:.2f}% implies potential tail losses reaching {cvar:.2f}% (CVaR). "
            f"{'Consider reviewing concentration risk given elevated beta.' if beta > 1.2 else 'The portfolio appears reasonably diversified based on current metrics.'}"
        )


# ── Validation Report ─────────────────────────────────────────────────────────
def generate_validation_report(metrics: dict) -> str:
    tickers_str = ", ".join(
        f"{t} ({w*100:.1f}%)" for t, w in zip(metrics["tickers"], metrics["weights"])
    )
    prompt = f"""
Portfolio: {tickers_str}
Observation period: {metrics['period']} ({metrics['n']} trading days)

Model outputs:
- Historical VaR 95%:  {metrics['hist_var95']*100:.4f}%
- Historical VaR 99%:  {metrics['hist_var99']*100:.4f}%
- Parametric VaR 95%:  {metrics['param_var95']*100:.4f}%
- Parametric VaR 99%:  {metrics['param_var99']*100:.4f}%
- Historical CVaR 95%: {metrics['hist_cvar95']*100:.4f}%

Backtesting (Kupiec POF):
- VaR 95% breach rate: {metrics['breach_rate_95']*100:.2f}% (expected 5.00%) — {'PASS' if metrics['var95_pass'] else 'FAIL'}
- VaR 99% backtest: {'PASS' if metrics['var99_pass'] else 'FAIL'}
- Actual breaches (95%): {metrics['breaches_95']} / {metrics['n']} days

Normality tests:
- KS test: stat={metrics['ks_stat']:.4f}, p={metrics['ks_pvalue']:.4f}
- Jarque-Bera: stat={metrics['jb_stat']:.4f}, p={metrics['jb_pvalue']:.4f}
- Normality: {'REJECTED — fat tails present' if metrics['normality_rejected'] else 'NOT REJECTED'}

Portfolio metrics:
- Annualised return: {metrics['expected_annual_return']*100:.2f}%
- Annualised vol:    {metrics['volatility']*100:.2f}%
- Sharpe ratio:      {metrics['sharpe_ratio']:.3f}
- Beta:              {metrics['portfolio_beta']:.3f}
"""
    try:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": _VALIDATION_SYSTEM},
                      {"role": "user",   "content": prompt}],
            temperature=0.3, max_tokens=700,
        )
        return r.choices[0].message.content.strip()
    except Exception:
        breach_ok  = "within acceptable bounds" if metrics["var95_pass"] else "elevated — model may underestimate tail risk"
        norm_note  = ("returns exhibit significant non-normality (fat tails); parametric VaR unreliable"
                      if metrics["normality_rejected"] else
                      "returns do not significantly deviate from normality; parametric VaR is appropriate")
        return f"""**1. Executive Summary**
This report validates the historical simulation VaR model for a {len(metrics['tickers'])}-asset portfolio over {metrics['n']} trading days ({metrics['period']}). The model demonstrates {'adequate' if metrics['var95_pass'] else 'insufficient'} predictive accuracy under the Kupiec backtesting criterion.

**2. Model Assumptions & Limitations**
- Historical simulation assumes future returns mirror the past observation window — regime shifts are not captured
- CAPM expected return assumes a linear single-factor relationship with market beta (ignores size/value premia)
- Constant correlation structure — does not reflect correlation breakdown during stress events
- No liquidity adjustment — assumes positions can be liquidated at mark-to-market prices

**3. Backtesting Results**
The VaR 95% model recorded {metrics['breaches_95']} breaches ({metrics['breach_rate_95']*100:.2f}%) against an expected 5.00% over {metrics['n']} observations — {breach_ok}. The VaR 99% model {'passes' if metrics['var99_pass'] else 'fails'} the Kupiec test, suggesting {'adequate' if metrics['var99_pass'] else 'inadequate'} tail risk capture at the higher confidence level.

**4. Statistical Findings**
The Kolmogorov-Smirnov test (p={metrics['ks_pvalue']:.4f}) and Jarque-Bera test (p={metrics['jb_pvalue']:.4f}) indicate {norm_note}. This directly affects the reliability of parametric VaR estimates relative to historical simulation.

**5. Recommendations**
- {'Adopt CVaR as the primary risk metric given evidence of fat tails' if metrics['normality_rejected'] else 'Parametric VaR remains reliable; monitor for regime changes'}
- Extend the observation window beyond {metrics['period']} to capture multiple market cycles and stress regimes
- Implement GARCH-based time-varying volatility to improve VaR responsiveness during high-vol periods"""