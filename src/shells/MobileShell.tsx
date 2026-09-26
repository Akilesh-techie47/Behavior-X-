import type { ReactNode } from 'react';
import { Battery, Camera, Mic, WifiOff } from 'lucide-react';
import type {
  CompanionStatus,
  DeviceKind,
  DeviceState,
  DeviceStatus,
  PermissionName,
  PermissionState,
} from '../domain/types';
import { NavBrand } from '../components/brand/Wordmark';

/**
 * Companion device shell.
 *
 * The phone is a *sensor*, and this shell is designed to make that legible: one
 * question at the top, a large honest state in the middle, nothing else. There
 * is no session score, no progress ring, no dashboard — a device that thinks it
 * is being watched back is a device that is not doing its job.
 *
 * When rendered inside the examiner console for demonstration, it is shown in a
 * device frame and labelled as such, so a screenshot of the console can never
 * be mistaken for a candidate's phone.
 */

export function MobileShell({
  children,
  framed = true,
  sessionLabel,
}: {
  children: ReactNode;
  /** Draws a handset outline. Off when this really is the phone's browser. */
  framed?: boolean;
  sessionLabel?: string;
}) {
  const body = (
    <div className="flex-1 flex flex-col bg-white min-h-0">{children}</div>
  );

  if (!framed) {
    return (
      <div className="min-h-dvh flex flex-col bg-white">
        <div className="flex-1 flex flex-col">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="w-[268px] h-[540px] border-2 border-neutral-800 rounded-[22px] p-[3px] bg-neutral-800 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.4)]">
        <div className="w-full h-full rounded-[19px] bg-white overflow-hidden flex flex-col">
          <div className="h-5 shrink-0 flex items-center justify-between px-4 text-[9px] text-neutral-500">
            <span className="data">09:41</span>
            <span className="w-10 h-1 rounded-full bg-neutral-800" aria-hidden="true" />
            <span className="flex items-center gap-1">
              <Battery className="w-2.5 h-2.5" aria-hidden="true" />
              <span className="w-3 h-1.5 border border-neutral-400 rounded-[1px] relative">
                <span className="absolute inset-[1px] right-[3px] bg-neutral-500" />
              </span>
            </span>
          </div>
          {body}
        </div>
      </div>
      <p className="text-[11px] text-neutral-500 max-w-[268px] text-center leading-relaxed">
        {sessionLabel ?? 'Companion device view'} — shown in a device frame for demonstration
      </p>
    </div>
  );
}

/** The device's own status header. States are words, never icons alone. */
export function CompanionStatusBar({ companion }: { companion: CompanionStatus }) {
  const observing = companion.cameraActive && companion.network !== 'offline';
  return (
    <div className="shrink-0 border-b border-neutral-200 px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <NavBrand to="/" />
        <span className={`eyebrow ${observing ? 'text-neutral-900' : 'text-neutral-500'}`}>
          {!companion.paired ? 'Not paired' : observing ? 'Observing' : companion.network === 'offline' ? 'Offline' : 'Paused'}
        </span>
      </div>
    </div>
  );
}

/** A single honest line about what the device is doing right now. */
export function DeviceStateLine({
  devices,
  permissions,
}: {
  devices: DeviceState[];
  permissions: PermissionState[];
}) {
  const status = (kind: DeviceKind) => devices.find(d => d.kind === kind)?.status;
  const granted = (name: PermissionName) => permissions.find(p => p.name === name)?.status === 'granted';
  const network = status('network');
  const healthy = (s?: DeviceStatus) => s === 'connected' || s === 'ready' || s === 'active';

  const word = (ok: boolean, down: string) => (ok ? 'on' : down);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
      <span className="inline-flex items-center gap-1.5">
        <Camera className={`w-3 h-3 ${granted('camera') ? '' : 'text-neutral-300'}`} aria-hidden="true" />
        Camera {word(granted('camera'), granted('camera') ? 'idle' : 'blocked')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Mic className={`w-3 h-3 ${granted('microphone') ? '' : 'text-neutral-300'}`} aria-hidden="true" />
        Microphone {word(granted('microphone'), granted('microphone') ? 'idle' : 'blocked')}
      </span>
      {!healthy(network) && (
        <span className="inline-flex items-center gap-1.5 text-neutral-700">
          <WifiOff className="w-3 h-3" aria-hidden="true" />
          Network {network ?? 'unknown'}
        </span>
      )}
    </div>
  );
}
