import React from 'react';
import { AlertTriangle, Eye, ArrowRight, Check } from 'lucide-react';
import { RiskState } from '../../types';
import { Button } from '../common/Button';
import { RiskBadge } from '../common/StatusBadge';

interface ExplainableAlertPanelProps {
  riskState: RiskState;
  onOpenSessionDetail?: () => void;
  className?: string;
}

export const ExplainableAlertPanel: React.FC<ExplainableAlertPanelProps> = ({
  riskState,
  onOpenSessionDetail,
  className = '',
}) => {
  const normLevel = String(riskState.level).toUpperCase() as 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';

  const reviewPriority = riskState.reviewPriorityScore ?? riskState.currentScore;
  const evidenceQuality = riskState.evidenceQualityScore ?? 92;
  const observationQuality = riskState.observationQualityScore ?? 94;

  const isElevated = normLevel === 'REVIEW' || normLevel === 'HIGH';

  const gauges = [
    { label: 'Review priority', value: reviewPriority, note: 'Warrant for human examination review' },
    { label: 'Evidence quality', value: evidenceQuality, note: 'Multi-sensor corroboration reliability' },
    { label: 'Observation quality', value: observationQuality, note: 'Sensor health, lighting, API stability' },
  ];

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden ${
        isElevated ? 'border-amber-300' : 'border-slate-200'
      } ${className}`}
    >
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b ${
          isElevated ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/70 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`inline-grid place-items-center w-7 h-7 rounded-md shrink-0 ${
              isElevated ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isElevated ? <AlertTriangle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-[13.5px] font-semibold text-slate-900 leading-tight">
              {isElevated ? 'Integrity review priority triggered' : 'Nominal multimodal baseline'}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Sliding 30-second evaluation window with continuous decay
            </p>
          </div>
        </div>

        <RiskBadge level={riskState.level} score={riskState.currentScore} />
      </div>

      <div className="p-5 space-y-4">
        {/* Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-slate-200 rounded-md border border-slate-200">
          {gauges.map(gauge => (
            <div key={gauge.label} className="px-4 py-3.5">
              <span className="eyebrow">{gauge.label}</span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="data text-[22px] font-semibold leading-none text-slate-900">
                  {gauge.value}
                </span>
                <span className="data text-[11.5px] text-slate-400">/ 100</span>
              </div>
              <p className="text-[11.5px] text-slate-500 leading-snug mt-1.5">{gauge.note}</p>
            </div>
          ))}
        </div>

        {/* Rationale */}
        <div className="space-y-2.5">
          <span className="eyebrow">Why was this review priority assigned?</span>
          <p className="text-[13.5px] text-slate-700 leading-relaxed">
            {riskState.humanReadableExplanation ||
              'Observable behavioral signals within the sliding temporal window require academic examiner verification.'}
          </p>

          {riskState.contributingSignalSummary && (
            <ul className="flex flex-wrap gap-1.5 pt-0.5">
              {riskState.contributingSignalSummary.map((item, idx) => (
                <li
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11.5px] text-slate-700"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50/70">
        <span className="text-[11.5px] text-slate-500">
          Do not watch the student. Understand the evidence. The human examiner decides.
        </span>
        {onOpenSessionDetail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSessionDetail}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Inspect evidence graph
          </Button>
        )}
      </div>
    </div>
  );
};
