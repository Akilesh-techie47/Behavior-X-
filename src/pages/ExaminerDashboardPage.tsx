import React, { useState } from 'react';
import { Search, ArrowUpRight, Sparkles, ChevronRight, Filter } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge } from '../components/common/StatusBadge';
import { PrivacyPanel, defaultPrivacyState } from '../components/examiner/PrivacyPanel';
import { ExplainableAlertPanel } from '../components/examiner/ExplainableAlertPanel';
import { SignalBreakdown } from '../components/examiner/SignalBreakdown';
import { EvidenceGraphViewer } from '../components/examiner/EvidenceGraphViewer';
import { QuestionHeatmap } from '../components/examiner/QuestionHeatmap';
import { SessionReplayViewer } from '../components/examiner/SessionReplayViewer';
import { ReviewStatus } from '../types';

export const ExaminerDashboardPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const {
    allSessions,
    loadSession,
    session,
    isDemoMode,
    setDemoMode,
    behaviorEngine,
    questionHeatmap,
    evidenceGraph,
    monitoringProfile,
    setMonitoringProfile,
  } = useSession();

  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'roster' | 'heatmap' | 'graph' | 'replay'>('roster');
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewStatus>>({
    'sess-8821': 'MARK_FOR_REVIEW',
    'sess-8822': 'REVIEWED',
    'sess-8823': 'NEEDS_FOLLOW_UP',
  });

  const handleUpdateReviewStatus = (sessionId: string, status: ReviewStatus) => {
    setReviewStates(prev => ({
      ...prev,
      [sessionId]: status,
    }));
  };

  const filteredSessions = allSessions.filter(s => {
    const matchesSearch =
      s.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

    const normLevel = String(s.riskState.level).toUpperCase();
    const matchesRisk =
      filterRisk === 'all' ||
      normLevel === filterRisk.toUpperCase() ||
      (filterRisk === 'review' && (normLevel === 'REVIEW' || normLevel === 'HIGH' || normLevel === 'ELEVATED'));

    return matchesSearch && matchesRisk;
  });

  const totalSessions = allSessions.length;
  const flaggedSessions = allSessions.filter(s => {
    const lvl = String(s.riskState.level).toUpperCase();
    return lvl === 'MEDIUM' || lvl === 'HIGH' || lvl === 'REVIEW' || lvl === 'ELEVATED';
  }).length;

  const handleSelectSession = (sessionId: string) => {
    loadSession(sessionId);
    onNavigate(`/examiner/session/${sessionId}`);
  };

  const handleTriggerPreset = (presetName: string) => {
    if (!behaviorEngine) return;
    if (presetName === 'multiple_faces') {
      behaviorEngine.triggerSyntheticEvent('MULTIPLE_FACES', 'Second individual observed in camera perimeter.');
    } else if (presetName === 'looking_away') {
      behaviorEngine.triggerSyntheticEvent('LOOKING_AWAY', 'Candidate attention deviated away from active viewport.');
    } else if (presetName === 'repeated') {
      behaviorEngine.triggerSyntheticEvent('RAPID_REPEATED_DEVIATION', 'Compound cluster: rapid glances away coinciding with focus shift.');
    } else if (presetName === 'ai_sequence') {
      behaviorEngine.triggerSyntheticEvent('AI_ERA_INTERACTION_PATTERN', 'External assistance sequence: focus blur followed by rapid response insertion.');
    }
  };

  const summaryMetrics = [
    { label: 'Monitored candidates', value: String(totalSessions), note: 'Active examination cohort' },
    { label: 'Review queue priority', value: String(flaggedSessions), note: 'Requires examiner verification' },
    {
      label: 'Nominal baseline rate',
      value: `${Math.round(((totalSessions - flaggedSessions) / totalSessions) * 100)}%`,
      note: 'Stable behavioral flow',
    },
    { label: 'Observation quality', value: '94%', note: 'Optimal sensor pipeline' },
  ];

  const consoleTabs = [
    { id: 'roster', label: 'Candidate roster', meta: totalSessions },
    { id: 'heatmap', label: 'Question heatmap' },
    { id: 'graph', label: 'Evidence graph' },
    { id: 'replay', label: 'Session replay' },
  ] as const;

  const riskFilters = ['all', 'normal', 'medium', 'high', 'review'];

  const demoPresets = [
    { id: 'looking_away', label: 'Gaze deviation', variant: 'outline' as const },
    { id: 'multiple_faces', label: 'Secondary person', variant: 'outline' as const },
    { id: 'repeated', label: 'Rapid cluster', variant: 'outline' as const },
    { id: 'ai_sequence', label: 'AI-era sequence', variant: 'academic' as const },
  ];

  return (
    <div className="space-y-6 py-6">
      {/* 1. Command center header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="min-w-0">
          <p className="eyebrow">Behavior-X v2 · examiner command &amp; review center</p>
          <h1 className="mt-1.5 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
            Examination intelligence console
          </h1>
          <p className="text-[13px] text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Cohort behavioral telemetry, causal evidence graphs, and human-in-the-loop review
            queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[12.5px] font-medium text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Observation pipeline active
          </span>
          <Button
            variant={isDemoMode ? 'academic' : 'outline'}
            size="sm"
            onClick={() => setDemoMode(!isDemoMode)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isDemoMode ? 'Demo triggers active' : 'Enable demo triggers'}
          </Button>
        </div>
      </div>

      {/* 2. Demo injection bar */}
      {isDemoMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50/70 px-4 py-3">
          <div className="inline-flex items-center gap-2 text-[12.5px] font-medium text-amber-900">
            <Sparkles className="w-4 h-4" />
            <span>Demo signal injection · deterministic one-click triggers</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {demoPresets.map(preset => (
              <Button
                key={preset.id}
                variant={preset.variant}
                size="sm"
                onClick={() => handleTriggerPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Cohort summary strip */}
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:divide-x sm:divide-y lg:divide-y-0 divide-slate-200">
          {summaryMetrics.map(metric => (
            <div key={metric.label} className="px-5 py-4">
              <span className="eyebrow">{metric.label}</span>
              <div className="data text-[26px] font-semibold leading-none text-slate-900 mt-2">
                {metric.value}
              </div>
              <p className="text-[12px] text-slate-500 mt-1.5">{metric.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active alert + signal breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <ExplainableAlertPanel
            riskState={session.riskState}
            onOpenSessionDetail={() => onNavigate(`/examiner/session/${session.id}`)}
          />
        </div>
        <div className="lg:col-span-4">
          <Card title="Signal breakdown" subtitle="Distribution across telemetry modalities">
            <SignalBreakdown events={session.events} />
          </Card>
        </div>
      </div>

      {/* 5. Console tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap items-center gap-1" aria-label="Console tools">
          {consoleTabs.map(tab => {
            const isActive = activeConsoleTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveConsoleTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'border-brand-700 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {'meta' in tab && tab.meta !== undefined && (
                  <span
                    className={`data rounded-[3px] px-1.5 py-0.5 text-[11px] ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.meta}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Candidate roster */}
      {activeConsoleTab === 'roster' && (
        <Card
          title="Candidate roster"
          subtitle="Active sessions, review states, and anomaly indices"
          bodyClassName="p-0"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="relative hidden sm:block">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search candidate or ID"
                  className="h-8 w-48 rounded-md border border-slate-300 bg-white pl-8 pr-2.5 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600/30"
                />
              </label>
              <div className="flex items-center gap-1.5">
                <span className="hidden md:inline-flex items-center gap-1 text-[11.5px] text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  Priority
                </span>
                {riskFilters.map(r => (
                  <button
                    key={r}
                    onClick={() => setFilterRisk(r)}
                    className={`h-7 px-2.5 rounded-md text-[11.5px] font-medium capitalize transition-colors ${
                      filterRisk === r
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2.5 pr-3">Candidate</th>
                  <th className="pb-2.5 pr-3">Assessment</th>
                  <th className="pb-2.5 pr-3">Review priority</th>
                  <th className="pb-2.5 pr-3">Telemetry</th>
                  <th className="pb-2.5 pr-3">Examiner determination</th>
                  <th className="pb-2.5 text-right">Investigation</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map(sess => {
                  const reviewState = reviewStates[sess.id] || 'UNREVIEWED';

                  return (
                    <tr
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className="group cursor-pointer"
                    >
                      <td className="py-3 pr-3">
                        <div className="text-[13.5px] font-semibold text-slate-900">
                          {sess.student.name}
                        </div>
                        <div className="data text-[11.5px] text-slate-500 mt-0.5">
                          {sess.student.studentId}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="data text-[12.5px] text-slate-700">
                          {sess.settings.courseCode}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <RiskBadge level={sess.riskState.level} score={sess.riskState.currentScore} />
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-[12.5px] text-slate-600">
                          {sess.events.length} cues
                        </span>
                      </td>
                      <td className="py-3 pr-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={reviewState}
                          onChange={e =>
                            handleUpdateReviewStatus(sess.id, e.target.value as ReviewStatus)
                          }
                          aria-label={`Examiner determination for ${sess.student.name}`}
                          className="h-8 px-2 rounded-md border border-slate-300 bg-white text-[12.5px] text-slate-800 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600/30"
                        >
                          <option value="UNREVIEWED">Unreviewed</option>
                          <option value="MARK_FOR_REVIEW">Mark for review</option>
                          <option value="REVIEWED">Confirmed reviewed</option>
                          <option value="NEEDS_FOLLOW_UP">Needs follow-up</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-slate-700 group-hover:text-slate-900">
                          Inspect
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Question heatmap */}
      {activeConsoleTab === 'heatmap' && <QuestionHeatmap items={questionHeatmap} />}

      {/* Tab 3: Evidence graph */}
      {activeConsoleTab === 'graph' && <EvidenceGraphViewer graphData={evidenceGraph} />}

      {/* Tab 4: Session replay */}
      {activeConsoleTab === 'replay' && <SessionReplayViewer session={session} />}

      {/* 6. Privacy audit & monitoring profile */}
      <PrivacyPanel
        privacyState={{
          ...defaultPrivacyState,
          monitoringProfile,
        }}
        onProfileChange={setMonitoringProfile}
      />
    </div>
  );
};
