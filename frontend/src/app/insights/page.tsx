"use client";
import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { fetchInsights } from "@/lib/api";
import { Brain, RefreshCw } from "lucide-react";
import MetricCard from "@/components/MetricCard";

interface InsightResult {
  insights: string;
  metrics: {
    expected_annual_return: number;
    volatility: number;
    sharpe_ratio: number;
    portfolio_beta: number;
    var_95: number;
    cvar_95: number;
  };
}

export default function InsightsPage() {
  const { holdings, period } = usePortfolio();
  const [result, setResult]   = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchInsights(holdings, period);
      setResult(data);
    } catch {
      setError("Insights failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="text-blue-400" size={24} /> AI Risk Insights
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Context-aware analysis — quant metrics translated into plain-English
          investment insights via GPT-4o-mini.
        </p>
      </div>

      <button onClick={run} disabled={loading} className="btn-primary flex items-center gap-2">
        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Brain size={16} />}
        {loading ? "Generating insights..." : "Generate AI Insights"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="space-y-6">
          {/* AI narrative */}
          <div className="card border-blue-500/30 bg-gradient-to-br from-[#111827] to-[#0f1a35]">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="text-blue-400" size={18} />
              <h2 className="font-semibold text-blue-400">Portfolio Risk Assessment</h2>
            </div>
            <p className="text-gray-200 leading-relaxed text-sm whitespace-pre-wrap">
              {result.insights}
            </p>
          </div>

          {/* Supporting metrics */}
          <div>
            <h2 className="font-semibold mb-3 text-gray-300 text-sm uppercase tracking-widest">
              Metrics Used
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                title="Expected Return"
                value={`${(result.metrics.expected_annual_return * 100).toFixed(2)}%`}
                trend="positive"
                description="CAPM annualised"
              />
              <MetricCard
                title="Volatility"
                value={`${(result.metrics.volatility * 100).toFixed(2)}%`}
                trend="negative"
                description="Annualised std dev"
              />
              <MetricCard
                title="Sharpe Ratio"
                value={result.metrics.sharpe_ratio.toFixed(3)}
                trend={result.metrics.sharpe_ratio > 1 ? "positive" : "neutral"}
                description="Risk-adjusted return"
              />
              <MetricCard
                title="Portfolio Beta"
                value={result.metrics.portfolio_beta.toFixed(3)}
                trend="neutral"
                description="vs S&P 500"
              />
              <MetricCard
                title="VaR (95%)"
                value={`${(result.metrics.var_95 * 100).toFixed(3)}%`}
                trend="negative"
                description="Daily downside risk"
              />
              <MetricCard
                title="CVaR (95%)"
                value={`${(result.metrics.cvar_95 * 100).toFixed(3)}%`}
                trend="negative"
                description="Expected tail loss"
              />
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-600 border-t border-[#1f2937] pt-4">
            ⚠️ This is not financial advice. All analysis is based on historical data
            and quantitative models. Past performance does not guarantee future results.
          </p>
        </div>
      )}
    </div>
  );
}