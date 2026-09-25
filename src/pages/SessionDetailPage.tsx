import React, { useState } from 'react';
import {
  ChevronLeft,
  Download,
  Info,
  GitBranch,
  Grid,
  PlayCircle,
  Clock,
  CheckCircle,
  Sliders,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { EventIndicator } from '../components/common/EventIndicator';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { RiskTimeline } from '../components/examiner/RiskTimeline';
import { AIExplanationCard } from '../components/examiner/AIExplanationCard';
import { EvidenceGraphViewer } from '../components/examiner/EvidenceGraphViewer';
import { QuestionHeatmap } from '../components/examiner/QuestionHeatmap';
import { CounterfactualPanel } from '../components/examiner/CounterfactualPanel';
import { SessionReplayViewer } from '../components/examiner/SessionReplayViewer';
import { ReviewDecisionPanel } from '../components/examiner/ReviewDecisionPanel';
import { SignalBreakdown } from '../components/examiner/SignalBreakdown';
import { EvidenceGraphEngine } from '../engine/evidence/EvidenceGraphEngine';
import { CounterfactualEngine } from '../engine/counterfactual/CounterfactualEngine';
import { mockQuestions } from '../data/mockData';

export const SessionDetailPage: React.FC<{ sessionId: string; onNavigate: (path: string) => void }> = ({
  sessionId,
  onNavigate,
}) => {
  const { allSessions, evidenceGraph: liveGraph, questionHeatmap: liveHeatmap, counterfactuals: liveCounterfactuals, addReviewDecision } = useSession();
  const targetSession = allSessions.find(s => s.id === sessionId) || allSessions[0];

  const [activeTab, setActiveTab] = useState<'evidence' | 'heatmap' | 'counterfactual' | 'replay' | 'events' | 'notes'>('evidence');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Compute or fallback graph and heatmap for target session
  const sessionGraph = targetSession.evidenceGraph || (
    new EvidenceGraphEngine().buildGraph(
      targetSession.events,
      targetSession.riskState,
      1
    )
  );

  const sessionHeatmap = liveHeatmap;

  const sessionCounterfactuals = targetSession.counterfactuals?.length
    ? targetSession.counterfactuals
    : new CounterfactualEngine().computeCounterfactuals(targetSession.events);

  const filteredEvents = targetSession.events.filter(e => {
    if (selectedSeverityFilter === 'all') return true;
    return e.severity === selectedSeverityFilter;
  });

  const reviewPriority = targetSession.riskState.reviewPriorityScore ?? targetSession.riskState.currentScore;
  const evidenceQuality = targetSession.riskState.evidenceQualityScore ?? Math.round((targetSession.riskState.confidence || 0.88) * 100);
  const observationQuality = targetSession.riskState.observationQualityScore ?? 92;

  const handleReviewAction = (
    status: 'CONFIRMED' | 'DISMISSED' | 'UNCERTAIN' | 'MARK_FOR_REVIEW',
    note: string
  ) => {
    addReviewDecision(status, note, selectedQuestionId || undefined);
  };

  const coreMetrics = [
    {
      index: 'Core metric 01',
      name: 'Integrity review priority',
      value: reviewPriority,
      note: 'Multi-signal deviation index indicating urgency of examiner inspection.',
      badge: (
        <RiskBadge level={targetSession.riskState.reviewPriorityLevel || targetSession.riskState.level} />
      ),
    },
    {
      index: 'Core metric 02',
      name: 'Evidence quality',
      value: evidenceQuality,
      note: 'Consistency and statistical confidence of underlying sensory records.',
      badge: (
        <StatusBadge
          status={targetSession.riskState.evidenceQualityLevel || 'Reliable'}
          variant="nominal"
          size="sm"
        />
      ),
    },
    {
      index: 'Core metric 03',
      name: 'Observation quality',
      value: observationQuality,
      note: 'Camera resolution, optical illuminance, and browser telemetry integrity.',
      badge: (
        <StatusBadge
          status={targetSession.riskState.observationQualityLevel || 'Optimal'}
          variant="nominal"
          size="sm"
        />
      ),
    },
  ];

  const metadataFields = [
    {
      label: 'Session status',
      value: targetSession.status,
      note: targetSession.student.email,
      transform: 'uppercase',
    },
    {
      label: 'Question progress',
      value: `${Object.keys(targetSession.answers).length} / ${targetSession.questionCount || 10} answered`,
      note: `${targetSession.flaggedQuestionIds?.length || 0} flagged for review`,
    },
    {
      label: 'Telemetry volume',
      value: `${targetSession.events.length} events`,
      note: '0.00s raw video stored',
    },
    {
      label: 'Primary observation',
      value: targetSession.riskState.primaryContributingFactor || 'Baseline stability observed',
      note: `Confidence ${evidenceQuality}%`,
      small: true,
    },
  ];

  const tabs = [
    { id: 'evidence', label: 'Causal evidence graph', icon: GitBranch },
    { id: 'heatmap', label: 'Question heatmap', icon: Grid },
    { id: 'counterfactual', label: 'Counterfactuals', icon: Sliders },
    { id: 'replay', label: 'Session replay', icon: PlayCircle },
    { id: 'events', label: `Events (${filteredEvents.length})`, icon: Clock },
    { id: 'notes', label: 'Review & audit', icon: CheckCircle },
  ] as const;

  return (
    <div className="space-y-6 py-6">
      {/* 1. Dossier header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/examiner')}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Console
          </Button>
          <div className="min-w-0">
            <p className="eyebrow flex flex-wrap items-center gap-x-2">
              <span>Investigation dossier</span>
              <span className="data text-slate-400">{targetSession.id}</span>
              <span className="data text-slate-400">{targetSession.student.studentId}</span>
            </p>
            <h1 className="mt-1 text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-slate-900 truncate">
              {targetSession.student.name}
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExportModalOpen(true)}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export audit log
        </Button>
      </div>

      {/* 2. Core metrics strip */}
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-slate-200">
          {coreMetrics.map(metric => (
            <div key={metric.index} className="px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow">{metric.index}</span>
                {metric.badge}
              </div>
              <h2 className="text-[13.5px] font-medium text-slate-700 mt-2.5">{metric.name}</h2>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="data text-[30px] font-semibold leading-none text-slate-900">
                  {metric.value}
                </span>
                <span className="data text-[12px] text-slate-400">/ 100</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={metric.value} max={100} />
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed mt-2.5">{metric.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Candidate metadata */}
      <Card
        title="Candidate metadata &amp; exam status"
        subtitle="Verifiable participant parameters and progress"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metadataFields.map(field => (
            <div key={field.label} className="panel-inset bg-white px-4 py-3">
              <span className="eyebrow">{field.label}</span>
              <div
                className={`mt-1.5 text-slate-900 ${
                  field.transform === 'uppercase'
                    ? 'text-[13px] font-semibold uppercase'
                    : field.small
                      ? 'text-[13px] font-medium leading-snug'
                      : 'text-[13.5px] font-semibold'
                }`}
              >
                {field.value}
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">{field.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="eyebrow">Deterministic rationale summary</span>
            <p className="text-[13px] text-slate-700 leading-relaxed mt-1.5">
              {targetSession.riskState.humanReadableExplanation ||
                'Evaluation derived from multi-signal correlation across camera orientation, browser focus, and keystroke interval analysis.'}
            </p>
          </div>
        </div>
      </Card>

      {/* 4. Investigation tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap items-center gap-1" aria-label="Investigation depth">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                aria-current={isActive ? 'page' : undefined}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'border-brand-700 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab: evidence graph */}
      {activeTab === 'evidence' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <EvidenceGraphViewer graphData={sessionGraph} />
            </div>
            <div className="lg:col-span-4 space-y-5">
              <Card title="Signal breakdown" subtitle="Telemetry modality distribution">
                <SignalBreakdown events={targetSession.events} />
              </Card>
              <Card
                title="Graph relationship architecture"
                subtitle="How observations are causally linked"
              >
                <ol className="space-y-3 text-[13px] text-slate-600">
                  {[
                    'Raw sensory events generate verified observation nodes with millisecond accuracy.',
                    'Temporal sequence engine establishes directed causal edges between disparate modalities.',
                    'Risk engine derives contribution weights without speculative intent attribution.',
                  ].map((text, idx) => (
                    <li key={text} className="flex items-start gap-2.5">
                      <span className="data text-[12px] text-slate-400 pt-0.5 shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>

          <AIExplanationCard session={targetSession} />

          <Card
            title="Temporal score evolution"
            subtitle="Review priority updates across exam duration"
          >
            <RiskTimeline timeline={targetSession.riskState.timeline || []} />
          </Card>
        </div>
      )}

      {/* Tab: question heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-5">
          <QuestionHeatmap
            items={sessionHeatmap}
            onSelectQuestion={qId => setSelectedQuestionId(qId)}
          />

          {selectedQuestionId && (
            <Card
              title={`Question ${selectedQuestionId} behavioral dossier`}
              subtitle="Response duration, interaction dynamics, and integrity signals"
            >
              {(() => {
                const question = mockQuestions.find(q => q.id === selectedQuestionId);
                const attempt = targetSession.questionAttempts ? targetSession.questionAttempts[selectedQuestionId] : undefined;
                return (
                  <div className="space-y-4">
                    <div className="panel-inset bg-white px-4 py-3.5">
                      <p className="text-[13.5px] font-semibold text-slate-900 leading-relaxed">
                        {question?.prompt || 'Question statement'}
                      </p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 data text-[11.5px] text-slate-500 mt-2">
                        <span>Difficulty: {question?.difficulty?.toUpperCase() || 'MEDIUM'}</span>
                        <span>Expected: {question?.expectedResponseTimeSeconds || 45}s</span>
                        <span>
                          Observed: {attempt ? Math.round(attempt.responseDurationMs / 1000) : 0}s
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          label: 'Answer modifications',
                          value: `${attempt?.answerChanges || 0} times`,
                        },
                        {
                          label: 'Rapid answer anomaly',
                          value:
                            attempt && attempt.responseDurationMs < 6000 ? 'Detected' : 'Nominal',
                        },
                        {
                          label: 'Question anomaly score',
                          value: `${attempt?.anomalyScore || 12} / 100`,
                        },
                      ].map(stat => (
                        <div key={stat.label} className="panel-inset bg-white px-4 py-3">
                          <span className="eyebrow">{stat.label}</span>
                          <div className="data text-[15px] font-semibold text-slate-900 mt-1.5">
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      )}

      {/* Tab: counterfactuals */}
      {activeTab === 'counterfactual' && (
        <CounterfactualPanel
          currentScore={reviewPriority}
          scenarios={sessionCounterfactuals}
        />
      )}

      {/* Tab: replay */}
      {activeTab === 'replay' && <SessionReplayViewer session={targetSession} />}

      {/* Tab: chronological events */}
      {activeTab === 'events' && (
        <Card
          title="Observable telemetry log"
          subtitle="Timestamped behavioral observations"
          bodyClassName="p-0"
          action={
            <div className="flex items-center gap-1">
              {(['all', 'high', 'medium', 'low'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverityFilter(sev)}
                  className={`h-7 px-2.5 rounded-md text-[11.5px] font-medium capitalize transition-colors ${
                    selectedSeverityFilter === sev
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          }
        >
          {filteredEvents.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-slate-500">
              No behavioral events recorded matching the current filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEvents.map(evt => (
                <div key={evt.id} className="px-5 py-3.5">
                  <EventIndicator
                    type={evt.type}
                    timestampMs={evt.timestamp}
                    durationSeconds={evt.durationSeconds || (evt.duration ? evt.duration / 1000 : undefined)}
                    confidence={evt.confidence}
                    description={evt.description}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: human review & audit */}
      {activeTab === 'notes' && (
        <ReviewDecisionPanel
          sessionId={targetSession.id}
          onAddDecision={handleReviewAction}
          existingDecisions={targetSession.reviewDecisions}
        />
      )}

      {/* 5. Structured export modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export examination integrity dossier"
        subtitle="Verifiable structured JSON telemetry record (0ms raw video)"
        maxWidth="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsExportModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3.5">
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Compliant with institutional privacy frameworks: zero facial footage or audio is
            retained. Telemetry consists solely of structured mathematical events, sequence
            timestamps, and calculated risk states.
          </p>
          <pre className="rounded-md bg-slate-900 border border-slate-800 p-4 text-slate-100 font-mono text-[11.5px] leading-relaxed overflow-x-auto max-h-80">
            {JSON.stringify(
              {
                sessionId: targetSession.id,
                candidate: {
                  id: targetSession.student.studentId,
                  name: targetSession.student.name,
                },
                metrics: {
                  reviewPriority: reviewPriority,
                  evidenceQuality: evidenceQuality,
                  observationQuality: observationQuality,
                },
                riskBreakdown: targetSession.riskState.breakdown,
                eventsCount: targetSession.events.length,
                topFactors: targetSession.riskState.topContributingFactors,
                counterfactuals: sessionCounterfactuals,
                events: targetSession.events,
                decisions: targetSession.reviewDecisions || [],
                privacyPolicy: 'ZERO_VIDEO_EPHEMERAL_BUFFER_0MS',
              },
              null,
              2
            )}
          </pre>
        </div>
      </Modal>
    </div>
  );
};
