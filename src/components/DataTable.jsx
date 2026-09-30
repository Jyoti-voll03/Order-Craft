import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DataTable({
  columns,
  data,
  pageSize = 8,
  emptyTitle = 'No matching records found',
  emptyDescription = 'Try adjusting your search query or status filters.',
  emptyAction,
}) {
  const { settings } = useApp();
  const isCompact = settings?.appearance?.compactTables;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const cellPadding = isCompact ? 'px-4 py-2.5' : 'px-5 py-3.5';

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-navy-900">{emptyTitle}</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          {emptyDescription}
        </p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-5 py-3.5 whitespace-nowrap ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {paginatedData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="hover:bg-slate-50/80 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    className={`${cellPadding} ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data.length > pageSize && (
        <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing{' '}
            <span className="font-semibold text-navy-900">
              {(safePage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-navy-900">
              {Math.min(safePage * pageSize, data.length)}
            </span>{' '}
            of <span className="font-semibold text-navy-900">{data.length}</span>{' '}
            records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                  pageNum === safePage
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
