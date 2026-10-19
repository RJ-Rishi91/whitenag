import React from 'react';

const statusConfig = {
  received: { label: 'Received', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  packed: { label: 'Packed', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  shipped: { label: 'Shipped', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export function StatusBadge({ status, size = 'md' }) {
  const config = statusConfig[status?.toLowerCase()] || {
    label: status || 'Unknown',
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-200'
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {config.label}
    </span>
  );
}
