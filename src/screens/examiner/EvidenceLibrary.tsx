import { useMemo, useState } from 'react';
import { Link } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, PanelHeader, StatStrip, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Column, DataTable } from '../../components/layout/DataTable';
import { ChannelTag, Tag } from '../../components/primitives/Status';
import { Select, TextInput } from '../../components/primitives/Form';
import { Button } from '../../components/primitives/Button';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { CHANNEL_LABEL, CHANNEL_ORDER, formatOffset } from '../../domain/format';
import type { EvidenceChannel, EvidenceSignal } from '../../domain/types';

/**
 * The evidence library.
 *
 * Every observation across every session in one table, because the question an
 * examiner asks after two reviews is "has this detector done this before?",
 * and that question is unanswerable one session at a time.
 *
 * This is a corpus view, not a monitoring view: it is here to calibrate
 * judgement, and nothing in it is an allegation about any candidate.
 */
export function EvidenceLibrary() {
  const sessions = useAsync(() => services.sessions.list(), []);

  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<EvidenceChannel | 'all'>('all');
  const [exam, setExam] = useState('all');

  const rows = useMemo(() => {
    const flattened: (EvidenceSignal & { sessionId: string; candidate: string; exam: string })[] = [];
    for (const session of sessions.data ?? []) {
      for (const signal of session.signals) {
        flattened.push({
          ...signal,
          sessionId: session.id,
          candidate: session.candidate.name,
          exam: session.examTitle,
        });
      }
    }
    return flattened;
  }, [sessions.data]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows
      .filter(row => {
        if (channel !== 'all' && row.channel !== channel) return false;
        if (exam !== 'all' && row.exam !== exam) return false;
        if (needle && !`${row.label} ${row.detail} ${row.candidate} ${row.kind}`.toLowerCase().includes(needle)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.offsetSeconds - a.offsetSeconds || a.sessionId.localeCompare(b.sessionId));
  }, [rows, search, channel, exam]);

  const byChannel = useMemo(
    () =>
      CHANNEL_ORDER.map(name => ({
        channel: name,
        count: rows.filter(r => r.channel === name).length,
        meanConfidence:
          rows.filter(r => r.channel === name).reduce((total, r) => total + r.confidence, 0) /
          Math.max(1, rows.filter(r => r.channel === name).length),
      })).filter(entry => entry.count > 0),
    [rows],
  );

  const exams = useMemo(() => [...new Set(rows.map(r => r.exam))], [rows]);

  if (sessions.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={12} label="Loading evidence library" />
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

  const columns: Column<(typeof visible)[number]>[] = [
    {
      key: 'session',
      header: 'Session',
      width: '82px',
      cell: row => (
        <Link
          to={`/examinations/${row.sessionId}`}
          className="data text-[11.5px] text-neutral-500 hover:text-neutral-900"
        >
          {row.sessionId}
        </Link>
      ),
    },
    {
      key: 'candidate',
      header: 'Candidate',
      cell: row => <span className="text-[12px] text-neutral-700">{row.candidate}</span>,
    },
    {
      key: 'channel',
      header: 'Ch',
      width: '54px',
      cell: row => <ChannelTag channel={row.channel} />,
    },
    {
      key: 'label',
      header: 'Observation',
      cell: row => (
        <div className="min-w-0">
          <div className="text-[12.5px] text-neutral-800">{row.label}</div>
          <div className="text-[11.5px] text-neutral-500 mt-0.5 max-w-[70ch]">{row.detail}</div>
        </div>
      ),
    },
    {
      key: 'offset',
      header: 'At',
      width: '70px',
      align: 'right',
      cell: row => <span className="data text-[11px] text-neutral-500">{formatOffset(row.offsetSeconds)}</span>,
    },
    {
      key: 'confidence',
      header: 'Conf.',
      width: '76px',
      align: 'right',
      sortValue: row => row.confidence,
      cell: row => <span className="data text-[11.5px] text-neutral-700">{Math.round(row.confidence * 100)}%</span>,
    },
    {
      key: 'strength',
      header: 'Strength',
      width: '84px',
      cell: row => <span className="text-[11.5px] text-neutral-500">{row.strength}</span>,
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Evidence"
        title="Evidence library"
        description="Every observation recorded across the current sitting. Useful for calibrating a detector against its own history before you weigh it in a review."
        actions={<SimulatedMark label="Generated corpus" />}
      />

      <Panel>
        <StatStrip
          items={[
            { label: 'Observations', value: rows.length, sublabel: 'Across all sessions' },
            { label: 'Sessions', value: sessions.data?.length ?? 0, sublabel: 'In the current sitting' },
            {
              label: 'Channels',
              value: byChannel.length,
              sublabel: 'Sources producing observations',
            },
            {
              label: 'Distinct kinds',
              value: new Set(rows.map(r => r.kind)).size,
              sublabel: 'Observation types recorded',
            },
          ]}
        />
      </Panel>

      <Section
        title="By channel"
        description="Where the observations are coming from. A channel that is producing almost nothing is a coverage problem, not a quiet session."
      >
        <Panel>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
            {byChannel.map(entry => (
              <div key={entry.channel} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-medium text-neutral-900">
                    {CHANNEL_LABEL[entry.channel]}
                  </span>
                  <span className="data text-[11.5px] text-neutral-500">{entry.count}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="meter flex-1 h-[3px]">
                    <span
                      className="bg-neutral-700"
                      style={{
                        width: `${Math.min(100, (entry.meanConfidence * 100) || 0)}%`,
                      }}
                    />
                  </div>
                  <span className="data text-[11px] text-neutral-500">
                    {Math.round(entry.meanConfidence * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-neutral-400">Mean detector confidence</p>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Panel>
        <Toolbar>
          <ToolbarGroup label="Find">
            <TextInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search observations…"
              aria-label="Search the evidence library"
              className="w-[240px] h-8 text-[12.5px]"
            />
          </ToolbarGroup>
          <ToolbarGroup label="Channel">
            <Select
              value={channel}
              onChange={e => setChannel(e.target.value as EvidenceChannel | 'all')}
              aria-label="Filter by channel"
              className="w-[150px]"
            >
              <option value="all">All channels</option>
              {CHANNEL_ORDER.map(name => (
                <option key={name} value={name}>
                  {CHANNEL_LABEL[name]}
                </option>
              ))}
            </Select>
          </ToolbarGroup>
          <ToolbarGroup label="Examination">
            <Select
              value={exam}
              onChange={e => setExam(e.target.value)}
              aria-label="Filter by examination"
              className="w-[190px]"
            >
              <option value="all">All examinations</option>
              {exams.map(title => (
                <option key={title} value={title}>
                  {title}
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
          rowKey={row => `${row.sessionId}-${row.id}`}
          caption="All recorded observations"
          emptyMessage="No observations match these filters."
          maxHeight="max-h-[640px]"
        />
      </Panel>

      <Panel>
        <PanelHeader
          title="How to read this"
          description="A note on the table above, because a corpus invites the wrong inference."
        />
        <PanelBody>
          <p className="text-[12.5px] leading-relaxed text-neutral-600 max-w-[78ch]">
            A detector producing many observations is not a more suspicious candidate, and a
            detector producing few is not a more satisfactory one. What this table supports
            is a question about the detector: does this kind of observation usually mean
            something, and does it usually have an approved explanation? Answer that first,
            and the individual case becomes much easier — most of them resolve to nothing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Tag>Corpus view</Tag>
            <Tag>Not an allegation</Tag>
            <Tag>Calibration, not surveillance</Tag>
          </div>
          <div className="mt-4">
            <Link to="/policy">
              <Button size="sm" variant="outline">
                See the policy clauses these observations are filtered against
              </Button>
            </Link>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
