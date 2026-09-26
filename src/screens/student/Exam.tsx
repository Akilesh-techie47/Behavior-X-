import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '../../router';
import { Button } from '../../components/primitives/Button';
import { TextArea } from '../../components/primitives/Form';
import { Banner } from '../../components/feedback/Banner';
import { useAsync, useCountdown } from '../../hooks';
import { services } from '../../services';
import type { Answer, AnswerState, Question } from '../../domain/types';
import { formatDurationFine, formatWallClock } from '../../domain/format';

/**
 * The examination.
 *
 * This screen is the product's most important restraint. A candidate must not be
 * able to tell that they are being observed, because the moment they can, they
 * are performing rather than working. So: no counters that move on their own,
 * no quality indicators, no confirmation that a particular behaviour was
 * noticed. The only motion is the clock, and the only progress is their own.
 */

const DEMO_TOTAL_SECONDS = 90 * 60;

export function Exam() {
  const navigate = useNavigate();
  const exam = useAsync(() => services.exam.getExam('EX-4417'), []);
  const [startedAt] = useState(() => Date.now());
  const deadline = useMemo(() => startedAt + DEMO_TOTAL_SECONDS * 1000, [startedAt]);
  const remaining = useCountdown(deadline);

  const questions = exam.data?.questions ?? [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showNav, setShowNav] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const current = questions[index];
  const answeredCount = Object.values(answers).filter(a => a.state !== 'unanswered').length;
  const flaggedCount = Object.values(answers).filter(a => a.state === 'flagged').length;

  // Move focus to the question heading on change, so a keyboard or screen
  // reader user is not left at the bottom of the previous answer.
  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  const setAnswer = (value: string) => {
    if (!current) return;
    setAnswers(prev => {
      const existing = prev[current.id];
      const state: AnswerState = existing?.state === 'flagged' ? 'flagged' : 'answered';
      return {
        ...prev,
        [current.id]: {
          questionId: current.id,
          questionNumber: current.number,
          value,
          state,
          lastEditedAt: new Date().toISOString(),
          edits: (existing?.edits ?? 0) + (existing && existing.value !== value ? 1 : 0),
        },
      };
    });
  };

  const toggleFlag = (questionId: string) => {
    setAnswers(prev => {
      const existing = prev[questionId];
      if (!existing) return prev;
      return {
        ...prev,
        [questionId]: {
          ...existing,
          state: existing.state === 'flagged' ? 'answered' : 'flagged',
        },
      };
    });
  };

  const submit = () => {
    void services.exam
      .submit({
        examId: 'EX-4417',
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.value])),
        flagged: Object.entries(answers)
          .filter(([, v]) => v.state === 'flagged')
          .map(([k]) => k),
        durationSeconds: DEMO_TOTAL_SECONDS - remaining,
      })
      .then(() => navigate('/student/submitted'));
  };

  if (exam.status === 'loading') {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16" role="status">
        <p className="text-[13px] text-neutral-500">Preparing your examination…</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16">
        <p className="text-[13px] text-neutral-600">
          This examination could not be loaded. Check your connection and reload.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 sm:px-6 py-8">
      <div className="mx-auto max-w-[760px] px-5 sm:px-6 py-8">
        {index === 0 && (
          <Banner tone="context" label="Before you start" className="mb-6">
            Your answers are saved as you type. You can move between questions freely and
            return to any of them. Flag a question if you want to come back to it.
          </Banner>
        )}

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-5">
          <h1 className="text-[13px] font-medium text-neutral-500" ref={headingRef} tabIndex={-1}>
            Question {current.number} of {questions.length}
            {current.points > 0 && (
              <span className="text-neutral-400"> · {current.points} marks</span>
            )}
          </h1>
          <p className="text-[12px] text-neutral-500">
            {answeredCount} answered
            {flaggedCount > 0 && ` · ${flaggedCount} flagged`}
          </p>
        </div>

        <article className="panel p-5 sm:p-6">
          <h2 className="text-[17px] leading-relaxed font-medium tracking-[-0.01em]">
            {current.prompt}
          </h2>

          {current.kind === 'code' && current.starterCode && (
            <pre className="data mt-4 text-[12px] leading-relaxed text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-[3px] p-3 overflow-x-auto">
              {current.starterCode}
            </pre>
          )}

          <div className="mt-6">
            <AnswerInput question={current} value={answers[current.id]?.value ?? ''} onChange={setAnswer} />
          </div>

          {current.guidance && (
            <p className="mt-4 pt-4 border-t border-neutral-100 text-[12.5px] leading-relaxed text-neutral-500">
              {current.guidance}
            </p>
          )}
        </article>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {index > 0 && (
            <Button variant="outline" onClick={() => setIndex(i => i - 1)}>
              Previous
            </Button>
          )}
          {index < questions.length - 1 ? (
            <Button variant="primary" onClick={() => setIndex(i => i + 1)}>
              Next question
            </Button>
          ) : (
            <Button variant="primary" onClick={submit}>
              Submit examination
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => toggleFlag(current.id)}
            aria-pressed={answers[current.id]?.state === 'flagged'}
          >
            {answers[current.id]?.state === 'flagged' ? 'Unflag' : 'Flag for review'}
          </Button>

          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => setShowNav(v => !v)}
            aria-expanded={showNav}
            aria-controls="question-jump"
          >
            All questions
          </Button>
        </div>

        {showNav && (
          <nav id="question-jump" aria-label="All questions" className="panel mt-4 p-3">
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-1.5">
              {questions.map((question, position) => {
                const answer = answers[question.id];
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setIndex(position);
                        setShowNav(false);
                      }}
                      aria-current={position === index ? 'true' : undefined}
                      className={[
                        'w-full h-8 border rounded-[2px] text-[12px] data transition-colors',
                        position === index
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : answer?.state === 'flagged'
                            ? 'border-neutral-400 bg-neutral-100 text-neutral-900'
                            : answer
                              ? 'border-neutral-300 text-neutral-700'
                              : 'border-neutral-200 text-neutral-400 hover:border-neutral-400',
                      ].join(' ')}
                    >
                      {question.number}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-neutral-500">
              <span>· Answered</span>
              <span>· Flagged</span>
              <span>· Not answered</span>
            </div>
          </nav>
        )}

        <p className="mt-8 text-[11.5px] text-neutral-400">
          Started at {formatWallClock(new Date(startedAt).toISOString())}. Time remaining{' '}
          {formatDurationFine(remaining)}.
        </p>
      </div>
    </div>
  );
}

/** One input control per question kind, chosen by the question itself. */
function AnswerInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.kind === 'mcq') {
    return (
      <fieldset>
        <legend className="sr-only">Select one answer</legend>
        <div className="space-y-2">
          {question.options?.map(option => (
            <label
              key={option.id}
              className={`flex items-start gap-3 px-3.5 py-3 border rounded-[3px] cursor-pointer transition-colors ${
                value === option.id
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
                className="mt-0.5 w-3.5 h-3.5 shrink-0 cursor-pointer"
              />
              <span className="text-[13.5px] leading-relaxed text-neutral-900">
                {option.text}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (question.kind === 'numeric') {
    return (
      <div>
        <label htmlFor={`answer-${question.id}`} className="sr-only">
          Your answer
        </label>
        <input
          id={`answer-${question.id}`}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-40 h-11 px-3 border border-neutral-300 rounded-[3px] data text-[15px]"
        />
      </div>
    );
  }

  if (question.kind === 'code') {
    return (
      <div>
        <label htmlFor={`answer-${question.id}`} className="sr-only">
          Your code
        </label>
        <TextArea
          id={`answer-${question.id}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="data text-[13px] min-h-[220px] leading-relaxed"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={`answer-${question.id}`} className="sr-only">
        Your answer
      </label>
      <TextArea
        id={`answer-${question.id}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-h-[200px]"
      />
    </div>
  );
}


