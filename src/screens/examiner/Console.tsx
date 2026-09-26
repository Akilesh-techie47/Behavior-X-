import { Link } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, StatStrip } from '../../components/layout/Panel';
import { Column, DataTable } from '../../components/layout/DataTable';
import { CandidateIdentity } from '../../components/layout/Avatar';
import { Meter, StatusBadge, Tag } from '../../components/primitives/Status';
import { Button } from '../../components/primitives/Button';
import { LoadingBlock, ErrorBlock } from '../../components/feedback/StateBlock';
import { CHANNEL_LABEL, formatDuration, formatRelative } from '../../domain/format';
import type { SessionRecord } from '../../domain/types';
import type { StatusTone } from '../../components/primitives/Status';

/**
 * The console home.
 *
 * Live state, not a dashboard of vanity figures. The questions an invigilator
 * actually opens this screen to answer are: who is running out of time, whose
 * observation is degraded, and what has just been submitted for review. So
 * those are the three panels, in that order, and the historical analytics live
 * behind their own route where they cannot crowd out the present tense.
 */

const STATUS_TONE: Record<SessionRecord['status'], StatusTone> = {
  scheduled: 'pending',
  live: 'active',
  submitted: 'unknown',
  in_review: 'degraded',
  closed: 'unknown',
  terminated: 'lost',
};

export function Console() {
  const sessions = useAsync(() => services.sessions.list(), []);
  const metrics = useAsync(() => services.sessions.metrics(), []);

  if (sessions.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={12} label="Loading console" />
      </div>
    );
  }

  if (sessions.error && !sessions.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock
          kind={sessions.error.kind}
          message={sessions.error.message}
          onRetry={sessions.reload}
        />
      </div>
    );
  }

  const all = sessions.data ?? [];
  const live = all.filter(s => s.status === 'live');
  const awaiting = all.filter(s => s.reviewStatus === 'queued');
  const degraded = all.filter(s => s.observationCoverage < 90 || s.observationQuality < 70);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Console"
        description="Live examination state and the review queue, for the current sitting."
        meta={
          <>
            <Tag>{live.length} in progress</Tag>
            <Tag>{awaiting.length} awaiting review</Tag>
            <Tag>{degraded.length} with degraded observation</Tag>
          </>
        }
        actions={
          <>
            <Link to="/queue">
              <Button size="sm" variant="outline">
                Review queue
              </Button>
            </Link>
            <Link to="/live">
              <Button size="sm" variant="primary">
                Live sessions
              </Button>
            </Link>
          </>
        }
      />

      {metrics.data && (
        <Panel>
          <StatStrip
            items={[
              {
                label: 'Coverage',
                value: `${metrics.data.observationCoverage}%`,
                sublabel: 'Across live sessions',
              },
              {
                label: 'Quality',
                value: `${metrics.data.observationQuality}%`,
                sublabel: 'Usability of that observation',
              },
              {
                label: 'Companion devices',
                value: `${metrics.data.companionDevicesOnline}/${metrics.data.companionDevicesExpected}`,
                sublabel: 'Paired and reporting',
              },
              {
                label: 'Suppressed',
                value: metrics.data.suppressedSignals,
                sublabel: 'Explained by policy',
              },
              {
                label: 'Escalated',
                value: metrics.data.escalatedBundles,
                sublabel: 'Put forward for review',
              },
              {
                label: 'Confirmation rate',
                value:
                  metrics.data.confirmationRate === null
                    ? '—'
                    : `${Math.round(metrics.data.confirmationRate * 100)}%`,
                sublabel: 'Of decided bundles, upheld by a human',
                emphasis: true,
              },
            ]}
          />
        </Panel>
      )}

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <Section
          title="In progress"
          description="Sessions currently running. Sorted by time remaining."
          actions={
            <Link to="/live" className="text-[12px] font-medium text-neutral-600 hover:text-neutral-900">
              All live
            </Link>
          }
        >
          <Panel>
            {live.length === 0 ? (
              <PanelBody>
                <p className="text-[12.5px] text-neutral-500">No sessions in progress.</p>
              </PanelBody>
            ) : (
              <DataTable
                columns={liveColumns}
                rows={live}
                rowKey={s => s.id}
                caption="Sessions in progress"
                maxHeight="max-h-[340px]"
              />
            )}
          </Panel>
        </Section>

        <Section
          title="Awaiting review"
          description="Submitted sessions with findings for an examiner to decide on."
          actions={
            <Link to="/queue" className="text-[12px] font-medium text-neutral-600 hover:text-neutral-900">
              Full queue
            </Link>
          }
        >
          <Panel>
            {awaiting.length === 0 ? (
              <PanelBody>
                <p className="text-[12.5px] text-neutral-500">
                  The queue is empty. Every submitted session has been decided or needed no
                  review.
                </p>
              </PanelBody>
            ) : (
              <DataTable
                columns={queueColumns}
                rows={awaiting}
                rowKey={s => s.id}
                caption="Sessions awaiting review"
                maxHeight="max-h-[340px]"
              />
            )}
          </Panel>
        </Section>
      </div>

      {degraded.length > 0 && (
        <Section
          title="Degraded observation"
          description="Sessions where what was observed is not complete or not usable. These need a human to know before the evidence is read."
        >
          <Panel>
            <DataTable
              columns={degradedColumns}
              rows={degraded}
              rowKey={s => s.id}
              caption="Sessions with degraded observation"
              maxHeight="max-h-[300px]"
            />
          </Panel>
        </Section>
      )}

      {metrics.data && metrics.data.channelHealth.length > 0 && (
        <Section title="Channel health" description="Which sources are carrying the record, and which are not.">
          <Panel>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
              {metrics.data.channelHealth.map(channel => (
                <div key={channel.channel} className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] font-medium text-neutral-900">
                      {channel.label}
                    </span>
                    <span className="data text-[11.5px] text-neutral-500">{channel.coverage}%</span>
                  </div>
                  <Meter value={channel.coverage} label={`${channel.label} coverage`} className="mt-2" />
                  <p className="mt-2.5 text-[11.5px] leading-relaxed text-neutral-500">
                    {channel.note}
                  </p>
                  <p className="mt-1.5 data text-[11px] text-neutral-400">
                    {channel.sessionsAffected} sessions affected
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </Section>
      )}

      {metrics.data && <CoverageTrend points={metrics.data.coverageTrend} />}
    </div>
  );
}

function CoverageTrend({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map(p => p.value), 1);
  return (
    <Section
      title="Coverage over the sitting"
      description="A bar per interval. Not a trend line: the intervals are discrete and joining them would imply a smoothness the data does not have."
    >
      <Panel>
        <PanelBody>
          <div className="flex items-end gap-2 h-28" role="img" aria-label="Observation coverage by interval">
            {points.map(point => (
              <div key={point.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <span className="data text-[10.5px] text-neutral-500">{point.value}%</span>
                <div
                  className="w-full bg-neutral-300 border-t border-neutral-900"
                  style={{ height: `${(point.value / max) * 72}px` }}
                />
                <span className="data text-[10px] text-neutral-400 truncate w-full text-center">
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        </PanelBody>
      </Panel>
    </Section>
  );
}

const liveColumns: Column<SessionRecord>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    cell: s => (
      <CandidateIdentity name={s.candidate.name} number={s.candidate.registrationId} size="sm" />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: '96px',
    cell: s => <StatusBadge tone={STATUS_TONE[s.status]}>{s.status.replace('_', ' ')}</StatusBadge>,
  },
  {
    key: 'progress',
    header: 'Progress',
    width: '150px',
    sortValue: s => s.answeredCount / Math.max(1, s.questionCount),
    cell: s => (
      <div className="flex items-center gap-2">
        <Meter
          value={(s.answeredCount / Math.max(1, s.questionCount)) * 100}
          label={`${s.candidate.name} progress`}
          className="w-16"
        />
        <span className="data text-[11px] text-neutral-500">
          {s.answeredCount}/{s.questionCount}
        </span>
      </div>
    ),
  },
  {
    key: 'remaining',
    header: 'Remaining',
    width: '92px',
    align: 'right',
    sortValue: s => s.totalSeconds - s.elapsedSeconds,
    cell: s => (
      <span className="data text-[11.5px] text-neutral-700">
        {formatDuration(s.totalSeconds - s.elapsedSeconds)}
      </span>
    ),
  },
  {
    key: 'coverage',
    header: 'Coverage',
    width: '104px',
    align: 'right',
    sortValue: s => s.observationCoverage,
    cell: s => <span className="data text-[11.5px] text-neutral-700">{s.observationCoverage}%</span>,
  },
  {
    key: 'open',
    header: '',
    width: '64px',
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

const queueColumns: Column<SessionRecord>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    cell: s => (
      <CandidateIdentity name={s.candidate.name} number={s.candidate.registrationId} size="sm" />
    ),
  },
  {
    key: 'exam',
    header: 'Examination',
    cell: s => <span className="text-[12px] text-neutral-600">{s.examTitle}</span>,
  },
  {
    key: 'findings',
    header: 'Findings',
    width: '86px',
    align: 'right',
    sortValue: s => s.escalatedCount,
    cell: s => <span className="data text-[11.5px] text-neutral-700">{s.escalatedCount}</span>,
  },
  {
    key: 'quality',
    header: 'Evidence',
    width: '96px',
    align: 'right',
    sortValue: s => s.evidenceQuality,
    cell: s => <span className="data text-[11.5px] text-neutral-700">{s.evidenceQuality}%</span>,
  },
  {
    key: 'submitted',
    header: 'Submitted',
    width: '108px',
    align: 'right',
    sortValue: s => s.endedAt ?? '',
    cell: s => (
      <span className="text-[11.5px] text-neutral-500">
        {s.endedAt ? formatRelative(s.endedAt) : '—'}
      </span>
    ),
  },
  {
    key: 'open',
    header: '',
    width: '64px',
    align: 'right',
    cell: s => (
      <Link
        to={`/examinations/${s.id}`}
        onClick={event => event.stopPropagation()}
        className="text-[12px] font-medium text-neutral-600 hover:text-neutral-900"
      >
        Review
      </Link>
    ),
  },
];

const degradedColumns: Column<SessionRecord>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    cell: s => <CandidateIdentity name={s.candidate.name} number={s.candidate.registrationId} size="sm" />,
  },
  {
    key: 'status',
    header: 'Status',
    width: '96px',
    cell: s => <StatusBadge tone={STATUS_TONE[s.status]}>{s.status.replace('_', ' ')}</StatusBadge>,
  },
  {
    key: 'coverage',
    header: 'Coverage',
    width: '110px',
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
    key: 'quality',
    header: 'Quality',
    width: '110px',
    align: 'right',
    sortValue: s => s.observationQuality,
    cell: s => (
      <div className="flex items-center justify-end gap-2">
        <Meter value={s.observationQuality} label="Quality" className="w-12" />
        <span className="data text-[11.5px]">{s.observationQuality}%</span>
      </div>
    ),
  },
  {
    key: 'gaps',
    header: 'Gaps',
    width: '120px',
    align: 'right',
    sortValue: s => s.coverageGaps.length,
    cell: s => (
      <div className="text-right">
        <span className="data text-[11.5px]">{s.coverageGaps.length}</span>
        {s.coverageGaps[0] && (
          <div className="text-[11px] text-neutral-400 truncate max-w-[110px] ml-auto">
                            {CHANNEL_LABEL[s.coverageGaps[0].channel]}
                          </div>
                        )}
                      </div>
                    ),
  },
  {
    key: 'open',
    header: '',
    width: '64px',
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
