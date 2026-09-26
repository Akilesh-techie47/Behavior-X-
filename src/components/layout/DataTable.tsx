import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

/**
 * Dense data tables.
 *
 * Real `<table>` markup with a sticky header, because a reviewer scans these
 * with a keyboard and compares numbers vertically. Rows are selectable so a
 * selection survives a filter change, which is the only way a bulk action in a
 * dense list can be safe.
 */

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Value used for sorting; omit for columns that should not be sorted. */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  /** Hides the caption visually but keeps it for assistive technology. */
  captionVisible?: boolean;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (keys: string[]) => void;
  onRowClick?: (row: T) => void;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  captionVisible,
  selectable,
  selected = [],
  onSelectedChange,
  onRowClick,
  defaultSort,
  emptyMessage = 'No matching records.',
  className = '',
  maxHeight,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(defaultSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find(c => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key: string) => {
    setSort(prev =>
      prev?.key === key
        ? prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
        : { key, direction: 'asc' },
    );
  };

  const allKeys = sorted.map(rowKey);
  const allSelected = allKeys.length > 0 && allKeys.every(k => selected.includes(k));
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    onSelectedChange?.(allSelected ? [] : allKeys);
  };

  const toggleOne = (key: string) => {
    onSelectedChange?.(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  };

  if (rows.length === 0) {
    return (
      <div className={className}>
        <p className={captionVisible ? 'text-[13px] font-semibold text-neutral-900 mb-2' : 'sr-only'}>
          {caption}
        </p>
        <p className="px-4 py-8 text-center text-[12.5px] text-neutral-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-auto ${maxHeight ?? ''} ${className}`}>
      <table className="w-full border-collapse text-[12.5px]">
        <caption className={captionVisible ? 'text-left text-[13px] font-semibold text-neutral-900 px-4 py-3' : 'sr-only'}>
          {caption}
        </caption>
        <thead className="sticky top-0 z-10">
          <tr className="bg-neutral-50">
            {selectable && (
              <th scope="col" className="w-9 px-3 py-2 text-left border-b border-neutral-300">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  aria-label={allSelected ? 'Clear selection' : 'Select all rows'}
                  className="w-3.5 h-3.5 rounded-[2px] border-neutral-400 cursor-pointer"
                />
              </th>
            )}
            {columns.map(column => {
              const sortable = Boolean(column.sortValue);
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                  className={[
                    'px-3 py-2 border-b border-neutral-300 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-neutral-500 whitespace-nowrap',
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                  ].join(' ')}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1 hover:text-neutral-900 transition-colors ${
                        column.align === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {column.header}
                      <span className={active ? 'text-neutral-900' : 'text-neutral-300'}>
                        {active && sort.direction === 'desc' ? (
                          <ArrowDown className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <ArrowUp className="w-3 h-3" aria-hidden="true" />
                        )}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => {
            const key = rowKey(row);
            const isSelected = selected.includes(key);
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  'border-b border-neutral-100 last:border-0',
                  onRowClick ? 'cursor-pointer' : '',
                  isSelected ? 'bg-neutral-50' : 'hover:bg-neutral-50/70',
                ].join(' ')}
              >
                {selectable && (
                  <td className="px-3 py-2 align-top" onClick={event => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(key)}
                      aria-label="Select row"
                      className="w-3.5 h-3.5 rounded-[2px] border-neutral-400 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={[
                      'px-3 py-2 align-top text-neutral-800',
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                      column.className ?? '',
                    ].join(' ')}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** A key/value table for a single record, where rows are the natural unit. */
export function DetailTable({
  rows,
  className = '',
}: {
  rows: { label: React.ReactNode; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={`text-[12.5px] ${className}`}>
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(96px,34%)_1fr] gap-4 py-[7px] border-b border-neutral-100 last:border-0"
        >
          <dt className="text-neutral-500">{row.label}</dt>
          <dd className="text-neutral-900 min-w-0">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
