import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  changeText?: string;
  icon: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, changeText, icon, subtitle, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-400 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
          {value}
        </span>
        {changeText && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {changeText}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1.5 truncate">{subtitle}</p>}
    </div>
  );
}
