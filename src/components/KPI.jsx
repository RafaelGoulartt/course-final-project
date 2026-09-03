import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTheme } from "../context/useTheme";

export default function KPI({
  title,
  value,
  subtitle,
  trend,
  trendUp = true,
  icon: Icon,
}) {
  const { isDark } = useTheme();

  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

  const cardClass = isDark ? "rounded-lg border-slate-800" : "rounded-lg border-slate-200";
  const iconClass = isDark ? "rounded-md border-slate-700 text-blue-400" : "rounded-md border-slate-300 text-blue-600";

  const titleClass = isDark ? "text-slate-500" : "text-slate-500";
  const valueClass = isDark ? "text-slate-50" : "text-slate-900";
  const subtitleClass = isDark ? "text-slate-500" : "text-slate-500";

  return (
    <article className={`border p-5 ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm uppercase tracking-wide ${titleClass}`}>{title}</p>
        {Icon && (
          <span className={`inline-flex h-9 w-9 items-center justify-center border ${iconClass}`}>
            <Icon size={16} />
          </span>
        )}
      </div>

      <h3 className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</h3>
      <p className={`mt-1 text-xs ${subtitleClass}`}>{subtitle}</p>

      {trend && (
        <div
          className={`mt-4 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold
          ${
            trendUp
              ? isDark ? "text-emerald-400" : "text-emerald-600"
              : isDark ? "text-rose-400" : "text-rose-600"
          }`}
        >
          <TrendIcon size={13} />
          {trend}
        </div>
      )}
    </article>
  );
}
