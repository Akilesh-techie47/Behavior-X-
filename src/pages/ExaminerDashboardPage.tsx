import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Layers,
  ChevronDown,
  Network,
  HelpCircle,
  Play,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { PrivacyPanel, defaultPrivacyState } from '../components/examiner/PrivacyPanel';
import { ExplainableAlertPanel } from '../components/examiner/ExplainableAlertPanel';
import { RiskTimeline } from '../components/examiner/RiskTimeline';
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

  return (
    <div className="space-y-6 py-6">
      {/* 1. TOP HEADER & COMMAND CENTER STATUS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-850 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1">
            <span>BEHAVIOR-X V2</span>
            <span>•</span>
            <span>EXAMINER COMMAND & REVIEW CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white tracking-tight">
            Examination Intelligence Console
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time cohort behavioral telemetry, causal evidence graphs, and human-in-the-loop review queues.
          </p>
        </div>

        {/* Global Operational Status Pill & Demo Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs font-mono font-bold text-black dark:text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
            <span>OBSERVATION PIPELINE: ACTIVE</span>
          </div>

          <Button
            variant={isDemoMode ? 'academic' : 'outline'}
            size="sm"
            onClick={() => setDemoMode(!isDemoMode)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isDemoMode ? 'Demo Simulation Active' : 'Enable Demo Triggers'}
          </Button>
        </div>
      </div>

      {/* 2. DEMO PRESET SIMULATION BAR */}
      {isDemoMode && (
        <div className="p-3.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-black dark:text-white">
            <Sparkles className="w-4 h-4" />
            <span>DEMO SIGNAL INJECTION (1-CLICK DETERMINISTIC TRIGGERS):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriggerPreset('looking_away')}
            >
              Simulate Gaze Deviation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriggerPreset('multiple_faces')}
            >
              Simulate Secondary Person
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriggerPreset('repeated')}
            >
              Simulate Rapid Cluster
            </Button>
            <Button
              variant="academic"
              size="sm"
              onClick={() => handleTriggerPreset('ai_sequence')}
            >
              Simulate AI-Era Sequence
            </Button>
          </div>
        </div>
      )}

      {/* 3. COHORT RISK SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            Total Monitored Candidates
          </span>
          <div className="text-3xl font-black text-black dark:text-white mt-1">
            {totalSessions}
          </div>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">Active Examination Cohort</span>
        </Card>

        <Card>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            Review Queue Priority
          </span>
          <div className="text-3xl font-black text-black dark:text-white mt-1">
            {flaggedSessions}
          </div>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">Requires Examiner Verification</span>
        </Card>

        <Card>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            Nominal Baseline Rate
          </span>
          <div className="text-3xl font-black text-black dark:text-white mt-1">
            {Math.round(((totalSessions - flaggedSessions) / totalSessions) * 100)}%
          </div>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">Stable Behavioral Flow</span>
        </Card>

        <Card>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            System Observation Quality
          </span>
          <div className="text-3xl font-black text-black dark:text-white mt-1">
            94%
          </div>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">Optimal Sensor Pipeline</span>
        </Card>
      </div>

      {/* 4. ACTIVE EXPLAINABLE ALERT PANEL & SIGNAL BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <ExplainableAlertPanel
            riskState={session.riskState}
            onOpenSessionDetail={() => onNavigate(`/examiner/session/${session.id}`)}
          />
        </div>
        <div className="lg:col-span-4">
          <Card title="Observable Signal Breakdown" subtitle="Distribution across telemetry modalities">
            <SignalBreakdown events={session.events} />
          </Card>
        </div>
      </div>

      {/* 5. TABBED CONSOLE TOOLS: ROSTER, HEATMAP, GRAPH, REPLAY */}
      <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveConsoleTab('roster')}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${
            activeConsoleTab === 'roster'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          Candidate Roster ({totalSessions})
        </button>
        <button
          onClick={() => setActiveConsoleTab('heatmap')}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${
            activeConsoleTab === 'heatmap'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          Question Integrity Heatmap
        </button>
        <button
          onClick={() => setActiveConsoleTab('graph')}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${
            activeConsoleTab === 'graph'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          Evidence Graph Viewer
        </button>
        <button
          onClick={() => setActiveConsoleTab('replay')}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${
            activeConsoleTab === 'replay'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          Behavioral Session Replay
        </button>
      </div>

      {/* Tab 1: Candidate Roster */}
      {activeConsoleTab === 'roster' && (
        <Card
          title="Student Candidate Roster"
          subtitle="Oversight of active candidate sessions, review states, and anomaly indices"
          action={
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase hidden sm:inline">
                Filter Review Priority:
              </span>
              {['all', 'normal', 'medium', 'high', 'review'].map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded font-bold transition-colors ${
                    filterRisk === r
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  {r === 'all' ? 'ALL' : r.toUpperCase()}
                </button>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Assessment</th>
                  <th className="pb-3">Review Priority</th>
                  <th className="pb-3">Evidence Telemetry</th>
                  <th className="pb-3">Examiner Determination</th>
                  <th className="pb-3 text-right">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-sans">
                {filteredSessions.map(sess => {
                  const reviewState = reviewStates[sess.id] || 'UNREVIEWED';

                  return (
                    <tr
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-black dark:text-white">
                          {sess.student.name}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          {sess.student.studentId}
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        {sess.settings.courseCode}
                      </td>
                      <td className="py-3.5 pr-3">
                        <RiskBadge level={sess.riskState.level} score={sess.riskState.currentScore} />
                      </td>
                      <td className="py-3.5 pr-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        {sess.events.length} recorded cues
                      </td>
                      <td className="py-3.5 pr-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={reviewState}
                          onChange={e =>
                            handleUpdateReviewStatus(sess.id, e.target.value as ReviewStatus)
                          }
                          className="text-xs font-mono font-bold px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none"
                        >
                          <option value="UNREVIEWED">UNREVIEWED</option>
                          <option value="MARK_FOR_REVIEW">MARK FOR REVIEW</option>
                          <option value="REVIEWED">CONFIRMED REVIEWED</option>
                          <option value="NEEDS_FOLLOW_UP">NEEDS FOLLOW-UP</option>
                        </select>
                      </td>
                      <td className="py-3.5 text-right font-mono text-xs">
                        <span className="font-bold underline text-black dark:text-white hover:opacity-70">
                          Inspect Evidence →
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

      {/* Tab 2: Question Heatmap */}
      {activeConsoleTab === 'heatmap' && (
        <QuestionHeatmap items={questionHeatmap} />
      )}

      {/* Tab 3: Evidence Graph Viewer */}
      {activeConsoleTab === 'graph' && (
        <EvidenceGraphViewer graphData={evidenceGraph} />
      )}

      {/* Tab 4: Session Replay */}
      {activeConsoleTab === 'replay' && (
        <SessionReplayViewer session={session} />
      )}

      {/* 6. PRIVACY AUDIT & MONITORING PROFILE CONFIGURATION */}
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
