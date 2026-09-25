import React from 'react';
import { AlertTriangle, Info, CheckCircle2, ShieldCheck, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { RiskState, RiskLevel } from '../../types';
import { Button } from '../common/Button';

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

  return (
    <div
      className={`p-5 rounded-lg border ${
        isElevated
          ? 'bg-neutral-950 text-white border-neutral-900 shadow-md ring-1 ring-neutral-800'
          : 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800 shadow-2xs'
      } space-y-4 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-black text-white dark:bg-white dark:text-black border border-neutral-700">
            {isElevated ? <AlertTriangle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-black dark:text-white font-mono">
              {isElevated ? 'INTEGRITY REVIEW PRIORITY TRIGGERED' : 'NOMINAL MULTIMODAL BASELINE'}
            </h4>
            <span className="text-[11px] font-mono text-neutral-500">
              Sliding 30-second temporal evaluation window with continuous decay
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-neutral-400 dark:border-neutral-700 uppercase">
          {normLevel} STATUS
        </span>
      </div>

      {/* THREE CORE SCORES GAUGES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
            1. Review Priority
          </span>
          <div className="text-xl font-bold text-black dark:text-white">
            {reviewPriority} <span className="text-xs text-neutral-400 font-normal">/ 100</span>
          </div>
          <span className="text-[10px] text-neutral-600 dark:text-neutral-400 block font-sans">
            Warrant for human examination review
          </span>
        </div>

        <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
            2. Evidence Quality
          </span>
          <div className="text-xl font-bold text-black dark:text-white">
            {evidenceQuality} <span className="text-xs text-neutral-400 font-normal">/ 100</span>
          </div>
          <span className="text-[10px] text-neutral-600 dark:text-neutral-400 block font-sans">
            Multi-sensor corroboration reliability
          </span>
        </div>

        <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
            3. Observation Quality
          </span>
          <div className="text-xl font-bold text-black dark:text-white">
            {observationQuality} <span className="text-xs text-neutral-400 font-normal">/ 100</span>
          </div>
          <span className="text-[10px] text-neutral-600 dark:text-neutral-400 block font-sans">
            Sensor health, lighting & API stability
          </span>
        </div>
      </div>

      {/* Observable Evidence Description */}
      <div className="space-y-1.5 text-xs">
        <div className="font-bold text-black dark:text-white uppercase tracking-wider text-[11px] font-mono">
          Why was this review priority assigned?
        </div>
        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          {riskState.humanReadableExplanation ||
            'Observable behavioral signals within the sliding temporal window require academic examiner verification.'}
        </p>

        {/* Contributing signals checklist */}
        {riskState.contributingSignalSummary && (
          <ul className="pt-1.5 space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400 pl-1 font-mono">
            {riskState.contributingSignalSummary.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action footer */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-neutral-200 dark:border-neutral-800">
        <span className="text-[11px] text-neutral-500 font-mono">
          Axiom: Do not watch the student. Understand the evidence. Human examiner decides.
        </span>
        {onOpenSessionDetail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSessionDetail}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Inspect Evidence Graph
          </Button>
        )}
      </div>
    </div>
  );
};
