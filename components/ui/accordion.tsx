"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Lightweight collapsible. Named to match the spec; intentionally
 * uncontrolled. If we need a controlled or multi-section accordion later
 * we can swap in radix-ui's primitive without changing call-sites.
 */
export function Accordion({ title, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-nordea-border rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-nordea-bg-hover transition-colors"
      >
        <span className="text-sm font-medium text-nordea-text">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-nordea-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-nordea-hairline">
          {children}
        </div>
      )}
    </div>
  );
}
