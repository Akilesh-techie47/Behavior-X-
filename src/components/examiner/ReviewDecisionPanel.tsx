import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Bookmark, History } from 'lucide-react';
import { ReviewDecision } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';

interface ReviewDecisionPanelProps {
  sessionId: string;
  existingDecisions?: ReviewDecision[];
  onAddDecision: (
    decision: 'CONFIRMED' | 'DISMISSED' | 'UNCERTAIN' | 'MARK_FOR_REVIEW',
    note: string
  ) => void;
  className?: string;
}

const ACTIONS = [
  {
    id: 'CONFIRMED' as const,
    label: 'Confirm signal',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    note: 'Validated as meaningful evidence requiring an academic record.',
  },
  {
    id: 'DISMISSED' as const,
    label: 'Dismiss signal',
    icon: <XCircle className="w-3.5 h-3.5" />,
    note: 'Benign movement such as scratch paper, a normal glance, or a lighting reflection.',
  },
  {
    id: 'UNCERTAIN' as const,
    label: 'Mark uncertain',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    note: 'Insufficient sensor confidence; follow-up discussion recommended.',
  },
  {
    id: 'MARK_FOR_REVIEW' as const,
    label: 'Queue for review',
    icon: <Bookmark className="w-3.5 h-3.5" />,
    note: 'Place the session in the secondary examiner verification cohort.',
  },
];

export const ReviewDecisionPanel: React.FC<ReviewDecisionPanelProps> = ({
  sessionId,
  existingDecisions = [],
  onAddDecision,
  className = '',
}) => {
  const [note, setNote] = useState('');
  const [selectedAction, setSelectedAction] = useState<
    'CONFIRMED' | 'DISMISSED' | 'UNCERTAIN' | 'MARK_FOR_REVIEW'
  >('CONFIRMED');

  const handleApplyDecision = () => {
    if (!note.trim()) return;
    onAddDecision(selectedAction, note.trim());
    setNote('');
  };

  return (
    <Card
      title="Human determination"
      subtitle="Examiner sovereignty: academic decision makers verify, dismiss, or clarify every observation"
      className={className}
    >
      <div className="space-y-4">
        {/* Determination choice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {ACTIONS.map(action => {
            const isSelected = selectedAction === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedAction(action.id)}
                aria-pressed={isSelected}
                className={`rounded-md border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 text-[13px] font-semibold mb-1 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-slate-400'}>{action.icon}</span>
                  <span>{action.label}</span>
                </div>
                <p
                  className={`text-[12px] leading-relaxed ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {action.note}
                </p>
              </button>
            );
          })}
        </div>

        {/* Rationale */}
        <div className="space-y-2">
          <label htmlFor={`decision-note-${sessionId}`} className="eyebrow block">
            Examiner annotation &amp; decision rationale
          </label>
          <textarea
            id={`decision-note-${sessionId}`}
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Document examiner rationale (e.g. candidate was permitted scratch paper on desk, verified glance coincided with rough diagram)…"
            className="w-full rounded-md border border-slate-300 bg-white p-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600/30"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="data text-[11.5px] text-slate-500">
              Signed with examiner ID EXAM-ADMIN-01
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={!note.trim()}
              onClick={handleApplyDecision}
            >
              Commit decision
            </Button>
          </div>
        </div>

        {/* Audit trail */}
        {existingDecisions.length > 0 && (
          <div className="pt-3.5 border-t border-slate-200 space-y-2.5">
            <span className="eyebrow inline-flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Review decision audit trail ({existingDecisions.length})
            </span>
            <div className="space-y-2">
              {existingDecisions.map((dec, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={dec.decision.replace(/_/g, ' ').toLowerCase()}
                        variant={
                          dec.decision === 'CONFIRMED'
                            ? 'high'
                            : dec.decision === 'DISMISSED'
                              ? 'nominal'
                              : dec.decision === 'UNCERTAIN'
                                ? 'elevated'
                                : 'info'
                        }
                        size="sm"
                      />
                      <span className="text-[11.5px] text-slate-500">
                        {dec.examinerName} · {dec.examinerId}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-700 leading-relaxed">{dec.note}</p>
                  </div>
                  <span className="data text-[11px] text-slate-400 flex-shrink-0">
                    {new Date(dec.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
