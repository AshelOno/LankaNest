import React from "react";
import { Button } from "@/components/ui/button";

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const Surface = ({ className = "", children }) => (
  <div
    className={cn(
      "rounded-lg border border-blue-100 bg-white shadow-sm",
      className
    )}
  >
    {children}
  </div>
);

export const SectionCard = ({ className = "", children }) => (
  <Surface className={cn("overflow-hidden", className)}>{children}</Surface>
);

export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  badge,
  badgeIcon,
}) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase text-emerald-700">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      ) : null}
    </div>

    {badge ? (
      <div className="hidden items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-emerald-100">
          {badgeIcon}
        </span>
        <span>{badge}</span>
      </div>
    ) : null}
  </div>
);

export const BadgeChip = ({ children, tone = "default" }) => {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    primary: "bg-blue-700 text-white",
    soft: "bg-teal-50 text-teal-700 border border-teal-100",
    danger: "bg-rose-500 text-white",
    success: "bg-emerald-500 text-white",
    amber: "bg-amber-100 text-amber-800 border border-amber-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-3 py-1 text-xs font-medium",
        styles[tone]
      )}
    >
      {children}
    </span>
  );
};

export const ActionButton = ({
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const styles = {
    default:
      "bg-white text-slate-900 border border-blue-100 hover:bg-blue-50 hover:border-blue-200",
    primary: "bg-blue-700 text-white border border-blue-700 hover:bg-blue-800",
    danger: "bg-rose-500 text-white border border-rose-500 hover:bg-rose-600",
    saved: "bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700",
  };

  return (
    <Button
      className={cn(
        "w-full rounded-lg px-4 py-3 font-medium shadow-sm transition-all duration-200",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export const StatCard = ({ icon, label, value, accent = false }) => {
  const displayValue =
    value === null || value === undefined || value === "" ? "N/A" : value;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        accent
          ? "border-emerald-200 bg-emerald-50"
          : "border-blue-100 bg-white"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-xl text-emerald-700">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="truncate text-sm font-semibold text-slate-900">
            {displayValue}
          </p>
        </div>
      </div>
    </div>
  );
};

export const InfoRow = ({ label, value }) => {
  const displayValue =
    value === null || value === undefined || value === "" ? "N/A" : value;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-blue-100 bg-slate-50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50/50">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="max-w-[62%] break-words text-right text-sm font-semibold text-slate-900">
        {displayValue}
      </span>
    </div>
  );
};

export const ModalShell = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 520,
}) => {
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-50 w-full overflow-hidden rounded-lg border border-blue-100 bg-white shadow-2xl"
        style={{ maxWidth: width }}
      >
        <div className="border-b border-blue-100 bg-blue-50/70 px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 sm:px-7">
          {children}
        </div>
      </div>
    </div>
  ) : null;
};
