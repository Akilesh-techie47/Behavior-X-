import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronLeft, LifeBuoy, LogOut, WifiOff } from 'lucide-react';
import { Link } from '../router';
import { NavBrand } from '../components/brand/Wordmark';
import { Button } from '../components/primitives/Button';

/**
 * Candidate shell.
 *
 * What a candidate sees while sitting an examination: no navigation, no
 * analytics, nothing to explore. The only permanent fixture is the exam title
 * and the time remaining, because that is the only thing they must not have
 * to look for. Support and withdrawal are always reachable because a candidate
 * must never be trapped.
 */

export interface StudentContext {
  examTitle: string;
  sectionLabel: string;
  seatId: string;
  /** Seconds remaining, or null when no session is live. */
  remainingSeconds: number | null;
  connection: 'good' | 'weak' | 'lost' | 'none';
  onWithdraw?: () => void;
}

export function StudentShell({ context, children }: { context: StudentContext; children: ReactNode }) {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col bg-neutral-50">
      <a href="#exam-main" className="skip-link">
        Skip to question
      </a>

      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-[1100px] px-5 h-14 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <NavBrand to="/" />
            <span className="hidden sm:inline h-4 w-px bg-neutral-200" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-neutral-900 truncate leading-tight">
                {context.examTitle}
              </div>
              <div className="text-[11px] text-neutral-500 truncate">
                {context.sectionLabel} · Seat {context.seatId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {context.connection === 'lost' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-900">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                Connection lost
              </span>
            )}
            {context.remainingSeconds !== null && <TimeRemaining seconds={context.remainingSeconds} />}
            <Button
              size="sm"
              variant="ghost"
              icon={<LifeBuoy className="w-3.5 h-3.5" />}
              onClick={() => setSupportOpen(true)}
            >
              <span className="hidden sm:inline">Support</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="exam-main" className="flex-1">
        {children}
      </main>

      {supportOpen && (
        <SupportPanel
          onClose={() => setSupportOpen(false)}
          onWithdraw={context.onWithdraw}
        />
      )}
    </div>
  );
}

function TimeRemaining({ seconds }: { seconds: number }) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const urgent = seconds < 300;

  return (
    <div
      className={`flex items-center gap-2 h-8 px-2.5 border rounded-[3px] ${
        urgent ? 'border-neutral-900' : 'border-neutral-200 bg-neutral-50'
      }`}
      role="timer"
      aria-label={`${hours} hours ${minutes} minutes remaining`}
      aria-live={urgent ? 'assertive' : 'off'}
    >
      <span className="eyebrow">Remaining</span>
      <span className={`data text-[14px] font-medium tabular-nums ${urgent ? 'text-neutral-900' : 'text-neutral-700'}`}>
        {hours > 0 && `${hours}:`}
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}

/** Support is a panel, not a modal, so a candidate can read it mid-question. */
function SupportPanel({ onClose, onWithdraw }: { onClose: () => void; onWithdraw?: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-neutral-900/20" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-label="Support and withdrawal"
        className="relative w-full max-w-[400px] bg-white border-l border-neutral-300 h-full overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Support</h2>
          <Button size="xs" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <div className="eyebrow mb-2">During the examination</div>
            <p className="text-[12.5px] leading-relaxed text-neutral-600">
              An invigilator can see your status and that your observation devices are
              connected. They cannot see your screen, your camera image, or anything you
              type unless you raise your hand.
            </p>
          </section>

          <section>
            <div className="eyebrow mb-2">If something is wrong</div>
            <ul className="space-y-2 text-[12.5px] leading-relaxed text-neutral-600">
              <li className="flex gap-2">
                <span className="text-neutral-300 select-none">—</span>
                <span>
                  <strong className="text-neutral-800 font-medium">Connection dropped.</strong>{' '}
                  Your answers are saved on this device. Reconnect and continue where you
                  left off; the timer keeps running.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-300 select-none">—</span>
                <span>
                  <strong className="text-neutral-800 font-medium">Camera blocked.</strong>{' '}
                  Re-enable it in your browser's site settings, then press Retry on the
                  device check.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-300 select-none">—</span>
                <span>
                  <strong className="text-neutral-800 font-medium">You need to step away.</strong>{' '}
                  Use the button below. An invigilator will pause your session and record
                  why.
                </span>
              </li>
            </ul>
          </section>

          {onWithdraw && (
            <section className="border-t border-neutral-200 pt-5">
              <div className="eyebrow mb-2">Withdraw</div>
              <p className="text-[12.5px] leading-relaxed text-neutral-600 mb-3">
                Withdrawing pauses the examination. Your invigilator is notified, and the
                session record states that you withdrew — it is not treated as a failure.
              </p>
              <Button variant="outline" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} onClick={onWithdraw}>
                Request withdrawal
              </Button>
            </section>
          )}

          <section className="border-t border-neutral-200 pt-5">
            <Link
              to="/help"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-700 hover:text-neutral-900"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Full help centre
            </Link>
          </section>
        </div>
      </aside>
    </div>
  );
}
