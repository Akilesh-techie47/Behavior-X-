import { useMemo, useState } from 'react';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, PanelHeader, StatStrip, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Column, DataTable } from '../../components/layout/DataTable';
import { Meter, StatusBadge, Tag } from '../../components/primitives/Status';
import { Select, TextInput } from '../../components/primitives/Form';
import { Button } from '../../components/primitives/Button';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { formatDateTime } from '../../domain/format';
import type { ReportModel, ReportRow } from '../../domain/types';

/**
 * Reports.
 *
 * One row per examination, and the confirmed column is deliberately small next
 * to the sessions column. A report that made confirmed findings look like the
 * headline number would be a report arguing for itself.
 */
export function Reports() {
  const reports = useAsync(() => services.analytics.reports(), []);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('all');
  const [open, setOpen] = useState<ReportRow | null>(null);

  const data: ReportModel | null = reports.data ?? null;
  const rows = data?.rows ?? [];
  const terms = useMemo(() => [...new Set(rows.map(r => r.term))].sort(), [rows]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(row => {
      if (term !== 'all' && row.term !== term) return false;
      if (needle && !`${row.examCode} ${row.examTitle}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, search, term]);

  const totals = useMemo(
    () => ({
      sessions: rows.reduce((sum, r) => sum + r.sessions, 0),
      review: rows.reduce((sum, r) => sum + r.reviewCandidates, 0),
      confirmed: rows.reduce((sum, r) => sum + r.confirmed, 0),
      dismissed: rows.reduce((sum, r) => sum + r.dismissed, 0),
      uncertain: rows.reduce((sum, r) => sum + r.uncertain, 0),
    }),
    [rows],
  );

  if (reports.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={6} label="Loading reports" />
      </div>
    );
  }

  if (reports.error && !reports.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={reports.error.kind} message={reports.error.message} onRetry={reports.reload} />
      </div>
    );
  }

  const columns: Column<ReportRow>[] = [
    {
      key: 'exam',
      header: 'Examination',
      cell: r => (
        <div className="min-w-0">
          <div className="text-[12.5px] text-neutral-900">{r.examTitle}</div>
          <div className="data text-[11px] text-neutral-400">
            {r.examCode} · {r.term}
          </div>
        </div>
      ),
    },
    {
      key: 'sessions',
      header: 'Sessions',
      width: '84px',
      align: 'right',
      sortValue: r => r.sessions,
      cell: r => <span className="data text-[11.5px] text-neutral-700">{r.sessions}</span>,
    },
    {
      key: 'coverage',
      header: 'Coverage',
      width: '108px',
      align: 'right',
      sortValue: r => r.coverage,
      cell: r => (
        <div className="flex items-center justify-end gap-2">
          <Meter value={r.coverage} label="Coverage" className="w-12" />
          <span className="data text-[11.5px]">{r.coverage}%</span>
        </div>
      ),
    },
    {
      key: 'quality',
      header: 'Evidence',
      width: '108px',
      align: 'right',
      sortValue: r => r.evidenceQuality,
      cell: r => <span className="data text-[11.5px] text-neutral-700">{r.evidenceQuality}%</span>,
    },
    {
      key: 'reviewed',
      header: 'Reviewed',
      width: '88px',
      align: 'right',
      sortValue: r => r.reviewCandidates,
      cell: r => <span className="data text-[11.5px] text-neutral-600">{r.reviewCandidates}</span>,
    },
    {
      key: 'confirmed',
      header: 'Confirmed',
      width: '92px',
      align: 'right',
      sortValue: r => r.confirmed,
      cell: r => <span className="data text-[11.5px] text-neutral-900">{r.confirmed}</span>,
    },
    {
      key: 'dismissed',
      header: 'Dismissed',
      width: '92px',
      align: 'right',
      sortValue: r => r.dismissed,
      cell: r => <span className="data text-[11.5px] text-neutral-600">{r.dismissed}</span>,
    },
    {
      key: 'uncertain',
      header: 'Uncertain',
      width: '92px',
      align: 'right',
      sortValue: r => r.uncertain,
      cell: r => <span className="data text-[11.5px] text-neutral-600">{r.uncertain}</span>,
    },
    {
      key: 'outcome',
      header: 'Outcome',
      width: '112px',
      cell: r => (
        <OutcomeBadge row={r} />
      ),
    },
    {
      key: 'open',
      header: '',
      width: '96px',
      align: 'right',
      cell: r => (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            setOpen(r);
          }}
          className="text-[12px] font-medium text-neutral-600 hover:text-neutral-900"
        >
          Detail
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Records"
        title="Reports"
        description="Per-examination summaries of what was observed and what an examiner decided. Prepared from the record, not from a model."
        actions={<SimulatedMark label="Synthetic report" />}
      />

      {data && (
        <Panel>
          <StatStrip
            items={[
              { label: 'Examinations', value: rows.length, sublabel: 'In the reporting period' },
              { label: 'Sessions', value: totals.sessions, sublabel: 'All submitted' },
              {
                label: 'Taken to review',
                value: totals.review,
                sublabel: `${((totals.review / Math.max(1, totals.sessions)) * 100).toFixed(1)}% of sessions`,
              },
              {
                label: 'Confirmed',
                value: totals.confirmed,
                sublabel: `${((totals.confirmed / Math.max(1, totals.review)) * 100).toFixed(1)}% of reviews`,
                emphasis: true,
              },
            ]}
          />
        </Panel>
      )}

      <Panel>
        <Toolbar>
          <ToolbarGroup label="Find">
            <TextInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Examination or code…"
              aria-label="Search reports"
              className="w-[240px] h-8 text-[12.5px]"
            />
          </ToolbarGroup>
          <ToolbarGroup label="Term">
            <Select
              value={term}
              onChange={e => setTerm(e.target.value)}
              aria-label="Filter by term"
              className="w-[150px]"
            >
              <option value="all">All terms</option>
              {terms.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </ToolbarGroup>
          <span className="ml-auto data text-[11.5px] text-neutral-400">
            {visible.length} of {rows.length}
          </span>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={visible}
          rowKey={r => r.id}
          caption="Per-examination report"
          onRowClick={r => setOpen(r)}
          defaultSort={{ key: 'confirmed', direction: 'asc' }}
          emptyMessage="No reports match these filters."
        />
      </Panel>

      {open && (
        <Section
          title={`${open.examTitle} — detail`}
          description={`${open.examCode} · ${open.term} · generated ${formatDateTime(open.generatedAt)}`}
        >
          <Panel>
            <PanelHeader
              title="Review outcomes"
              description="Every correlated finding that reached a reviewer, and what they decided."
              actions={
                <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>
                  Close
                </Button>
              }
            />
            <PanelBody>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Dismissed', value: open.dismissed, note: 'Observation was explained or not material' },
                  { label: 'Uncertain', value: open.uncertain, note: 'Left open; requires a second reader' },
                  { label: 'Confirmed', value: open.confirmed, note: 'Referred for the documented process' },
                ].map(item => (
                  <div key={item.label} className="border border-neutral-200 p-4">
                    <div className="data text-[20px] font-semibold text-neutral-900">{item.value}</div>
                    <div className="text-[12.5px] text-neutral-700 mt-1">{item.label}</div>
                    <p className="text-[11.5px] text-neutral-500 mt-1.5 leading-relaxed">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-neutral-100 pt-4 space-y-2.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[12.5px] text-neutral-600">Session coverage</span>
                  <span className="data text-[12px] text-neutral-900">{open.coverage}%</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[12.5px] text-neutral-600">Mean evidence quality</span>
                  <span className="data text-[12px] text-neutral-900">{open.evidenceQuality}%</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[12.5px] text-neutral-600">Record retention</span>
                  <span className="data text-[12px] text-neutral-900">
                    {data?.retentionDays ?? '—'} days
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[12.5px] text-neutral-600">Download</span>
                  <span className="text-[12px]">
                    {open.downloadable ? (
                      <Tag>Available on request</Tag>
                    ) : (
                      <span className="text-neutral-400">Held by the records office</span>
                    )}
                  </span>
                </div>
              </div>
            </PanelBody>
          </Panel>
        </Section>
      )}

      <Section
        title="What a report is not"
        description="Included because a report like this circulates, and its omissions are the part that matters."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Panel>
            <PanelHeader title="Contains" />
            <ul className="divide-y divide-neutral-100">
              {[
                'Counts of sessions, coverage, and evidence quality',
                'Reviewer decisions with the name of the reviewer attached',
                'The policy clauses that removed observations, and how often',
                'A generation timestamp and a retention period',
              ].map(item => (
                <li key={item} className="px-4 py-2.5 flex gap-2.5 text-[12.5px] text-neutral-700">
                  <span className="w-1.5 h-1.5 border border-neutral-700 rounded-[1px] shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHeader title="Does not contain" />
            <ul className="divide-y divide-neutral-100">
              {[
                'A ranking of candidates, or any per-candidate figure',
                'A screen recording, keystroke log, or page content',
                'An explanation the reviewer did not write',
                'A model output presented as a finding',
                'Any use outside the documented process',
              ].map(item => (
                <li key={item} className="px-4 py-2.5 flex gap-2.5 text-[12.5px] text-neutral-600">
                  <span className="w-1.5 h-1.5 border border-neutral-300 rounded-[1px] shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </Section>
    </div>
  );
}

function OutcomeBadge({ row }: { row: ReportRow }) {
  const share = row.confirmed / Math.max(1, row.reviewCandidates);
  if (row.reviewCandidates === 0) return <StatusBadge tone="nominal">No review needed</StatusBadge>;
  if (share < 0.1) return <StatusBadge tone="nominal">Routine</StatusBadge>;
  if (share < 0.3) return <StatusBadge tone="degraded">Elevated</StatusBadge>;
  return <StatusBadge tone="lost">Investigate</StatusBadge>;
}
