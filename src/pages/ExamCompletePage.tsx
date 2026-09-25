import React from 'react';
import { CheckCircle2, ShieldCheck, FileText, ArrowRight, RotateCcw, Clock, Lock } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const ExamCompletePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { session, questions, resetSession } = useSession();

  const answeredCount = Object.keys(session.answers).length;
  const unansweredCount = questions.length - answeredCount;

  const completionTimeFormatted = session.endedAt
    ? new Date(session.endedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Just now';

  const completionDateFormatted = session.endedAt
    ? new Date(session.endedAt).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Today';

  const handleReturnHome = () => {
    resetSession();
    onNavigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6 font-sans">
      {/* Top Completion Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 border border-neutral-950 dark:border-white bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 font-mono uppercase">
          Examination Submitted Successfully
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
          Your responses and encrypted behavioral telemetry record have been securely sealed.
        </p>
      </div>

      {/* Official Submission Summary & Receipt */}
      <Card title="Official Telemetry Receipt" subtitle="Cryptographically sealed examination record">
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs font-mono">
          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-500 uppercase">Submission Status</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-neutral-950 dark:text-neutral-50">
              <CheckCircle2 className="w-4 h-4" />
              <span>SUBMITTED & SEALED</span>
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-500 uppercase">Examination Code</span>
            <span className="font-semibold text-neutral-950 dark:text-neutral-50">
              {session.settings.courseCode} — {session.settings.examTitle}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-500 uppercase">Candidate Identity</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {session.student.name}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-500 uppercase">Candidate ID</span>
            <span className="text-neutral-900 dark:text-neutral-100">
              {session.student.studentId}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-500 uppercase">Items Evaluated</span>
            <span className="font-bold text-neutral-950 dark:text-neutral-50">
              {answeredCount} / {questions.length} Items
              {unansweredCount > 0 && (
                <span className="text-neutral-400 font-normal ml-1">({unansweredCount} skipped)</span>
              )}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-500 uppercase">Timestamp</span>
            <span className="text-neutral-900 dark:text-neutral-100">
              {completionTimeFormatted} ({completionDateFormatted})
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-500 uppercase">Optical Buffer State</span>
            <span className="inline-flex items-center gap-1.5 text-neutral-950 dark:text-neutral-50 font-medium text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Stream Terminated • RAM Purged</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Privacy Notice (Rule 8 & 9 Compliant: Never show raw risk score or accusations to candidate) */}
      <div className="p-4 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-800 dark:text-neutral-200 space-y-1.5 font-mono">
        <div className="flex items-center gap-2 font-bold uppercase text-neutral-950 dark:text-neutral-50">
          <Lock className="w-4 h-4" />
          <span>Privacy & Ephemeral Processing Notice</span>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
          In accordance with Behavior-X's privacy charter, zero raw video footage, photos, or biometric scans were stored during this examination. All transient frames processed in on-device RAM were purged immediately.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={handleReturnHome}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Return to Portal
        </Button>
        <Button
          variant="academic"
          size="md"
          onClick={() => onNavigate(`/examiner/session/${session.id}`)}
          icon={<FileText className="w-4 h-4" />}
        >
          Examine Session Dossier
        </Button>
      </div>
    </div>
  );
};
