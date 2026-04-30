import axios from "axios";
import { Holding } from "@/context/PortfolioContext";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE });

// ── Portfolio payload helper ──────────────────────────────────────────────────
function toPayload(holdings: Holding[], period: string) {
  return {
    tickers:  holdings.map((h) => h.ticker),
    weights:  holdings.map((h) => h.weight),
    period,
  };
}

// ── Metrics (CAPM, Sharpe, Beta, VaR) ────────────────────────────────────────
export async function fetchMetrics(holdings: Holding[], period: string) {
  const { data } = await api.post("/metrics/", toPayload(holdings, period));
  return data;
}

// ── Monte Carlo simulation ────────────────────────────────────────────────────
export async function runSimulation(
  holdings: Holding[],
  period: string,
  days: number,
  simulations: number,
  initial_value: number
) {
  const { data } = await api.post("/simulate/", {
    ...toPayload(holdings, period),
    days,
    simulations,
    initial_value,
  });
  return data;
}

// ── Black-Scholes options pricing ─────────────────────────────────────────────
export async function priceOption(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
) {
  const { data } = await api.post("/options/", { S, K, T, r, sigma });
  return data;
}

// ── Risk (VaR, CVaR, stress tests) ───────────────────────────────────────────
export async function fetchRisk(holdings: Holding[], period: string) {
  const { data } = await api.post("/risk/", toPayload(holdings, period));
  return data;
}

// ── AI Insights ───────────────────────────────────────────────────────────────
export async function fetchInsights(holdings: Holding[], period: string) {
  const { data } = await api.post("/insights/", toPayload(holdings, period));
  return data;
}