import { useState } from 'react';
import { Send } from 'lucide-react';
import type { BriefingSection, BriefingSectionKey } from '../../domain/types';
import { Panel, PanelBody, PanelHeader } from '../layout/Panel';
import { Button } from '../primitives/Button';
import { TextArea } from '../primitives/Form';
import { Banner } from '../feedback/Banner';
import { SimulatedMark } from '../feedback/StateBlock';
import { ErrorBlock, LoadingBlock } from '../feedback/StateBlock';
import { useAction, useAsync } from '../../hooks';
import { services } from '../../services';
import { formatWallClock } from '../../domain/format';

/**
 * Explain.
 *
 * The most dangerous surface in the product, because a fluent paragraph is
 * persuasive in a way a table is not. Three rules govern everything here:
 *
 *  1. It states what the record shows and what it does not, in that order, and
 *     never asserts an intention.
 *  2. Every claim is traceable — the sections cite the signal ids they rest on.
 *  3. The generated text is marked as generated, permanently, at the top of
 *     the panel rather than in a footnote.
 *
 * The questions it offers are diagnostic, not accusatory, and none of them
 * asks the model to characterise the candidate.
 */

const SECTION_ORDER: BriefingSectionKey[] = [
  'observed',
  'context',
  'correlated',
  'evidence',
  'alternative',
  'suggestion',
];

export function BriefingPanel({
  sessionId,
  signalId,
  onAskSignal,
}: {
  sessionId: string;
  signalId: string | null;
  onAskSignal: (signalId: string) => void;
}) {
  const briefing = useAsync(() => services.ai.ask(sessionId, ''), [sessionId]);
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<{ question: string; at: string }[]>([]);

  const ask = useAction(async (text: string, targetSignalId?: string) => {
    const result = await services.ai.ask(sessionId, text, targetSignalId);
    briefing.mutate(() => result);
    setAsked(prev => [...prev, { question: text, at: result.generatedAt }]);
    return result;
  });

  const suggestions = useAsync(() => services.ai.suggestions(sessionId), [sessionId]);

  const submit = () => {
    const text = question.trim();
    if (text.length === 0) return;
    setQuestion('');
    ask.run(text, signalId ?? undefined);
  };

  return (
    <Panel as="aside" className="sticky top-[72px]">
      <PanelHeader
        title="Examiner briefing"
        description="Generated from the record. It summarises; it does not decide."
        actions={<SimulatedMark label="Generated" />}
      />

      <div className="px-4 py-2.5 border-b border-neutral-200 bg-neutral-50">
        <p className="text-[11.5px] leading-relaxed text-neutral-600">
          {briefing.data?.standing ??
            'This text is produced by a model from the signals, coverage, and policy clauses below it. It can be wrong. Every claim it makes is listed with the records it rests on, so you can check each one.'}
        </p>
      </div>

      {briefing.status === 'loading' && <LoadingBlock rows={6} label="Preparing briefing" />}

      {briefing.error && briefing.data === null && (
        <ErrorBlock
          kind={briefing.error.kind}
          message={briefing.error.message}
          onRetry={briefing.reload}
        />
      )}

      {briefing.data && (
        <>
          {briefing.error && (
            <div className="px-4 pt-3">
              <Banner tone="material" label="Stale">
                {briefing.error.message} Showing the last briefing that loaded.
              </Banner>
            </div>
          )}

          <PanelBody dense className="space-y-4">
            {briefing.data.confidenceCaveat && (
              <p className="text-[11.5px] leading-relaxed text-neutral-500 border-l-2 border-neutral-200 pl-3">
                {briefing.data.confidenceCaveat}
              </p>
            )}
            {SECTION_ORDER.map(key => {
              const section = briefing.data!.sections.find(s => s.key === key);
              if (!section) return null;
              return (
                <BriefingSectionBlock
                  key={key}
                  section={section}
                  onAskSignal={onAskSignal}
                />
              );
            })}
          </PanelBody>

          <div className="px-4 py-2.5 border-y border-neutral-200 bg-neutral-50 flex flex-wrap items-center gap-2">
            <span className="eyebrow">Generated</span>
            <span className="data text-[11px] text-neutral-500">
              {formatWallClock(briefing.data.generatedAt)} · {briefing.data.model}
            </span>
          </div>
        </>
      )}

      {suggestions.data && suggestions.data.length > 0 && (
        <div className="px-4 py-3 border-b border-neutral-200">
          <div className="eyebrow mb-2">Ask about this session</div>
          <ul className="space-y-1.5">
            {suggestions.data.map(suggestion => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onClick={() => ask.run(suggestion.prompt, signalId ?? undefined)}
                  disabled={ask.pending}
                  className="text-left text-[12px] text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50 flex items-start gap-1.5"
                >
                  <span className="text-neutral-300" aria-hidden="true">
                    ↳
                  </span>
                  <span>{suggestion.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-3">
        {signalId && (
          <p className="mb-2 text-[11.5px] text-neutral-500">
            Your question will be scoped to the selected observation.
          </p>
        )}
        <TextArea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask about coverage, a policy clause, or what a signal does not show…"
          aria-label="Ask about this session"
          className="min-h-[68px] text-[12.5px]"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="mt-2 flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<Send className="w-3 h-3" />}
            loading={ask.pending}
            onClick={submit}
          >
            Ask
          </Button>
          <span className="text-[11px] text-neutral-400">⌘↵</span>
          {ask.error && <span className="text-[11.5px] text-neutral-900">{ask.error}</span>}
        </div>

        {asked.length > 0 && (
          <ul className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
            {asked.map((entry, index) => (
              <li key={index} className="text-[11.5px] text-neutral-500 leading-relaxed">
                <span className="data text-neutral-400">{formatWallClock(entry.at)}</span>{' '}
                {entry.question}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function BriefingSectionBlock({
  section,
  onAskSignal,
}: {
  section: BriefingSection;
  onAskSignal: (signalId: string) => void;
}) {
  return (
    <section>
      <h4 className="eyebrow mb-1.5">{section.title}</h4>
      <p className="text-[12.5px] leading-relaxed text-neutral-700">{section.body}</p>

      {section.signalIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {section.signalIds.map(signalId => (
            <button
              key={signalId}
              type="button"
              onClick={() => onAskSignal(signalId)}
              className="data text-[10.5px] px-1.5 h-[18px] border border-neutral-200 rounded-[2px] text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
              title="Show this observation in the timeline"
            >
              {signalId}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
