# Aegis — Portfolio Intelligence & Risk Simulation Platform

> Full-stack quantitative finance platform built for aspiring quant, SWE, and fintech roles.

| | |
|---|---|
| 🌐 **Live Demo** | [aegis-finance-sg.vercel.app](https://aegis-finance-sg.vercel.app) |
| 📡 **API Docs** | [aegis-7qsn.onrender.com/docs](https://aegis-7qsn.onrender.com/docs) |
| 💻 **Source Code** | [github.com/YOUR_USERNAME/aegis](https://github.com/YOUR_USERNAME/aegis) |

---

## What It Does

Aegis lets users build a stock portfolio and immediately understand its risk profile — powered by **real market data from Yahoo Finance**, not mock numbers.

| Module | Description |
|---|---|
| 📊 **Portfolio Builder** | Add any listed ticker (e.g. SPY, AAPL, JPM) with custom weights |
| 📈 **Metrics Dashboard** | CAPM expected return, Sharpe ratio, Beta vs S&P 500, VaR, CVaR |
| 🎲 **Monte Carlo Simulator** | 500+ GBM paths, probability of loss, 5th/95th percentile outcomes |
| 📉 **Options Pricer** | Black-Scholes call/put pricing + full Greeks (Δ, Γ, ν, Θ, ρ) |
| 🛡️ **Risk Analysis** | VaR/CVaR at 95%/99%, max drawdown, skewness, kurtosis, 2008/2020 stress tests |
| 🤖 **AI Insights** | Translates quant metrics into plain-English risk explanations |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI (Python), yfinance, NumPy, SciPy |
| Quant Engine | CAPM, Geometric Brownian Motion, Black-Scholes, Historical VaR |
| AI Layer | OpenAI GPT-4o-mini (with data-driven fallback) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Quant Finance Concepts Implemented

- **CAPM** — `E[R] = Rf + β(Rm - Rf)` for expected return estimation
- **Covariance Matrix** — `σ²p = wᵀΣw` for portfolio variance
- **Sharpe Ratio** — risk-adjusted return vs risk-free rate
- **Geometric Brownian Motion** — `dS = μS dt + σS dW` for Monte Carlo paths
- **Black-Scholes** — European option pricing with closed-form Greeks
- **Historical VaR/CVaR** — tail risk quantification at 95% and 99% confidence
- **Stress Testing** — 2008 GFC, COVID crash, +200bps rate hike scenarios

---

## Local Development

### Prerequisites
- Node.js 18+ and Python 3.11+

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend live at `http://localhost:8000`  
Swagger UI at `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```

App live at `http://localhost:3000`

---

## Project Structure

```
aegis/
├── frontend/                  # Next.js 16 + TypeScript
│   └── src/
│       ├── app/               # Pages: portfolio, simulate, options, risk, insights
│       ├── components/        # Navbar, MetricCard, Charts
│       ├── context/           # Global portfolio state
│       └── lib/api.ts         # All API calls to backend
│
└── backend/                   # FastAPI + Python
    ├── routers/               # metrics, simulate, options, risk, insights
    └── services/
        ├── market_data.py     # yfinance live data fetching
        ├── quant.py           # CAPM, GBM, Black-Scholes, VaR/CVaR
        └── ai_insights.py     # OpenAI + data-driven fallback
```

---
