import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Bookmark, MessageSquare, History } from 'lucide-react';
import { ReviewDecision } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface ReviewDecisionPanelProps {
  sessionId: string;
  existingDecisions?: ReviewDecision[];
  onAddDecision: (
    decision: 'CONFIRMED' | 'DISMISSED' | 'UNCERTAIN' | 'MARK_FOR_REVIEW',
    note: string
  ) => void;
  className?: string;
}

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
      title="Human-in-the-Loop Determination"
      subtitle="Examiner evaluation sovereign — human academic decision makers verify, dismiss, or clarify all observations"
      className={className}
    >
      <div className="space-y-4">
        {/* Action Choice Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedAction('CONFIRMED')}
            className={`p-3 rounded-md border text-left transition-all ${
              selectedAction === 'CONFIRMED'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold shadow-xs'
                : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Signal</span>
            </div>
            <p className="text-[11px] opacity-75 font-normal">
              Validated as meaningful evidence requiring academic record.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAction('DISMISSED')}
            className={`p-3 rounded-md border text-left transition-all ${
              selectedAction === 'DISMISSED'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold shadow-xs'
                : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Dismiss Signal</span>
            </div>
            <p className="text-[11px] opacity-75 font-normal">
              Benign movement (scratch paper, normal glance, lighting reflection).
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAction('UNCERTAIN')}
            className={`p-3 rounded-md border text-left transition-all ${
              selectedAction === 'UNCERTAIN'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold shadow-xs'
                : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Mark Uncertain</span>
            </div>
            <p className="text-[11px] opacity-75 font-normal">
              Insufficient sensor confidence; follow-up discussion recommended.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAction('MARK_FOR_REVIEW')}
            className={`p-3 rounded-md border text-left transition-all ${
              selectedAction === 'MARK_FOR_REVIEW'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold shadow-xs'
                : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Queue for Review</span>
            </div>
            <p className="text-[11px] opacity-75 font-normal">
              Place session in secondary examiner verification cohort.
            </p>
          </button>
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block">
            Examiner Annotation & Decision Rationale
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Document examiner rationale (e.g. candidate was permitted scratch paper on desk, verified glance coincided with rough diagram)..."
            className="w-full p-3 rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-sans"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-neutral-400">
              Audit action will be cryptographically signed with Examiner ID: EXAM-ADMIN-01
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={!note.trim()}
              onClick={handleApplyDecision}
            >
              Commit Review Decision
            </Button>
          </div>
        </div>

        {/* Audit History Log */}
        {existingDecisions.length > 0 && (
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-850 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
              <History className="w-3.5 h-3.5" />
              <span>Review Decision Audit Trail ({existingDecisions.length})</span>
            </div>
            <div className="space-y-1.5">
              {existingDecisions.map((dec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black dark:text-white font-mono uppercase">
                        [{dec.decision}]
                      </span>
                      <span className="text-neutral-500 text-[11px]">
                        by {dec.examinerName} ({dec.examinerId})
                      </span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 mt-1 leading-relaxed">
                      {dec.note}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 flex-shrink-0">
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
