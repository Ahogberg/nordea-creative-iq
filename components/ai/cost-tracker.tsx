"use client";

import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, Check } from "lucide-react";

interface UsageBudget {
  user_id: string;
  monthly_budget_usd: number;
  current_period_spend_usd: number;
  period_start: string;
}

interface UsageStats {
  total_calls_30d: number;
  cached_calls: number;
  stubbed_calls: number;
  failed_calls: number;
  cache_hit_rate: number;
}

interface UsagePayload {
  budget: UsageBudget;
  stats: UsageStats;
  by_provider: Record<string, { count: number; spend: number }>;
}

interface CostTrackerProps {
  /** Light theme for dashboard panels; default is the Motion-Studio dark theme */
  variant?: "dark" | "light";
}

export function CostTracker({ variant = "dark" }: CostTrackerProps) {
  const [usage, setUsage] = useState<UsagePayload | null>(null);

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUsage(data))
      .catch(() => setUsage(null));
  }, []);

  if (!usage) return null;

  const spend = usage.budget?.current_period_spend_usd ?? 0;
  const budget = usage.budget?.monthly_budget_usd ?? 100;
  const pct = budget > 0 ? (spend / budget) * 100 : 0;
  const Icon = pct > 80 ? AlertTriangle : pct > 0 ? TrendingUp : Check;
  const color = pct > 80 ? "#C8575C" : pct > 50 ? "#E2BD2C" : "#40BFA3";

  const dark = variant === "dark";
  const cardBg = dark ? "bg-white/[0.03]" : "bg-white";
  const cardBorder = dark ? "border-white/[0.06]" : "border-gray-200";
  const titleColor = dark ? "text-white" : "text-gray-900";
  const labelColor = dark ? "text-white/40" : "text-gray-500";
  const trackBg = dark ? "bg-white/10" : "bg-gray-100";
  const dividerBorder = dark ? "border-white/[0.06]" : "border-gray-200";

  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className={`text-sm font-medium ${titleColor}`}>
            AI-användning denna månad
          </span>
        </div>
        <span className={`text-xs ${labelColor} font-mono tabular-nums`}>
          ${spend.toFixed(2)} / ${budget.toFixed(0)}
        </span>
      </div>

      <div className={`h-2 ${trackBg} rounded-full overflow-hidden mb-3`}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>

      <div className={`grid grid-cols-3 gap-3 pt-3 border-t ${dividerBorder}`}>
        <Stat label="Anrop (30d)" value={usage.stats?.total_calls_30d ?? 0} variant={variant} />
        <Stat
          label="Cache-hits"
          value={`${Math.round((usage.stats?.cache_hit_rate ?? 0) * 100)}%`}
          variant={variant}
        />
        <Stat
          label="Stubbed"
          value={usage.stats?.stubbed_calls ?? 0}
          tone={(usage.stats?.stubbed_calls ?? 0) > 0 ? "warn" : "normal"}
          variant={variant}
        />
      </div>

      {(usage.stats?.stubbed_calls ?? 0) > 0 && (
        <div className={`mt-3 pt-3 border-t ${dividerBorder} text-xs text-amber-400/90`}>
          {usage.stats.stubbed_calls} anrop till externa providers blockerade — väntar på Nordea-godkännande
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "normal",
  variant = "dark",
}: {
  label: string;
  value: number | string;
  tone?: "normal" | "warn";
  variant?: "dark" | "light";
}) {
  const dark = variant === "dark";
  const labelColor = dark ? "text-white/40" : "text-gray-500";
  const baseValueColor = dark ? "text-white" : "text-gray-900";
  return (
    <div>
      <div className={`text-xs ${labelColor}`}>{label}</div>
      <div
        className={`text-lg font-semibold tabular-nums ${
          tone === "warn" ? "text-amber-400" : baseValueColor
        }`}
      >
        {value}
      </div>
    </div>
  );
}
