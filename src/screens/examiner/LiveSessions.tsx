import { useEffect, useState } from 'react';
import { Link } from '../../router';
import { useAsync, useTick } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelHeader, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Column, DataTable } from '../../components/layout/DataTable';
import { CandidateIdentity } from '../../components/layout/Avatar';
import { Meter, StatusBadge, Dot } from '../../components/primitives/Status';
import { Select } from '../../components/primitives/Form';
import { ErrorBlock, LoadingBlock, SimulatedDot } from '../../components/feedback/StateBlock';
import { Banner } from '../../components/feedback/Banner';
import { formatDuration, formatRelative } from '../../domain/format';
import type { SessionRecord } from '../../domain/types';

/**
 * Live sessions.
 *
 * An invigilator needs this to be unmissable and unalarming. There is no score
 * and no alert styling here on purpose: a console that turns amber every time a
 * candidate looks at their phone trains its user to ignore it. Degradation is
 * shown as a fact in a column, and the only thing styled as urgent is a
 * session that is genuinely about to end.
 */
export function LiveSessions() {
  const sessions = useAsync(() => services.sessions.list({ status: 'live' }), []);
  const [exam, setExam] = useState('all');
  const [only, setOnly] = useState('all');
  useTick(15_000);

  // Re-fetch periodically so elapsed times and last-signal ages stay honest.
  useEffect(() => {
    const id = setInterval(() => sessions.reload(), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (sessions.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={8} label="Loading live sessions" />
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

  const all = sessions.data ?? [];
  const exams = [...new Map(all.map(s => [s.examId, s.examTitle])).entries()];
  const visible = all.filter(session => {
    if (exam !== 'all' && session.examId !== exam) return false;
    if (only === 'degraded' && session.observationQuality >= 70 && session.observationCoverage >= 90) {
      return false;
    }
    if (only === 'ending' && session.totalSeconds - session.elapsedSeconds > 900) return false;
    if (only === 'companion' && !session.devices.some(d => d.kind === 'phone' && d.status === 'connected')) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Live sessions"
        description="Sessions in progress, refreshed every thirty seconds. Observations shown here are what the record contains; they are not an assessment of the candidate."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-neutral-500">
              <Dot weight="solid" />
              {visible.length} running
            </span>
            <SimulatedDot />
            <span className="text-[11.5px] text-neutral-400">All records are generated</span>
          </>
        }
      />

      {all.length === 0 ? (
        <Panel>
          <div className="px-6 py-12 text-center">
            <p className="text-[13.5px] font-medium text-neutral-800">No sessions in progress</p>
            <p className="mt-1.5 text-[12.5px] text-neutral-500">
              Live sessions appear here as candidates begin an examination.
            </p>
          </div>
        </Panel>
      ) : (
        <>
          {all.some(s => s.devices.some(d => d.status === 'denied' || d.status === 'disconnected')) && (
            <Banner tone="material" label="Device" title="A required observation source is unavailable">
              A blocked or disconnected source is a coverage gap, not a mark against a
              candidate. The gap is recorded with its duration and the candidate may be
              told to fix it.
            </Banner>
          )}

          <Panel>
            <Toolbar>
              <ToolbarGroup label="Examination">
                <Select
                  value={exam}
                  onChange={e => setExam(e.target.value)}
                  aria-label="Filter by examination"
                  className="w-[200px]"
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
                  value={only}
                  onChange={e => setOnly(e.target.value)}
                  aria-label="Filter sessions"
                  className="w-[190px]"
                >
                  <option value="all">All sessions</option>
                  <option value="degraded">Degraded observation</option>
                  <option value="ending">Ending within 15 min</option>
                  <option value="companion">Without companion</option>
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
              caption="Sessions in progress"
              emptyMessage="No live sessions match these filters."
            />
          </Panel>
        </>
      )}

      <Section
        title="What an invigilator can and cannot do here"
        description="The limits are interface decisions, not policy statements written afterwards."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Panel>
            <PanelHeader title="Available" />
            <ul className="divide-y divide-neutral-100">
              {[
                'See that a session is running and how far through it is',
                'See which observation sources are connected or degraded',
                'See a coverage gap, its reason, and its duration',
                'Message a candidate through the session',
                'Pause or extend a session where the rules allow it',
              ].map(item => (
                <li key={item} className="px-4 py-2.5 flex gap-2.5 text-[12.5px] text-neutral-700">
                  <span className="w-1.5 h-1.5 border border-neutral-700 rounded-[1px] shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHeader title="Not available, by design" />
            <ul className="divide-y divide-neutral-100">
              {[
                'Any score, rank, or probability for a candidate',
                'Screen contents or keystrokes',
                'A judgement about a live session, before the evidence is read',
                'A decision to end a candidate’s examination for conduct',
                'A view of one candidate without the other examiner knowing',
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

const columns: Column<SessionRecord>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    cell: s => <CandidateIdentity name={s.candidate.name} number={s.candidate.registrationId} size="sm" />,
  },
  {
    key: 'exam',
    header: 'Examination',
    cell: s => <span className="text-[12px] text-neutral-600 truncate">{s.examTitle}</span>,
  },
  {
    key: 'progress',
    header: 'Progress',
    width: '138px',
    cell: s => (
      <div className="flex items-center gap-2">
        <Meter
          value={(s.answeredCount / Math.max(1, s.questionCount)) * 100}
          label="Progress"
          className="w-14"
        />
        <span className="data text-[11px] text-neutral-500">
          {s.answeredCount}/{s.questionCount}
        </span>
      </div>
    ),
  },
  {
    key: 'elapsed',
    header: 'Elapsed',
    width: '92px',
    align: 'right',
    sortValue: s => s.elapsedSeconds,
    cell: s => <span className="data text-[11.5px] text-neutral-700">{formatDuration(s.elapsedSeconds)}</span>,
  },
  {
    key: 'remaining',
    header: 'Remaining',
    width: '104px',
    align: 'right',
    sortValue: s => s.totalSeconds - s.elapsedSeconds,
    cell: s => {
      const remaining = s.totalSeconds - s.elapsedSeconds;
      return (
        <span
          className={`data text-[11.5px] ${remaining < 900 ? 'text-neutral-900 font-medium' : 'text-neutral-700'}`}
        >
          {formatDuration(remaining)}
        </span>
      );
    },
  },
  {
    key: 'current',
    header: 'On',
    width: '52px',
    align: 'right',
    cell: s => <span className="data text-[11.5px] text-neutral-500">Q{s.currentQuestion}</span>,
  },
  {
    key: 'devices',
    header: 'Sources',
    width: '104px',
    cell: s => {
      const bad = s.devices.filter(d => d.status === 'denied' || d.status === 'disconnected' || d.status === 'unavailable');
      return bad.length === 0 ? (
        <span className="text-[11.5px] text-neutral-500">All connected</span>
      ) : (
        <span className="text-[11.5px] text-neutral-900">
          {bad.length} {bad.length === 1 ? 'source' : 'sources'} down
        </span>
      );
    },
  },
  {
    key: 'coverage',
    header: 'Coverage',
    width: '104px',
    align: 'right',
    sortValue: s => s.observationCoverage,
    cell: s => (
      <span className="data text-[11.5px] text-neutral-700">{s.observationCoverage}%</span>
    ),
  },
  {
    key: 'lastSignal',
    header: 'Last signal',
    width: '132px',
    align: 'right',
    sortValue: s => s.lastSignalAt,
    cell: s => (
      <div className="text-right">
        <div className="text-[11.5px] text-neutral-600 truncate max-w-[130px] ml-auto">
          {s.lastSignalLabel}
        </div>
        <div className="data text-[10.5px] text-neutral-400">{formatRelative(s.lastSignalAt)}</div>
      </div>
    ),
  },
  {
    key: 'state',
    header: 'State',
    width: '92px',
    cell: s =>
      s.status === 'live' ? (
        <StatusBadge tone="active">Running</StatusBadge>
      ) : (
        <StatusBadge tone="unknown">{s.status.replace('_', ' ')}</StatusBadge>
      ),
  },
  {
    key: 'offset',
    header: '',
    width: '66px',
    align: 'right',
    cell: s => (
      <Link
        to={`/examinations/${s.id}`}
        onClick={event => event.stopPropagation()}
        className="text-[12px] font-medium text-neutral-600 hover:text-neutral-900"
      >
        Open
      </Link>
    ),
  },
];
