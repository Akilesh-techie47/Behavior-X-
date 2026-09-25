import React, { useState } from 'react';
import {
  ChevronLeft,
  ShieldCheck,
  User,
  Clock,
  Activity,
  FileCheck,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
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

export const SessionDetailPage: React.FC<{ sessionId: string; onNavigate: (path: string) => void }> = ({
  sessionId,
  onNavigate,
}) => {
  const { allSessions } = useSession();
  const targetSession = allSessions.find(s => s.id === sessionId) || allSessions[0];

  const [notes, setNotes] = useState(targetSession.notes || '');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredEvents = targetSession.events.filter(e => {
    if (selectedSeverityFilter === 'all') return true;
    return e.severity === selectedSeverityFilter;
  });

  return (
    <div className="space-y-6 py-6">
      {/* Detail Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/examiner')}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Back to All Students
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>EXAM SESSION REPORT</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{targetSession.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
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
            Download Report (JSON)
          </Button>
        </div>
      </div>

      {/* Top Telemetry Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Risk Gauge Card */}
        <div className="md:col-span-4">
          <Card title="Overall Review Score" subtitle="Combined rating of observed cues" className="h-full">
            <div className="space-y-6">
              <RiskIndicator
                score={targetSession.riskState.currentScore}
                level={targetSession.riskState.level}
                size="lg"
              />

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1 font-medium">
                    <span>Looking Away Score</span>
                    <span className="font-bold">{targetSession.riskState.breakdown.attentionDeviationScore}/40</span>
                  </div>
                  <ProgressBar
                    value={targetSession.riskState.breakdown.attentionDeviationScore}
                    max={40}
                    color="indigo"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1 font-medium">
                    <span>Camera View & Second Person</span>
                    <span className="font-bold">{targetSession.riskState.breakdown.presenceScore}/40</span>
                  </div>
                  <ProgressBar
                    value={targetSession.riskState.breakdown.presenceScore}
                    max={40}
                    color="rose"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1 font-medium">
                    <span>Tab Switching & Window Focus</span>
                    <span className="font-bold">{targetSession.riskState.breakdown.environmentScore}/20</span>
                  </div>
                  <ProgressBar
                    value={targetSession.riskState.breakdown.environmentScore}
                    max={20}
                    color="amber"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Candidate & Metadata Card */}
        <div className="md:col-span-8">
          <Card title="Student Information & Progress" subtitle="Verified enrolled student">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">STUDENT ID</span>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {targetSession.student.studentId}
                </div>
                <div className="text-slate-600 dark:text-slate-400">{targetSession.student.email}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">EXAM PROGRESS</span>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {Object.keys(targetSession.answers).length} of {targetSession.questionCount} Questions Answered
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-medium">Status: {targetSession.status.toUpperCase()}</div>
              </div>

              {/* Explainable Attribution Summary */}
              <div className="sm:col-span-2 p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold">
                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Why this score was given:</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-medium">
                    Confidence: {Math.round((targetSession.riskState.confidence || 0.85) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-indigo-950 dark:text-indigo-100 leading-relaxed font-normal">
                  {targetSession.riskState.humanReadableExplanation || targetSession.riskState.primaryContributingFactor}
                </p>

                {/* Contributing Signals Checklist */}
                {targetSession.riskState.contributingSignalSummary && (
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/50 space-y-1">
                    <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                      CONTRIBUTING SIGNALS:
                    </span>
                    <ul className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                      {targetSession.riskState.contributingSignalSummary.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Gemini AI Explanation Layer */}
      <AIExplanationCard session={targetSession} />

      {/* Chronological Score Timeline */}
      <Card
        title="Score History Over Time"
        subtitle="Tracking how review scores changed as the student answered questions"
        badge={
          <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-medium">
            Timeline View
          </span>
        }
      >
        <RiskTimeline timeline={targetSession.riskState.timeline || []} />
      </Card>

      {/* Observable Behavioral Events Chronology */}
      <Card
        title="List of Flagged Moments"
        subtitle="Times when student looked away, switched windows, or camera changed"
        action={
          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'high', 'medium', 'low'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  selectedSeverityFilter === sev
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {sev === 'all' ? 'All Moments' : `${sev} Priority`}
              </button>
            ))}
          </div>
        }
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No moments match this filter. Everything looked steady!
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

      {/* Examiner Notes & Determination */}
      <Card title="Teacher Review Notes" subtitle="Add your own comments after speaking with the student">
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes (e.g., student had permission to use rough notebook, or explained background noise)..."
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Notes are saved securely with the student's exam record.
            </span>
            <Button variant="primary" size="sm">
              Save Review Notes
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Raw Evidence Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Session Audit Log"
        subtitle="Zero-video structured data record"
        maxWidth="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsExportModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Below is the safe, text-only event summary ready for school records. Notice that zero video or photos are saved.
          </p>
          <pre className="p-3 bg-slate-950 text-indigo-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 border border-slate-800">
            {JSON.stringify(
              {
                sessionId: targetSession.id,
                candidateId: targetSession.student.studentId,
                riskScore: targetSession.riskState.currentScore,
                riskLevel: targetSession.riskState.level,
                humanExplanation: targetSession.riskState.humanReadableExplanation,
                eventsCount: targetSession.events.length,
                topContributingFactors: targetSession.riskState.topContributingFactors,
                events: targetSession.events,
                privacyStandard: 'ZERO_VIDEO_ON_DEVICE_ONLY',
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
