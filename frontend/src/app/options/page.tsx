"use client";
import { useState } from "react";
import { priceOption } from "@/lib/api";
import MetricCard from "@/components/MetricCard";
import { TrendingUp } from "lucide-react";

interface OptionResult {
  call_price: number;
  put_price: number;
  delta_call: number;
  delta_put: number;
  gamma: number;
  vega: number;
  theta_call: number;
  theta_put: number;
  rho_call: number;
  rho_put: number;
  d1: number;
  d2: number;
}

export default function OptionsPage() {
  const [S, setS] = useState(150);
  const [K, setK] = useState(155);
  const [T, setT] = useState(0.5);
  const [r, setR] = useState(0.05);
  const [sigma, setSigma] = useState(0.2);
  const [result, setResult] = useState<OptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function calculate() {
    setLoading(true);
    setError("");
    try {
      const data = await priceOption(S, K, T, r, sigma);
      setResult(data);
    } catch {
      setError("Calculation failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const greeks = result
    ? [
        { label: "Δ Call (Delta)",  value: result.delta_call.toFixed(4), desc: "Call price sensitivity to S" },
        { label: "Δ Put (Delta)",   value: result.delta_put.toFixed(4),  desc: "Put price sensitivity to S" },
        { label: "Γ (Gamma)",       value: result.gamma.toFixed(6),      desc: "Delta sensitivity to S" },
        { label: "ν (Vega)",        value: result.vega.toFixed(4),       desc: "Sensitivity to volatility" },
        { label: "Θ Call (Theta)",  value: result.theta_call.toFixed(4), desc: "Daily time decay (call)" },
        { label: "Θ Put (Theta)",   value: result.theta_put.toFixed(4),  desc: "Daily time decay (put)" },
        { label: "ρ Call (Rho)",    value: result.rho_call.toFixed(4),   desc: "Sensitivity to r (call)" },
        { label: "ρ Put (Rho)",     value: result.rho_put.toFixed(4),    desc: "Sensitivity to r (put)" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="text-blue-400" size={24} />
          Black-Scholes Options Pricer
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Price European call and put options. Computes all Greeks: Δ, Γ, ν, Θ, ρ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="card space-y-4">
          <h2 className="font-semibold">Contract Parameters</h2>

          {[
            { label: "Spot Price (S)",          value: S,     set: setS,     step: 1,    hint: "Current asset price" },
            { label: "Strike Price (K)",         value: K,     set: setK,     step: 1,    hint: "Exercise price" },
            { label: "Time to Expiry (T, years)",value: T,     set: setT,     step: 0.01, hint: "e.g. 0.5 = 6 months" },
            { label: "Risk-Free Rate (r)",        value: r,     set: setR,     step: 0.001,hint: "e.g. 0.05 = 5%" },
            { label: "Implied Volatility (σ)",   value: sigma, set: setSigma, step: 0.01, hint: "e.g. 0.2 = 20%" },
          ].map(({ label, value, set, step, hint }) => (
            <div key={label}>
              <label className="label">
                {label}{" "}
                <span className="text-gray-600 text-xs">— {hint}</span>
              </label>
              <input
                className="input-field"
                type="number"
                value={value}
                onChange={(e) => set(parseFloat(e.target.value))}
                step={step}
              />
            </div>
          ))}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={calculate}
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? "Calculating..." : "Price Options"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                title="Call Price"
                value={`$${result.call_price.toFixed(4)}`}
                trend="positive"
                description="European call option value"
              />
              <MetricCard
                title="Put Price"
                value={`$${result.put_price.toFixed(4)}`}
                trend="negative"
                description="European put option value"
              />
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-widest text-gray-400">
                Greeks
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {greeks.map(({ label, value, desc }) => (
                  <div key={label} className="bg-[#1a2235] rounded-lg p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-lg font-bold text-blue-400">{value}</p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card text-sm text-gray-400 space-y-1">
              <p>
                d₁ ={" "}
                <span className="text-white font-mono">{result.d1.toFixed(4)}</span>
              </p>
              <p>
                d₂ ={" "}
                <span className="text-white font-mono">{result.d2.toFixed(4)}</span>
              </p>
              <p className="text-xs text-gray-600 pt-1 border-t border-[#1f2937]">
                Black-Scholes assumes constant volatility, no dividends, European
                exercise, and log-normal asset prices.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}