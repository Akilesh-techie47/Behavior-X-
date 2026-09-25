import React from 'react';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
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

  const getAlertConfig = () => {
    switch (normLevel) {
      case 'REVIEW':
      case 'HIGH':
        return {
          bg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
          title: 'REVIEW SIGNAL (ELEVATED ANOMALY)',
          badgeText: 'ACTION REQUIRED: REVIEW SESSION',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 border-rose-300',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
          title: 'REVIEW SIGNAL (MODERATE ATTENTION DEVIATION)',
          badgeText: 'RECOMMENDED: MONITOR PATTERN',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        };
      case 'LOW':
        return {
          bg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
          title: 'LOW DEVIATION OBSERVED',
          badgeText: 'ROUTINE OBSERVATION',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300',
          icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        };
      case 'NORMAL':
      default:
        return {
          bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
          title: 'NOMINAL SIGNAL TRAJECTORY',
          badgeText: 'NOMINAL BASELINE',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
    }
  };

  const config = getAlertConfig();

  return (
    <div className={`p-5 rounded-2xl border ${config.bg} shadow-xs space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-2xs border border-black/5">
            {config.icon}
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {config.title}
            </h4>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
              <span>Risk Level: <strong>{normLevel}</strong></span>
              <span>•</span>
              <span>Anomaly Index: <strong>{riskState.currentScore}/100</strong></span>
              <span>•</span>
              <span>Confidence: <strong>{Math.round((riskState.confidence || 0.85) * 100)}%</strong></span>
            </div>
          </div>
        </div>

        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border ${config.badgeClass}`}>
          {config.badgeText}
        </span>
      </div>

      {/* WHY Section */}
      <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
        <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Why was this review state triggered?
        </div>
        <p className="leading-relaxed text-slate-600 dark:text-slate-300">
          {riskState.humanReadableExplanation ||
            'Observable behavioral signals within the sliding temporal window require examiner verification.'}
        </p>

        {/* Contributing signals checklist */}
        {riskState.contributingSignalSummary && (
          <ul className="pt-1.5 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
            {riskState.contributingSignalSummary.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action footer */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-black/5 dark:border-white/5">
        <span className="text-[11px] text-slate-400 italic">
          Reminder: Alerts represent signals requiring human review, not proof of guilt.
        </span>
        {onOpenSessionDetail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSessionDetail}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Review Evidence Log
          </Button>
        )}
      </div>
    </div>
  );
};
