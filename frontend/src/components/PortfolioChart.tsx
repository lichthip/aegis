"use client";
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "#3b82f6","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#06b6d4","#f97316",
];

interface Props {
  holdings: { ticker: string; weight: number }[];
}

interface TooltipPayload {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: TooltipPayload }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, value } = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: "#1f2937",
        border: "1px solid #374151",
        borderRadius: 8,
        padding: "8px 14px",
      }}
    >
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 2 }}>{name}</p>
      <p style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>
        {value.toFixed(2)}%
      </p>
    </div>
  );
}

export default function PortfolioChart({ holdings }: Props) {
  const data = holdings.map((h) => ({
    name: h.ticker,
    value: parseFloat((h.weight * 100).toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ color: "#d1d5db", fontSize: 13 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}