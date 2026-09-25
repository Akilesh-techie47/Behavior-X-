import React from 'react';
import { CheckCircle2, ShieldCheck, FileText, RotateCcw, Lock } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';

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

  const receiptRows = [
    {
      label: 'Examination',
      value: `${session.settings.courseCode} — ${session.settings.examTitle}`,
      emphasis: true,
    },
    { label: 'Candidate', value: session.student.name, emphasis: true },
    { label: 'Candidate ID', value: session.student.studentId, mono: true },
    {
      label: 'Items evaluated',
      value: `${answeredCount} / ${questions.length}`,
      emphasis: true,
      suffix: unansweredCount > 0 ? `${unansweredCount} skipped` : 'All items attempted',
    },
    { label: 'Submitted at', value: `${completionTimeFormatted} · ${completionDateFormatted}` },
  ];

  return (
    <div className="max-w-3xl mx-auto py-10 sm:py-14 space-y-6">
      {/* 1. Confirmation header */}
      <div className="text-center space-y-4">
        <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle2 className="w-7 h-7" />
        </span>
        <div className="space-y-2">
          <p className="eyebrow">Session finalized</p>
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.025em] text-slate-900">
            Examination submitted
          </h1>
          <p className="text-[14px] text-slate-600 max-w-lg mx-auto leading-relaxed">
            Your responses and behavioral telemetry record have been sealed for human examiner
            evaluation. No further action is required from you.
          </p>
        </div>
      </div>

      {/* 2. Official receipt */}
      <Card
        title="Official telemetry receipt"
        subtitle="Sealed examination record"
        badge={<StatusBadge status="Submitted & sealed" variant="nominal" size="sm" />}
      >
        <dl className="divide-y divide-slate-100">
          {receiptRows.map(row => (
            <div
              key={row.label}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-0.5 py-3"
            >
              <dt className="eyebrow">{row.label}</dt>
              <dd className="flex items-baseline gap-2 text-[13.5px]">
                <span
                  className={`${row.mono ? 'data text-[13px]' : ''} ${
                    row.emphasis ? 'font-semibold text-slate-900' : 'text-slate-700'
                  }`}
                >
                  {row.value}
                </span>
                {row.suffix && (
                  <span className="text-[12px] text-slate-500">{row.suffix}</span>
                )}
              </dd>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-0.5 py-3">
            <dt className="eyebrow">Optical buffer state</dt>
            <dd className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Stream terminated · RAM purged</span>
            </dd>
          </div>
        </dl>
      </Card>

      {/* 3. Privacy notice — no risk score or accusations shown to candidates */}
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5">
        <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-[13px] font-semibold text-slate-900">
            Privacy &amp; ephemeral processing notice
          </h3>
          <p className="text-[12.5px] text-slate-600 leading-relaxed">
            In accordance with the Behavior-X privacy charter, zero raw video footage, photographs,
            or biometric scans were stored during this examination. All transient frames processed
            in on-device RAM were purged immediately after analysis.
          </p>
        </div>
      </div>

      {/* 4. Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={handleReturnHome}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Return to portal
        </Button>
        <Button
          variant="academic"
          size="md"
          onClick={() => onNavigate(`/examiner/session/${session.id}`)}
          icon={<FileText className="w-4 h-4" />}
        >
          Examine session dossier
        </Button>
      </div>
    </div>
  );
};
