"use client";
import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import MetricCard from "@/components/MetricCard";
import { fetchRisk } from "@/lib/api";
import { Shield } from "lucide-react";

interface RiskResult {
  var_95: number;
  var_99: number;
  cvar_95: number;
  cvar_99: number;
  max_drawdown: number;
  stress_2008: number;
  stress_2020: number;
  stress_rate_hike: number;
  daily_returns_std: number;
  skewness: number;
  kurtosis: number;
}

export default function RiskPage() {
  const { holdings, period } = usePortfolio();
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRisk(holdings, period);
      setResult(data);
    } catch {
      setError("Risk analysis failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="text-blue-400" size={24} /> Risk Analysis
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          VaR, CVaR, drawdown, skewness, kurtosis, and historical stress test scenarios.
        </p>
      </div>

      <button onClick={run} disabled={loading} className="btn-primary">
        {loading ? "Analysing..." : "Run Risk Analysis"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="space-y-6">
          {/* VaR / CVaR */}
          <div>
            <h2 className="font-semibold mb-3 text-gray-300">Value at Risk</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="VaR 95%" value={`${(result.var_95 * 100).toFixed(3)}%`} trend="negative" description="Daily loss not exceeded 95% of the time" />
              <MetricCard title="VaR 99%" value={`${(result.var_99 * 100).toFixed(3)}%`} trend="negative" description="Daily loss not exceeded 99% of the time" />
              <MetricCard title="CVaR 95%" value={`${(result.cvar_95 * 100).toFixed(3)}%`} trend="negative" description="Expected loss beyond 95% VaR" />
              <MetricCard title="CVaR 99%" value={`${(result.cvar_99 * 100).toFixed(3)}%`} trend="negative" description="Expected loss beyond 99% VaR" />
            </div>
          </div>

          {/* Drawdown & Distribution */}
          <div>
            <h2 className="font-semibold mb-3 text-gray-300">Distribution & Drawdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard title="Max Drawdown" value={`${(result.max_drawdown * 100).toFixed(2)}%`} trend="negative" description="Largest peak-to-trough decline" />
              <MetricCard title="Skewness" value={result.skewness.toFixed(3)} trend={result.skewness < 0 ? "negative" : "positive"} description="Negative = left tail risk" />
              <MetricCard title="Excess Kurtosis" value={result.kurtosis.toFixed(3)} trend={result.kurtosis > 3 ? "negative" : "neutral"} description="Fat tails vs normal dist." />
            </div>
          </div>

          {/* Stress Tests */}
          <div>
            <h2 className="font-semibold mb-3 text-gray-300">Stress Testing Scenarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "2008 Financial Crisis", value: result.stress_2008, desc: "30-day drawdown applied to current portfolio" },
                { label: "COVID Crash (Mar 2020)", value: result.stress_2020, desc: "Flash crash scenario applied to weights" },
                { label: "+200bps Rate Hike", value: result.stress_rate_hike, desc: "Duration/equity shock from rate rise" },
              ].map(({ label, value, desc }) => (
                <div key={label} className="card border-red-500/20">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{label}</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{(value * 100).toFixed(2)}%</p>
                  <p className="text-xs text-gray-600 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}