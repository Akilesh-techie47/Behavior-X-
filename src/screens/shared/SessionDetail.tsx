import { Link } from '../../router';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { Pipeline } from '../../components/brand/Wordmark';
import { CandidateContext } from '../../components/examiner/CandidateContext';
import { formatDuration, formatRelative } from '../../domain/format';

const STAGES = ['Observe', 'Contextualize', 'Correlate', 'Filter', 'Explain', 'Review'] as const;

/**
 * Shared session detail view — simplified read-only version.
 */
export function SessionDetail({ sessionId }: { sessionId: string }) {
  const session = useAsync(() => services.sessions.get(sessionId), [sessionId]);

  if (session.status === 'loading') {
    return (
      <div className="p-4 lg:p-6" role="status">
        <div className="text-[13px] text-neutral-500">Loading session…</div>
      </div>
    );
  }

  if (session.error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-[14px] font-semibold text-neutral-900">Could not load session</div>
        <div className="mt-1 text-[12.5px] text-neutral-600">{session.error.message}</div>
        <button className="mt-3 inline-flex items-center h-8 px-3 rounded-[3px] border border-neutral-300 bg-white text-neutral-700 text-[12.5px] font-medium" onClick={session.reload}>
          Try again
        </button>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-[14px] font-semibold text-neutral-900">Session not found</div>
        <div className="mt-1 text-[12.5px] text-neutral-600">
          No session with identifier "{sessionId}" was found.
        </div>
        <Link to="/examinations" className="mt-3 inline-block">
          <button className="inline-flex items-center h-8 px-3 rounded-[3px] bg-neutral-900 text-white text-[12.5px] font-medium">
            Return to session list
          </button>
        </Link>
      </div>
    );
  }

  const s = session.data;

  return (
    <div className="h-full flex flex-col">
      {/* Stage pipeline */}
      <div className="border-b border-neutral-200 bg-white px-4 py-3 sticky top-0 z-10">
        <Pipeline
          steps={STAGES}
          activeIndex={0}
          className="max-w-[1400px] mx-auto"
          orientation="horizontal"
        />
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6 max-w-[1400px] mx-auto">
        {/* Candidate context header */}
        <CandidateContext record={s} />

        {/* Session overview */}
        <div className="mt-6 grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <div className="panel p-6">
              <h3 className="text-[14px] font-semibold mb-4">Session overview</h3>
              <dl className="space-y-3 text-[12.5px]">
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Session</dt>
                  <dd className="text-neutral-900 font-medium data">{s.id}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Examination</dt>
                  <dd className="text-neutral-900">{s.examTitle} <span className="data text-[11px] text-neutral-400 ml-1.5">({s.examCode})</span></dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Candidate</dt>
                  <dd className="text-neutral-900">{s.candidate.name} <span className="data text-[11px] text-neutral-400 ml-1.5">({s.candidate.registrationId})</span></dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Status</dt>
                  <dd className="text-neutral-900 font-medium capitalize">{s.status}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Review status</dt>
                  <dd className="text-neutral-900 font-medium">{s.reviewStatus.replace('_', ' ')}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Elapsed</dt>
                  <dd className="text-neutral-900">{formatDuration(s.elapsedSeconds)} / {formatDuration(s.totalSeconds)}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Coverage</dt>
                  <dd className="text-neutral-900 font-medium">{s.observationCoverage}%</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Observation quality</dt>
                  <dd className="text-neutral-900 font-medium">{s.observationQuality}%</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Evidence quality</dt>
                  <dd className="text-neutral-900 font-medium">{s.evidenceQuality}%</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Signals recorded</dt>
                  <dd className="text-neutral-900 font-medium">{s.signalCount}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Correlated bundles</dt>
                  <dd className="text-neutral-900 font-medium">{s.bundles.length}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Suppressed observations</dt>
                  <dd className="text-neutral-900 font-medium">{s.suppressedCount}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <dt className="text-neutral-500">Escalated bundles</dt>
                  <dd className="text-neutral-900 font-medium">{s.escalatedCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Decisions recorded</dt>
                  <dd className="text-neutral-900 font-medium">{s.decisions.length}</dd>
                </div>
              </dl>
            </div>

            {s.bundles.length > 0 && (
              <div className="panel p-6">
                <h3 className="text-[14px] font-semibold mb-4">Correlated bundles</h3>
                <ul className="space-y-2">
                  {s.bundles.map(bundle => (
                    <li key={bundle.id} className="px-3 py-2 bg-neutral-50 rounded-[3px] border border-neutral-100">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="data text-[11px] text-neutral-400 w-16 shrink-0">
                          {bundle.windowStart.toFixed(1)}s
                        </span>
                        <span className="text-[12.5px] font-medium text-neutral-900">{bundle.title}</span>
                        <span className="text-[11px] text-neutral-500 px-2 py-0.5 rounded-[2px] bg-neutral-100">
                          {bundle.disposition}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-neutral-600">{bundle.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {s.suppressed.length > 0 && (
              <div className="panel p-6">
                <h3 className="text-[14px] font-semibold mb-4">Suppressed observations</h3>
                <ul className="space-y-2">
                  {s.suppressed.map(obs => (
                    <li key={obs.id} className="px-3 py-2 bg-neutral-50 rounded-[3px] border border-neutral-100">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="data text-[11px] text-neutral-400 w-16 shrink-0">
                          {obs.offsetSeconds.toFixed(1)}s
                        </span>
                        <span className="text-[12.5px] font-medium text-neutral-900">{obs.label}</span>
                        <span className="text-[11px] text-neutral-500 px-2 py-0.5 rounded-[2px] bg-neutral-100">
                          Suppressed
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-neutral-600">{obs.reason}</p>
                      <p className="mt-1 text-[11px] text-neutral-500">Baseline: {obs.baseline}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {s.decisions.length > 0 && (
              <div className="panel p-6">
                <h3 className="text-[14px] font-semibold mb-4">Review history</h3>
                <ul className="space-y-3">
                  {s.decisions.map(d => (
                    <li key={d.id} className="border-l-2 border-neutral-300 pl-4 py-2">
                      <div className="flex items-baseline gap-2 text-[12px]">
                        <span className="font-medium text-neutral-900">{d.decision}</span>
                        <span className="text-neutral-500">{d.examinerName}</span>
                        <span className="text-neutral-400">{formatRelative(d.recordedAt)}</span>
                      </div>
                      <p className="mt-1 text-[12px] text-neutral-600">{d.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}