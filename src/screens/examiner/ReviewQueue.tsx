import { useMemo, useState } from 'react';
import { Link } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import type { SessionRecord } from '../../domain/types';
import { PageHeader } from '../../components/layout/Page';
import { Panel, Toolbar, ToolbarGroup, StatStrip } from '../../components/layout/Panel';
import { Column, DataTable } from '../../components/layout/DataTable';
import { CandidateIdentity } from '../../components/layout/Avatar';
import { Meter, StatusBadge, Tag, VerdictTag } from '../../components/primitives/Status';
import { Select, TextInput } from '../../components/primitives/Form';
import { Button } from '../../components/primitives/Button';
import { Banner } from '../../components/feedback/Banner';
import { ErrorBlock, LoadingBlock } from '../../components/feedback/StateBlock';
import { formatDuration, formatRelative } from '../../domain/format';
import type { StatusTone } from '../../components/primitives/Status';

/**
 * The review queue.
 *
 * The default sort is the one an examiner actually works by: strongest evidence
 * first, worst coverage first, oldest first. A queue sorted by submission time
 * makes you read easy cases before hard ones and you end up with an hour left
 * and nothing but hard cases.
 *
 * Nothing is auto-decided. The queue is a worklist.
 */

type SortKey = 'priority' | 'submitted' | 'evidence' | 'coverage' | 'candidate';

export function ReviewQueue() {
  const sessions = useAsync(() => services.sessions.list({ reviewStatus: 'queued' }), []);
  const [search, setSearch] = useState('');
  const [exam, setExam] = useState<string>('all');
  const [coverage, setCoverage] = useState('all');
  const [sort, setSort] = useState<SortKey>('priority');
  const [selected, setSelected] = useState<string[]>([]);

  const all = sessions.data ?? [];

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = all.filter(session => {
      if (exam !== 'all' && session.examId !== exam) return false;
      if (coverage === 'degraded' && session.observationCoverage >= 90) return false;
      if (coverage === 'gaps' && session.coverageGaps.length === 0) return false;
      if (
        needle &&
        !`${session.candidate.name} ${session.candidate.registrationId} ${session.id}`.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });

    const byPriority = (s: SessionRecord) =>
      s.evidenceQuality * 0.5 + (100 - s.observationCoverage) * 0.3 + s.escalatedCount * 8;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'submitted':
          return (a.endedAt ?? '').localeCompare(b.endedAt ?? '');
        case 'evidence':
          return b.evidenceQuality - a.evidenceQuality;
        case 'coverage':
          return a.observationCoverage - b.observationCoverage;
        case 'candidate':
          return a.candidate.name.localeCompare(b.candidate.name);
        default:
          return byPriority(b) - byPriority(a);
      }
    });
  }, [all, search, exam, coverage, sort]);

  const exams = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of all) map.set(session.examId, session.examTitle);
    return [...map.entries()];
  }, [all]);

  if (sessions.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={10} label="Loading review queue" />
      </div>
    );
  }

  if (sessions.error && !sessions.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={sessions.error.kind} message={sessions.error.message} onRetry={sessions.reload} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Review"
        title="Queue"
        description="Submitted sessions with a correlated finding for an examiner to decide on. Nothing here is decided by the system."
        meta={
          <>
            <Tag>{visible.length} shown</Tag>
            <Tag>{all.length} queued in total</Tag>
            {selected.length > 0 && <Tag>{selected.length} selected</Tag>}
          </>
        }
      />

      {all.length === 0 ? (
        <Panel>
          <div className="px-6 py-12 text-center">
            <p className="text-[13.5px] font-medium text-neutral-800">The queue is empty</p>
            <p className="mt-1.5 text-[12.5px] text-neutral-500 max-w-[56ch] mx-auto leading-relaxed">
              Every submitted session has either been decided or needed no review. Sessions
              with no policy-relevant finding, and sessions where every observation was
              explained by a clause, are normal outcomes.
            </p>
            <Link to="/examinations" className="inline-block mt-4">
              <Button size="sm" variant="outline">
                Back to the console
              </Button>
            </Link>
          </div>
        </Panel>
      ) : (
        <>
          <Panel>
            <StatStrip
              items={[
                { label: 'Queued', value: all.length, sublabel: 'Awaiting a decision' },
                {
                  label: 'With coverage gaps',
                  value: all.filter(s => s.coverageGaps.length > 0).length,
                  sublabel: 'Read these with the gaps in mind',
                },
                {
                  label: 'Escalated findings',
                  value: all.reduce((total, s) => total + s.escalatedCount, 0),
                  sublabel: 'Correlated groups awaiting a decision',
                },
                {
                  label: 'Oldest waiting',
                  value: (() => {
                    const oldest = all
                      .map(s => s.endedAt)
                      .filter((v): v is string => v !== null)
                      .sort()[0];
                    return oldest ? formatRelative(oldest) : '—';
                  })(),
                  sublabel: 'Since submission',
                  emphasis: true,
                },
              ]}
            />
          </Panel>

          {selected.length > 1 && (
            <Banner tone="material" label="Multiple selected" title="Decisions are recorded one session at a time">
              A decision is a judgement about a single record. Bulk actions are not offered
              for that reason, and a reviewer's name is attached to each decision
              individually.
            </Banner>
          )}

          <Panel>
            <Toolbar>
              <ToolbarGroup label="Find">
                <TextInput
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, registration, session…"
                  aria-label="Search the queue"
                  className="w-[220px] h-8 text-[12.5px]"
                />
              </ToolbarGroup>

              <ToolbarGroup label="Examination">
                <Select
                  value={exam}
                  onChange={e => setExam(e.target.value)}
                  aria-label="Filter by examination"
                  className="w-[190px]"
                >
                  <option value="all">All examinations</option>
                  {exams.map(([id, title]) => (
                    <option key={id} value={id}>
                      {title}
                    </option>
                  ))}
                </Select>
              </ToolbarGroup>

              <ToolbarGroup label="Coverage">
                <Select
                  value={coverage}
                  onChange={e => setCoverage(e.target.value)}
                  aria-label="Filter by coverage"
                  className="w-[150px]"
                >
                  <option value="all">Any</option>
                  <option value="degraded">Below 90%</option>
                  <option value="gaps">Has gaps</option>
                </Select>
              </ToolbarGroup>

              <ToolbarGroup label="Order">
                <Select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  aria-label="Order the queue"
                  className="w-[172px]"
                >
                  <option value="priority">Evidence first</option>
                  <option value="submitted">Oldest waiting</option>
                  <option value="evidence">Highest evidence quality</option>
                  <option value="coverage">Worst coverage first</option>
                  <option value="candidate">Candidate name</option>
                </Select>
              </ToolbarGroup>

              <span className="ml-auto data text-[11.5px] text-neutral-400">
                {visible.length} of {all.length}
              </span>
            </Toolbar>

            <DataTable
              columns={columns}
              rows={visible}
              rowKey={s => s.id}
              caption="Sessions awaiting review"
              selectable
              selected={selected}
              onSelectedChange={setSelected}
              defaultSort={undefined}
              emptyMessage="No queued sessions match these filters."
            />
          </Panel>
        </>
      )}
    </div>
  );
}

const REVIEW_TONE: Record<SessionRecord['reviewStatus'], StatusTone> = {
  queued: 'degraded',
  in_review: 'active',
  confirmed: 'lost',
  dismissed: 'nominal',
  uncertain: 'unknown',
  not_required: 'unknown',
};

const columns: Column<SessionRecord>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    cell: s => <CandidateIdentity name={s.candidate.name} number={s.candidate.registrationId} size="sm" />,
  },
  {
    key: 'session',
    header: 'Session',
    width: '84px',
    cell: s => <span className="data text-[11.5px] text-neutral-500">{s.id}</span>,
  },
  {
    key: 'exam',
    header: 'Examination',
    cell: s => <span className="text-[12px] text-neutral-600">{s.examTitle}</span>,
  },
  {
    key: 'findings',
    header: 'Findings',
    width: '92px',
    align: 'right',
    sortValue: s => s.escalatedCount,
    cell: s =>
      s.escalatedCount > 0 ? (
        <span className="data text-[11.5px] text-neutral-900">{s.escalatedCount}</span>
      ) : (
        <span className="text-[11.5px] text-neutral-400">—</span>
      ),
  },
  {
    key: 'evidence',
    header: 'Evidence',
    width: '112px',
    align: 'right',
    sortValue: s => s.evidenceQuality,
    cell: s => (
      <div className="flex items-center justify-end gap-2">
        <Meter value={s.evidenceQuality} label="Evidence quality" className="w-12" />
        <span className="data text-[11.5px]">{s.evidenceQuality}%</span>
      </div>
    ),
  },
  {
    key: 'coverage',
    header: 'Coverage',
    width: '112px',
    align: 'right',
    sortValue: s => s.observationCoverage,
    cell: s => (
      <div className="flex items-center justify-end gap-2">
        <Meter value={s.observationCoverage} label="Coverage" className="w-12" />
        <span className="data text-[11.5px]">{s.observationCoverage}%</span>
      </div>
    ),
  },
  {
    key: 'gaps',
    header: 'Gaps',
    width: '78px',
    align: 'right',
    sortValue: s => s.coverageGaps.length,
    cell: s =>
      s.coverageGaps.length > 0 ? (
        <span className="data text-[11.5px] text-neutral-900">{s.coverageGaps.length}</span>
      ) : (
        <span className="text-[11.5px] text-neutral-400">—</span>
      ),
  },
  {
    key: 'review',
    header: 'Review',
    width: '104px',
    cell: s => <StatusBadge tone={REVIEW_TONE[s.reviewStatus]}>{s.reviewStatus.replace('_', ' ')}</StatusBadge>,
  },
  {
    key: 'waiting',
    header: 'Waiting',
    width: '104px',
    align: 'right',
    sortValue: s => s.endedAt ?? '',
    cell: s => (
      <span className="text-[11.5px] text-neutral-500">
        {s.endedAt ? formatRelative(s.endedAt) : '—'}
      </span>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    width: '92px',
    align: 'right',
    sortValue: s => s.elapsedSeconds,
    cell: s => <span className="data text-[11.5px] text-neutral-500">{formatDuration(s.elapsedSeconds)}</span>,
  },
  {
    key: 'open',
    header: '',
    width: '78px',
    align: 'right',
    cell: s => (
      <Link
        to={`/examinations/${s.id}`}
        onClick={event => event.stopPropagation()}
        className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-600 hover:text-neutral-900"
      >
        Review
        {s.reviewStatus === 'in_review' && <VerdictTag>In progress</VerdictTag>}
      </Link>
    ),
  },
];
