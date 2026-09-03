"use client";
import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { fetchValidation } from "@/lib/api";
import { CheckCircle, XCircle, FileText, BarChart2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import clsx from "clsx";

interface VMeta {
  n: number; hist_var95: number; hist_var99: number; hist_cvar95: number;
  param_var95: number; param_var99: number; breaches_95: number;
  breach_rate_95: number; var95_pass: boolean; var99_pass: boolean;
  ks_stat: number; ks_pvalue: number; jb_stat: number; jb_pvalue: number;
  normality_rejected: boolean; expected_annual_return: number;
  volatility: number; sharpe_ratio: number; portfolio_beta: number;
}
interface RollingPoint { day: number; ret: number; var_95: number; }
interface ValResult    { report: string; metrics: VMeta; rolling_var: RollingPoint[]; }

function PassBadge({ pass }: { pass: boolean }) {
  return pass
    ? <span className="flex items-center gap-1 text-emerald-400 font-bold text-sm"><CheckCircle size={14}/> PASS</span>
    : <span className="flex items-center gap-1 text-red-400 font-bold text-sm"><XCircle size={14}/> FAIL</span>;
}

export default function ValidationPage() {
  const { holdings, period } = usePortfolio();
  const [result, setResult]   = useState<ValResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function run() {
    setLoading(true); setError("");
    try { setResult(await fetchValidation(holdings, period)); }
    catch { setError("Validation failed. Ensure backend is running."); }
    finally { setLoading(false); }
  }

  // Transform rolling VaR for chart (negate var_95 so it plots as a loss threshold)
  const chartData = result?.rolling_var.map((d) => ({ ...d, neg_var: -d.var_95 })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-blue-400" size={24} /> Model Validation & Backtesting
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Historical VaR backtesting (Kupiec POF), parametric vs historical comparison,
          normality testing, and AI-generated draft validation report.
        </p>
      </div>

      <button onClick={run} disabled={loading} className="btn-primary">
        {loading ? "Running validation..." : "Run Model Validation"}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="space-y-8">

          {/* ── Kupiec Backtest Summary ── */}
          <div>
            <h2 className="font-semibold text-gray-200 mb-1">VaR Backtesting — Kupiec POF Test</h2>
            <p className="text-xs text-gray-500 mb-4">
              Counts days actual loss exceeded predicted VaR. A well-calibrated model: ~5% breaches (VaR 95%), ~1% (VaR 99%).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Observations</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{result.metrics.n}</p>
                <p className="text-xs text-gray-600">Trading days</p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-widest">VaR 95% Breaches</p>
                <p className={clsx("text-3xl font-bold mt-1", result.metrics.var95_pass ? "text-emerald-400" : "text-red-400")}>
                  {result.metrics.breaches_95}
                </p>
                <p className="text-xs text-gray-600">
                  {(result.metrics.breach_rate_95 * 100).toFixed(2)}% actual (exp: 5.00%)
                </p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">VaR 95% Result</p>
                <PassBadge pass={result.metrics.var95_pass} />
                <p className="text-xs text-gray-600 mt-1">Kupiec POF criterion</p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">VaR 99% Result</p>
                <PassBadge pass={result.metrics.var99_pass} />
                <p className="text-xs text-gray-600 mt-1">Kupiec POF criterion</p>
              </div>
            </div>
          </div>

          {/* ── Historical vs Parametric ── */}
          <div>
            <h2 className="font-semibold text-gray-200 mb-3">Historical vs Parametric VaR</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#1f2937] text-xs uppercase tracking-widest text-gray-500">
                    <th className="pb-3">Metric</th>
                    <th className="pb-3">Historical Simulation</th>
                    <th className="pb-3">Parametric (Normal)</th>
                    <th className="pb-3">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]">
                  {[
                    { label: "Daily VaR 95%", h: result.metrics.hist_var95, p: result.metrics.param_var95 },
                    { label: "Daily VaR 99%", h: result.metrics.hist_var99, p: result.metrics.param_var99 },
                  ].map(({ label, h, p }) => {
                    const diff = h - p;
                    return (
                      <tr key={label}>
                        <td className="py-3 text-gray-300">{label}</td>
                        <td className="py-3 font-mono text-red-400">{(h * 100).toFixed(4)}%</td>
                        <td className="py-3 font-mono text-orange-400">{(p * 100).toFixed(4)}%</td>
                        <td className={clsx("py-3 font-mono text-xs", diff > 0 ? "text-red-400" : "text-emerald-400")}>
                          {diff > 0 ? "+" : ""}{(diff * 100).toFixed(4)}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="py-3 text-gray-300">CVaR 95%</td>
                    <td className="py-3 font-mono text-red-400">{(result.metrics.hist_cvar95 * 100).toFixed(4)}%</td>
                    <td className="py-3 text-gray-600 italic">N/A</td>
                    <td className="py-3 text-gray-600">—</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-[#1f2937]">
                If Historical &gt; Parametric: returns have fatter tails than normal — parametric VaR underestimates actual risk.
              </p>
            </div>
          </div>

          {/* ── Normality Tests ── */}
          <div>
            <h2 className="font-semibold text-gray-200 mb-3">Statistical Normality Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Normality Assumption</p>
                <p className={clsx("text-lg font-bold", result.metrics.normality_rejected ? "text-red-400" : "text-emerald-400")}>
                  {result.metrics.normality_rejected ? "REJECTED" : "NOT REJECTED"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {result.metrics.normality_rejected
                    ? "Fat tails detected — CVaR preferred over VaR"
                    : "Near-normal — parametric VaR reliable"}
                </p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Kolmogorov-Smirnov</p>
                <p className="text-xl font-bold text-blue-400">p = {result.metrics.ks_pvalue.toFixed(4)}</p>
                <p className="text-xs text-gray-600 mt-1">stat = {result.metrics.ks_stat.toFixed(4)}<br/>p &lt; 0.05 → reject normality</p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Jarque-Bera</p>
                <p className="text-xl font-bold text-blue-400">p = {result.metrics.jb_pvalue.toFixed(4)}</p>
                <p className="text-xs text-gray-600 mt-1">stat = {result.metrics.jb_stat.toFixed(4)}<br/>Tests skewness + kurtosis jointly</p>
              </div>
            </div>
          </div>

          {/* ── Rolling VaR Chart ── */}
          {chartData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-200 mb-1 flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-400" /> Rolling 30-Day VaR vs Actual Returns
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Returns below the red VaR line = breaches. A calibrated model has ~5% of returns below the line.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fontSize: 10 }}
                    label={{ value: "Day", position: "insideBottom", fill: "#6b7280", fontSize: 11 }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v * 100).toFixed(2)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: 8 }}
                    formatter={(v: number, name: string) => [
                      `${(v * 100).toFixed(4)}%`,
                      name === "neg_var" ? "−VaR 95% (threshold)" : "Daily Return",
                    ]}
                  />
                  <Legend formatter={(v) => (
                    <span style={{ color: "#d1d5db", fontSize: 12 }}>
                      {v === "neg_var" ? "−VaR 95% threshold" : "Daily Return"}
                    </span>
                  )} />
                  <ReferenceLine y={0} stroke="#374151" strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="ret"     stroke="#6b7280" strokeWidth={0.8} dot={false} name="ret" />
                  <Line type="monotone" dataKey="neg_var" stroke="#ef4444" strokeWidth={1.5} dot={false} name="neg_var" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── AI Validation Report ── */}
          <div className="card border-blue-500/30 bg-gradient-to-br from-[#111827] to-[#0f1a35]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-blue-400" size={18} />
              <h2 className="font-semibold text-blue-400">AI-Generated Draft Validation Report</h2>
            </div>
            <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-[#0a0f1e] rounded-lg p-4 border border-[#1f2937]">
              {result.report}
            </div>
            <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-[#1f2937]">
              ⚠️ Draft only — not a substitute for formal model validation by a qualified risk professional.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}