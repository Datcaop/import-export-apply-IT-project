import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  footer?: ReactNode;
}

export function DataTable<T>({ columns, data, rowKey, emptyMessage = 'Không có dữ liệu', footer }: DataTableProps<T>) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-text tabular-nums">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-3 py-2.5 text-[13px] font-semibold text-text-muted bg-surface-alt border-b border-border whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-surface-alt/50">
                  {columns.map((col) => (
                    <td key={col.key} className={`text-left px-3 py-[11px] border-b border-border-soft align-middle ${col.className ?? ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
