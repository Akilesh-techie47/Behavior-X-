import { useMemo, useState } from 'react';
import { Link } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, PanelHeader, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Button } from '../../components/primitives/Button';
import { Select } from '../../components/primitives/Form';
import { StatusBadge, Text } from '../../components/primitives/Status';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { formatDate, formatDateTime, formatDuration, formatWallClock } from '../../domain/format';
import type { ExamDefinition } from '../../domain/types';

/**
 * Schedule.
 *
 * Built from the examination definitions rather than a separate calendar
 * model, because a second source of truth for "when is this exam" is a
 * second thing to get wrong on the morning of a sitting.
 */
export function Schedule() {
  const exams = useAsync(() => services.exam.listExams(), []);
  const [status, setStatus] = useState<ExamDefinition['status'] | 'all'>('all');
  const sessions = useAsync(() => services.sessions.list(), []);

  const byDate = useMemo(() => {
    const rows = (exams.data ?? []).filter(exam => status === 'all' || exam.status === status);
    const map = new Map<string, ExamDefinition[]>();
    for (const exam of rows) {
      const key = exam.scheduledWindow.opensAt.slice(0, 10);
      const bucket = map.get(key);
      if (bucket) bucket.push(exam);
      else map.set(key, [exam]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [exams.data, status]);

  const load = useMemo(() => {
    const all = sessions.data ?? [];
    const map = new Map<string, number>();
    for (const session of all) map.set(session.examId, (map.get(session.examId) ?? 0) + 1);
    return map;
  }, [sessions.data]);

  if (exams.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={6} label="Loading schedule" />
      </div>
    );
  }

  if (exams.error && !exams.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={exams.error.kind} message={exams.error.message} onRetry={exams.reload} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Programme"
        title="Schedule"
        description="Examinations in the current sitting, with the number of recorded sessions against each."
        actions={<SimulatedMark label="Simulated programme" />}
      />

      <Panel>
        <Toolbar>
          <ToolbarGroup label="Show">
            <Select
              value={status}
              onChange={e => setStatus(e.target.value as ExamDefinition['status'] | 'all')}
              aria-label="Filter by examination status"
              className="w-[180px]"
            >
              <option value="all">All examinations</option>
              <option value="live">Live now</option>
              <option value="scheduled">Scheduled</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          </ToolbarGroup>
          <span className="ml-auto data text-[11.5px] text-neutral-400">
            {byDate.length} dates · {(exams.data ?? []).length} examinations
          </span>
        </Toolbar>

        <div className="divide-y divide-neutral-100">
          {byDate.map(([date, items]) => (
            <div key={date} className="px-4 py-4">
              <div className="flex items-baseline gap-3">
                <span className="data text-[12px] text-neutral-900">{formatDate(`${date}T00:00:00`)}</span>
                <span className="text-[11.5px] text-neutral-400">
                  {items.length} {items.length === 1 ? 'examination' : 'examinations'}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {items.map(exam => {
                  const count = load.get(exam.id) ?? 0;
                  return (
                    <li
                      key={exam.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-neutral-200 px-3 py-2.5"
                    >
                      <span className="data text-[11.5px] text-neutral-400 w-[150px]">
                        {formatWallClock(exam.scheduledWindow.opensAt)}–
                        {formatWallClock(exam.scheduledWindow.closesAt).slice(0, 5)}
                      </span>
                      <span className="text-[12.5px] text-neutral-900 w-[92px]">{exam.code}</span>
                      <span className="text-[12.5px] text-neutral-700 flex-1 min-w-[200px]">
                        {exam.title}
                      </span>
                      <span className="data text-[11.5px] text-neutral-500 w-[80px]">
                        {formatDuration(exam.durationMinutes * 60)}
                      </span>
                      <span className="data text-[11.5px] text-neutral-500 w-[92px] text-right">
                        {exam.completedCount}/{exam.candidateCount} sat
                      </span>
                      <span className="data text-[11.5px] text-neutral-400 w-[88px] text-right">
                        {count === 0 ? 'no records' : `${count} recorded`}
                      </span>
                      <StatusBadge tone={EXAM_TONE[exam.status]}>{exam.status}</StatusBadge>
                      {exam.status === 'live' && (
                        <Link to="/live">
                          <Button size="sm" variant="ghost">
                            Watch
                          </Button>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {byDate.length === 0 && (
          <p className="px-4 py-10 text-center text-[12.5px] text-neutral-500">
            No examinations match this filter.
          </p>
        )}
      </Panel>

      <Section
        title="Readiness"
        description="What has to be true before a sitting can start, and what the platform checks."
      >
        <div className="grid md:grid-cols-3 gap-4">
          <Panel>
            <PanelHeader title="Before the sitting" />
            <PanelBody>
              <ul className="space-y-2">
                {[
                  'Environment checks passed on the invigilator’s machine',
                  'A companion device paired for the room',
                  'Alignment report reviewed and accepted',
                  'Policy clauses loaded for the examination code',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] text-neutral-600">
                    <span className="data text-[10px] text-neutral-400 mt-1">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="During the sitting" />
            <PanelBody>
              <ul className="space-y-2">
                {[
                  'Session roster opened and reconciled',
                  'Live coverage monitored for gaps, not for conduct',
                  'Candidate queries answered from the record',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] text-neutral-600">
                    <span className="data text-[10px] text-neutral-400 mt-1">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="After the sitting" />
            <PanelBody>
              <ul className="space-y-2">
                {[
                  'All sessions reconciled against submissions',
                  'Coverage gaps exported with durations and reasons',
                  'Retention clock started on the record',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] text-neutral-600">
                    <span className="data text-[10px] text-neutral-400 mt-1">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
        </div>
      </Section>

      <Text className="text-[11.5px] text-neutral-400">
        All times shown in the examination’s own timezone. Compiled{' '}
        {formatDateTime(new Date().toISOString())}.
      </Text>
    </div>
  );
}

const EXAM_TONE: Record<ExamDefinition['status'], 'nominal' | 'active' | 'degraded' | 'unknown'> = {
  draft: 'unknown',
  scheduled: 'degraded',
  live: 'active',
  closed: 'nominal',
  archived: 'unknown',
};
