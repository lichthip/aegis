"use client";
import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import MonteCarloChart from "@/components/MonteCarloChart";
import MetricCard from "@/components/MetricCard";
import { runSimulation } from "@/lib/api";
import { Activity } from "lucide-react";

interface SimResult {
  paths: number[][];
  mean_final: number;
  median_final: number;
  percentile_5: number;
  percentile_95: number;
  prob_loss: number;
  initial_value: number;
}

export default function SimulatePage() {
  const { holdings, period } = usePortfolio();
  const [days, setDays] = useState(252);
  const [sims, setSims] = useState(500);
  const [initialValue, setInitialValue] = useState(10000);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const data = await runSimulation(holdings, period, days, sims, initialValue);
      setResult(data);
    } catch {
      setError("Simulation failed. Ensure backend is running and tickers are valid.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-blue-400" size={24} /> Monte Carlo Simulation
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Geometric Brownian Motion paths modelled from real historical μ and σ.
        </p>
      </div>

      {/* Controls */}
      <div className="card grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Horizon (days)</label>
          <input className="input-field" type="number" value={days}
            onChange={(e) => setDays(Number(e.target.value))} min={21} max={1260} />
        </div>
        <div>
          <label className="label">Simulations</label>
          <input className="input-field" type="number" value={sims}
            onChange={(e) => setSims(Number(e.target.value))} min={100} max={2000} step={100} />
        </div>
        <div>
          <label className="label">Initial Value ($)</label>
          <input className="input-field" type="number" value={initialValue}
            onChange={(e) => setInitialValue(Number(e.target.value))} min={100} />
        </div>
        <div className="flex items-end">
          <button onClick={run} disabled={loading} className="btn-primary w-full">
            {loading ? "Running..." : "Run Simulation"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard title="Mean Final" value={`$${result.mean_final.toFixed(0)}`} trend="positive" />
            <MetricCard title="Median Final" value={`$${result.median_final.toFixed(0)}`} trend="neutral" />
            <MetricCard title="5th Percentile" value={`$${result.percentile_5.toFixed(0)}`} trend="negative" description="Worst-case scenario" />
            <MetricCard title="95th Percentile" value={`$${result.percentile_95.toFixed(0)}`} trend="positive" description="Best-case scenario" />
            <MetricCard title="Prob. of Loss" value={`${(result.prob_loss * 100).toFixed(1)}%`}
              trend={result.prob_loss > 0.4 ? "negative" : "positive"}
              description="Paths ending below initial" />
          </div>
          <div className="card">
            <h2 className="font-semibold mb-4">Simulated Portfolio Paths</h2>
            <MonteCarloChart paths={result.paths} initialValue={result.initial_value} />
            <p className="text-xs text-gray-500 mt-3">
              Showing up to 80 of {sims} simulated paths. Each path models daily returns drawn from a log-normal distribution calibrated to historical data.
            </p>
          </div>
        </>
      )}
    </div>
  );
}