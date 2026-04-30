# Aegis — Portfolio Intelligence & Risk Simulation Platform

> Full-stack quantitative finance platform built with **Next.js 14**, **FastAPI**, and **Python**.  
> Real market data via **yfinance** · CAPM · Monte Carlo (GBM) · Black-Scholes · VaR/CVaR · AI Insights

**Live Demo:** [https://aegis-finance.vercel.app](https://aegis-finance.vercel.app) ← replace after deployment

---

## What It Does

| Module | What It Shows |
|---|---|
| **Portfolio Builder** | Build a portfolio of any tickers with custom weights |
| **Metrics Dashboard** | CAPM return, Sharpe ratio, Beta, VaR, CVaR from real data |
| **Monte Carlo Simulator** | 500+ GBM paths, probability of loss, 5th/95th percentile |
| **Options Pricer** | Black-Scholes call/put pricing + all Greeks (Δ, Γ, ν, Θ, ρ) |
| **Risk Analysis** | VaR/CVaR at 95%/99%, max drawdown, skewness, kurtosis, stress tests |
| **AI Insights** | GPT-4o-mini translates quant metrics into plain-English analysis |

---

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend:** FastAPI (Python), yfinance, NumPy, SciPy
- **AI:** OpenAI GPT-4o-mini (optional — has fallback)
- **Deploy:** Vercel (frontend) + Render (backend)

---

## Local Development (Test First)

### Prerequisites

- Node.js 18+ — [nodejs.org](https://nodejs.org)
- Python 3.11+ — [python.org](https://python.org)
- Git — [git-scm.com](https://git-scm.com)

---

### Step 1 — Clone / set up folders

```bash
# If using git
git init aegis && cd aegis

# Or just navigate to your project root where frontend/ and backend/ folders live
```

---

### Step 2 — Start the Backend

```bash
# Navigate to backend
cd backend

# Create and activate a virtual environment
python -m venv venv

# Mac/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment (copy .env is already provided)
# No changes needed to test — OpenAI key is optional

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

✅ Backend is live at: [http://localhost:8000](http://localhost:8000)  
✅ API docs at: [http://localhost:8000/docs](http://localhost:8000/docs) ← Swagger UI, great for demos

---

### Step 3 — Start the Frontend

```bash
# Open a NEW terminal tab, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create your local env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start Next.js dev server
npm run dev
```

✅ App is live at: [http://localhost:3000](http://localhost:3000)

---

### Step 4 — Test Each Feature

1. **Portfolio page** → add/adjust tickers (try `AAPL`, `TSLA`, `JPM`) → Save
2. **Home dashboard** → metrics auto-load with real Yahoo Finance data
3. **Simulate** → set 252 days, 500 sims → Run Simulation
4. **Options** → default values work, hit Price Options
5. **Risk** → Run Risk Analysis → see VaR, stress tests
6. **AI Insights** → Generate Insights (works without OpenAI key using fallback)

---

## Free Deployment Guide

### Part A — Deploy Backend on Render (Free)

1. Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Aegis Finance Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aegis.git
git push -u origin main
```

2. Go to [render.com](https://render.com) → Sign up free → **New → Web Service**
3. Connect your GitHub repo
4. Configure:

| Field | Value |
|---|---|
| **Name** | aegis-backend |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. Under **Environment Variables** add:

| Key | Value |
|---|---|
| `OPENAI_API_KEY` | your key (or leave blank) |
| `FRONTEND_URL` | (fill in after Vercel deploy) |

6. Click **Deploy** → wait ~3 mins  
7. Your backend URL will be: `https://aegis-backend.onrender.com`

> ⚠️ Free Render instances spin down after 15 min of inactivity. First request takes ~30s to wake up. This is fine for a portfolio project.

---

### Part B — Deploy Frontend on Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub → **Add New Project**
2. Import your `aegis` repo
3. Configure:

| Field | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |

4. Under **Environment Variables** add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://aegis-backend.onrender.com` |

5. Click **Deploy** → wait ~2 mins  
6. Your app URL will be: `https://aegis-finance.vercel.app`

---

### Part C — Final Wiring

1. Copy your Vercel URL (e.g. `https://aegis-finance.vercel.app`)
2. Go back to Render → your backend service → **Environment**
3. Update `FRONTEND_URL` to your Vercel URL
4. Render will auto-redeploy

✅ Your app is now live. Share this URL on your resume/LinkedIn.

---

## Project Structure

```
aegis/
├── frontend/                  # Next.js 14 + TypeScript
│   └── src/
│       ├── app/               # Pages (portfolio, simulate, options, risk, insights)
│       ├── components/        # Navbar, MetricCard, Charts
│       ├── context/           # Global portfolio state
│       └── lib/api.ts         # All API calls
│
└── backend/                   # FastAPI + Python
    ├── routers/               # metrics, simulate, options, risk, insights
    └── services/
        ├── market_data.py     # yfinance data fetching
        ├── quant.py           # CAPM, GBM, Black-Scholes, VaR/CVaR
        └── ai_insights.py     # OpenAI + fallback insights
```

---

## Resume Bullet Points (copy these)

```
Aegis — Portfolio Intelligence & Risk Simulation Platform         Apr 2026 – Present
Solo Full-Stack Project · aegis-finance.vercel.app

- Enabled data-driven investment decision-making by building a full-stack portfolio
  analytics platform (TypeScript, Next.js, FastAPI) using real market data (yfinance),
  implementing CAPM-based expected returns, Sharpe ratio, beta, and covariance-based
  risk modelling.

- Modelled portfolio uncertainty using a Monte Carlo simulation engine (geometric
  Brownian motion) to model return distributions and quantify downside risk, and
  engineered an options pricing module (Black-Scholes) to price European derivatives
  and analyse sensitivities (Delta, Gamma, Vega).

- Quantified portfolio risk exposure through implementation of Value at Risk (VaR) and
  Conditional VaR, supporting scenario-based stress testing under 2008 GFC and COVID
  crash conditions.

- Improved interpretability of quantitative outputs by integrating an AI-driven insights
  layer (GPT-4o-mini) that translates complex risk metrics into context-aware, actionable
  investment explanations.
```

---

## Interview Talking Points

- **Why GBM?** It assumes log-normal returns and constant drift/vol — a standard first-order model. Limitations: it ignores fat tails (hence why CVaR matters more than VaR alone).
- **Why CAPM?** Simple, interpretable baseline. In practice supplemented by multi-factor models (Fama-French).
- **What does CVaR add over VaR?** VaR tells you the threshold; CVaR tells you the expected loss *given* you've crossed it — more informative for tail risk.
- **Black-Scholes assumptions?** Constant vol, no dividends, European exercise, log-normal prices, continuous trading. Real markets violate all of these — hence implied vol surfaces.

---

*Built by [Your Name] · [Your LinkedIn]*