"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, TrendingUp, Activity, Shield, Brain, AlertTriangle, FileText } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/",           label: "Dashboard",    icon: BarChart2     },
  { href: "/portfolio",  label: "Portfolio",    icon: TrendingUp    },
  { href: "/simulate",   label: "Simulate",     icon: Activity      },
  { href: "/options",    label: "Options",      icon: TrendingUp    },
  { href: "/risk",       label: "Risk",         icon: Shield        },
  { href: "/stress",     label: "Stress Test",  icon: AlertTriangle },
  { href: "/validation", label: "Validation",   icon: FileText      },
  { href: "/insights",   label: "AI Insights",  icon: Brain         },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-[#1f2937] bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Shield className="text-blue-500" size={20} />
          <span className="text-lg font-bold tracking-tight">
            Aegis <span className="text-blue-500">Finance</span>
          </span>
        </Link>
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                pathname === href
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:text-white hover:bg-[#1f2937]"
              )}
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}