import React from 'react';

const STATUS_STYLES = {
  // Order Statuses
  Pending: 'bg-amber-50 text-amber-700 border-amber-200 dot-amber-500',
  Confirmed: 'bg-sky-50 text-sky-700 border-sky-200 dot-sky-500',
  'In Production': 'bg-orange-50 text-orange-700 border-orange-200 dot-orange-500',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald-500',
  Delivered: 'bg-teal-50 text-teal-700 border-teal-200 dot-teal-500',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dot-rose-500',

  // Production Statuses
  Scheduled: 'bg-slate-100 text-slate-700 border-slate-200 dot-slate-500',
  'In Progress': 'bg-orange-50 text-orange-700 border-orange-200 dot-orange-500',
  'Quality Check': 'bg-indigo-50 text-indigo-700 border-indigo-200 dot-indigo-500',
  Paused: 'bg-amber-50 text-amber-700 border-amber-200 dot-amber-500',

  // Inventory Statuses
  'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald-500',
  'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200 dot-amber-500',
  'Out of Stock': 'bg-rose-50 text-rose-700 border-rose-200 dot-rose-500',

  // Priority Levels
  Low: 'bg-slate-100 text-slate-600 border-slate-200 dot-slate-400',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200 dot-blue-500',
  High: 'bg-orange-50 text-orange-700 border-orange-200 dot-orange-500',
  Urgent: 'bg-rose-50 text-rose-700 border-rose-200 dot-rose-600',

  // Customer Status
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald-500',
};

const DOT_COLORS = {
  Pending: 'bg-amber-500',
  Confirmed: 'bg-sky-500',
  'In Production': 'bg-orange-500 animate-pulse',
  Completed: 'bg-emerald-500',
  Delivered: 'bg-teal-500',
  Cancelled: 'bg-rose-500',
  Scheduled: 'bg-slate-400',
  'In Progress': 'bg-orange-500 animate-pulse',
  'Quality Check': 'bg-indigo-500',
  Paused: 'bg-amber-500',
  'In Stock': 'bg-emerald-500',
  'Low Stock': 'bg-amber-500',
  'Out of Stock': 'bg-rose-500 animate-pulse',
  Low: 'bg-slate-400',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Urgent: 'bg-rose-600 animate-pulse',
  Active: 'bg-emerald-500',
};

export default function StatusBadge({ status, size = 'sm', showDot = true }) {
  const styleClass =
    STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotClass = DOT_COLORS[status] || 'bg-slate-400';

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap ${sizeClasses} ${styleClass}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
      {status}
    </span>
  );
}
