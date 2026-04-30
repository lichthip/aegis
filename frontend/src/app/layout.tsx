import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { PortfolioProvider } from "@/context/PortfolioContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aegis — Portfolio Intelligence Platform",
  description: "Portfolio risk simulation and analysis powered by quant finance and AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0f1e] text-white min-h-screen`}>
        <PortfolioProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </PortfolioProvider>
      </body>
    </html>
  );
}