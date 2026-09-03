"use client";
import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { fetchStress } from "@/lib/api";
import { AlertTriangle, TrendingDown, Zap } from "lucide-react";
import clsx from "clsx";

interface CrisisScenario {
  key: string; label: string; window: string;
  portfolio_return: number | null; worst_single_day: number | null;
  annualised_vol_during: number | null; spy_return: number | null;
  data_available: boolean; n_trading_days: number;
}
interface RateShock    { label: string; delta_r: number; estimated_impact: number; }
interface VolSens      { label: string; var_95: number; cvar_95: number; annualised_vol: number; }
interface StressResult {
  crisis_scenarios: CrisisScenario[]; rate_shocks: RateShock[];
  vol_sensitivity: VolSens[]; base_var_95: number; base_cvar_95: number; base_vol: number;
}

function badge(ret: number | null) {
  if (ret === null)   return { label: "N/A",      cls: "bg-gray-700 text-gray-400",          border: "border-gray-600" };
  if (ret < -0.30)    return { label: "SEVERE",    cls: "bg-red-900/50 text-red-400",         border: "border-red-500"  };
  if (ret < -0.15)    return { label: "HIGH",      cls: "bg-orange-900/50 text-orange-400",   border: "border-orange-500" };
  if (ret < -0.05)    return { label: "MODERATE",  cls: "bg-yellow-900/50 text-yellow-400",   border: "border-yellow-500" };
  return               { label: "LOW",       cls: "bg-emerald-900/50 text-emerald-400",  border: "border-emerald-500" };
}

function retColor(ret: number | null) {
  if (ret === null) return "text-gray-400";
  if (ret < -0.15)  return "text-red-400";
  if (ret < -0.05)  return "text-orange-400";
  if (ret < 0)      return "text-yellow-400";
  return "text-emerald-400";
}

export default function StressPage() {
  const { holdings, period } = usePortfolio();
  const [result, setResult]   = useState<StressResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function run() {
    setLoading(true); setError("");
    try { setResult(await fetchStress(holdings, period)); }
    catch { setError("Stress test failed. Ensure backend is running."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="text-orange-400" size={24} /> Stress Testing & Scenario Analysis
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Portfolio performance under historical market crises, rate shocks, and volatility regime changes — using real Yahoo Finance data.
        </p>
      </div>

      <button onClick={run} disabled={loading} className="btn-primary">
        {loading ? "Fetching crisis data..." : "Run Stress Tests"}
      </button>
      {loading && <p className="text-gray-500 text-xs animate-pulse">Fetching historical crisis windows from Yahoo Finance — may take 15–20s...</p>}
      {error  && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="space-y-8">

          {/* ── Crisis Scenarios ── */}
          <div>
            <h2 className="font-semibold text-gray-200 mb-1">Historical Crisis Scenarios</h2>
            <p className="text-xs text-gray-500 mb-4">Real portfolio returns computed from actual historical prices during each crisis window.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.crisis_scenarios.map((s) => {
                const b = badge(s.portfolio_return);
                return (
                  <div key={s.key} className={clsx("card border-l-4", b.border)}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm">{s.label}</p>
                      <span className={clsx("text-xs px-2 py-0.5 rounded-full font-bold", b.cls)}>{b.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{s.window}</p>
                    {s.data_available ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Portfolio Return</span>
                          <span className={clsx("text-sm font-bold", retColor(s.portfolio_return))}>
                            {s.portfolio_return !== null ? `${(s.portfolio_return * 100).toFixed(2)}%` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Worst Single Day</span>
                          <span className="text-sm font-mono text-red-400">
                            {s.worst_single_day !== null ? `${(s.worst_single_day * 100).toFixed(2)}%` : "N/A"}
                          </span>
                        </div>
                        {s.spy_return !== null && (
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">SPY (benchmark)</span>
                            <span className="text-sm font-mono text-gray-400">{(s.spy_return * 100).toFixed(2)}%</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Trading Days</span>
                          <span className="text-sm text-gray-400">{s.n_trading_days}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 italic">Data unavailable — ticker may not have existed during this period.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Rate Shocks ── */}
          <div>
            <h2 className="font-semibold text-gray-200 mb-1 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" /> Interest Rate Shock Analysis
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Parallel yield curve shifts applied via equity duration proxy (~18yr). Impact ≈ −duration × Δr.
            </p>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#1f2937] text-gray-500 text-xs uppercase tracking-widest">
                    <th className="pb-3">Scenario</th><th className="pb-3">Δ Rate</th>
                    <th className="pb-3">Est. Impact</th><th className="pb-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]">
                  {result.rate_shocks.map((r) => {
                    const b = badge(r.estimated_impact);
                    return (
                      <tr key={r.label}>
                        <td className="py-3 font-mono text-white">{r.label}</td>
                        <td className="py-3 text-gray-400">{(r.delta_r * 100).toFixed(0)} bps</td>
                        <td className={clsx("py-3 font-bold", retColor(r.estimated_impact))}>
                          {(r.estimated_impact * 100).toFixed(2)}%
                        </td>
                        <td className="py-3">
                          <span className={clsx("text-xs px-2 py-0.5 rounded-full font-bold", b.cls)}>{b.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Volatility Sensitivity ── */}
          <div>
            <h2 className="font-semibold text-gray-200 mb-1 flex items-center gap-2">
              <TrendingDown size={16} className="text-blue-400" /> Volatility Sensitivity
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              VaR/CVaR recalculated under shocked vol regimes. Base VaR 95%:{" "}
              <span className="text-white">{(result.base_var_95 * 100).toFixed(3)}%</span> | Base vol:{" "}
              <span className="text-white">{(result.base_vol * 100).toFixed(2)}%</span>
            </p>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#1f2937] text-gray-500 text-xs uppercase tracking-widest">
                    <th className="pb-3">Vol Regime</th><th className="pb-3">Ann. Vol</th>
                    <th className="pb-3">VaR 95%</th><th className="pb-3">CVaR 95%</th>
                    <th className="pb-3">VaR Δ vs Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]">
                  <tr className="bg-[#1a2235]/50">
                    <td className="py-3 text-blue-400 font-medium">Base (Current)</td>
                    <td className="py-3 text-gray-300">{(result.base_vol * 100).toFixed(2)}%</td>
                    <td className="py-3 text-gray-300">{(result.base_var_95 * 100).toFixed(3)}%</td>
                    <td className="py-3 text-gray-300">{(result.base_cvar_95 * 100).toFixed(3)}%</td>
                    <td className="py-3 text-gray-500">—</td>
                  </tr>
                  {result.vol_sensitivity.map((v) => {
                    const delta = v.var_95 - result.base_var_95;
                    return (
                      <tr key={v.label}>
                        <td className="py-3 font-mono text-white">{v.label}</td>
                        <td className="py-3 text-gray-400">{(v.annualised_vol * 100).toFixed(2)}%</td>
                        <td className="py-3 text-red-400">{(v.var_95 * 100).toFixed(3)}%</td>
                        <td className="py-3 text-red-400">{(v.cvar_95 * 100).toFixed(3)}%</td>
                        <td className={clsx("py-3 font-mono text-xs", delta > 0 ? "text-red-400" : "text-emerald-400")}>
                          {delta > 0 ? "+" : ""}{(delta * 100).toFixed(3)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}