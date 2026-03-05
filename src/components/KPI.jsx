import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTheme } from "../context/useTheme";

export default function KPI({
  title,
  value,
  subtitle,
  trend,
  trendUp = true,
  icon: Icon,
  tone = "blue",
}) {
  const { isDark } = useTheme();

  const toneClasses = {
    blue: isDark
      ? "from-sky-500/20 to-sky-500/5 text-sky-300 ring-sky-400/30"
      : "from-sky-200 to-sky-100 text-sky-700 ring-sky-300",
    emerald: isDark
      ? "from-emerald-500/20 to-emerald-500/5 text-emerald-300 ring-emerald-400/30"
      : "from-emerald-200 to-emerald-100 text-emerald-700 ring-emerald-300",
    amber: isDark
      ? "from-amber-500/20 to-amber-500/5 text-amber-300 ring-amber-400/30"
      : "from-amber-200 to-amber-100 text-amber-700 ring-amber-300",
    rose: isDark
      ? "from-rose-500/20 to-rose-500/5 text-rose-300 ring-rose-400/30"
      : "from-rose-200 to-rose-100 text-rose-700 ring-rose-300",
  };

  const toneClass = toneClasses[tone] || toneClasses.blue;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

  const cardClass = isDark
    ? "border-slate-800 bg-slate-900/70 shadow-black/20"
    : "border-slate-200 bg-white/90 shadow-slate-300/40";

  const titleClass = isDark ? "text-slate-400" : "text-slate-600";
  const valueClass = isDark ? "text-slate-100" : "text-slate-900";
  const subtitleClass = isDark ? "text-slate-500" : "text-slate-500";

  return (
    <article className={`rounded-2xl border p-5 shadow-lg ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm ${titleClass}`}>{title}</p>
        {Icon && (
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${toneClass}`}
          >
            <Icon size={16} />
          </span>
        )}
      </div>

      <h3 className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</h3>
      <p className={`mt-1 text-xs ${subtitleClass}`}>{subtitle}</p>

      {trend && (
        <div
          className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
          ${
            trendUp
              ? isDark
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-emerald-100 text-emerald-700"
              : isDark
                ? "bg-rose-500/15 text-rose-300"
                : "bg-rose-100 text-rose-700"
          }`}
        >
          <TrendIcon size={13} />
          {trend}
        </div>
      )}
    </article>
  );
}
