import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate, Link } from '../../router';
import { Section } from '../../components/layout/Page';
import { Button } from '../../components/primitives/Button';
import { Wordmark } from '../../components/brand/Wordmark';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { formatWallClock } from '../../domain/format';

/**
 * Confirmation after submission.
 *
 * The candidate is told exactly what was recorded and what happens next, and
 * then they are left alone. This is the last moment they are told anything, so
 * it is also the moment the product is most obliged to be precise: no "your
 * results will be available soon", no implication that anything was assessed.
 */
export function Submitted() {
  const navigate = useNavigate();
  const receipt = useAsync(
    () =>
      services.exam.submit({
        examId: 'EX-4417',
        answers: {},
        flagged: [],
        durationSeconds: 90 * 60,
      }),
    [],
  );
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (acknowledged) navigate('/student/status');
  }, [acknowledged, navigate]);

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-[620px] px-6 h-14 flex items-center">
          <Wordmark size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-[620px] px-6 py-12">
        <div className="w-9 h-9 border border-neutral-900 rounded-[3px] grid place-items-center mb-5">
          <Check className="w-4 h-4 text-neutral-900" aria-hidden="true" />
        </div>

        <Section title="Your examination has been submitted">
          <p className="text-[14px] leading-relaxed text-neutral-600 max-w-[60ch]">
            Your answers have been recorded. You may close this window. Submitting again
            will not create a second record.
          </p>
        </Section>

        {receipt.data && (
          <Section title="Receipt" className="mt-8">
            <dl className="panel divide-y divide-neutral-100">
              {[
                { label: 'Submission', value: receipt.data.submissionId, mono: true },
                { label: 'Exam code', value: receipt.data.examCode, mono: true },
                { label: 'Submitted at', value: formatWallClock(receipt.data.submittedAt) },
                {
                  label: 'Questions answered',
                  value: `${receipt.data.questionsAnswered} of ${receipt.data.questionsTotal}`,
                },
                { label: 'Flagged for your review', value: String(receipt.data.flaggedCount) },
              ].map(row => (
                <div key={row.label} className="px-4 py-2.5 flex items-baseline justify-between gap-4">
                  <dt className="text-[12.5px] text-neutral-500">{row.label}</dt>
                  <dd
                    className={`text-[12.5px] text-neutral-900 text-right ${
                      row.mono ? 'data' : ''
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11.5px] text-neutral-400 leading-relaxed">
              {receipt.data.handling} Review window: {receipt.data.reviewWindow}.
            </p>
          </Section>
        )}

        <Section title="What happens now" className="mt-8">
          <ol className="space-y-4">
            {[
              {
                title: 'Your record is closed for answering',
                body: 'Nothing further is collected from your devices. The observation record for your session is retained only for as long as your institution requires an appeal to remain possible.',
              },
              {
                title: 'Observations may be reviewed',
                body: 'If the observations of your session meet a policy threshold, an examiner reads the record. They see what was observed, the conditions it was observed under, and any policy clauses that apply. They make the decision.',
              },
              {
                title: 'You will be told if a decision was reached',
                body: 'And you may ask who made it, when, and the reasoning they recorded. If no review was required, that is also an answer, and you may ask for confirmation that your session was not escalated.',
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="data text-[11px] text-neutral-400 pt-0.5 shrink-0">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-[13.5px] font-medium text-neutral-900">{step.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-600 max-w-[60ch]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Confirm you have read this" className="mt-10">
          <label className="flex items-start gap-3 panel p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded-[2px] border-neutral-400 cursor-pointer"
            />
            <span className="text-[13px] text-neutral-800 leading-relaxed">
              I have read the above and understand that no assessment of my behaviour is
              shown to me now, and that I may request the record of my session.
            </span>
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to="/">
              <Button variant="primary" size="lg">
                Finish
              </Button>
            </Link>
            <Link to="/privacy">
              <Button variant="ghost">Data handling statement</Button>
            </Link>
          </div>
        </Section>

        {receipt.data && (
          <p className="mt-10 text-[11.5px] text-neutral-400">
            Demonstration build. Submission reference {receipt.data.submissionId} is synthetic.
          </p>
        )}
      </main>
    </div>
  );
}
