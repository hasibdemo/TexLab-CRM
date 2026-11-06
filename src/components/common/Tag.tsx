import React from 'react';

interface TagProps {
  label: string;
  onRemove?: () => void;
  variant?: 'default' | 'blue' | 'slate';
}

export function Tag({ label, onRemove, variant = 'default' }: TagProps) {
  const styles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/80',
    blue: 'bg-blue-50 text-blue-800 border-blue-200/70',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${styles[variant]} whitespace-nowrap`}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          aria-label={`Remove tag ${label}`}
        >
          &times;
        </button>
      )}
    </span>
  );
}

interface StatusIndicatorProps {
  status: 'Lead' | 'Active' | 'Inactive';
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const configs = {
    Active: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200/60',
      label: 'Active',
    },
    Lead: {
      text: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200/60',
      label: 'Lead',
    },
    Inactive: {
      text: 'text-slate-600',
      bg: 'bg-slate-100 border-slate-200',
      label: 'Inactive',
    },
  };

  const current = configs[status] || configs.Active;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${current.bg} ${current.text} whitespace-nowrap`}>
      {current.label}
    </span>
  );
}

interface TypeIndicatorProps {
  type: 'Buyer' | 'Supplier' | 'Agent' | 'Freight Forwarder';
}

export function TypeIndicator({ type }: TypeIndicatorProps) {
  const configs = {
    Buyer: 'bg-blue-50 text-blue-800 border-blue-200',
    Supplier: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    Agent: 'bg-amber-50 text-amber-800 border-amber-200',
    'Freight Forwarder': 'bg-slate-100 text-slate-800 border-slate-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${configs[type] || 'bg-slate-100 text-slate-700'} whitespace-nowrap`}>
      {type}
    </span>
  );
}
