"use client";

import { Check } from "lucide-react";
import { CHANNELS, FORMATS, type Channel, type Format } from "@/lib/campaign-options";

/** Kanaler och format för kampanjen — knappar som slås av och på. */
export function CampaignChoicesPicker({
  channels,
  formats,
  onChange,
  recommendedChannels = [],
  recommendedFormats = [],
}: {
  channels: Channel[];
  formats: Format[];
  onChange: (next: { channels: Channel[]; formats: Format[] }) => void;
  recommendedChannels?: string[];
  recommendedFormats?: string[];
}) {
  const toggle = <T extends string>(list: T[], id: T) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-nordea-text">Kanaler</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <Choice
              key={c.id}
              selected={channels.includes(c.id)}
              recommended={recommendedChannels.includes(c.id)}
              title={c.name}
              detail={c.description}
              onClick={() => onChange({ channels: toggle(channels, c.id), formats })}
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold text-nordea-text">Videoformat</legend>
        <p className="mt-0.5 text-xs text-nordea-text-tertiary">
          Videon görs i det första du väljer — de andra växlar du till i Motion Studio.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMATS.map((f) => {
            const index = formats.indexOf(f.id);
            return (
              <Choice
                key={f.id}
                selected={index >= 0}
                recommended={recommendedFormats.includes(f.id)}
                title={f.name}
                detail={index === 0 ? `${f.ratio} · videon görs här` : f.ratio}
                onClick={() => onChange({ channels, formats: toggle(formats, f.id) })}
              />
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function Choice({
  selected,
  recommended,
  title,
  detail,
  onClick,
}: {
  selected: boolean;
  recommended: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-nordea-blue bg-nordea-blue-soft"
          : "border-nordea-border bg-white hover:border-nordea-blue/40"
      }`}
    >
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-nordea-text">
        {title}
        {selected && <Check className="h-4 w-4 flex-shrink-0 text-nordea-blue" />}
      </span>
      <span className="mt-0.5 block text-xs text-nordea-text-tertiary">
        {detail}
        {recommended && " · rekommenderas"}
      </span>
    </button>
  );
}
