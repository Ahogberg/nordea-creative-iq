interface SectionTitleProps {
  title: string;
  hint?: string;
  right?: React.ReactNode;
}

export function SectionTitle({ title, hint, right }: SectionTitleProps) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-nordea-text">{title}</h2>
        {hint && (
          <span className="text-xs text-nordea-text-tertiary">{hint}</span>
        )}
      </div>
      {right}
    </div>
  );
}
