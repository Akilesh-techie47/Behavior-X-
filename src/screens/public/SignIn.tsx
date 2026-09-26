import { useState } from 'react';
import { useNavigate } from '../../router';
import { Link } from '../../router';import { Button } from '../../components/primitives/Button';
import { Field, TextInput } from '../../components/primitives/Form';
import { Section } from '../../components/layout/Page';
import { Wordmark } from '../../components/brand/Wordmark';

/**
 * Sign in.
 *
 * Two doors, because a candidate and an examiner are not the same kind of
 * user and conflating them is how console permissions end up wrong. In the
 * demonstration build both are open, because there is nothing to protect.
 */
export function SignIn() {
  const [role, setRole] = useState<'examiner' | 'candidate'>('examiner');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (role === 'candidate') {
      navigate('/student');
      return;
    }
    if (identifier.trim().length === 0) {
      setError('Enter your examiner identifier.');
      return;
    }
    setError(null);
    navigate('/examinations');
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-neutral-900 text-neutral-300 p-10">
        <Wordmark size="lg" />
        <div className="max-w-[42ch]">
          <p className="text-[22px] leading-[1.3] font-medium text-white tracking-[-0.01em]">
            Don't judge the student. Understand the evidence.
          </p>
          <p className="mt-5 text-[13.5px] leading-relaxed text-neutral-400">
            The console is a place to read records carefully. Everything it shows is
            traceable to a signal, a source condition, and a policy clause.
          </p>
        </div>
        <p className="text-[11.5px] text-neutral-500">
          Demonstration build · BUILD 0.9.0-DEMO
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden mb-8">
            <Wordmark size="lg" />
          </div>

          <Section title="Sign in">
            <div
              role="radiogroup"
              aria-label="Choose your role"
              className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-[3px] mb-5"
            >
              {(['examiner', 'candidate'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={role === option}
                  onClick={() => {
                    setRole(option);
                    setError(null);
                  }}
                  className={`h-8 rounded-[2px] text-[12.5px] font-medium transition-colors ${
                    role === option
                      ? 'bg-white text-neutral-900 border border-neutral-200'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {option === 'examiner' ? 'Examiner' : 'Candidate'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} noValidate>
              {role === 'examiner' ? (
                <Field
                  label="Examiner identifier"
                  required
                  error={error}
                  hint="Any identifier is accepted in the demonstration build."
                >
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="EX-2291"
                      autoComplete="username"
                    />
                  )}
                </Field>
              ) : (
                <Field
                  label="You have an exam code"
                  hint="Candidates join with the code issued by your institution."
                >
                  {({ id, describedBy }) => (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      placeholder="DSA-4X7Q"
                      className="data"
                    />
                  )}
                </Field>
              )}

              <Button type="submit" variant="primary" block className="mt-5">
                {role === 'examiner' ? 'Open console' : 'Continue to exam check'}
              </Button>
            </form>
          </Section>

          <div className="mt-8 pt-6 border-t border-neutral-200 space-y-2">
            <Link
              to="/student"
              className="block text-[12.5px] text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Candidate examination interface →
            </Link>
            <Link
              to="/mobile"
              className="block text-[12.5px] text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Companion device pairing →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
