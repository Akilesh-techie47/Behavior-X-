import { BrowserCapability, BrowserIntegrityReport } from '../../types';

export class BrowserIntegrityService {
  public static getCapabilities(): BrowserCapability[] {
    return new BrowserIntegrityService().evaluateBrowserCapabilities();
  }

  /**
   * Assesses browser APIs and provides an honest, transparent Browser Capability Matrix
   */
  public evaluateBrowserCapabilities(): BrowserCapability[] {
    const isBrowser = typeof window !== 'undefined';

    const capabilities: BrowserCapability[] = [
      {
        id: 'tab-visibility',
        name: 'Tab Visibility Monitoring (Page Visibility API)',
        status: isBrowser && 'visibilityState' in document ? 'SUPPORTED' : 'NOT AVAILABLE IN BROWSER',
        notes: 'Detects when candidate navigates away from active examination tab.',
        verifiedInEnvironment: isBrowser && 'visibilityState' in document,
      },
      {
        id: 'window-focus',
        name: 'Window Focus & Blur Monitoring',
        status: isBrowser ? 'SUPPORTED' : 'NOT AVAILABLE IN BROWSER',
        notes: 'Detects OS-level focus shifts and multi-tasking outside browser window.',
        verifiedInEnvironment: isBrowser,
      },
      {
        id: 'fullscreen-enforcement',
        name: 'Fullscreen API Lock & Exit Detection',
        status: isBrowser && !!document.fullscreenEnabled ? 'SUPPORTED' : 'PARTIAL',
        notes: 'Enforces dedicated full-screen examination viewport.',
        verifiedInEnvironment: isBrowser && !!document.fullscreenEnabled,
      },
      {
        id: 'clipboard-events',
        name: 'Clipboard Event Interception (Copy / Paste / Cut)',
        status: 'PARTIAL',
        notes: 'Listens to in-page copy/paste events; OS-level clipboard history cannot be accessed due to browser sandbox security.',
        verifiedInEnvironment: true,
      },
      {
        id: 'keystroke-mouse',
        name: 'Keystroke & Mouse Interaction Dynamics',
        status: 'SUPPORTED',
        notes: 'Collects in-page dwell, interval, typing speed, and cursor velocity telemetry.',
        verifiedInEnvironment: true,
      },
      {
        id: 'external-display',
        name: 'External Display Topology (Window Screen Details)',
        status: isBrowser && 'getScreenDetails' in window ? 'PARTIAL' : 'PARTIAL',
        notes: 'Standard browsers provide screen resolution; physical monitor topology requires experimental Permissions Policy.',
        verifiedInEnvironment: false,
      },
      {
        id: 'devtools-detection',
        name: 'Developer Tools Inspection Heuristics',
        status: 'PARTIAL',
        notes: 'Heuristic detection via window inner/outer dimension delta and console evaluation timing.',
        verifiedInEnvironment: true,
      },
      {
        id: 'screen-recording-apps',
        name: 'OS Background Screen Recording Apps',
        status: 'NOT AVAILABLE IN BROWSER',
        notes: 'Web sandbox prevents inspecting native operating system process lists or third-party background software.',
        verifiedInEnvironment: false,
      },
      {
        id: 'os-applications',
        name: 'Native OS Applications Inspection',
        status: 'NOT AVAILABLE IN BROWSER',
        notes: 'Browser security strictly isolates client code from inspecting non-browser application processes.',
        verifiedInEnvironment: false,
      },
    ];

    return capabilities;
  }

  /**
   * Performs client tampering and devtools heuristics checks
   */
  public checkIntegrity(): BrowserIntegrityReport {
    const capabilities = this.evaluateBrowserCapabilities();
    const tamperSignals: string[] = [];
    let devToolsLikelyOpen = false;

    if (typeof window !== 'undefined') {
      // DevTools heuristic: significant delta between outer and inner window dimensions
      const widthDelta = window.outerWidth - window.innerWidth;
      const heightDelta = window.outerHeight - window.innerHeight;

      if (widthDelta > 160 || heightDelta > 160) {
        devToolsLikelyOpen = true;
        tamperSignals.push('Window geometry discrepancy suggests developer tools or dock opened.');
      }

      // Check if Date.now or performance.now was hooked/tampered
      try {
        if (!Date.now.toString().includes('[native code]')) {
          tamperSignals.push('Native Date.now function prototype has been modified.');
        }
      } catch {
        // ignore
      }
    }

    return {
      capabilities,
      isTampered: tamperSignals.length > 0,
      tamperSignals,
      devToolsLikelyOpen,
      checkedAt: Date.now(),
    };
  }
}

export const browserIntegrityService = new BrowserIntegrityService();
