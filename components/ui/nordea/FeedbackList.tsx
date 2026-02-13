import { Check, AlertTriangle, X } from 'lucide-react';

interface FeedbackItem {
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

export function FeedbackList({ items, title }: { items: FeedbackItem[]; title?: string }) {
  const icons = {
    pass: <Check className="w-4 h-4 text-emerald-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    fail: <X className="w-4 h-4 text-red-500" />,
  };

  return (
    <div>
      {title && <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>}
      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            <span className="mt-0.5">{icons[item.status]}</span>
            <span className="text-sm text-gray-700">{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
