interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'neutral';
  children: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
    neutral: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded ${styles[status]}`}>
      {children}
    </span>
  );
}
