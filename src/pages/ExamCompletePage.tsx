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
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      {/* Top Completion Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Examination Submitted Successfully
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Your exam responses have been securely received and sealed. Thank you for completing this assessment.
        </p>
      </div>

      {/* Official Submission Summary & Receipt */}
      <Card title="Official Assessment Receipt" subtitle="Academic enrollment record">
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Submission Status</span>
            <span className="inline-flex items-center gap-1.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>SUBMITTED & VERIFIED</span>
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Course Code & Title</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {session.settings.courseCode} — {session.settings.examTitle}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Student Name</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {session.student.name}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Student Identification</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {session.student.studentId}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Number of Questions Answered</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {answeredCount} / {questions.length} Questions
              {unansweredCount > 0 && (
                <span className="text-slate-400 font-normal ml-1">({unansweredCount} skipped)</span>
              )}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Exam Completion Time</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {completionTimeFormatted} ({completionDateFormatted})
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Optical Sensor Status</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Stream Disconnected • RAM Cleared</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Privacy Message (Notice: Does not expose suspicious behavior scores to the candidate) */}
      <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-100">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Privacy & Data Protection Notice</span>
        </div>
        <p className="text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed text-[11px]">
          In accordance with Behavior-X's privacy charter, no raw video footage, photos, or biometric data were stored during this examination. All transient frames processed on your device were purged upon submission.
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
          Switch to Examiner View
        </Button>
      </div>
    </div>
  );
};
