import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
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
      title="AI Explanation & Examiner Assistant"
      subtitle="Generative AI synthesis converting mathematical telemetry into objective, non-accusatory evidence summary"
      badge={
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-mono font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>{explanation?.source === 'gemini' ? 'GEMINI 3.8 FLASH' : 'DETERMINISTIC FALLBACK ENGINE'}</span>
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
          {loading ? 'Synthesizing...' : 'Re-Evaluate AI'}
        </Button>
      }
    >
      <div className="space-y-4 text-xs leading-relaxed">
        {/* Core Narrative Summary */}
        <div className="p-4 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-black dark:text-white font-bold text-xs uppercase tracking-wider font-mono">
            <Bot className="w-4 h-4" />
            <span>Structured Telemetry Synthesis</span>
          </div>
          <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal text-sm">
            {explanation?.sessionSummary || 'Synthesizing objective examination summary...'}
          </p>
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
            <strong className="text-black dark:text-white font-mono">Observable Contributors:</strong> {explanation?.contributingSignalsExplanation}
          </div>
        </div>

        {/* Observable Patterns & Review Advice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Left: Strongest Patterns */}
          <div className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-2">
            <h5 className="font-bold text-black dark:text-white text-xs flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Correlated Behavioral Patterns</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              {explanation?.strongestObservablePatterns?.map((pat, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-black dark:text-white font-bold">•</span>
                  <span>{pat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Suggested Review Points */}
          <div className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-2">
            <h5 className="font-bold text-black dark:text-white text-xs flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Info className="w-3.5 h-3.5" />
              <span>Examiner Investigation Recommendations</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              {explanation?.suggestedReviewPoints?.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-black dark:text-white font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ethical Uncertainty Disclaimer Banner */}
        <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5 border border-neutral-200 dark:border-neutral-800">
          <ShieldCheck className="w-4 h-4 text-black dark:text-white flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-black dark:text-white font-mono uppercase text-[10px] block">
              Ethical Mandate: Non-Accusatory Telemetry
            </strong>
            {explanation?.uncertaintyDisclaimer}
          </div>
        </div>
      </div>
    </Card>
  );
};
