import { useState } from 'react';
import { useNavigate } from '../../router';
import { Section } from '../../components/layout/Page';
import { Button } from '../../components/primitives/Button';
import { Checkbox } from '../../components/primitives/Form';
import { Wordmark } from '../../components/brand/Wordmark';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { formatDuration } from '../../domain/format';

/**
 * Informed agreement.
 *
 * Written as a statement of what happens, not a list of clauses, and read
 * before the timer starts rather than after. Three commitments are stated
 * explicitly, because they are the ones a candidate would otherwise have to
 * take on trust: they will not be shown an assessment, the record can be asked
 * for, and the decision is a person's.
 */
export function Agreement() {
  const navigate = useNavigate();
  const [understood, setUnderstood] = useState<Record<string, boolean>>({
    observed: false,
    record: false,
    decision: false,
  });

  const exam = useAsync(() => services.exam.getExam('EX-4417'), []);
  const allAgreed = Object.values(understood).every(Boolean);

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-[720px] px-6 h-14 flex items-center justify-between">
          <Wordmark size="sm" />
          <span className="eyebrow">Step 2 of 3 · Agreement</span>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-10">
        <Section
          title="How this examination is observed"
          description={
            exam.data
              ? `${exam.data.title} · ${formatDuration(exam.data.durationMinutes * 60)} · ${exam.data.questionCount} questions`
              : 'Loading examination details'
          }
        >
          <div className="panel">
            <div className="p-5 border-b border-neutral-100">
              <h3 className="text-[13.5px] font-semibold">What is recorded</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600">
                Signals from your camera and microphone: for example, that you were not
                present at your screen for a period, that a second person entered the
                camera view, or that you moved away. Each is recorded with the time it
                happened and a measure of how sure the detector is. Each is, on its own,
                just an observation.
              </p>
            </div>

            <div className="p-5 border-b border-neutral-100">
              <h3 className="text-[13.5px] font-semibold">What is not recorded</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600">
                Your screen contents, your keystrokes individually, anything you do outside
                the examination window, and any image of your face once the review that
                required it has been closed. There is no keystroke logging and no remote
                control of your device.
              </p>
            </div>

            <div className="p-5 border-b border-neutral-100">
              <h3 className="text-[13.5px] font-semibold">What happens next</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600">
                If the observations of your examination meet a policy threshold, an
                examiner reviews them. They see the observations, the context, the
                coverage, and the policy clauses that apply — and they make a decision. A
                system does not make the decision, and it does not recommend one.
              </p>
            </div>

            <div className="p-5">
              <h3 className="text-[13.5px] font-semibold">Your rights</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600">
                You may ask what was recorded, including observations that were filtered
                out and the rule that filtered them. If a decision was reached, you may
                ask who made it, when, and why. If the record contains an error, you may
                ask for it to be corrected.
              </p>
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="mt-3 text-[12.5px] font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
              >
                Read the full data handling statement
              </button>
            </div>
          </div>
        </Section>

        <Section title="Your agreement" className="mt-10">
          <div className="panel p-4 space-y-4">
            <Checkbox
              checked={understood.observed}
              onChange={e => setUnderstood(prev => ({ ...prev, observed: e.target.checked }))}
              label="I understand that my camera and microphone are used to observe my examination, and what that means."
            />
            <Checkbox
              checked={understood.record}
              onChange={e => setUnderstood(prev => ({ ...prev, record: e.target.checked }))}
              label="I understand that a record of observations is kept, and that I may ask to see it."
            />
            <Checkbox
              checked={understood.decision}
              onChange={e => setUnderstood(prev => ({ ...prev, decision: e.target.checked }))}
              label="I understand that any decision about my examination is made by a person, and that I may ask for their reasoning."
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              disabled={!allAgreed}
              onClick={() => navigate('/student/exam')}
            >
              Agree and begin
            </Button>
            <Button variant="ghost" onClick={() => navigate('/student/check')}>
              Back to device check
            </Button>
          </div>

          {!allAgreed && (
            <p className="mt-3 text-[12px] text-neutral-500">
              All three statements must be acknowledged before you can begin.
            </p>
          )}

          <p className="mt-6 text-[12px] text-neutral-400">
            Your timer starts when you select “Agree and begin”, not before.
          </p>
        </Section>
      </main>
    </div>
  );
}
