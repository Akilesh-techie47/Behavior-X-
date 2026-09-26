import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { useNavigate } from '../../router';
import { Section } from '../../components/layout/Page';
import { Button } from '../../components/primitives/Button';
import { Checkbox } from '../../components/primitives/Form';
import { Wordmark } from '../../components/brand/Wordmark';
import { services } from '../../services';
import type { CheckPlanItem } from '../../services';
import type { CheckState, EnvironmentCheck, PermissionState } from '../../domain/types';
import { useAsync } from '../../hooks';

/**
 * The pre-examination device check.
 *
 * The screen a candidate actually gets stuck on, so it is built around one
 * question per row and one action per failing row. No aggregated verdict, no
 * percentage, no red. A row is either satisfied, degraded with a stated
 * consequence, or blocked with a remedy the candidate can perform themselves.
 *
 * Permission requests happen here and nowhere else: the candidate is never
 * surprised by a prompt in the middle of an examination.
 */

type PlanItem = CheckPlanItem;

export function DeviceCheck() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<EnvironmentCheck[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // `checkPlan` is synchronous in the contract, but wrapped so the screen does
  // not care whether a real implementation resolves it over a network.
  const plan = useAsync(async () => services.devices.checkPlan(), []);
  const permissions = useAsync(() => services.devices.permissionStates(), []);

  const runCheck = useCallback(
    async (item: PlanItem) => {
      setRunning(item.id);
      try {
        const result = await item.run();
        setChecks(prev => {
          const rest = prev.filter(c => c.id !== result.id);
          const merged = [...rest, result];
          const order = plan.data ?? [];
          return merged.sort(
            (a, b) =>
              order.findIndex(p => p.id === a.id) - order.findIndex(p => p.id === b.id),
          );
        });
        return result;
      } finally {
        setRunning(null);
      }
    },
    [plan.data],
  );

  // Run every check once on arrival, so the candidate sees the whole picture
  // rather than a list they have to work through themselves.
  useEffect(() => {
    if (!plan.data) return;
    let cancelled = false;
    (async () => {
      for (const item of plan.data!) {
        if (cancelled) return;
        await runCheck(item);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.data]);

  const requestPermission = async (name: PermissionState['name']) => {
    const updated = await services.devices.requestPermission(name);
    permissions.mutate(prev => prev.map(p => (p.name === name ? updated : p)));
  };

  const blocked = checks.filter(c => c.state === 'failed');
  const warned = checks.filter(c => c.state === 'warned');
  const pendingChecks = checks.length < (plan.data?.length ?? 0);
  const ready = checks.length > 0 && blocked.length === 0 && !pendingChecks;

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-[720px] px-6 h-14 flex items-center justify-between">
          <Wordmark size="sm" />
          <span className="eyebrow">Step 1 of 3 · Device check</span>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-10">
        <Section
          title="Check your setup"
          description="We check these before your examination starts, so nothing interrupts you while you are working. Each row tells you what was found and what it means."
        >
          {plan.status === 'loading' && (
            <div className="panel">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-4 py-3.5 border-b border-neutral-100 last:border-0 flex items-center gap-3">
                  <div className="w-4 h-4 border border-neutral-200 rounded-[2px]" />
                  <div className="flex-1">
                    <div className="h-2.5 w-32 bg-neutral-200/70 rounded-[2px]" />
                    <div className="h-2 w-48 mt-2 bg-neutral-100 rounded-[2px]" />
                  </div>
                </div>
              ))}
              <p className="sr-only" role="status">Checking your devices</p>
            </div>
          )}

          {plan.error && (
            <div className="panel">
              <ErrorRetry message={plan.error.message} onRetry={plan.reload} />
            </div>
          )}

          {plan.data && (
            <div className="panel">
              <ul className="divide-y divide-neutral-100">
                {plan.data.map(item => {
                  const result = checks.find(c => c.id === item.id);
                  const state: CheckState | 'running' =
                    running === item.id ? 'running' : result?.state ?? 'pending';
                  return (
                    <li key={item.id} className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <StateMark state={state} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <span className="text-[13.5px] font-medium text-neutral-900">
                              {item.label}
                            </span>
                            {(state === 'failed' || state === 'warned') && result && (
                              <Button
                                size="xs"
                                variant="outline"
                                icon={<RefreshCw className="w-3 h-3" />}
                                loading={running === item.id}
                                onClick={() => runCheck(item)}
                              >
                                Retry
                              </Button>
                            )}
                          </div>

                          <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                            {state === 'running'
                              ? 'Checking…'
                              : state === 'pending'
                                ? 'Not checked yet.'
                                : (result?.summary ?? '')}
                          </p>

                          {result?.measurement && (
                            <p className="data mt-1 text-[11.5px] text-neutral-500">
                              {result.measurement}
                            </p>
                          )}

                          {result?.remedy && (state === 'failed' || state === 'warned') && (
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-900">
                              {result.remedy}
                            </p>
                          )}

                          {state === 'pending' && (
                            <p className="mt-1 text-[11.5px] text-neutral-400">
                              Requires {item.requirement}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Section>

        {permissions.data && permissions.data.length > 0 && (
          <Section
            title="What this asks your browser for"
            description="Each permission below is requested only if your examination needs it, and only on this screen."
            className="mt-10"
          >
            <div className="panel divide-y divide-neutral-100">
              {permissions.data.map(permission => (
                <div key={permission.name} className="px-4 py-3.5 flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-neutral-900">
                        {permission.label}
                      </span>
                      {permission.required ? (
                        <span className="eyebrow text-neutral-400">Required</span>
                      ) : (
                        <span className="eyebrow text-neutral-300">Optional</span>
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                      {permission.purpose}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
                      {permission.handling}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`eyebrow ${
                        permission.status === 'granted'
                          ? 'text-neutral-900'
                          : permission.status === 'denied'
                            ? 'text-neutral-700'
                            : 'text-neutral-400'
                      }`}
                    >
                      {permission.status}
                    </span>
                    {permission.status !== 'granted' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => requestPermission(permission.name)}
                      >
                        Allow
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section className="mt-10">
          <div className="panel p-4">
            <Checkbox
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              label="My setup is ready and I understand how this examination is observed."
              description="The next screen explains this in full before you agree to anything."
            />
          </div>

          {attempted && !ready && (
            <p className="mt-3 text-[12.5px] text-neutral-900" role="alert">
              {pendingChecks
                ? 'Still running the remaining checks.'
                : blocked.length > 0
                  ? `${blocked.length} ${blocked.length === 1 ? 'check is' : 'checks are'} still blocked. Retry ${blocked.length === 1 ? 'it' : 'them'}, or continue if you have been told it is acceptable.`
                  : 'Please confirm the statement above to continue.'}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setAttempted(true);
                if (ready && agreed) navigate('/student/agreement');
              }}
            >
              Continue
            </Button>
            {warned.length > 0 && (
              <span className="text-[12px] text-neutral-500">
                {warned.length} {warned.length === 1 ? 'check is' : 'checks are'} degraded. You
                can continue — this will be recorded with its consequence.
              </span>
            )}
          </div>
        </Section>
      </main>
    </div>
  );
}

function StateMark({ state }: { state: CheckState | 'running' }) {
  if (state === 'passed') {
    return (
      <span className="w-4 h-4 border border-neutral-900 rounded-[2px] grid place-items-center shrink-0 mt-0.5">
        <Check className="w-2.5 h-2.5 text-neutral-900" aria-hidden="true" />
      </span>
    );
  }
  if (state === 'failed') {
    return (
      <span className="w-4 h-4 border-2 border-neutral-900 rounded-[2px] grid place-items-center shrink-0 mt-0.5">
        <span className="verbatim text-[9px] leading-none">✕</span>
      </span>
    );
  }
  if (state === 'warned') {
    return (
      <span className="w-4 h-4 border border-neutral-500 rounded-[2px] grid place-items-center shrink-0 mt-0.5">
        <span className="verbatim text-[9px] leading-none">!</span>
      </span>
    );
  }
  if (state === 'unavailable') {
    return (
      <span className="w-4 h-4 border border-neutral-300 rounded-[2px] grid place-items-center shrink-0 mt-0.5">
        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-[1px]" />
      </span>
    );
  }
  return (
    <span className="w-4 h-4 border border-neutral-200 rounded-[2px] shrink-0 mt-0.5">
      {state === 'running' && (
        <span className="block w-1.5 h-1.5 m-auto mt-1 bg-neutral-400 rounded-[1px] animate-pulse" />
      )}
    </span>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-4">
      <p className="text-[13px] font-semibold">Could not run the device check</p>
      <p className="mt-1 text-[12.5px] text-neutral-600">{message}</p>
      <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
