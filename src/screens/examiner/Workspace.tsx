import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useRoute } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import type { EvidenceBundle, EvidenceSignal, SessionRecord } from '../../domain/types';
import { Panel, PanelHeader } from '../../components/layout/Panel';
import { Pipeline } from '../../components/brand/Wordmark';
import { CandidateIdentity } from '../../components/layout/Avatar';
import { SignalTable } from '../../components/examiner/SignalTable';
import { CorrelationTimeline } from '../../components/examiner/CorrelationTimeline';
import { EvidenceGraphView } from '../../components/examiner/EvidenceGraphView';
import { BundlePanel, SuppressedPanel } from '../../components/examiner/SuppressedPanel';
import { BriefingPanel } from '../../components/examiner/BriefingPanel';
import { DecisionForm } from '../../components/examiner/DecisionForm';
import { CoveragePanel, DevicePanel } from '../../components/examiner/CoveragePanel';
import { ReplayControls, useReplay } from '../../components/examiner/ReplayControls';
import { CandidateContext } from '../../components/examiner/CandidateContext';
import { ErrorBlock, LoadingBlock, StaleNotice } from '../../components/feedback/StateBlock';
import { Button } from '../../components/primitives/Button';
import { formatDuration, formatOffset, formatRelative } from '../../domain/format';

const STAGES = ['Observe', 'Contextualize', 'Correlate', 'Filter', 'Explain', 'Review'] as const;

/**
 * The review workspace.
 *
 * The six method stages are tabs rather than a wizard, because a reviewer goes
 * back and forth: they read a signal, check the coverage around it, look at the
 * graph, then decide. A wizard would make that a forward-only journey and they
 * would abandon it.
 *
 * The layout is fixed — header, then evidence on the left and the briefing on
 * the right, decision underneath — so the position of a thing does not change
 * when the stage does. That is the whole reason a console can be learned.
 */
export function Workspace({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const route = useRoute();
  const [stage, setStage] = useState(0);
  const [selectedSignal, setSelectedSignal] = useState<EvidenceSignal | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<EvidenceBundle | null>(null);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [decisions, setDecisions] = useState<SessionRecord['decisions']>([]);

  const session = useAsync(() => services.sessions.get(sessionId), [sessionId]);
  const graph = useAsync(() => services.evidence.graph(sessionId, selectedBundle?.id), [
    sessionId,
    selectedBundle?.id,
  ]);

  const replay = useReplay(session.data?.totalSeconds ?? 1, seekTo);

  useEffect(() => {
    if (session.data) setDecisions(session.data.decisions);
  }, [session.data]);

  const escalatedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const bundle of session.data?.bundles ?? []) {
      for (const id of bundle.signalIds) ids.add(id);
    }
    return ids;
  }, [session.data]);

  const signalsAtPlayhead = useMemo(
    () =>
      (session.data?.signals ?? []).filter(
        signal =>
          signal.offsetSeconds <= replay.state.offset &&
          signal.offsetSeconds + (signal.durationSeconds ?? 0) >= replay.state.offset,
      ).length,
    [session.data, replay.state.offset],
  );

  const selectSignal = useCallback((signal: EvidenceSignal) => {
    setSelectedSignal(signal);
    setSeekTo(signal.offsetSeconds);
  }, []);

  const focusSignalById = useCallback(
    (signalId: string) => {
      const found = session.data?.signals.find(s => s.id === signalId);
      if (found) {
        selectSignal(found);
        setStage(1);
      }
    },
    [session.data, selectSignal],
  );

  const windowSeconds = useMemo<[number, number] | null>(() => {
    if (!session.data) return null;
    const anchor =
      selectedBundle?.windowStart ?? selectedSignal?.offsetSeconds ?? session.data.signals[0]?.offsetSeconds;
    if (anchor === undefined) return null;
    const start = Math.max(0, anchor - 60);
    return [start, Math.min(session.data.totalSeconds, anchor + 120)];
  }, [session.data, selectedBundle, selectedSignal]);

  if (session.status === 'loading') {
    return (
      <div className="p-6">
        <LoadingBlock rows={10} label="Loading session record" />
      </div>
    );
  }

  if (session.status === 'error' && !session.data) {
    return (
      <div className="p-6">
        <Panel>
          <PanelHeader title="Session unavailable" />
          <ErrorBlock
            kind={session.error?.kind}
            message={session.error?.message ?? 'This session could not be loaded.'}
            onRetry={session.reload}
          >
            <p className="mt-3 text-[12.5px] text-neutral-600">
              Session identifiers look like <span className="data">S-1025</span>. If this is
              a record you have just closed, it may have been archived.
            </p>
          </ErrorBlock>
          <div className="px-4 pb-4">
            <Link to="/queue">
              <Button size="sm" variant="outline">
                Back to the review queue
              </Button>
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  const record = session.data!;

  return (
    <div className="pb-10">
      {/* Session header — fixed, identifies the record being judged. */}
      <header className="sticky top-[56px] z-10 bg-white border-b border-neutral-200 px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <CandidateIdentity
              name={record.candidate.name}
              number={record.candidate.registrationId}
              subtitle={record.candidate.cohort}
            />
            <div className="hidden sm:block h-9 w-px bg-neutral-200" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[12.5px] text-neutral-900 truncate">{record.examTitle}</div>
              <div className="data text-[11px] text-neutral-500">
                {record.id} · seat {record.candidate.registrationId} ·{' '}
                {formatDuration(record.elapsedSeconds)} of {formatDuration(record.totalSeconds)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/queue">
              <Button size="sm" variant="ghost">
                Queue
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/examinations/${record.id}?print=1`)}
            >
              Export record
            </Button>
          </div>
        </div>

        <div className="mt-3 -mb-3">
          <Pipeline steps={STAGES} activeIndex={stage} />
        </div>
      </header>

      {session.error && (
        <div className="px-4 lg:px-6 pt-3">
          <StaleNotice
            message={`${session.error.message} Showing the last record that loaded; figures may be out of date.`}
            onRetry={session.reload}
          />
        </div>
      )}

      {/* Stage navigation */}
      <nav aria-label="Review stages" className="px-4 lg:px-6 pt-3">
        <ul className="flex flex-wrap gap-1.5">
          {STAGES.map((name, index) => {
            const counts: Record<number, number | null> = {
              0: record.signals.length,
              1: record.coverageGaps.length,
              2: escalatedIds.size,
              3: record.suppressed.length,
              4: null,
              5: decisions.length,
            };
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => setStage(index)}
                  aria-current={stage === index ? 'step' : undefined}
                  className={`h-7 px-2.5 inline-flex items-center gap-1.5 border rounded-[3px] text-[12px] font-medium transition-colors ${
                    stage === index
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <span className="data text-[10.5px] opacity-60">{index + 1}</span>
                  {name}
                  {counts[index] !== null && (
                    <span
                      className={`data text-[10px] ${
                        stage === index ? 'text-white/70' : 'text-neutral-400'
                      }`}
                    >
                      {counts[index]}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 lg:px-6 pt-4">
        <StagePanels
          stage={stage}
          record={record}
          graph={graph.data}
          selectedSignal={selectedSignal}
          selectedBundle={selectedBundle}
          escalatedIds={escalatedIds}
          onSelectSignal={selectSignal}
          onSelectBundle={bundle => {
            setSelectedBundle(bundle);
            setSeekTo(bundle.windowStart);
          }}
          onFocusSignal={focusSignalById}
          decisions={decisions}
          onDecisionRecorded={() => session.reload()}
          replay={replay}
          windowSeconds={windowSeconds}
          signalsAtPlayhead={signalsAtPlayhead}
          hasStageQuery={route.includes('?')}
        />
      </div>
    </div>
  );
}

function StagePanels({
  stage,
  record,
  graph,
  selectedSignal,
  selectedBundle,
  escalatedIds,
  onSelectSignal,
  onSelectBundle,
  onFocusSignal,
  decisions,
  onDecisionRecorded,
  replay,
  windowSeconds,
  signalsAtPlayhead,
  hasStageQuery,
}: {
  stage: number;
  record: SessionRecord;
  graph: Awaited<ReturnType<typeof services.evidence.graph>> | null;
  selectedSignal: EvidenceSignal | null;
  selectedBundle: EvidenceBundle | null;
  escalatedIds: Set<string>;
  onSelectSignal: (signal: EvidenceSignal) => void;
  onSelectBundle: (bundle: EvidenceBundle) => void;
  onFocusSignal: (signalId: string) => void;
  decisions: SessionRecord['decisions'];
  onDecisionRecorded: () => void;
  replay: ReturnType<typeof useReplay>;
  windowSeconds: [number, number] | null;
  signalsAtPlayhead: number;
  hasStageQuery: boolean;
}) {
  void hasStageQuery;

  // 0 Observe · 1 Contextualize · 2 Correlate · 3 Filter · 4 Explain · 5 Review
  if (stage === 0) {
    return (
      <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <Panel>
            <PanelHeader
              title="Observations"
              description="Every signal recorded during the session, in time order. Sorted by time because time is what makes correlation possible."
            />
            <SignalTable
              signals={record.signals}
              escalatedIds={escalatedIds}
              selectedId={selectedSignal?.id ?? null}
              onSelect={onSelectSignal}
            />
          </Panel>
        </div>
        <div className="space-y-4">
          <BriefingPanel
            sessionId={record.id}
            signalId={selectedSignal?.id ?? null}
            onAskSignal={onFocusSignal}
          />
        </div>
      </div>
    );
  }

  if (stage === 1) {
    return (
      <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <CandidateContext record={record} />
          <CoveragePanel session={record} />
          <DevicePanel devices={record.devices} />
        </div>
        <div className="space-y-4">
          <BriefingPanel
            sessionId={record.id}
            signalId={selectedSignal?.id ?? null}
            onAskSignal={onFocusSignal}
          />
        </div>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className="space-y-4">
        <Panel>
          <PanelHeader
            title="Correlate"
            description="Channels against a shared time axis. A claim one channel supports is one channel's claim."
            actions={
              selectedSignal ? (
                <span className="text-[11.5px] text-neutral-500">
                  Anchored to {formatOffset(selectedSignal.offsetSeconds)}
                </span>
              ) : undefined
            }
          />
          <CorrelationTimeline
            segments={record.timelineSegments}
            signals={record.signals}
            totalSeconds={record.totalSeconds}
            windowSeconds={windowSeconds}
            playhead={replay.state.playing || replay.state.offset > 0 ? replay.state.offset : null}
            onSeek={offset => replay.setOffset(offset)}
            onSelectSignal={onSelectSignal}
            selectedSignalId={selectedSignal?.id ?? null}
            escalatedIds={escalatedIds}
            replaying={replay.state.playing}
          />
          <ReplayControls
            state={replay.state}
            control={replay.control}
            setSpeed={replay.setSpeed}
            totalSeconds={record.totalSeconds}
            seek={offset => {
              replay.setOffset(offset);
            }}
            signalCountAtPlayhead={signalsAtPlayhead}
          />
        </Panel>

        {graph && <EvidenceGraphView graph={graph} signals={record.signals} onSelectSignal={onSelectSignal} selectedSignalId={selectedSignal?.id ?? null} />}
      </div>
    );
  }

  if (stage === 3) {
    return (
      <div className="grid xl:grid-cols-2 gap-4 items-start">
        <BundlePanel
          bundles={record.bundles}
          selectedBundleId={selectedBundle?.id ?? null}
          onSelect={onSelectBundle}
        />
        <SuppressedPanel suppressed={record.suppressed} />
      </div>
    );
  }

  if (stage === 4) {
    return (
      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <Panel>
            <PanelHeader
              title="What the record shows"
              description="The correlated finding, what supports it, and — stated just as plainly — what it does not show."
            />
            {record.bundles.length === 0 ? (
              <div className="p-4 text-[12.5px] text-neutral-500">
                No finding was reached for this session, so there is nothing to explain.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {record.bundles.map(bundle => (
                  <div key={bundle.id} className="p-4">
                    <h3 className="text-[13.5px] font-semibold">{bundle.title}</h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-700 max-w-[76ch]">
                      {bundle.summary}
                    </p>

                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                      <div>
                        <div className="eyebrow mb-1.5">What supports it</div>
                        <ul className="space-y-1.5">
                          {bundle.supporting.map((item, index) => (
                            <li key={index} className="text-[12px] leading-relaxed text-neutral-600 flex gap-2">
                              <span className="text-neutral-400" aria-hidden="true">+</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="eyebrow mb-1.5">What it does not show</div>
                        <ul className="space-y-1.5">
                          {bundle.gaps.map((item, index) => (
                            <li key={index} className="text-[12px] leading-relaxed text-neutral-600 flex gap-2">
                              <span className="text-neutral-300" aria-hidden="true">—</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {bundle.alternativeExplanation && (
                      <div className="mt-4 border-l-2 border-neutral-300 pl-3">
                        <div className="eyebrow mb-1.5">Another explanation the record allows</div>
                        <p className="text-[12px] leading-relaxed text-neutral-600">
                          {bundle.alternativeExplanation}
                        </p>
                      </div>
                    )}

                    {bundle.policyClauses.length > 0 && (
                      <div className="mt-4">
                        <div className="eyebrow mb-1.5">Policy clauses bearing on this</div>
                        <ul className="space-y-1.5">
                          {bundle.policyClauses.map(clause => (
                            <li key={clause.id} className="text-[12px] leading-relaxed text-neutral-600">
                              <span className="data text-[11px] text-neutral-400">{clause.reference}</span>{' '}
                              {clause.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <BriefingPanel
          sessionId={record.id}
          signalId={selectedSignal?.id ?? null}
          onAskSignal={onFocusSignal}
        />
      </div>
    );
  }

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
        {selectedBundle && (
          <Panel>
            <PanelHeader
              title="Deciding on one finding"
              description={selectedBundle.title}
              actions={
                <Button size="xs" variant="ghost" onClick={() => onSelectBundle(selectedBundle)}>
                  {selectedBundle.title.slice(0, 40)}
                </Button>
              }
            />
          </Panel>
        )}
        <DecisionForm
          sessionId={record.id}
          bundleId={selectedBundle?.id}
          existingDecisions={decisions}
          onRecorded={() => {
            onDecisionRecorded();
          }}
        />
      </div>
      <div className="space-y-4">
        <Panel>
          <PanelHeader title="Session summary" />
          <dl className="divide-y divide-neutral-100 text-[12.5px]">
            {[
              { label: 'Status', value: record.status },
              { label: 'Review state', value: record.reviewStatus },
              { label: 'Started', value: formatRelative(record.startedAt) },
              { label: 'Ended', value: record.endedAt ? formatRelative(record.endedAt) : 'In progress' },
              { label: 'Questions', value: `${record.answeredCount} of ${record.questionCount} answered` },
              { label: 'Signals', value: String(record.signalCount) },
              { label: 'Escalated', value: String(record.escalatedCount) },
              { label: 'Suppressed', value: String(record.suppressedCount) },
            ].map(row => (
              <div key={row.label} className="px-4 py-2 flex items-baseline justify-between gap-4">
                <dt className="text-neutral-500">{row.label}</dt>
                <dd className="text-neutral-900 text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
