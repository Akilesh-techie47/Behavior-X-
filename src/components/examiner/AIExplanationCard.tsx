import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ExamSession } from '../../types';
import { ExplanationResponse } from '../../services/ai/types';
import { fetchExplanation } from '../../services/ai/client';

interface AIExplanationCardProps {
  session: ExamSession;
  className?: string;
}

export const AIExplanationCard: React.FC<AIExplanationCardProps> = ({ session, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);

  const loadExplanation = async () => {
    setLoading(true);
    try {
      const sanitizedEvents = (session.events || []).map(e => ({
        type: e.type,
        category: e.category,
        durationSeconds: e.durationSeconds || (e.duration ? e.duration / 1000 : 1),
        timestampSeconds: Math.round(e.timestamp / 1000),
      }));

      const res = await fetchExplanation({
        sessionDurationMinutes: session.settings.totalDurationMinutes || 45,
        riskScore: session.riskState.currentScore,
        riskLevel: String(session.riskState.level).toUpperCase(),
        events: sanitizedEvents,
        primaryContributingFactor: session.riskState.humanReadableExplanation,
      });
      setExplanation(res);
    } catch {
      // client handles fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExplanation();
  }, [session.id, session.riskState.currentScore, session.events.length]);

  return (
    <Card
      title="AI Summary & Review Assistant"
      subtitle="Easy-to-read explanation of student activity during the test"
      badge={
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium text-indigo-900 dark:text-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{explanation?.source === 'gemini' ? 'Gemini AI Assistant' : 'Instant Offline Summary'}</span>
        </div>
      }
      className={className}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={loadExplanation}
          disabled={loading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          {loading ? 'Thinking...' : 'Refresh Summary'}
        </Button>
      }
    >
      <div className="space-y-4 text-xs leading-relaxed">
        {/* Core Narrative Summary */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Overall Exam Summary</span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal text-sm">
            {explanation?.sessionSummary || 'Creating plain English summary...'}
          </p>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">What caused this:</strong> {explanation?.contributingSignalsExplanation}
          </div>
        </div>

        {/* Observable Patterns & Review Advice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Strongest Patterns */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-2">
            <h5 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Main Things We Noticed</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
              {explanation?.strongestObservablePatterns?.map((pat, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                  <span>{pat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Suggested Review Points */}
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/30 space-y-2">
            <h5 className="font-bold text-amber-950 dark:text-amber-200 text-xs flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Recommended Next Steps for Teacher</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
              {explanation?.suggestedReviewPoints?.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ethical Uncertainty Disclaimer Banner */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 dark:text-white">Fairness & Privacy Promise:</strong>{' '}
            {explanation?.uncertaintyDisclaimer}
          </div>
        </div>
      </div>
    </Card>
  );
};
