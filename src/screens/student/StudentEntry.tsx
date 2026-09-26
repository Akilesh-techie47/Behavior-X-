import { useState } from 'react';
import { useNavigate } from '../../router';
import { Section } from '../../components/layout/Page';
import { Button } from '../../components/primitives/Button';
import { Field, TextInput } from '../../components/primitives/Form';
import { Wordmark } from '../../components/brand/Wordmark';
import { useAction } from '../../hooks';
import { services } from '../../services';
import { ErrorBlock } from '../../components/feedback/StateBlock';

/**
 * Joining an examination.
 *
 * The candidate is asked for two things and nothing else: the code, and the
 * name they want on their record. No email, no account, no password — an
 * examination is not a relationship, and the fewer identifiers a candidate has
 * to hand over before they start, the better.
 */
export function StudentEntry() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const lookup = useAction(async () => {
    const exams = await services.exam.listExams();
    const match = exams.find(
      exam => exam.code.toLowerCase() === code.trim().toLowerCase(),
    );
    return match ?? null;
  });

  const codeError =
    touched && code.trim().length < 4
      ? 'Enter the code issued by your institution.'
      : lookup.error;

  const proceed = () => {
    setTouched(true);
    if (code.trim().length < 4 || name.trim().length < 2) return;
    lookup.run().then(exam => {
      if (exam) navigate('/student/check');
    });
  };

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-[560px] px-6 h-14 flex items-center">
          <Wordmark size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-6 py-12">
        <Section
          title="Join your examination"
          description="Enter the code issued by your institution. The code is specific to one sitting."
        >
          <form
            onSubmit={event => {
              event.preventDefault();
              proceed();
            }}
            noValidate
            className="space-y-5"
          >
            <Field
              label="Exam code"
              required
              error={codeError}
              hint="Six to ten characters, for example DSA-4X7Q."
            >
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onBlur={() => setTouched(true)}
                  placeholder="DSA-4X7Q"
                  className="data text-[15px] tracking-[0.08em] h-11"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </Field>

            <Field
              label="Name for your record"
              required
              hint="This is the name that will appear on your examination record. It should match your registration."
            >
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="As registered"
                  autoComplete="name"
                />
              )}
            </Field>

            {lookup.error && (
              <ErrorBlock
                message={lookup.error}
                onRetry={() => {
                  lookup.clearError();
                  lookup.run();
                }}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              loading={lookup.pending}
            >
              Continue to device check
            </Button>
          </form>
        </Section>

        <section className="mt-10 pt-8 border-t border-neutral-200">
          <h2 className="eyebrow mb-3">Before you begin</h2>
          <ul className="space-y-2.5 text-[12.5px] leading-relaxed text-neutral-600">
            {[
              'You will check your camera, microphone, and connection before anything starts.',
              'You will be asked to agree to how your examination is observed, in plain language.',
              'Nothing you do during the examination is scored, ranked, or shown to you while you work.',
              'You can withdraw at any point, and doing so is recorded as a withdrawal, not a failure.',
            ].map(item => (
              <li key={item} className="flex gap-2.5">
                <span className="text-neutral-300 select-none" aria-hidden="true">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-[12px] text-neutral-400">
          Demonstration build. Use any code to continue.
        </p>
      </main>
    </div>
  );
}
