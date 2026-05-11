import { ChevronRight } from "lucide-react";

interface TopbarProps {
  breadcrumb: string[];
  right?: React.ReactNode;
}

/**
 * Shared topbar with breadcrumb + optional right-aligned actions. Used by
 * every screen redesigned in Sprint 7 for visual consistency.
 */
export function Topbar({ breadcrumb, right }: TopbarProps) {
  return (
    <div className="h-14 px-8 border-b border-nordea-hairline flex items-center justify-between bg-white">
      <div className="flex items-center gap-2 text-sm">
        {breadcrumb.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <ChevronRight className="w-3 h-3 text-nordea-text-tertiary" />
            )}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "text-nordea-text font-medium"
                  : "text-nordea-text-tertiary"
              }
            >
              {item}
            </span>
          </span>
        ))}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
