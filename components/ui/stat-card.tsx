import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "green" | "cobalt" | "teal" | "rose";
  sub?: string;
  icon?: LucideIcon;
}

/**
 * KPI card with optional delta + sub-label. Used on Dashboard and
 * Mediaplanering. `deltaTone` defaults to green for positive deltas.
 */
export function StatCard({
  label,
  value,
  delta,
  deltaTone = "green",
  sub,
  icon: Icon,
}: StatCardProps) {
  const deltaColorClass =
    deltaTone === "cobalt"
      ? "text-nordea-blue"
      : deltaTone === "teal"
        ? "text-nordea-teal"
        : deltaTone === "rose"
          ? "text-nordea-rose"
          : "text-nordea-green";

  return (
    <div className="nordea-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="nordea-eyebrow text-[10px]">{label}</div>
        {Icon && (
          <div className="w-7 h-7 bg-nordea-blue-soft text-nordea-blue rounded-md flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-nordea-text tracking-tight">
          {value}
        </span>
        {delta && (
          <span className={`text-xs font-medium ${deltaColorClass}`}>
            {delta}
          </span>
        )}
      </div>
      {sub && (
        <div className="text-xs text-nordea-text-tertiary mt-1">{sub}</div>
      )}
    </div>
  );
}
