import type { LucideIcon } from "lucide-react";

interface SegmentedTab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Segmenterade flikar i Nordea-stil (ersätter de gamla .tabs-list-klasserna). */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex gap-1 p-1 rounded-lg bg-nordea-deep-soft ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 h-8 px-3.5 rounded-md text-[13px] font-medium transition-all ${
              active
                ? "bg-white text-nordea-text shadow-[0_1px_3px_rgba(0,0,94,0.08)]"
                : "text-nordea-text-tertiary hover:text-nordea-text"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[11px] font-mono ${active ? "text-nordea-blue" : "text-nordea-text-faint"}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
