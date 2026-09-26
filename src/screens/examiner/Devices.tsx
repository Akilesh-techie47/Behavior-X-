import { useMemo, useState } from 'react';
import { Link } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, PanelHeader, StatStrip, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Column, DataTable } from '../../components/layout/DataTable';
import { Button } from '../../components/primitives/Button';
import { Select } from '../../components/primitives/Form';
import { StatusBadge, Tag, Text, ValueRow } from '../../components/primitives/Status';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { Banner } from '../../components/feedback/Banner';
import { formatDuration, formatRelative, titleCase } from '../../domain/format';
import type { DeviceState, SessionRecord } from '../../domain/types';

/**
 * Devices.
 *
 * This is a health page for the room, not a surveillance page for the person
 * in it. It answers "is the record complete" and nothing about the candidate.
 * A denied camera is listed as a fault to be fixed, in the same tone as a
 * failing network card.
 */
export function Devices() {
  const sessions = useAsync(() => services.sessions.list(), []);
  const [filter, setFilter] = useState<'all' | 'faulty' | 'required'>('all');
  const [examId, setExamId] = useState('all');

  const exams = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of sessions.data ?? []) map.set(session.examId, session.examTitle);
    return [...map.entries()];
  }, [sessions.data]);

  const rows = useMemo(() => {
    const flat: (DeviceState & { session: SessionRecord })[] = [];
    for (const session of sessions.data ?? []) {
      for (const device of session.devices) flat.push({ ...device, session });
    }
    return flat
      .filter(row => {
        if (examId !== 'all' && row.session.examId !== examId) return false;
        if (filter === 'required' && !row.required) return false;
        if (filter === 'faulty' && (row.status === 'connected' || row.status === 'ready' || row.status === 'active')) return false;
        return true;
      })
      .sort((a, b) => {
        const rank = (status: DeviceState['status']) =>
          status === 'connected' ? 2 : status === 'ready' || status === 'active' ? 1 : 0;
        return rank(a.status) - rank(b.status) || a.session.id.localeCompare(b.session.id);
      });
  }, [sessions.data, filter, examId]);

  const totals = useMemo(() => {
    const all = (sessions.data ?? []).flatMap(s => s.devices);
    return {
      total: all.length,
      connected: all.filter(d => d.status === 'connected').length,
      degraded: all.filter(d => d.status === 'degraded').length,
      blocked: all.filter(d => d.status === 'denied' || d.status === 'unavailable' || d.status === 'disconnected')
        .length,
    };
  }, [sessions.data]);

  if (sessions.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={10} label="Loading devices" />
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

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'session',
      header: 'Session',
      width: '96px',
      cell: row => (
        <Link
          to={`/examinations/${row.session.id}`}
          className="data text-[11.5px] text-neutral-500 hover:text-neutral-900"
        >
          {row.session.id}
        </Link>
      ),
    },
    {
      key: 'candidate',
      header: 'Candidate',
      cell: row => <span className="text-[12px] text-neutral-700">{row.session.candidate.name}</span>,
    },
    {
      key: 'device',
      header: 'Source',
      width: '132px',
      cell: row => (
        <span className="text-[12px] text-neutral-700">
          {row.label}
          {row.required && <span className="ml-1.5 text-[10.5px] text-neutral-400">required</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '104px',
      cell: row => <StatusBadge tone={STATUS_TONE[row.status]}>{row.status}</StatusBadge>,
    },
    {
      key: 'detail',
      header: 'Detail',
      cell: row => <span className="text-[11.5px] text-neutral-500">{row.detail}</span>,
    },
    {
      key: 'readout',
      header: 'Readout',
      width: '160px',
      align: 'right',
      cell: row => <span className="data text-[11px] text-neutral-500">{row.readout ?? '—'}</span>,
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Devices"
        description="Observation sources across every session. A fault here is a gap in the record, and the interface treats it as one."
        actions={<SimulatedMark label="Simulated inventory" />}
      />

      <Panel>
        <StatStrip
          items={[
            { label: 'Sources', value: totals.total, sublabel: 'Across all sessions' },
            {
              label: 'Connected',
              value: totals.connected,
              sublabel: `${Math.round((totals.connected / Math.max(1, totals.total)) * 100)}% of sources`,
            },
            {
              label: 'Degraded',
              value: totals.degraded,
              sublabel: 'Present but unreliable',
            },
            {
              label: 'Unavailable',
              value: totals.blocked,
              sublabel: 'Recorded as a coverage gap',
              emphasis: true,
            },
          ]}
        />
      </Panel>

      {totals.blocked > 0 && (
        <Banner tone="material" label="Coverage" title={`${totals.blocked} required sources were unavailable`}>
          Each of these appears in its session as a gap with a duration and a reason. None of
          them is attributed to the candidate, and none of them is treated as a finding.
        </Banner>
      )}

      <Panel>
        <Toolbar>
          <ToolbarGroup label="Examination">
            <Select
              value={examId}
              onChange={e => setExamId(e.target.value)}
              aria-label="Filter by examination"
              className="w-[210px]"
            >
              <option value="all">All examinations</option>
              {exams.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </Select>
          </ToolbarGroup>
          <ToolbarGroup label="Show">
            <Select
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              aria-label="Filter devices"
              className="w-[170px]"
            >
              <option value="all">All sources</option>
              <option value="faulty">Not connected</option>
              <option value="required">Required only</option>
            </Select>
          </ToolbarGroup>
          <span className="ml-auto data text-[11.5px] text-neutral-400">
            {rows.length} of {totals.total}
          </span>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={row => `${row.session.id}-${row.kind}`}
          caption="Observation sources"
          emptyMessage="No devices match these filters."
        />
      </Panel>

      <Section
        title="Pairing and alignment"
        description="The two checks that decide whether a companion device's footage can be used at all."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Panel>
            <PanelHeader
              title="Pairing"
              description="Proves a device is present and recording. It says nothing about who is holding it."
              actions={
                <Link to="/pair">
                  <Button size="sm" variant="outline">
                    Pair a device
                  </Button>
                </Link>
              }
            />
            <PanelBody>
              <div className="divide-y divide-neutral-100">
                <ValueRow label="Mechanism" value="Short code, five minutes" />
                <ValueRow label="Proves" value="A device accepted the request" />
                <ValueRow label="Does not prove" value="Identity of the holder" />
                <ValueRow label="On failure" value="Gap recorded, no data retained" />
              </div>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader
              title="Alignment"
              description="Whether the companion view and the room agree. Reviewed by a person, not by a threshold alone."
            />
            <PanelBody>
              <div className="divide-y divide-neutral-100">
                <ValueRow label="Checks" value="Room geometry, candidate presence" />
                <ValueRow label="Output" value="Accept, or a request to re-pair" />
                <ValueRow label="Reviewed by" value="An examiner, before the sitting" />
                <ValueRow label="Automatic" value="No" />
              </div>
              <Text className="mt-3">
                An alignment failure does not end a session. It produces a recorded gap and a
                note, and the examiner decides what to do about the sitting.
              </Text>
            </PanelBody>
          </Panel>
        </div>
      </Section>

      {(sessions.data ?? []).some(s => s.coverageGaps.length > 0) && (
        <Section
          title="Coverage gaps"
          description="Every gap in the current sitting, with its duration. A gap is a limitation of the record and belongs in any conclusion drawn from it."
        >
          <Panel>
            <ul className="divide-y divide-neutral-100">
              {(sessions.data ?? [])
                .flatMap(session => session.coverageGaps.map(gap => ({ session, gap })))
                .sort((a, b) => b.gap.endSeconds - a.gap.endSeconds)
                .map(({ session, gap }) => (
                  <li key={`${session.id}-${gap.id}`} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <Link
                      to={`/examinations/${session.id}`}
                      className="data text-[11.5px] text-neutral-500 hover:text-neutral-900 w-[96px]"
                    >
                      {session.id}
                    </Link>
                    <span className="text-[12px] text-neutral-700 w-[130px]">{session.candidate.name}</span>
                    <span className="text-[11.5px] text-neutral-500 w-[110px]">
                      {titleCase(gap.channel)}
                    </span>
                    <span className="data text-[11.5px] text-neutral-500 w-[92px]">
                      {formatDuration(gap.endSeconds - gap.startSeconds)}
                    </span>
                    <span className="text-[11.5px] text-neutral-500 flex-1 min-w-[180px]">{gap.reason}</span>
                    <span className="text-[11px] text-neutral-400">
                      ended {formatRelative(new Date(gap.endSeconds * 1000).toISOString())}
                    </span>
                    <Tag>Gap</Tag>
                  </li>
                ))}
            </ul>
          </Panel>
        </Section>
      )}

      <Section title="Housekeeping" description="Operations that affect every session in the room.">
        <Panel>
          <PanelBody className="flex flex-wrap gap-3">
            <Button size="sm" variant="outline">
              Re-run environment checks
            </Button>
            <Button size="sm" variant="outline">
              Refresh source inventory
            </Button>
            <Button size="sm" variant="ghost">
              Export coverage report
            </Button>
          </PanelBody>
        </Panel>
      </Section>
    </div>
  );
}

const STATUS_TONE: Record<DeviceState['status'], 'nominal' | 'active' | 'degraded' | 'lost' | 'unknown'> = {
  connected: 'nominal',
  ready: 'active',
  active: 'active',
  degraded: 'degraded',
  denied: 'lost',
  disconnected: 'lost',
  unavailable: 'lost',
  not_required: 'unknown',
};
