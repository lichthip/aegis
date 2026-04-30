"use client";
import { useState } from "react";
import { usePortfolio, Holding } from "@/context/PortfolioContext";
import PortfolioChart from "@/components/PortfolioChart";
import { Plus, Trash2, RefreshCw } from "lucide-react";

const PERIODS = ["3mo", "6mo", "1y", "2y", "5y"];

export default function PortfolioPage() {
  const { holdings, setHoldings, period, setPeriod } = usePortfolio();
  const [draft, setDraft] = useState<Holding[]>(holdings);
  const [newTicker, setNewTicker] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [error, setError] = useState("");

  const totalWeight = draft.reduce((s, h) => s + h.weight, 0);

  function addHolding() {
    const ticker = newTicker.trim().toUpperCase();
    const weight = parseFloat(newWeight);
    if (!ticker || isNaN(weight) || weight <= 0) {
      setError("Enter a valid ticker and weight (0–100).");
      return;
    }
    if (draft.find((h) => h.ticker === ticker)) {
      setError("Ticker already exists.");
      return;
    }
    setDraft([...draft, { ticker, weight: weight / 100 }]);
    setNewTicker("");
    setNewWeight("");
    setError("");
  }

  function removeHolding(ticker: string) {
    setDraft(draft.filter((h) => h.ticker !== ticker));
  }

  function updateWeight(ticker: string, value: string) {
    const w = parseFloat(value);
    if (isNaN(w)) return;
    setDraft(draft.map((h) => h.ticker === ticker ? { ...h, weight: w / 100 } : h));
  }

  function normalise() {
    const total = draft.reduce((s, h) => s + h.weight, 0);
    setDraft(draft.map((h) => ({ ...h, weight: h.weight / total })));
  }

  function save() {
    if (Math.abs(totalWeight - 1) > 0.01) {
      setError(`Weights sum to ${(totalWeight * 100).toFixed(1)}%. Normalise or adjust to 100%.`);
      return;
    }
    setHoldings(draft);
    setError("");
    alert("Portfolio saved! All modules will now use these holdings.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio Builder</h1>
        <p className="text-gray-400 text-sm mt-1">
          Add tickers and weights. Real price data is pulled live from Yahoo Finance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Holdings</h2>
            <span className={`text-sm font-mono ${Math.abs(totalWeight - 1) < 0.01 ? "text-emerald-400" : "text-yellow-400"}`}>
              Σ = {(totalWeight * 100).toFixed(1)}%
            </span>
          </div>

          {draft.map((h) => (
            <div key={h.ticker} className="flex items-center gap-3">
              <span className="font-mono text-blue-400 w-16 text-sm">{h.ticker}</span>
              <input
                type="number"
                className="input-field text-sm"
                value={(h.weight * 100).toFixed(1)}
                onChange={(e) => updateWeight(h.ticker, e.target.value)}
                min={0}
                max={100}
                step={0.1}
              />
              <span className="text-gray-500 text-sm">%</span>
              <button onClick={() => removeHolding(h.ticker)} className="text-red-400 hover:text-red-300">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {/* Add new */}
          <div className="flex gap-2 pt-2 border-t border-[#1f2937]">
            <input
              className="input-field text-sm"
              placeholder="TICKER"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHolding()}
            />
            <input
              className="input-field text-sm w-24"
              placeholder="Weight %"
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
            <button onClick={addHolding} className="btn-secondary flex items-center gap-1">
              <Plus size={15} />
            </button>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Period selector */}
          <div>
            <label className="label">Historical Period</label>
            <div className="flex gap-2 flex-wrap">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    period === p ? "bg-blue-600 text-white" : "bg-[#1f2937] text-gray-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={normalise} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> Normalise
            </button>
            <button onClick={save} className="btn-primary text-sm">
              Save Portfolio
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="card">
          <h2 className="font-semibold mb-4">Allocation Preview</h2>
          <PortfolioChart holdings={draft} />
          <div className="mt-4 space-y-2">
            {draft.map((h) => (
              <div key={h.ticker} className="flex justify-between text-sm">
                <span className="text-gray-300 font-mono">{h.ticker}</span>
                <span className="text-blue-400">{(h.weight * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}