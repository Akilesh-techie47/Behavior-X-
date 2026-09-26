import { useMemo, useState } from 'react';
import { CHANNEL_LABEL, formatOffset } from '../../domain/format';
import type { EvidenceChannel, EvidenceSignal, SignalStrength } from '../../domain/types';
import type { Column } from '../layout/DataTable';
import { DataTable as Table } from '../layout/DataTable';
import { ChannelTag, ConfidenceMeter, StrengthBar, Tag } from '../primitives/Status';
import { Select, TextInput } from '../primitives/Form';
import { Toolbar, ToolbarGroup } from '../layout/Panel';
import { EmptyBlock } from '../feedback/StateBlock';

/**
 * The signal table.
 *
 * This is the densest object in the product and the one a reviewer returns to
 * most, so it is a real sortable table with a stable row identity and a
 * selection that survives filtering. Signals are never sorted by confidence by
 * default: a reviewer wants them in time order, because time order is what
 * makes correlation possible.
 */

const STRENGTH_RANK: Record<SignalStrength, number> = { strong: 0, moderate: 1, weak: 2 };

export interface SignalFilters {
  search: string;
  channel: EvidenceChannel | 'all';
  strength: SignalStrength | 'all';
  minConfidence: number;
  escalatedOnly: boolean;
}

const EMPTY: SignalFilters = {
  search: '',
  channel: 'all',
  strength: 'all',
  minConfidence: 0,
  escalatedOnly: false,
};

export function SignalTable({
  signals,
  escalatedIds,
  selectedId,
  onSelect,
}: {
  signals: EvidenceSignal[];
  escalatedIds: Set<string>;
  selectedId?: string | null;
  onSelect: (signal: EvidenceSignal) => void;
}) {
  const [filters, setFilters] = useState<SignalFilters>(EMPTY);
  const [selection, setSelection] = useState<string[]>([]);

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return signals
      .filter(signal => {
        if (filters.channel !== 'all' && signal.channel !== filters.channel) return false;
        if (filters.strength !== 'all' && signal.strength !== filters.strength) return false;
        if (signal.confidence * 100 < filters.minConfidence) return false;
        if (filters.escalatedOnly && !escalatedIds.has(signal.id)) return false;
        if (needle && !`${signal.label} ${signal.detail} ${signal.kind} ${signal.channel}`.toLowerCase().includes(needle)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.offsetSeconds - b.offsetSeconds);
  }, [signals, filters, escalatedIds]);

  const columns: Column<EvidenceSignal>[] = [
    {
      key: 'offset',
      header: 'At',
      width: '76px',
      sortValue: s => s.offsetSeconds,
      cell: s => <span className="data text-[11.5px] text-neutral-500">{formatOffset(s.offsetSeconds)}</span>,
    },
    {
      key: 'channel',
      header: 'Ch',
      width: '54px',
      sortValue: s => s.channel,
      cell: s => <ChannelTag channel={s.channel} />,
    },
    {
      key: 'summary',
      header: 'Observation',
      cell: s => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              onSelect(s);
            }}
            className={`text-left hover:underline underline-offset-2 ${
              selectedId === s.id ? 'text-neutral-900 font-medium' : 'text-neutral-800'
            }`}
          >
            {s.label}
          </button>
          <p className="mt-1 text-[11.5px] text-neutral-500 leading-snug max-w-[64ch]">{s.detail}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="data text-[11px] text-neutral-400">{s.kind.replace(/_/g, ' ')}</span>
            {escalatedIds.has(s.id) && <Tag className="border-neutral-400 text-neutral-800">Escalated</Tag>}
            {s.questionNumber !== undefined && (
              <span className="data text-[11px] text-neutral-400">Q{s.questionNumber}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'strength',
      header: 'Strength',
      width: '96px',
      sortValue: s => STRENGTH_RANK[s.strength],
      cell: s => <StrengthBar strength={s.strength} />,
    },
    {
      key: 'confidence',
      header: 'Conf.',
      width: '104px',
      align: 'right',
      sortValue: s => s.confidence,
      cell: s => <ConfidenceMeter value={s.confidence} />,
    },
    {
      key: 'conditions',
      header: 'Source',
      width: '150px',
      cell: s => (
        <div className="text-[11.5px] text-neutral-500 leading-snug">
          <div>{s.source}</div>
          <div className="data text-neutral-400 mt-0.5">{s.wallClock}</div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Toolbar>
        <ToolbarGroup label="Find">
          <TextInput
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search observations…"
            aria-label="Search observations"
            className="w-[200px] h-8 text-[12.5px]"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Channel">
          <Select
            value={filters.channel}
            onChange={e => setFilters(f => ({ ...f, channel: e.target.value as SignalFilters['channel'] }))}
            aria-label="Filter by channel"
            className="w-[132px]"
          >
            <option value="all">All channels</option>
            {(Object.keys(CHANNEL_LABEL) as EvidenceChannel[]).map(channel => (
              <option key={channel} value={channel}>
                {CHANNEL_LABEL[channel]}
              </option>
            ))}
          </Select>
        </ToolbarGroup>

        <ToolbarGroup label="Strength">
          <Select
            value={filters.strength}
            onChange={e =>
              setFilters(f => ({ ...f, strength: e.target.value as SignalFilters['strength'] }))
            }
            aria-label="Filter by strength"
            className="w-[116px]"
          >
            <option value="all">Any</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </Select>
        </ToolbarGroup>

        <ToolbarGroup label="Conf ≥">
          <Select
            value={String(filters.minConfidence)}
            onChange={e => setFilters(f => ({ ...f, minConfidence: Number(e.target.value) }))}
            aria-label="Minimum confidence"
            className="w-[92px]"
          >
            <option value="0">Any</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
          </Select>
        </ToolbarGroup>

        <label className="flex items-center gap-1.5 text-[12px] text-neutral-600 cursor-pointer ml-1">
          <input
            type="checkbox"
            checked={filters.escalatedOnly}
            onChange={e => setFilters(f => ({ ...f, escalatedOnly: e.target.checked }))}
            className="w-3.5 h-3.5 rounded-[2px] border-neutral-400 cursor-pointer"
          />
          Escalated only
        </label>

        <span className="ml-auto data text-[11.5px] text-neutral-400">
          {visible.length} of {signals.length}
        </span>
      </Toolbar>

      <Table
        columns={columns}
        rows={visible}
        rowKey={s => s.id}
        caption="Observations recorded during this session"
        selectable
        selected={selection}
        onSelectedChange={setSelection}
        onRowClick={onSelect}
        emptyMessage="No observations match these filters."
        maxHeight="max-h-[520px]"
      />

      {selection.length > 0 && (
        <div className="px-3 py-2 border-t border-neutral-200 bg-neutral-50 flex flex-wrap items-center gap-3">
          <span className="data text-[11.5px] text-neutral-600">{selection.length} selected</span>
          <span className="text-[11.5px] text-neutral-500">
            Selection is kept while you change the filters.
          </span>
        </div>
      )}

      {visible.length === 0 && signals.length > 0 && (
        <EmptyBlock
          title="No observations match"
          description="Widen the confidence threshold or clear the channel filter."
          className="hidden"
        />
      )}
    </div>
  );
}
