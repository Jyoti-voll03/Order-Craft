import React from 'react';

const COLOR_VARIANTS = {
  navy: {
    iconBg: 'bg-navy-900 text-white',
    borderAccent: 'border-l-4 border-l-navy-900',
    badge: 'bg-slate-100 text-slate-700',
  },
  orange: {
    iconBg: 'bg-orange-500 text-white',
    borderAccent: 'border-l-4 border-l-orange-500',
    badge: 'bg-orange-50 text-orange-700',
  },
  emerald: {
    iconBg: 'bg-emerald-600 text-white',
    borderAccent: 'border-l-4 border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  amber: {
    iconBg: 'bg-amber-500 text-white',
    borderAccent: 'border-l-4 border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700',
  },
  rose: {
    iconBg: 'bg-rose-600 text-white',
    borderAccent: 'border-l-4 border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700',
  },
  indigo: {
    iconBg: 'bg-indigo-600 text-white',
    borderAccent: 'border-l-4 border-l-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'navy',
  trend,
  onClick,
}) {
  const theme = COLOR_VARIANTS[variant] || COLOR_VARIANTS.navy;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 ${theme.borderAccent} transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${theme.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500 truncate">{subtitle}</span>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${theme.badge}`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
