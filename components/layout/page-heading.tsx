interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
}

/** Sidrubrik i Sprint 7-stil: eyebrow + display-rubrik + ingress. */
export function PageHeading({ eyebrow, title, description, right }: PageHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-6 mb-7">
      <div>
        {eyebrow && <div className="nordea-eyebrow mb-2">{eyebrow}</div>}
        <h1 className="nordea-display text-3xl text-nordea-deep">{title}</h1>
        {description && (
          <p className="text-sm text-nordea-text-secondary mt-2 max-w-2xl">{description}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  );
}
