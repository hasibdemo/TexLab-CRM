import React from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
  emptyAction?: React.ReactNode;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Pagination
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your filters or search query.',
  emptyAction,
  sortKey,
  sortOrder,
  onSort,
  currentPage = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  const total = totalItems !== undefined ? totalItems : data.length;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          <div className="h-9 bg-slate-100 rounded animate-pulse" />
          <div className="h-12 bg-slate-50 rounded animate-pulse" />
          <div className="h-12 bg-slate-50 rounded animate-pulse" />
          <div className="h-12 bg-slate-50 rounded animate-pulse" />
          <div className="h-12 bg-slate-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">{emptyMessage}</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{emptySubtext}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-semibold tracking-wide uppercase">
              {columns.map((col, idx) => {
                const isSorted = col.sortKey && sortKey === col.sortKey;
                return (
                  <th
                    key={idx}
                    className={`py-3 px-4 ${col.headerClassName || ''}`}
                    onClick={() => {
                      if (col.sortable && col.sortKey && onSort) {
                        onSort(col.sortKey);
                      }
                    }}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.sortable ? 'cursor-pointer hover:text-slate-900 select-none' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-900" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-900" />
                            )
                          ) : (
                            <span className="inline-block w-3.5 h-3.5 text-slate-300">↕</span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'
                }`}
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`py-3 px-4 ${col.className || ''}`}>
                    {col.render
                      ? col.render(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/40 text-xs text-slate-600">
          <div className="font-mono tabular-nums">
            Showing <span className="font-semibold text-slate-900">{startItem}</span> to{' '}
            <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
            <span className="font-semibold text-slate-900">{total}</span> records
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 font-mono tabular-nums text-xs">
              Page {currentPage} of {totalPages}
            </div>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
