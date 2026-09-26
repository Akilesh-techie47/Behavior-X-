import { useMemo, useState } from 'react';
import { Link } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, StatStrip, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Column, DataTable } from '../../components/layout/DataTable';
import { TextInput } from '../../components/primitives/Form';
import { StatusBadge, Tag } from '../../components/primitives/Status';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { formatDateTime, formatRelative, titleCase } from '../../domain/format';
import type { DecisionKind, ReviewStatus, SessionRecord } from '../../domain/types';

/**
 * The audit log.
 *
 * Built from the sessions themselves rather than a separate event store: the
 * log has to be derivable from the record, or it is a second record that can
 * disagree with the first. Every row says who did what, to which session, and
 * when — including the rows that record an examiner opening a session, which is
 * the part most such systems leave out.
 */
export function AuditLog() {
  const sessions = useAsync(() => services.sessions.list(), []);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<DecisionKind | 'all' | 'access'>('all');

  const rows = useMemo(() => {
    const all: AuditRow[] = [];
    for (const session of sessions.data ?? []) {
      all.push({
        id: `${session.id}-open`,
        kind: 'access',
        session,
        actor: 'invigilator console',
        summary: 'Session record opened',
        detail: `${session.candidate.name} · ${session.examTitle}`,
        at: session.lastSignalAt,
      });
      for (const decision of session.decisions) {
        all.push({
          id: decision.id,
          kind: decision.decision,
          session,
          actor: decision.examinerName,
          summary: `Recorded: ${decision.decision}`,
          detail: decision.note
            ? `${session.candidate.name} · “${truncate(decision.note, 90)}”`
            : `${session.candidate.name} · ${session.examTitle}`,
          at: decision.recordedAt,
        });
      }
    }
    return all.sort((a, b) => b.at.localeCompare(a.at));
  }, [sessions.data]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(row => {
      if (kind !== 'all' && row.kind !== kind) return false;
      if (needle && !`${row.actor} ${row.summary} ${row.detail} ${row.session.id}`.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [rows, search, kind]);

  const columns: Column<AuditRow>[] = [
    {
      key: 'when',
      header: 'When',
      width: '150px',
      cell: r => (
        <div>
          <div className="data text-[11.5px] text-neutral-700">{formatDateTime(r.at)}</div>
          <div className="text-[10.5px] text-neutral-400">{formatRelative(r.at)}</div>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      width: '160px',
      cell: r => <span className="text-[12px] text-neutral-800">{r.actor}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      width: '150px',
      cell: r => <StatusBadge tone={KIND_TONE[r.kind] ?? 'unknown'}>{titleCase(r.kind)}</StatusBadge>,
    },
    {
      key: 'summary',
      header: 'Summary',
      cell: r => <span className="text-[12px] text-neutral-700">{r.summary}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      cell: r => (
        <div className="min-w-0">
          <div className="text-[11.5px] text-neutral-600 truncate max-w-[46ch]">{r.detail}</div>
          <Link
            to={`/examinations/${r.session.id}`}
            className="data text-[10.5px] text-neutral-400 hover:text-neutral-700"
          >
            {r.session.id}
          </Link>
        </div>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      width: '110px',
      cell: r => <OutcomePill status={r.session.reviewStatus} />,
    },
  ];

  if (sessions.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={12} label="Loading audit log" />
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
        eyebrow="Administration"
        title="Audit log"
        description="Who read a record, who decided, and when. An examiner cannot read a session without leaving a line here, and the line cannot be edited afterwards."
        actions={<SimulatedMark label="Derived from the record" />}
      />

      <Panel>
        <StatStrip
          items={[
            { label: 'Entries', value: rows.length, sublabel: 'Derived from session records' },
            {
              label: 'Decisions',
              value: rows.filter(r => r.kind !== 'access').length,
              sublabel: 'Each with a named examiner',
            },
            {
              label: 'Accesses',
              value: rows.filter(r => r.kind === 'access').length,
              sublabel: 'Reads of a candidate record',
            },
            {
              label: 'Retention',
              value: '—',
              sublabel: 'Held by the records office',
            },
          ]}
        />
      </Panel>

      <Panel>
        <Toolbar>
          <ToolbarGroup label="Find">
            <TextInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Examiner, session, candidate…"
              aria-label="Search the audit log"
              className="w-[250px] h-8 text-[12.5px]"
            />
          </ToolbarGroup>
          <ToolbarGroup label="Action">
            <select
              value={kind}
              onChange={e => setKind(e.target.value as typeof kind)}
              aria-label="Filter by action"
              className="h-8 rounded-[3px] border border-neutral-300 bg-white px-2 text-[12.5px] text-neutral-800"
            >
              <option value="all">All actions</option>
              <option value="access">Record opened</option>
              <option value="confirmed">Confirmed</option>
              <option value="dismissed">Dismissed</option>
              <option value="uncertain">Uncertain</option>
              <option value="escalated">Escalated</option>
            </select>
          </ToolbarGroup>
          <span className="ml-auto data text-[11.5px] text-neutral-400">
            {visible.length} of {rows.length}
          </span>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={visible}
          rowKey={r => r.id}
          caption="Audit entries"
          emptyMessage="No entries match these filters."
        />
      </Panel>

      <Section
        title="What the log is for"
        description="Three uses, and one thing it deliberately cannot do."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Panel>
            <PanelBody>
              <ul className="space-y-2.5">
                {[
                  'To let a candidate ask who looked at their record, and get an answer.',
                  'To let a second examiner see what a first examiner already decided, and why.',
                  'To show that a decision was recorded at a time, with a name, and cannot be quietly changed.',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] text-neutral-700">
                    <span className="data text-[10px] text-neutral-400 mt-1">01</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelBody>
              <p className="text-[12.5px] leading-relaxed text-neutral-600 max-w-[70ch]">
                The log does not contain the content of a review, only the fact of it. An
                examiner’s written rationale belongs to the session, where a second reader
                will meet it in context; copying it here would create a second copy that
                could drift from the first. It also cannot show what an examiner thought and
                did not record, and it is not used to rate examiners against each other.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Tag>Append only</Tag>
                <Tag>Attributed</Tag>
                <Tag>Derived, not stored</Tag>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </Section>
    </div>
  );
}

interface AuditRow {
  id: string;
  kind: DecisionKind | 'access';
  session: SessionRecord;
  actor: string;
  summary: string;
  detail: string;
  at: string;
}

const KIND_TONE: Record<string, 'nominal' | 'active' | 'degraded' | 'lost' | 'unknown'> = {
  access: 'unknown',
  confirmed: 'lost',
  dismissed: 'nominal',
  uncertain: 'degraded',
  escalated: 'active',
};

function OutcomePill({ status }: { status: ReviewStatus }) {
  if (status === 'confirmed' || status === 'dismissed' || status === 'uncertain' || status === 'in_review') {
    return <StatusBadge tone={KIND_TONE[status] ?? 'unknown'}>{status.replace('_', ' ')}</StatusBadge>;
  }
  return <span className="text-[11px] text-neutral-400">{titleCase(status)}</span>;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
