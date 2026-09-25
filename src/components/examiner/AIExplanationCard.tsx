import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, ShieldCheck, RefreshCw, Info, Check } from 'lucide-react';
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
      title="AI explanation & examiner assistant"
      subtitle="Generative synthesis of mathematical telemetry into an objective, non-accusatory evidence summary"
      badge={
        <span className="data inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 whitespace-nowrap">
          <Sparkles className="w-3 h-3" />
          {explanation?.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Deterministic fallback'}
        </span>
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
          {loading ? 'Synthesizing' : 'Re-evaluate'}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Narrative summary */}
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-grid place-items-center w-6 h-6 rounded bg-slate-900 text-white shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </span>
            <span className="eyebrow text-slate-700">Structured telemetry synthesis</span>
          </div>
          <p className="text-[14px] text-slate-800 leading-relaxed">
            {explanation?.sessionSummary || 'Synthesizing objective examination summary…'}
          </p>
          <div className="pt-2.5 border-t border-slate-200 text-[12.5px] text-slate-600">
            <strong className="font-semibold text-slate-900">Observable contributors: </strong>
            {explanation?.contributingSignalsExplanation}
          </div>
        </div>

        {/* Patterns & review points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="panel-inset bg-white space-y-2.5">
            <span className="eyebrow inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Correlated behavioral patterns
            </span>
            <ul className="space-y-1.5">
              {explanation?.strongestObservablePatterns?.map((pat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12.5px] text-slate-700 leading-relaxed">
                  <span className="mt-[7px] w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                  <span>{pat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-inset bg-white space-y-2.5">
            <span className="eyebrow inline-flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-600" />
              Recommended investigation points
            </span>
            <ul className="space-y-1.5">
              {explanation?.suggestedReviewPoints?.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12.5px] text-slate-700 leading-relaxed">
                  <span className="mt-[7px] w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ethical mandate */}
        <div className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="eyebrow">Ethical mandate: non-accusatory telemetry</span>
            <p className="text-[12.5px] text-slate-600 leading-relaxed">
              {explanation?.uncertaintyDisclaimer}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
