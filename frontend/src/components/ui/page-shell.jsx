import PropTypes from "prop-types";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

function useEntranceMotion(offset = 8) {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: offset },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.24, ease: "easeOut" },
      };
}

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
  titleClassName,
  descriptionClassName,
  actionsClassName,
}) {
  const motionProps = useEntranceMotion();

  return (
    <div className={cn("ln-page-surface min-h-screen text-slate-950", className)}>
      <motion.section
        {...motionProps}
        className={cn("mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8", contentClassName)}
      >
        {(eyebrow || title || description || actions) && (
          <div
            className={cn(
              "ln-shell-header mb-6 flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between",
              headerClassName
            )}
          >
            <div className="max-w-3xl">
              {eyebrow && <p className="ln-eyebrow text-emerald-700">{eyebrow}</p>}
              {title && (
                <h1
                  className={cn(
                    "mt-1.5 text-2xl font-black text-slate-950 sm:text-3xl",
                    titleClassName
                  )}
                >
                  {title}
                </h1>
              )}
              {description && (
                <p
                  className={cn(
                    "mt-2 max-w-2xl text-sm leading-6 text-slate-600",
                    descriptionClassName
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className={cn("flex flex-wrap items-center gap-3", actionsClassName)}>
                {actions}
              </div>
            )}
          </div>
        )}
        <div>{children}</div>
      </motion.section>
    </div>
  );
}

PageShell.propTypes = {
  eyebrow: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  titleClassName: PropTypes.string,
  descriptionClassName: PropTypes.string,
  actionsClassName: PropTypes.string,
};

export function DashboardShell({
  sidebar,
  eyebrow,
  title,
  description,
  actions,
  children,
  sidebarWidth = "18rem",
}) {
  const motionProps = useEntranceMotion();

  return (
    <div className="ln-dashboard-bg min-h-screen text-slate-950">
      {sidebar}
      <main
        className="min-w-0 px-4 py-5 sm:px-5 lg:ml-[var(--sidebar-width)] lg:px-6"
        style={{ "--sidebar-width": sidebarWidth }}
      >
        <motion.div {...motionProps} className="mx-auto max-w-[1600px]">
          {(title || description || actions) && (
            <section className="ln-shell-header mb-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  {eyebrow && <p className="ln-eyebrow text-emerald-700">{eyebrow}</p>}
                  {title && (
                    <h1 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                  )}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
              </div>
            </section>
          )}
          <div>{children}</div>
        </motion.div>
      </main>
    </div>
  );
}

DashboardShell.propTypes = {
  sidebar: PropTypes.node,
  eyebrow: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  sidebarWidth: PropTypes.string,
};

export function SectionCard({ title, description, action, children, className, bodyClassName }) {
  const motionProps = useEntranceMotion(6);

  return (
    <motion.section {...motionProps} className={cn("ln-card", className)}>
      {(title || description || action) && (
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-950">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </motion.section>
  );
}

SectionCard.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
};

export function StatCard({ icon: Icon, label, value, detail, tone = "blue", className }) {
  const motionProps = useEntranceMotion(6);
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <motion.div
      {...motionProps}
      whileHover={{ y: -3 }}
      className={cn("ln-market-card flex min-h-[8.25rem] items-start gap-3 p-4", className)}
    >
      {Icon && (
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        {detail && <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>}
      </div>
    </motion.div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  detail: PropTypes.node,
  tone: PropTypes.oneOf(["blue", "emerald", "amber", "rose", "slate"]),
  className: PropTypes.string,
};

export function EmptyState({ icon: Icon, title, description, action, className }) {
  const motionProps = useEntranceMotion(6);

  return (
    <motion.div
      {...motionProps}
      className={cn("rounded-lg border border-dashed border-blue-200 bg-white px-6 py-10 text-center shadow-sm", className)}
    >
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </motion.div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string,
};

export function LoadingState({ label = "Loading", className }) {
  return (
    <div
      className={cn(
          "flex min-h-[16rem] items-center justify-center rounded-lg border border-blue-100 bg-white/95 p-4 shadow-sm backdrop-blur",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
        {label}
      </div>
    </div>
  );
}

LoadingState.propTypes = {
  label: PropTypes.node,
  className: PropTypes.string,
};

export function FormShell({ title, description, children, footer, className }) {
  const motionProps = useEntranceMotion();

  return (
    <div className="ln-page-surface flex min-h-screen items-center justify-center px-4 py-10">
      <motion.section
        {...motionProps}
      className={cn("w-full max-w-md rounded-lg border border-blue-100 bg-white/94 p-6 shadow-[0_24px_70px_rgba(10,65,116,0.14)] backdrop-blur sm:p-7", className)}
      >
        <div className="mb-6 text-center">
          <img src="/lankanestLogo.png" alt="LankaNest" className="mx-auto h-12 w-auto" />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">{title}</h1>
          {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
      </motion.section>
    </div>
  );
}

FormShell.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  className: PropTypes.string,
};

export function PremiumLink({ children, className, ...props }) {
  return (
    <a
      className={cn("inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-emerald-700", className)}
      {...props}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

PremiumLink.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
