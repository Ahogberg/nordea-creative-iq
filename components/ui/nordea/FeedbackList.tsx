import { Check, AlertTriangle, X } from 'lucide-react';

interface FeedbackItem {
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

export function FeedbackList({ items, title }: { items: FeedbackItem[]; title?: string }) {
  const icons = {
    pass: <Check className="w-4 h-4 text-nordea-green" />,
    warning: <AlertTriangle className="w-4 h-4 text-nordea-amber" />,
    fail: <X className="w-4 h-4 text-nordea-rose" />,
  };

  return (
    <div>
      {title && <h4 className="nordea-eyebrow mb-2">{title}</h4>}
      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-3 border-b border-nordea-hairline last:border-0">
            <span className="mt-0.5">{icons[item.status]}</span>
            <span className="text-[13px] text-nordea-text-secondary">{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
