import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a quantitative finance analyst at a top-tier investment bank.
Your role is to translate raw portfolio risk metrics into clear, concise, and 
context-aware investment insights for an informed investor.

Rules:
- Be specific — reference the actual numbers provided
- Explain what each metric means in practical terms
- Flag the most important risks first
- Suggest one or two actionable observations (not financial advice)
- Use professional but accessible language
- Keep the response to 4–6 sentences
- Do not use bullet points — write in flowing paragraphs
"""

def generate_insights(metrics: dict) -> str:
    """
    Takes computed portfolio metrics and returns an AI-generated
    plain-English risk and performance summary.
    """
    tickers_str = ", ".join(
        f"{t} ({w*100:.1f}%)"
        for t, w in zip(metrics["tickers"], metrics["weights"])
    )

    user_prompt = f"""
Analyse the following portfolio and provide a concise risk and performance summary.

Portfolio composition: {tickers_str}
Historical period used: {metrics['period']}

Key metrics:
- Expected Annual Return (CAPM): {metrics['expected_annual_return']*100:.2f}%
- Annualised Volatility:         {metrics['volatility']*100:.2f}%
- Sharpe Ratio:                  {metrics['sharpe_ratio']:.3f}
- Portfolio Beta (vs S&P 500):   {metrics['portfolio_beta']:.3f}
- Daily VaR (95%):               {metrics['var_95']*100:.3f}%
- Daily CVaR (95%):              {metrics['cvar_95']*100:.3f}%

Provide a professional risk assessment. Highlight the most significant risk 
factors, what the metrics indicate about return/risk trade-off, and one or 
two practical observations an investor should consider.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=400,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        # Graceful fallback — still useful without OpenAI key
        ret  = metrics['expected_annual_return'] * 100
        vol  = metrics['volatility'] * 100
        sr   = metrics['sharpe_ratio']
        beta = metrics['portfolio_beta']
        var  = metrics['var_95'] * 100
        cvar = metrics['cvar_95'] * 100

        quality = "strong" if sr > 1.0 else "moderate" if sr > 0.5 else "weak"
        risk_lvl = "high" if beta > 1.3 else "moderate" if beta > 0.8 else "low"

        return (
            f"Your portfolio targets a {ret:.1f}% annualised return with {vol:.1f}% volatility, "
            f"yielding a {quality} Sharpe ratio of {sr:.2f} — indicating "
            f"{'attractive' if sr > 1 else 'below-average'} risk-adjusted performance. "
            f"With a market beta of {beta:.2f}, you carry {risk_lvl} systematic market exposure, "
            f"meaning the portfolio tends to {'amplify' if beta > 1 else 'dampen'} S&P 500 moves. "
            f"Your 95% daily VaR of {var:.2f}% implies that on 1 in 20 trading days you could lose "
            f"more than this amount, with expected tail losses (CVaR) reaching {cvar:.2f}%. "
            f"{'Consider reviewing concentration risk given elevated beta.' if beta > 1.2 else 'The portfolio appears reasonably diversified based on current metrics.'}"
        )