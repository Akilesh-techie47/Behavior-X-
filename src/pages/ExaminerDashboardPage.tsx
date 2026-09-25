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
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { RiskIndicator } from '../components/common/RiskIndicator';
import { PrivacyPanel } from '../components/examiner/PrivacyPanel';
import { ExplainableAlertPanel } from '../components/examiner/ExplainableAlertPanel';
import { RiskTimeline } from '../components/examiner/RiskTimeline';
import { SignalBreakdown } from '../components/examiner/SignalBreakdown';
import { ReviewStatus } from '../types';

export const ExaminerDashboardPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { allSessions, loadSession, session, isDemoMode, setDemoMode, behaviorEngine } = useSession();
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'entire' | '5m' | '10m'>('entire');
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
  const activeSessions = allSessions.filter(s => s.status === 'active').length;

  const handleSelectSession = (sessionId: string) => {
    loadSession(sessionId);
    onNavigate(`/examiner/session/${sessionId}`);
  };

  // Demo presets trigger
  const handleTriggerPreset = (presetName: string) => {
    if (!behaviorEngine) return;
    if (presetName === 'multiple_faces') {
      behaviorEngine.triggerSyntheticEvent('MULTIPLE_FACES', 'Second person appeared in camera frame.');
    } else if (presetName === 'looking_away') {
      behaviorEngine.triggerSyntheticEvent('LOOKING_AWAY', 'Student looked away from the test screen.');
    } else if (presetName === 'repeated') {
      behaviorEngine.triggerSyntheticEvent('RAPID_REPEATED_DEVIATION', 'Multiple quick glances away and window tab switches.');
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* 1. TOP HEADER & COMMAND CENTER STATUS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
            <span>BEHAVIOR-X</span>
            <span>•</span>
            <span>EXAM MONITORING & REVIEW DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Teacher & Examiner Console
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Review student exam patterns, check flagged moments, and view plain-English AI explanations.
          </p>
        </div>

        {/* Global Operational Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ALL SYSTEMS ACTIVE</span>
          </div>

          <Button
            variant={isDemoMode ? 'academic' : 'outline'}
            size="sm"
            onClick={() => setDemoMode(!isDemoMode)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isDemoMode ? 'Demo Mode Active' : 'Test with Simulated Data'}
          </Button>
        </div>
      </div>

      {/* 2. DEMO PRESET SIMULATION BAR */}
      {isDemoMode && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-indigo-950 dark:text-indigo-200 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>TEST QUICK SCENARIOS (TRY WITH 1 CLICK):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriggerPreset('looking_away')}
              className="text-xs font-medium"
            >
              Simulate Looking Away
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriggerPreset('multiple_faces')}
              className="text-xs font-medium"
            >
              Simulate Second Person
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriggerPreset('repeated')}
              className="text-xs font-medium"
            >
              Simulate Repeated Distraction
            </Button>
          </div>
        </div>
      )}

      {/* 3. COHORT RISK SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Total Students
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalSessions}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Taking the exam</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Needs Teacher Review
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {flaggedSessions}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Flagged for extra attention</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Normal & Focused
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalSessions - flaggedSessions}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Standard test-taking pattern</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Privacy Guarantee
          </span>
          <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Zero Video Saved</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Processed only on device</span>
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
          <Card title="Observed Event Breakdown" subtitle="Types of activity noticed">
            <SignalBreakdown events={session.events} />
          </Card>
        </div>
      </div>

      {/* 5. ACTIVE SESSIONS TABLE & WORKFLOW REVIEW STATES */}
      <Card
        title="Student Exam Roster"
        subtitle="Review and mark each student's exam status"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">Filter by Concern:</span>
            {['all', 'normal', 'medium', 'high', 'review'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterRisk === r
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {r === 'all' ? 'ALL' : r.toUpperCase()}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Student</th>
                <th className="pb-3">Course</th>
                <th className="pb-3">Concern Level</th>
                <th className="pb-3">Flagged Cues</th>
                <th className="pb-3">Review Decision</th>
                <th className="pb-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSessions.map(sess => {
                const reviewState = reviewStates[sess.id] || 'UNREVIEWED';

                return (
                  <tr
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-850/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 pr-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {sess.student.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ID: {sess.student.studentId}
                      </div>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {sess.settings.courseCode}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <RiskBadge level={sess.riskState.level} score={sess.riskState.currentScore} />
                    </td>
                    <td className="py-3.5 pr-3 font-medium text-slate-700 dark:text-slate-300">
                      {sess.events.length} moments noted
                    </td>
                    <td className="py-3.5 pr-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={reviewState}
                        onChange={e =>
                          handleUpdateReviewStatus(sess.id, e.target.value as ReviewStatus)
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none ${
                          reviewState === 'REVIEWED'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : reviewState === 'NEEDS_FOLLOW_UP'
                            ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                            : reviewState === 'MARK_FOR_REVIEW'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <option value="UNREVIEWED">Not Reviewed</option>
                        <option value="MARK_FOR_REVIEW">Needs Review</option>
                        <option value="REVIEWED">Looks Good</option>
                        <option value="NEEDS_FOLLOW_UP">Follow Up with Student</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        View Audit Log →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. PRIVACY AUDIT VERIFICATION */}
      <PrivacyPanel />
    </div>
  );
};
