"use client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";

interface Props {
  paths: number[][];      // array of simulation paths
  initialValue?: number;
}

export default function MonteCarloChart({ paths, initialValue = 10000 }: Props) {
  if (!paths || paths.length === 0) return null;

  const steps = paths[0].length;
  // Sample up to 80 paths for performance
  const sampled = paths.slice(0, 80);

  // Build chart data: each point = { step, path0, path1, ... }
  const data = Array.from({ length: steps }, (_, i) => {
    const point: Record<string, number> = { step: i };
    sampled.forEach((path, j) => { point[`p${j}`] = parseFloat(path[i].toFixed(2)); });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="step"
          stroke="#4b5563"
          tick={{ fontSize: 11 }}
          label={{ value: "Days", position: "insideBottom", fill: "#6b7280", fontSize: 12 }}
        />
        <YAxis
          stroke="#4b5563"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: 8 }}
          formatter={(v: number) => [`$${v.toFixed(0)}`, "Portfolio"]}
          labelFormatter={(l) => `Day ${l}`}
        />
        <ReferenceLine y={initialValue} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Initial", fill: "#f59e0b", fontSize: 11 }} />
        {sampled.map((_, j) => (
          <Line
            key={j}
            type="monotone"
            dataKey={`p${j}`}
            stroke="#3b82f6"
            strokeWidth={0.6}
            dot={false}
            opacity={0.25}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}