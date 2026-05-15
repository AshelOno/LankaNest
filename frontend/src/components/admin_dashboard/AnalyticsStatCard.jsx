import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";

const toneConfig = {
  blue: {
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    accent: "from-blue-500 to-blue-400",
    progressTrack: "bg-blue-100",
    progressFill: "bg-gradient-to-r from-blue-500 to-blue-400",
    valueCss: "text-blue-700",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    accent: "from-emerald-500 to-teal-400",
    progressTrack: "bg-emerald-100",
    progressFill: "bg-gradient-to-r from-emerald-500 to-teal-400",
    valueCss: "text-emerald-700",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    accent: "from-amber-500 to-yellow-400",
    progressTrack: "bg-amber-100",
    progressFill: "bg-gradient-to-r from-amber-500 to-yellow-400",
    valueCss: "text-amber-700",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    accent: "from-rose-500 to-pink-400",
    progressTrack: "bg-rose-100",
    progressFill: "bg-gradient-to-r from-rose-500 to-pink-400",
    valueCss: "text-rose-700",
  },
  purple: {
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
    accent: "from-purple-500 to-violet-400",
    progressTrack: "bg-purple-100",
    progressFill: "bg-gradient-to-r from-purple-500 to-violet-400",
    valueCss: "text-purple-700",
  },
  indigo: {
    iconBg: "bg-indigo-50",
    iconText: "text-indigo-600",
    accent: "from-indigo-500 to-blue-400",
    progressTrack: "bg-indigo-100",
    progressFill: "bg-gradient-to-r from-indigo-500 to-blue-400",
    valueCss: "text-indigo-700",
  },
};

/**
 * AnalyticsStatCard – premium analytics card for admin dashboards.
 *
 * Props:
 *  icon        – Lucide icon component
 *  label       – card title
 *  value       – number or string value to display
 *  detail      – helper text below value
 *  tone        – blue | emerald | amber | rose | purple | indigo
 *  trend       – "up" | "down" | "neutral"
 *  trendLabel  – text beside trend icon, e.g. "+12% this month"
 *  progress    – 0–100 renders a progress bar
 *  isLoading   – skeleton state
 */
export default function AnalyticsStatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "blue",
  trend,
  trendLabel,
  progress,
  isLoading = false,
  className,
  prefix = "",
  suffix = "",
}) {
  const t = toneConfig[tone] ?? toneConfig.blue;

  const rawStr = String(value ?? "");
  const isNumeric =
    typeof value === "number" || (/^\d+$/.test(rawStr) && rawStr !== "");

  const TrendIcon =
    trend === "up"
      ? TrendingUp
      : trend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    trend === "up"
      ? "text-emerald-600 bg-emerald-50 ring-emerald-200"
      : trend === "down"
      ? "text-rose-600 bg-rose-50 ring-rose-200"
      : "text-slate-500 bg-slate-50 ring-slate-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(15,23,42,0.10)" }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow",
        className
      )}
    >
      {/* Coloured top accent stripe */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] rounded-t-xl bg-gradient-to-r",
          t.accent
        )}
      />

      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              t.iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", t.iconText)} />
          </div>
        )}

        {trend && trendLabel && !isLoading && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
              trendColor
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trendLabel}
          </span>
        )}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="mt-1">
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100" />
        ) : isNumeric ? (
          <p className={cn("text-3xl font-extrabold tracking-tight", t.valueCss)}>
            {prefix}
            <CountUp end={parseInt(rawStr, 10) || 0} />
            {suffix}
          </p>
        ) : (
          <p className={cn("text-xl font-bold leading-tight", t.valueCss)}>
            {value}
          </p>
        )}
      </div>

      {detail && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {isLoading ? (
            <span className="inline-block h-3 w-32 animate-pulse rounded bg-slate-100" />
          ) : (
            detail
          )}
        </p>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div
            className={cn(
              "h-1.5 w-full overflow-hidden rounded-full",
              t.progressTrack
            )}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className={cn("h-full rounded-full", t.progressFill)}
            />
          </div>
          <p className="mt-1 text-right text-[10px] font-medium text-slate-400">
            {progress.toFixed(0)}%
          </p>
        </div>
      )}
    </motion.div>
  );
}

AnalyticsStatCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  detail: PropTypes.string,
  tone: PropTypes.oneOf(["blue", "emerald", "amber", "rose", "purple", "indigo"]),
  trend: PropTypes.oneOf(["up", "down", "neutral"]),
  trendLabel: PropTypes.string,
  progress: PropTypes.number,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
};
