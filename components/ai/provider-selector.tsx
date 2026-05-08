"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Check, Lock, Cloud, Server } from "lucide-react";

interface ProviderInfo {
  id: string;
  name: string;
  hosting: "self" | "external" | "stock-api";
  status: string;
  available: boolean;
  models?: Array<{ id: string; name: string; cost_per_call_usd: number }>;
  requires_env_keys?: string[];
}

interface ProviderSelectorProps {
  type: "video" | "image" | "stock";
  value: string;
  onChange: (providerId: string) => void;
}

export function ProviderSelector({ type, value, onChange }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/ai/providers")
      .then((r) => r.json())
      .then((data) => setProviders(data[type] ?? []))
      .catch(() => setProviders([]));
  }, [type]);

  const selected = providers.find((p) => p.id === value) ?? providers[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.06] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected && <ProviderIcon provider={selected} />}
          <span className="text-sm font-medium text-white truncate">
            {selected?.name ?? "Välj provider"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 w-full bg-[#0a0a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
            {providers.length === 0 && (
              <div className="p-4 text-sm text-white/50">Laddar providers…</div>
            )}
            {providers.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  if (!p.available) return;
                  onChange(p.id);
                  setOpen(false);
                }}
                disabled={!p.available}
                className={`w-full flex items-start gap-3 p-3 text-left ${
                  p.available
                    ? "hover:bg-white/[0.05] cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                } ${p.id === value ? "bg-white/[0.05]" : ""}`}
              >
                <ProviderIcon provider={p} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {p.name}
                    </span>
                    {p.id === value && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {p.hosting === "self" && "Nordea internal · ingen kostnad"}
                    {p.hosting === "stock-api" && "Royalty-free · ingen kostnad"}
                    {p.hosting === "external" && (
                      <span className="text-amber-400">
                        {p.available
                          ? "Extern · per-call kostnad"
                          : "Stubbed · väntar på godkännande"}
                      </span>
                    )}
                  </div>
                  {!p.available && p.requires_env_keys?.length ? (
                    <div className="text-xs text-white/30 mt-1 font-mono">
                      Kräver: {p.requires_env_keys.join(", ")}
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProviderIcon({ provider }: { provider: ProviderInfo }) {
  const Icon =
    provider.hosting === "self"
      ? Server
      : provider.hosting === "stock-api"
      ? Cloud
      : provider.available
      ? Cloud
      : Lock;

  const color =
    provider.hosting === "self"
      ? "text-emerald-400"
      : provider.hosting === "stock-api"
      ? "text-blue-400"
      : provider.available
      ? "text-blue-400"
      : "text-white/30";

  return <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />;
}
