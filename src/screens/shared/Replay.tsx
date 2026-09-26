import { useAsync } from '../../hooks';
import { services } from '../../services';

/**
 * Replay view — a simplified full-screen replay of a session.
 */
export function Replay({ sessionId }: { sessionId: string }) {
  const session = useAsync(() => services.sessions.get(sessionId), [sessionId]);

  if (session.status === 'loading') {
    return (
      <div className="p-4 lg:p-6" role="status">
        <div className="text-[13px] text-neutral-500">Loading replay…</div>
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
      </div>
    );
  }

  const s = session.data;

  return (
    <div className="h-dvh flex flex-col bg-neutral-50">
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <a href="#/examinations" className="inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900">
              ← Back to sessions
            </a>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-neutral-900 truncate">
                {s.examTitle} — Replay
              </div>
              <div className="text-[11px] text-neutral-500 truncate">
                Session {s.id} · {s.candidate.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-900">
              {s.totalSeconds}s
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto max-w-[1400px] mx-auto p-4 lg:p-6">
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="panel p-4 max-h-[500px] overflow-y-auto">
            <h3 className="text-[14px] font-semibold mb-4">Signal timeline</h3>
            <ul className="space-y-2">
              {s.signals.slice(0, 100).map(signal => (
                <li key={signal.id} className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-[3px] border border-neutral-100">
                  <span className="data text-[11px] text-neutral-500 w-16 shrink-0">
                    {signal.offsetSeconds.toFixed(1)}s
                  </span>
                  <span className="text-[12px] font-medium text-neutral-900 shrink-0">{signal.label}</span>
                  <span className="data text-[10px] text-neutral-400 shrink-0">{signal.channel}</span>
                  <span className="text-[11px] text-neutral-500 flex-1 truncate">{signal.detail}</span>
                  <span className="text-[10px] text-neutral-400">{(signal.confidence * 100).toFixed(0)}%</span>
                </li>
              ))}
              {s.signals.length > 100 && (
                <li className="text-center text-[12px] text-neutral-400 py-2">
                  … and {s.signals.length - 100} more signals
                </li>
              )}
            </ul>
          </div>

          <div className="panel p-4 space-y-4">
            <h3 className="text-[14px] font-semibold">Session summary</h3>
            <dl className="space-y-3 text-[12.5px]">
              <div className="flex justify-between border-b border-neutral-100 pb-3">
                <dt className="text-neutral-500">Total signals</dt>
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
              <div className="flex justify-between">
                <dt className="text-neutral-500">Decisions recorded</dt>
                <dd className="text-neutral-900 font-medium">{s.decisions.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}