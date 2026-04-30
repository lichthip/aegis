"use client";
import { useEffect, useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import MetricCard from "@/components/MetricCard";
import PortfolioChart from "@/components/PortfolioChart";
import { fetchMetrics } from "@/lib/api";
import { TrendingUp, Shield, Activity, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Metrics {
  expected_annual_return: number;
  volatility: number;
  sharpe_ratio: number;
  portfolio_beta: number;
  var_95: number;
  cvar_95: number;
}

export default function HomePage() {
  const { holdings, period } = usePortfolio();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (holdings.length === 0) return;
    setLoading(true);
    setError("");
    fetchMetrics(holdings, period)
      .then(setMetrics)
      .catch(() => setError("Failed to fetch metrics. Check backend is running."))
      .finally(() => setLoading(false));
  }, [holdings, period]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="card bg-gradient-to-br from-[#111827] to-[#0f1a35] border-blue-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Portfolio Intelligence <span className="text-blue-500">Platform</span>
            </h1>
            <p className="text-gray-400 max-w-xl">
              Real-time portfolio analytics powered by live market data, quantitative finance
              models (CAPM, Black-Scholes, Monte Carlo), and AI-driven risk insights.
            </p>
            <div className="flex gap-3 mt-4">
              <Link href="/portfolio" className="btn-primary flex items-center gap-2">
                Build Portfolio <ArrowRight size={16} />
              </Link>
              <Link href="/insights" className="btn-secondary flex items-center gap-2">
                <Brain size={16} /> AI Insights
              </Link>
            </div>
          </div>
          <Shield className="text-blue-500 opacity-20" size={80} />
        </div>
      </div>

      {/* Current portfolio snapshot */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Current Portfolio Snapshot</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-28 bg-[#1a2235]" />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Expected Return"
              value={`${(metrics.expected_annual_return * 100).toFixed(2)}%`}
              trend="positive"
              description="CAPM annualised"
            />
            <MetricCard
              title="Volatility"
              value={`${(metrics.volatility * 100).toFixed(2)}%`}
              trend="negative"
              description="Annualised std dev"
            />
            <MetricCard
              title="Sharpe Ratio"
              value={metrics.sharpe_ratio.toFixed(3)}
              trend={metrics.sharpe_ratio > 1 ? "positive" : "neutral"}
              description="Risk-adjusted return"
            />
            <MetricCard
              title="Portfolio Beta"
              value={metrics.portfolio_beta.toFixed(3)}
              trend="neutral"
              description="vs S&P 500"
            />
            <MetricCard
              title="VaR (95%)"
              value={`${(metrics.var_95 * 100).toFixed(2)}%`}
              trend="negative"
              description="Daily downside risk"
            />
            <MetricCard
              title="CVaR (95%)"
              value={`${(metrics.cvar_95 * 100).toFixed(2)}%`}
              trend="negative"
              description="Expected tail loss"
            />
          </div>
        ) : null}
      </div>

      {/* Allocation + nav cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Allocation</h2>
          <PortfolioChart holdings={holdings} />
        </div>
        <div className="grid grid-cols-2 gap-4 content-start">
          {[
            { href: "/simulate",  Icon: Activity,   label: "Monte Carlo",   desc: "Simulate 1,000+ paths using GBM to model return distributions & downside probability." },
            { href: "/options",   Icon: TrendingUp,  label: "Options Pricer",desc: "Price European calls & puts via Black-Scholes. Visualise Delta, Gamma, Vega." },
            { href: "/risk",      Icon: Shield,      label: "Risk Analysis", desc: "VaR, CVaR, drawdown analysis, and stress test under 2008/2020 crash scenarios." },
            { href: "/insights",  Icon: Brain,       label: "AI Insights",  desc: "Translate quant metrics into plain-English investment risk explanations." },
          ].map(({ href, Icon, label, desc }) => (
            <Link key={href} href={href} className="card hover:border-blue-500/50 transition-all group">
              <Icon className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={22} />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}