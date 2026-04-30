"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export interface Holding {
  ticker: string;
  weight: number;
}

interface PortfolioContextType {
  holdings: Holding[];
  setHoldings: (h: Holding[]) => void;
  period: string;
  setPeriod: (p: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([
    { ticker: "AAPL", weight: 0.30 },
    { ticker: "MSFT", weight: 0.25 },
    { ticker: "GOOGL", weight: 0.20 },
    { ticker: "JPM",  weight: 0.15 },
    { ticker: "BRK-B",weight: 0.10 },
  ]);
  const [period, setPeriod] = useState("1y");

  return (
    <PortfolioContext.Provider value={{ holdings, setHoldings, period, setPeriod }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be inside PortfolioProvider");
  return ctx;
}