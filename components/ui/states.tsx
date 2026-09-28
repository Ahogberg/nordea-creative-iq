// ── Gemensamma lägen: tomt, fel och laddning ──
//
// En och samma formgivning i alla vyer, så att en långsam eller tom databas
// ser avsiktlig ut i stället för trasig. Färger via nordea-tokens (globals.css).

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox, RotateCw } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Knapp eller länk, t.ex. <Link className="nordea-btn nordea-btn-primary">. */
  action?: React.ReactNode;
  /** Kompakt variant för kort och paneler. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center ${compact ? "py-8 px-4" : "py-16 px-6"} ${className}`}>
      <div
        className={`${compact ? "w-10 h-10 mb-3" : "w-12 h-12 mb-4"} rounded-xl bg-nordea-blue-soft text-nordea-blue flex items-center justify-center mx-auto`}
      >
        <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
      </div>
      <div className={`font-semibold text-nordea-text ${compact ? "text-sm" : "text-base"}`}>{title}</div>
      {description && (
        <p className="text-sm text-nordea-text-tertiary mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  /** Visas för användaren — håll den begriplig, inte en stacktrace. */
  description?: string;
  onRetry?: () => void;
  /** Extra handling bredvid "Försök igen", t.ex. en länk tillbaka. */
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Något gick inte att hämta",
  description = "Det kan vara ett tillfälligt fel. Försök igen om en stund.",
  onRetry,
  action,
  compact = false,
  className = "",
}: ErrorStateProps) {
  return (
    <div role="alert" className={`text-center ${compact ? "py-8 px-4" : "py-16 px-6"} ${className}`}>
      <div
        className={`${compact ? "w-10 h-10 mb-3" : "w-12 h-12 mb-4"} rounded-xl bg-nordea-rose-soft text-nordea-rose flex items-center justify-center mx-auto`}
      >
        <AlertCircle className={compact ? "w-4 h-4" : "w-5 h-5"} />
      </div>
      <div className={`font-semibold text-nordea-text ${compact ? "text-sm" : "text-base"}`}>{title}</div>
      <p className="text-sm text-nordea-text-tertiary mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>
      {(onRetry || action) && (
        <div className="mt-5 flex justify-center gap-2">
          {onRetry && (
            <button type="button" onClick={onRetry} className="nordea-btn nordea-btn-secondary">
              <RotateCw className="w-4 h-4" />
              Försök igen
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/** Grå platshållare som pulserar — bygg sidans form av dessa medan data laddas. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-nordea-blue-soft ${className}`} />;
}

/** Rutnät av kortplatshållare, för listor som kampanjer och mallar. */
export function CardGridSkeleton({ count = 6, className = "" }: { count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Laddar"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="nordea-card p-5">
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
