/**
 * Device service.
 *
 * Where a real browser API exists, this uses it: camera and microphone
 * availability come from `enumerateDevices`, network state from a real request,
 * browser capability from feature detection. Nothing about the candidate's
 * machine is guessed. Where an API does not exist — which is the normal case
 * for a companion device, since a phone cannot be reached from a laptop page
 * over the open web — the service says so plainly instead of simulating a
 * success.
 *
 * The one thing that is simulated is the companion pairing handshake, and it
 * is stamped `simulated: true` all the way through to the interface.
 */

import type {
  AlignmentCheck,
  AlignmentReport,
  CompanionStatus,
  EnvironmentCheck,
  PairingSession,
  PermissionState,
} from '../../domain/types';
import type { CheckPlanItem, DeviceService } from '../contracts';
import { transport } from './transport';

function nowIso(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ *
 * Environment probes
 * ------------------------------------------------------------------ */

async function probeCamera(): Promise<EnvironmentCheck> {
  const base = {
    id: 'camera',
    label: 'Camera',
    requirement: 'A working camera that can deliver frames to the edge engine.',
  };

  if (!navigator.mediaDevices?.enumerateDevices) {
    return {
      ...base,
      state: 'unavailable',
      summary: 'This browser exposes no camera enumeration API, so no measurement was possible.',
      measurement: 'navigator.mediaDevices unavailable',
      remedy:
        'Use a current version of Chrome, Edge or Firefox on a laptop with a built-in or external camera.',
    };
  }

  const started = performance.now();
  let devices: MediaDeviceInfo[];
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch (error) {
    return {
      ...base,
      state: 'failed',
      summary: `Device enumeration was refused: ${(error as Error).message}`,
      measurement: 'enumerateDevices() rejected',
      remedy: 'Grant camera access in the browser address bar, then run the check again.',
    };
  }
  const elapsed = Math.round(performance.now() - started);
  const cameras = devices.filter(d => d.kind === 'videoinput');

  if (cameras.length === 0) {
    return {
      ...base,
      state: 'failed',
      summary: 'No video input device is reported by the operating system.',
      measurement: '0 video inputs',
      remedy: 'Connect a camera and confirm it is not disabled in the operating system privacy settings.',
    };
  }

  const labelled = cameras.some(d => d.label.length > 0);
  return {
    ...base,
    state: 'passed',
    summary: labelled
      ? `${cameras.length} camera${cameras.length === 1 ? '' : 's'} reported and readable by the browser.`
      : `${cameras.length} camera${cameras.length === 1 ? '' : 's'} present. Labels are hidden until camera permission is granted, which the next screen asks for.`,
    measurement: `${cameras.length} input${cameras.length === 1 ? '' : 's'} · ${elapsed} ms`,
  };
}

async function probeMicrophone(): Promise<EnvironmentCheck> {
  const base = {
    id: 'microphone',
    label: 'Microphone',
    requirement: 'A microphone for room-level monitoring. Audio is never recorded or retained.',
  };

  if (!navigator.mediaDevices?.enumerateDevices) {
    return {
      ...base,
      state: 'skipped',
      summary: 'Device enumeration is unavailable in this browser.',
      measurement: 'navigator.mediaDevices unavailable',
      remedy: 'Not required. Room-level monitoring is optional for this examination.',
    };
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const microphones = devices.filter(d => d.kind === 'audioinput');

  if (microphones.length === 0) {
    return {
      ...base,
      state: 'warned',
      summary: 'No audio input reported. The examination can proceed, but no audio observation will be available.',
      measurement: '0 audio inputs',
      remedy: 'Connect a microphone if your examination requires room-level monitoring.',
    };
  }

  return {
    ...base,
    state: 'passed',
    summary: `${microphones.length} audio input${microphones.length === 1 ? '' : 's'} reported. Level monitoring only; no audio content is retained.`,
    measurement: `${microphones.length} input${microphones.length === 1 ? '' : 's'}`,
  };
}

async function probeBrowser(): Promise<EnvironmentCheck> {
  const base = {
    id: 'browser',
    label: 'Browser',
    requirement: 'A browser that reports page visibility and window focus reliably.',
  };

  const features: [string, boolean][] = [
    ['visibilitychange', 'visibilityState' in document],
    ['fullscreen', Boolean(document.documentElement.requestFullscreen)],
    ['page lifecycle', 'onvisibilitychange' in document],
    ['clipboard events', 'clipboard' in navigator],
  ];
  const missing = features.filter(([, ok]) => !ok).map(([name]) => name);
  const ua = navigator.userAgent;
  const engine = /Firefox\//.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Unrecognised';

  if (engine === 'Unrecognised') {
    return {
      ...base,
      state: 'failed',
      summary: 'The browser could not be identified, so observation coverage cannot be guaranteed.',
      measurement: 'user agent not matched',
      remedy: 'Use a current version of Chrome, Edge or Firefox.',
    };
  }

  if (missing.length > 0) {
    return {
      ...base,
      state: 'warned',
      summary: `${engine} detected, but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} unavailable. Some evidence will not be recordable.`,
      measurement: `${engine} · ${features.length - missing.length}/${features.length} capabilities`,
      remedy: 'The examination will still run, and the limitation will be recorded against any interval that depends on it.',
    };
  }

  return {
    ...base,
    state: 'passed',
    summary: `${engine} detected with all ${features.length} capabilities the evidence record depends on.`,
    measurement: `${engine} · ${features.length}/${features.length} capabilities`,
  };
}

async function probeNetwork(): Promise<EnvironmentCheck> {
  const base = {
    id: 'network',
    label: 'Network',
    requirement: 'Stable reachability to the examination endpoint throughout the sitting.',
  };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      ...base,
      state: 'failed',
      summary: 'The browser reports no network connection.',
      measurement: 'navigator.onLine = false',
      remedy: 'Reconnect to a network and run the check again. An examination cannot be delivered offline.',
    };
  }

  const started = performance.now();
  let reachable = false;
  try {
    const response = await fetch(window.location.href, {
      method: 'HEAD',
      cache: 'no-store',
    });
    reachable = response.ok || response.status === 405;
  } catch {
    reachable = false;
  }
  const rtt = Math.round(performance.now() - started);

  if (!reachable) {
    return {
      ...base,
      state: 'failed',
      summary: 'The examination endpoint did not answer a reachability probe.',
      measurement: `no response in ${rtt} ms`,
      remedy: 'Check for a proxy or firewall that blocks the examination domain, then run the check again.',
    };
  }

  if (rtt > 400) {
    return {
      ...base,
      state: 'warned',
      summary: `The endpoint answered, but round-trip time is ${rtt} ms. Interaction events may be written late.`,
      measurement: `${rtt} ms round trip`,
      remedy: 'Prefer a wired connection. The workspace warns the invigilator if write latency rises during the sitting.',
    };
  }

  return {
    ...base,
    state: 'passed',
    summary: 'The examination endpoint answered a reachability probe within budget.',
    measurement: `${rtt} ms round trip`,
  };
}

async function probeScreen(): Promise<EnvironmentCheck> {
  const base = {
    id: 'screen',
    label: 'Screen',
    requirement: 'A display of at least 1280×720 with the workspace visible in fullscreen.',
  };

  const width = window.screen.width;
  const height = window.screen.height;
  const isFullscreen = Boolean(document.fullscreenElement);

  if (width < 1280 || height < 720) {
    return {
      ...base,
      state: 'failed',
      summary: `The display reports ${width}×${height}, below the minimum for the examination workspace.`,
      measurement: `${width}×${height}`,
      remedy: 'Connect an external display of at least 1280×720 before continuing.',
    };
  }

  return {
    ...base,
    state: 'passed',
    summary: isFullscreen
      ? `Display ${width}×${height}. The workspace is in fullscreen.`
      : `Display ${width}×${height}. Fullscreen is requested at the start of the examination, not now.`,
    measurement: `${width}×${height}${isFullscreen ? ' · fullscreen' : ''}`,
  };
}

async function probeSecondaryDevice(): Promise<EnvironmentCheck> {
  const base = {
    id: 'secondary',
    label: 'Secondary device',
    requirement: 'A phone on the same network, paired by QR code, for a second observation angle.',
  };

  const hasBluetooth = 'bluetooth' in navigator;
  const secure = window.isSecureContext;

  return {
    ...base,
    state: 'skipped',
    summary: secure
      ? 'No companion device is paired yet. The next screen pairs one by QR code; nothing is required from this laptop.'
      : 'This page is not served over HTTPS, so a companion device cannot be paired.',
    measurement: hasBluetooth
      ? 'Web Bluetooth available · pairing by QR code'
      : 'Web Bluetooth unavailable · pairing by QR code',
    remedy: secure
      ? undefined
      : 'The examination workspace is only served over HTTPS. Pairing is disabled otherwise.',
  };
}

/* ------------------------------------------------------------------ *
 * Permissions
 * ------------------------------------------------------------------ */

const PERMISSION_COPY: Record<
  PermissionState['name'],
  { label: string; purpose: string; required: boolean; handling: string }
> = {
  camera: {
    label: 'Camera',
    purpose: 'Frames are sampled on this device so presence, head orientation and framing can be measured.',
    required: true,
    handling:
      'Frames are processed in memory on this device. No video is written to disk and none is transmitted. Only derived measurements — face count, coarse head orientation, framing quality — are recorded.',
  },
  microphone: {
    label: 'Microphone',
    purpose: 'Room-level sound level monitoring, so that a second voice in the room can be detected as an observation.',
    required: false,
    handling:
      'Only the sound level is retained. No audio is recorded, stored or transmitted, and speech is never transcribed.',
  },
  screen: {
    label: 'Screen',
    purpose: 'The workspace measures its own visibility and focus events directly from the page.',
    required: true,
    handling:
      'No screen capture permission is requested. The workspace reads its own visibility and focus state, which requires no permission at all.',
  },
  fullscreen: {
    label: 'Fullscreen',
    purpose: 'Reduces the chance of an accidental application switch being confused with a policy breach.',
    required: false,
    handling: 'A browser-level mode. Nothing is recorded while it is active.',
  },
  clipboard_read: {
    label: 'Clipboard',
    purpose: 'Clipboard operations are counted and measured so that pasted content can be weighed against the regulations.',
    required: false,
    handling:
      'Only the length, the target field and the timing of each operation are retained. Clipboard content is never read or stored.',
  },
  notifications: {
    label: 'Notifications',
    purpose: 'Tells you if the companion device disconnects during the examination.',
    required: false,
    handling: 'Standard browser notifications. No examination content is included in any notification.',
  },
};

function permission(name: PermissionState['name']): PermissionState {
  const copy = PERMISSION_COPY[name];
  let status: PermissionState['status'] = 'unknown';

  // Screen and clipboard are reported from the page itself, so a secure context
  // is all they require. Fullscreen and notifications are feature-detected.
  if (name === 'screen' || name === 'clipboard_read') {
    status = window.isSecureContext ? 'unknown' : 'unavailable';
  }
  if (name === 'fullscreen') {
    status = typeof document.documentElement.requestFullscreen === 'function' ? 'unknown' : 'unavailable';
  }
  if (name === 'notifications') {
    status = 'Notification' in window ? 'unknown' : 'unavailable';
  }

  return { name, ...copy, status };
}

/* ------------------------------------------------------------------ *
 * Companion
 * ------------------------------------------------------------------ */

let companionOnline = true;
let companionBattery = 82;

export class MockDeviceService implements DeviceService {
  checkPlan(): CheckPlanItem[] {
    return [
      {
        id: 'camera',
        label: 'Camera',
        requirement: 'A working camera that can deliver frames to the edge engine.',
        run: probeCamera,
      },
      {
        id: 'microphone',
        label: 'Microphone',
        requirement: 'A microphone for room-level monitoring. Audio is never recorded or retained.',
        run: probeMicrophone,
      },
      {
        id: 'browser',
        label: 'Browser',
        requirement: 'A browser that reports page visibility and window focus reliably.',
        run: probeBrowser,
      },
      {
        id: 'network',
        label: 'Network',
        requirement: 'Stable reachability to the examination endpoint throughout the sitting.',
        run: probeNetwork,
      },
      {
        id: 'screen',
        label: 'Screen',
        requirement: 'A display of at least 1280×720 with the workspace visible in fullscreen.',
        run: probeScreen,
      },
      {
        id: 'secondary',
        label: 'Secondary device',
        requirement: 'A phone on the same network, paired by QR code, for a second observation angle.',
        run: probeSecondaryDevice,
      },
    ];
  }

  async runEnvironmentCheck(): Promise<EnvironmentCheck[]> {
    return transport(async () => {
      const plan = this.checkPlan();
      const results: EnvironmentCheck[] = [];
      for (const item of plan) {
        results.push(await item.run());
      }
      return results;
    });
  }

  async permissionStates(): Promise<PermissionState[]> {
    const names = Object.keys(PERMISSION_COPY) as PermissionState['name'][];
    return transport(() => names.map(name => permission(name)));
  }

  async requestPermission(name: PermissionState['name']): Promise<PermissionState> {
    return transport(async () => {
      const current = permission(name);

      if (name === 'camera' || name === 'microphone') {
        if (!navigator.mediaDevices?.getUserMedia) {
          return { ...current, status: 'unavailable' };
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: name === 'camera' ? { width: { ideal: 640 } } : false,
            audio: name === 'microphone' ? true : false,
          });
          stream.getTracks().forEach(track => track.stop());
          return { ...current, status: 'granted' };
        } catch (error) {
          const denied = (error as DOMException)?.name === 'NotAllowedError';
          return {
            ...current,
            status: denied ? 'denied' : 'unavailable',
          };
        }
      }

      if (name === 'fullscreen') {
        const available = Boolean(document.documentElement.requestFullscreen);
        return { ...current, status: available ? 'granted' : 'unavailable' };
      }

      if (name === 'notifications') {
        if (!('Notification' in window)) return { ...current, status: 'unavailable' };
        try {
          const result = await Notification.requestPermission();
          return { ...current, status: result === 'granted' ? 'granted' : 'denied' };
        } catch {
          return { ...current, status: 'denied' };
        }
      }

      if (name === 'screen' || name === 'clipboard_read') {
        return { ...current, status: window.isSecureContext ? 'granted' : 'unavailable' };
      }

      return { ...current, status: 'granted' };
    });
  }

  async beginPairing(): Promise<PairingSession> {
    return transport(() => ({
      id: 'pair-7781',
      code: '482 913',
      pairingUrl: 'https://observe.example.edu/join/482913',
      phase: 'awaiting_scan' as const,
      expiresInSeconds: 300,
      simulated: true as const,
    }));
  }

  async pollPairing(pairingId: string): Promise<PairingSession> {
    return transport(() => ({
      id: pairingId,
      code: '482 913',
      pairingUrl: 'https://observe.example.edu/join/482913',
      phase: 'device_found' as const,
      deviceName: 'Pixel 8a',
      batteryPercent: companionBattery,
      network: 'stable',
      cameraFacing: 'rear',
      expiresInSeconds: 264,
      simulated: true as const,
    }));
  }

  async measureAlignment(): Promise<AlignmentReport> {
    return transport(() => {
      const checks: AlignmentCheck[] = [
        {
          id: 'candidate_visible',
          label: 'Candidate visible',
          satisfied: true,
          guidance: 'Your face should be fully inside the frame, looking at the screen.',
          measured: 'Detected · 1 face · 96% of frame height',
        },
        {
          id: 'laptop_visible',
          label: 'Laptop visible',
          satisfied: true,
          guidance: 'The whole laptop, including the keyboard, should be inside the frame.',
          measured: 'Screen and keyboard both inside frame',
        },
        {
          id: 'workspace_visible',
          label: 'Workspace visible',
          satisfied: false,
          guidance: 'Move back slightly until the top bar of the workspace is visible.',
          measured: 'Top 6% of the workspace is outside the frame',
        },
        {
          id: 'lighting',
          label: 'Lighting',
          satisfied: true,
          guidance: 'Avoid a window or bright light directly behind you.',
          measured: 'Even · no backlight detected',
        },
        {
          id: 'distance',
          label: 'Distance',
          satisfied: true,
          guidance: 'About an arm’s length back is right for most desks.',
          measured: 'Within expected range',
        },
      ];
      const satisfied = checks.filter(c => c.satisfied).length;
      return {
        coverage: {
          coverage: Math.round(72 + satisfied * 3.4),
          quality: 90,
          lapsedSeconds: 0,
          reason:
            satisfied === checks.length
              ? 'Framing meets every requirement.'
              : `${checks.length - satisfied} framing requirement${checks.length - satisfied === 1 ? '' : 's'} not yet met. Observation coverage is reported as it would be with this framing.`,
        },
        checks,
        capturedAt: nowIso(),
        simulated: true,
      };
    });
  }

  async companion(): Promise<CompanionStatus> {
    return transport(() => ({
      paired: true,
      deviceName: 'Pixel 8a',
      sessionId: 'S-1025',
      examTitle: 'Advanced Programming Assessment',
      batteryPercent: companionBattery,
      charging: false,
      network: companionOnline ? 'stable' : 'offline',
      rttMs: companionOnline ? 46 : 0,
      cameraActive: companionOnline,
      cameraFacing: 'rear',
      coverage: companionOnline ? 91 : 71,
      coverageNote: companionOnline
        ? 'Frames are arriving at approximately one per second. The examination only needs presence and framing, so this is more than sufficient.'
        : 'No frames arriving. Laptop observation is unaffected; coverage for this session has fallen accordingly.',
      framesDelivered: 38412,
      framesDropped: companionOnline ? 118 : 12904,
      emergencyContact: '+44 20 7946 0100 · Northgate Examination Office',
      lastSyncAt: nowIso(),
      simulated: true as const,
    }));
  }

  async disconnectCompanion(): Promise<CompanionStatus> {
    companionOnline = false;
    return this.companion();
  }

  /** Test/demo affordance used by the companion screen's scenario switcher. */
  static setOnline(online: boolean): void {
    companionOnline = online;
  }

  static setBattery(percent: number): void {
    companionBattery = percent;
  }
}
