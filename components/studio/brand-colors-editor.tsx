"use client";

import { useStudioStore } from "@/lib/studio/store";
import { Label } from "@/components/ui/label";

const NORDEA_PALETTE = [
  { name: "Nordea Deep", hex: "#00005E" },
  { name: "Nordea Blue", hex: "#0000A0" },
  { name: "Nordea Teal", hex: "#40BFA3" },
];

/**
 * Background + accent color picker. Writes to config.backgroundColor +
 * config.accentColor — the canonical Nordea palette is offered as quick
 * swatches; future sprints can add a free-form picker.
 */
export function BrandColorsEditor() {
  const backgroundColor = useStudioStore((s) => s.config.backgroundColor);
  const accentColor = useStudioStore((s) => s.config.accentColor);

  const setBackground = (hex: string) =>
    useStudioStore.setState((state) => ({
      config: { ...state.config, backgroundColor: hex },
    }));
  const setAccent = (hex: string) =>
    useStudioStore.setState((state) => ({
      config: { ...state.config, accentColor: hex },
    }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Bakgrund</Label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {NORDEA_PALETTE.map((color) => {
            const active = backgroundColor === color.hex;
            return (
              <button
                type="button"
                key={`bg-${color.hex}`}
                title={color.name}
                onClick={() => setBackground(color.hex)}
                className={`w-9 h-9 rounded-md border transition-all ${
                  active
                    ? "border-nordea-blue ring-2 ring-nordea-blue/30"
                    : "border-nordea-border hover:ring-1 hover:ring-nordea-blue/20"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs">Accentfärg</Label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {NORDEA_PALETTE.map((color) => {
            const active = accentColor === color.hex;
            return (
              <button
                type="button"
                key={`accent-${color.hex}`}
                title={color.name}
                onClick={() => setAccent(color.hex)}
                className={`w-9 h-9 rounded-md border transition-all ${
                  active
                    ? "border-nordea-blue ring-2 ring-nordea-blue/30"
                    : "border-nordea-border hover:ring-1 hover:ring-nordea-blue/20"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </div>

      <p className="text-xs text-nordea-text-tertiary">
        Nordeas varumärkesfärger används som standard. Anpassad färgväljare
        kommer i en senare sprint.
      </p>
    </div>
  );
}
