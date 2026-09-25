import React, { useState } from 'react';
import { Check } from 'lucide-react';
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

  const densityTone = (score: number) => {
    if (score >= 70) return { bar: 'bg-rose-600', text: 'text-rose-700', label: 'Review' };
    if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700', label: 'High' };
    if (score >= 30) return { bar: 'bg-brand-600', text: 'text-brand-700', label: 'Medium' };
    if (score >= 15) return { bar: 'bg-sky-500', text: 'text-sky-700', label: 'Low' };
    return { bar: 'bg-slate-300', text: 'text-slate-500', label: 'Nominal' };
  };

  const legend = [
    { label: 'Nominal', bar: 'bg-slate-300' },
    { label: 'Low', bar: 'bg-sky-500' },
    { label: 'Medium', bar: 'bg-brand-600' },
    { label: 'High', bar: 'bg-amber-500' },
    { label: 'Review', bar: 'bg-rose-600' },
  ];

  return (
    <Card
      title="Question integrity heatmap"
      subtitle="Response time and behavioral telemetry mapped across all questions"
      className={className}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Heatmap grid */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {items.map(q => {
              const isSelected = q.questionId === selectedQuestionId;
              const tone = densityTone(q.score);

              return (
                <button
                  key={q.questionId}
                  onClick={() => handleSelect(q.questionId)}
                  aria-pressed={isSelected}
                  className={`rounded-md border p-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="data text-[11.5px] font-semibold">Q{q.number}</span>
                    <span
                      className={`text-[10px] uppercase tracking-[0.04em] ${
                        isSelected ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSelected ? 'bg-white' : tone.bar}`}
                      style={{ width: `${Math.min(100, q.score)}%` }}
                    />
                  </div>

                  <div
                    className={`mt-2 data text-[10.5px] flex items-center justify-between ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    <span>{q.responseTimeSec}s</span>
                    <span>exp {q.expectedTimeSec}s</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-200">
            {legend.map(item => (
              <span key={item.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-[3px] ${item.bar}`} />
                {item.label}
              </span>
            ))}
            <span className="text-[11.5px] text-slate-400 ml-auto">
              Select a question to inspect its telemetry
            </span>
          </div>
        </div>

        {/* Selected question detail */}
        <div className="lg:col-span-5">
          {selectedItem ? (
            <div className="panel-inset bg-white space-y-3.5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="data text-[13px] font-semibold text-slate-900">
                    Question {selectedItem.number}
                  </span>
                  <span className="rounded-[3px] border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.04em] text-slate-500">
                    {selectedItem.difficulty}
                  </span>
                </div>
                <RiskBadge level={selectedItem.level} score={selectedItem.score} />
              </div>

              <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3">
                {selectedItem.prompt}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200">
                {[
                  { label: 'Response time', value: `${selectedItem.responseTimeSec}s` },
                  { label: 'Expected time', value: `${selectedItem.expectedTimeSec}s` },
                  {
                    label: 'Answer revisions',
                    value: `${selectedItem.answerChanges} change${
                      selectedItem.answerChanges === 1 ? '' : 's'
                    }`,
                  },
                  {
                    label: 'Completion state',
                    value: selectedItem.isAnswered ? 'Submitted' : 'Pending',
                  },
                ].map(stat => (
                  <div key={stat.label} className="panel-inset bg-slate-50 px-3 py-2.5">
                    <span className="eyebrow">{stat.label}</span>
                    <div className="data text-[13.5px] font-semibold text-slate-900 mt-1">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {selectedItem.flags && selectedItem.flags.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="eyebrow">Observed behavioral flags</span>
                  <ul className="space-y-1.5">
                    {selectedItem.flags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[12.5px] text-slate-700">
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-[13px] text-slate-500">
              Select a question to view its telemetry.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
