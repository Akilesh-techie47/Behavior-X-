import React, { useState } from 'react';
import { HelpCircle, Clock, AlertTriangle, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react';
import { QuestionIntegrityItem } from '../../engine/questions/QuestionIntelligenceEngine';
import { Card } from '../common/Card';
import { RiskBadge } from '../common/StatusBadge';

interface QuestionHeatmapProps {
  items: QuestionIntegrityItem[];
  className?: string;
  onSelectQuestion?: (questionId: string) => void;
}

export const QuestionHeatmap: React.FC<QuestionHeatmapProps> = ({
  items,
  className = '',
  onSelectQuestion,
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    items.length > 0 ? items[0].questionId : ''
  );

  const selectedItem = items.find(q => q.questionId === selectedQuestionId) || items[0];

  const handleSelect = (id: string) => {
    setSelectedQuestionId(id);
    if (onSelectQuestion) {
      onSelectQuestion(id);
    }
  };

  const getDensityVisual = (score: number) => {
    if (score >= 70) return '██████████';
    if (score >= 50) return '████████';
    if (score >= 30) return '█████';
    if (score >= 15) return '███';
    return '█';
  };

  return (
    <Card
      title="Question Integrity Heatmap"
      subtitle="Behavioral telemetry and response-time distribution mapped across all exam questions"
      className={className}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Heatmap Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {items.map(q => {
              const isSelected = q.questionId === selectedQuestionId;
              const hasAnomaly = q.score >= 30;

              return (
                <button
                  key={q.questionId}
                  onClick={() => handleSelect(q.questionId)}
                  className={`p-3 rounded-md text-left transition-all duration-150 border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="font-bold">Q{q.number}</span>
                    <span className="text-[9px] uppercase tracking-wider">{q.difficulty}</span>
                  </div>

                  <div className="my-1">
                    <div className="font-mono text-[10px] tracking-tighter truncate opacity-80">
                      {getDensityVisual(q.score)}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono mt-1 opacity-70 flex justify-between">
                    <span>{q.responseTimeSec}s</span>
                    <span>exp: {q.expectedTimeSec}s</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
            <span>DENSITY: █ NOMINAL • ███ LOW • █████ MEDIUM • ████████ HIGH • ██████████ REVIEW</span>
            <span>CLICK QUESTION TO INSPECT TELEMETRY</span>
          </div>
        </div>

        {/* Right Column: Selected Question Behavioral Details */}
        <div className="lg:col-span-5">
          {selectedItem ? (
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-black dark:text-white">
                    QUESTION {selectedItem.number}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                    {selectedItem.difficulty}
                  </span>
                </div>
                <RiskBadge level={selectedItem.level} score={selectedItem.score} />
              </div>

              <p className="text-xs text-neutral-800 dark:text-neutral-200 line-clamp-3 leading-relaxed">
                {selectedItem.prompt}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <div className="p-2 bg-white dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">ACTUAL RESPONSE TIME</span>
                  <strong className="text-sm text-black dark:text-white">{selectedItem.responseTimeSec}s</strong>
                </div>
                <div className="p-2 bg-white dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">EXPECTED TIME</span>
                  <strong className="text-sm text-neutral-700 dark:text-neutral-300">{selectedItem.expectedTimeSec}s</strong>
                </div>
                <div className="p-2 bg-white dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">ANSWER REVISIONS</span>
                  <strong className="text-sm text-black dark:text-white">{selectedItem.answerChanges} change{selectedItem.answerChanges === 1 ? '' : 's'}</strong>
                </div>
                <div className="p-2 bg-white dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">COMPLETION STATE</span>
                  <strong className="text-sm text-black dark:text-white">{selectedItem.isAnswered ? 'Submitted' : 'Pending'}</strong>
                </div>
              </div>

              {selectedItem.flags && selectedItem.flags.length > 0 && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                    Observed Behavioral Flags:
                  </span>
                  <ul className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1 font-mono">
                    {selectedItem.flags.map((flag, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span>•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-neutral-400">Select a question to view telemetry</div>
          )}
        </div>
      </div>
    </Card>
  );
};
