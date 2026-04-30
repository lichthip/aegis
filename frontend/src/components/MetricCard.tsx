import clsx from "clsx";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "positive" | "negative" | "neutral";
  description?: string;
}

export default function MetricCard({
  title, value, subtitle, trend = "neutral", description,
}: MetricCardProps) {
  return (
    <div className="card flex flex-col gap-1 hover:border-blue-500/40 transition-colors">
      <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">{title}</p>
      <p
        className={clsx(
          "text-3xl font-bold mt-1",
          trend === "positive" && "text-emerald-400",
          trend === "negative" && "text-red-400",
          trend === "neutral"  && "text-blue-400"
        )}
      >
        {value}
      </p>
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      {description && <p className="text-xs text-gray-600 mt-1 border-t border-[#1f2937] pt-2">{description}</p>}
    </div>
  );
}