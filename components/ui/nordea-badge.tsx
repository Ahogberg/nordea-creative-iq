type Tone = "neutral" | "teal" | "cobalt" | "amber" | "green" | "rose" | "solid";

interface NordeaBadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Status / metadata pill. Named "NordeaBadge" to avoid colliding with the
 * existing shadcn `Badge` in components/ui/badge.tsx.
 */
export function NordeaBadge({
  tone = "neutral",
  dot,
  children,
  className = "",
}: NordeaBadgeProps) {
  return (
    <span
      className={`nordea-badge nordea-badge-${tone} ${dot ? "nordea-badge-dot" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
