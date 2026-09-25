import React, { useState } from 'react';
import {
  ChevronLeft,
  Download,
  Info,
  Layers,
  Activity,
  GitBranch,
  Grid,
  PlayCircle,
  Cpu,
  CheckCircle,
  FileText,
  Clock,
  Shield,
  User,
  Sliders,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { RiskIndicator } from '../components/common/RiskIndicator';
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
import { QuestionIntelligenceEngine } from '../engine/questions/QuestionIntelligenceEngine';
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

  return (
    <div className="space-y-6 py-6 font-sans">
      {/* Session Breadcrumb & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/examiner')}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Examiner Console
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-neutral-500">
              <span>Investigation Dossier</span>
              <span>•</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{targetSession.id}</span>
              <span>•</span>
              <span>{targetSession.student.studentId}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
              {targetSession.student.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Structured Audit Log
          </Button>
        </div>
      </div>

      {/* The Three Core Scores - Architectural Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Integrity Review Priority */}
        <div className="p-5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Core Metric 01</span>
            <RiskBadge level={targetSession.riskState.reviewPriorityLevel || targetSession.riskState.level} />
          </div>
          <div className="text-xs uppercase font-medium text-neutral-600 dark:text-neutral-400">Integrity Review Priority</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-mono font-bold text-neutral-950 dark:text-neutral-50">{reviewPriority}</span>
            <span className="text-xs font-mono text-neutral-400">/ 100</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
            Multi-signal deviation index indicating urgency of examiner inspection.
          </p>
          <div className="mt-3">
            <ProgressBar value={reviewPriority} max={100} />
          </div>
        </div>

        {/* Metric 2: Evidence Quality */}
        <div className="p-5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Core Metric 02</span>
            <StatusBadge status={targetSession.riskState.evidenceQualityLevel || 'RELIABLE'} variant="nominal" size="sm" />
          </div>
          <div className="text-xs uppercase font-medium text-neutral-600 dark:text-neutral-400">Evidence Quality Score</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-mono font-bold text-neutral-950 dark:text-neutral-50">{evidenceQuality}</span>
            <span className="text-xs font-mono text-neutral-400">/ 100</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
            Consistency and statistical confidence of underlying sensory records.
          </p>
          <div className="mt-3">
            <ProgressBar value={evidenceQuality} max={100} />
          </div>
        </div>

        {/* Metric 3: System Observation Quality */}
        <div className="p-5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Core Metric 03</span>
            <StatusBadge status={targetSession.riskState.observationQualityLevel || 'OPTIMAL'} variant="nominal" size="sm" />
          </div>
          <div className="text-xs uppercase font-medium text-neutral-600 dark:text-neutral-400">Observation Quality</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-mono font-bold text-neutral-950 dark:text-neutral-50">{observationQuality}</span>
            <span className="text-xs font-mono text-neutral-400">/ 100</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
            Camera resolution, optical illuminance, and browser telemetry integrity.
          </p>
          <div className="mt-3">
            <ProgressBar value={observationQuality} max={100} />
          </div>
        </div>
      </div>

      {/* Candidate Session Header Details */}
      <Card
        title="Candidate Metadata & Exam Status"
        subtitle="Verifiable participant parameters and progress"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Session Status</div>
            <div className="text-sm font-semibold text-neutral-950 dark:text-neutral-100 mt-1 uppercase">
              {targetSession.status}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{targetSession.student.email}</div>
          </div>

          <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Question Progress</div>
            <div className="text-sm font-semibold text-neutral-950 dark:text-neutral-100 mt-1">
              {Object.keys(targetSession.answers).length} / {targetSession.questionCount || 10} Answered
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {targetSession.flaggedQuestionIds?.length || 0} flagged for review
            </div>
          </div>

          <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Telemetry Volume</div>
            <div className="text-sm font-semibold text-neutral-950 dark:text-neutral-100 mt-1">
              {targetSession.events.length} Structured Events
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">0.00s raw video stored</div>
          </div>

          <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Primary Observation</div>
            <div className="text-xs font-medium text-neutral-900 dark:text-neutral-200 mt-1 truncate">
              {targetSession.riskState.primaryContributingFactor || 'Baseline stability observed'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Confidence: {evidenceQuality}%</div>
          </div>
        </div>

        {/* Explainability Callout */}
        <div className="mt-4 p-4 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>Deterministic Rationale Summary</span>
          </div>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
            {targetSession.riskState.humanReadableExplanation ||
              'Evaluation derived from multi-signal correlation across camera orientation, browser focus, and keystroke interval analysis.'}
          </p>
        </div>
      </Card>

      {/* Navigation Sub-Tabs for Investigation Depth */}
      <div className="flex flex-wrap border-b border-neutral-300 dark:border-neutral-700 gap-1">
        {[
          { id: 'evidence', label: 'Causal Evidence Graph', icon: GitBranch },
          { id: 'heatmap', label: 'Question Integrity Heatmap', icon: Grid },
          { id: 'counterfactual', label: 'Counterfactual Engine', icon: Sliders },
          { id: 'replay', label: 'Behavioral Session Replay', icon: PlayCircle },
          { id: 'events', label: `Chronological Events (${filteredEvents.length})`, icon: Clock },
          { id: 'notes', label: 'Human Review & Audit', icon: CheckCircle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${
                isActive
                  ? 'border-neutral-950 text-neutral-950 dark:border-neutral-50 dark:text-neutral-50 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <EvidenceGraphViewer graphData={sessionGraph} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <SignalBreakdown events={targetSession.events} />
              <Card title="Graph Relationship Architecture" subtitle="How observations are causally linked">
                <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-neutral-950 dark:text-neutral-50">1.</span>
                    <span>Raw sensory events generate verified observation nodes with millisecond accuracy.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-neutral-950 dark:text-neutral-50">2.</span>
                    <span>Temporal sequence engine establishes directed causal edges between disparate modalities.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-neutral-950 dark:text-neutral-50">3.</span>
                    <span>Risk engine derives contribution weights without speculative intent attribution.</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Gemini & Deterministic Explanation */}
          <AIExplanationCard session={targetSession} />

          {/* Risk Timeline */}
          <Card
            title="Temporal Score Evolution"
            subtitle="Real-time review score updates across exam duration"
          >
            <RiskTimeline timeline={targetSession.riskState.timeline || []} />
          </Card>
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <QuestionHeatmap
            items={sessionHeatmap}
            onSelectQuestion={qId => setSelectedQuestionId(qId)}
          />

          {selectedQuestionId && (
            <Card
              title={`Question ${selectedQuestionId} Detailed Behavioral Dossier`}
              subtitle="Question-level response duration, interaction dynamics, and integrity signals"
            >
              {(() => {
                const question = mockQuestions.find(q => q.id === selectedQuestionId);
                const attempt = targetSession.questionAttempts ? targetSession.questionAttempts[selectedQuestionId] : undefined;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="p-3 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950">
                      <div className="font-bold text-neutral-900 dark:text-neutral-100 text-sm mb-1">
                        {question?.prompt || 'Question Statement'}
                      </div>
                      <div className="flex gap-4 text-neutral-500 font-mono text-[11px]">
                        <span>Difficulty: {question?.difficulty?.toUpperCase() || 'MEDIUM'}</span>
                        <span>Expected Duration: {question?.expectedResponseTimeSeconds || 45}s</span>
                        <span>Observed Duration: {attempt ? Math.round(attempt.responseDurationMs / 1000) : 0}s</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                      <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <span className="text-[10px] text-neutral-500 uppercase">Answer Modifications</span>
                        <div className="text-base font-bold text-neutral-950 dark:text-neutral-50 mt-1">
                          {attempt?.answerChanges || 0} times
                        </div>
                      </div>
                      <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <span className="text-[10px] text-neutral-500 uppercase">Rapid Answer Anomaly</span>
                        <div className="text-base font-bold text-neutral-950 dark:text-neutral-50 mt-1">
                          {attempt && attempt.responseDurationMs < 6000 ? 'DETECTED' : 'NOMINAL'}
                        </div>
                      </div>
                      <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <span className="text-[10px] text-neutral-500 uppercase">Question Anomaly Score</span>
                        <div className="text-base font-bold text-neutral-950 dark:text-neutral-50 mt-1">
                          {attempt?.anomalyScore || 12} / 100
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      )}

      {activeTab === 'counterfactual' && (
        <div className="space-y-6">
          <CounterfactualPanel
            currentScore={reviewPriority}
            scenarios={sessionCounterfactuals}
          />
        </div>
      )}

      {activeTab === 'replay' && (
        <div className="space-y-6">
          <SessionReplayViewer session={targetSession} />
        </div>
      )}

      {activeTab === 'events' && (
        <Card
          title="Observable Telemetry Log"
          subtitle="Timestamped behavioral observations chronologically recorded"
          action={
            <div className="flex items-center gap-1 text-xs font-mono">
              {(['all', 'high', 'medium', 'low'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverityFilter(sev)}
                  className={`px-2.5 py-1 border text-[11px] uppercase transition-colors ${
                    selectedSeverityFilter === sev
                      ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev}
                </button>
              ))}
            </div>
          }
        >
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-neutral-500">
              No behavioral events recorded matching the current filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map(evt => (
                <EventIndicator
                  key={evt.id}
                  type={evt.type}
                  timestampMs={evt.timestamp}
                  durationSeconds={evt.durationSeconds || (evt.duration ? evt.duration / 1000 : undefined)}
                  confidence={evt.confidence}
                  description={evt.description}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <ReviewDecisionPanel
            sessionId={targetSession.id}
            onAddDecision={handleReviewAction}
            existingDecisions={targetSession.reviewDecisions}
          />
        </div>
      )}

      {/* Structured Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Examination Integrity Dossier"
        subtitle="Verifiable structured JSON telemetry record (0ms raw video)"
        maxWidth="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsExportModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Compliant with institutional privacy frameworks: zero facial footage or audio is retained. Telemetry consists solely of structured mathematical events, sequence timestamps, and calculated risk states.
          </p>
          <pre className="p-4 bg-neutral-950 text-neutral-100 font-mono text-[11px] rounded-none overflow-x-auto max-h-80 border border-neutral-800">
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
