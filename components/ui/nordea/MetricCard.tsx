interface MetricCardProps {
  label: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  sublabel?: string;
}

export function MetricCard({ label, value, change, sublabel }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</span>
        {change && (
          <span className={`text-sm font-medium ${change.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {change.positive ? '\u2191' : '\u2193'} {change.value}
          </span>
        )}
      </div>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}
