import { BehaviorEvent, KeystrokeMetrics } from '../../types';
import { BehaviorConfig } from '../config';
import { EventDebouncer } from '../EventDebouncer';
import { SignalDetector } from '../detectors/SignalDetector';

export class KeystrokeDetector implements SignalDetector {
  readonly id = 'keystroke_detector';
  private running = false;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;
  private sessionId: string;

  // Keystroke dynamics tracking state
  private keydownTimestamps: Map<string, number> = new Map();
  private recentKeystrokeTimes: number[] = [];
  private dwellTimes: number[] = [];
  private intervals: number[] = [];
  private lastKeyReleaseTime: number = 0;
  private pauseCount: number = 0;
  private shortcutCount: number = 0;

  // Personal session rolling baseline
  private baselineSpeedKps: number = 3.5;
  private hasEstablishedBaseline: boolean = false;

  constructor(sessionId: string, config: BehaviorConfig, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.config = config;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public setBaselineSpeed(kps: number): void {
    if (kps > 0) {
      this.baselineSpeedKps = kps;
      this.hasEstablishedBaseline = true;
    }
  }

  public start(onEvent: (event: BehaviorEvent) => void): void {
    if (this.running) return;
    this.running = true;
    this.onEventCallback = onEvent;

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onEventCallback = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getMetrics(): KeystrokeMetrics {
    const now = Date.now();
    // Rolling 5s keystrokes
    this.recentKeystrokeTimes = this.recentKeystrokeTimes.filter(t => now - t <= 5000);
    const speedKps = this.recentKeystrokeTimes.length / 5;

    const avgDwell =
      this.dwellTimes.length > 0
        ? this.dwellTimes.reduce((a, b) => a + b, 0) / this.dwellTimes.length
        : 110;

    const avgInterval =
      this.intervals.length > 0
        ? this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length
        : 260;

    const suddenShiftRatio =
      this.hasEstablishedBaseline && this.baselineSpeedKps > 0
        ? speedKps / this.baselineSpeedKps
        : 1.0;

    return {
      currentSpeedKps: parseFloat(speedKps.toFixed(2)),
      avgDwellTimeMs: Math.round(avgDwell),
      avgIntervalMs: Math.round(avgInterval),
      pauseCount: this.pauseCount,
      shortcutCount: this.shortcutCount,
      suddenShiftRatio: parseFloat(suddenShiftRatio.toFixed(2)),
      lastKeystrokeTime: this.lastKeyReleaseTime || now,
    };
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const now = Date.now();
    this.recentKeystrokeTimes.push(now);

    // Track interval between previous keyup and current keydown
    if (this.lastKeyReleaseTime > 0) {
      const interval = now - this.lastKeyReleaseTime;
      this.intervals.push(interval);
      if (this.intervals.length > 50) this.intervals.shift();

      // Check for typing pause anomaly (> 4000ms idle then sudden burst)
      if (interval > 4000 && this.debouncer.canEmit('TYPING_PAUSE_ANOMALY', now)) {
        this.pauseCount++;
        this.debouncer.recordEmitted('TYPING_PAUSE_ANOMALY', now);
        this.emit({
          id: `evt-kpause-${now}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId: this.sessionId,
          timestamp: now,
          type: 'TYPING_PAUSE_ANOMALY',
          category: 'interaction',
          severity: 'low',
          confidence: 0.85,
          duration: interval,
          durationSeconds: Math.round(interval / 1000),
          source: 'keystroke_detector',
          description: `Typing paused for ${(interval / 1000).toFixed(1)}s before resume. Recorded for cognitive baseline rhythm.`,
          evidence: {
            durationMs: interval,
            additionalContext: `Typing pause duration: ${(interval / 1000).toFixed(1)}s`,
          },
        });
      }
    }

    if (!this.keydownTimestamps.has(e.code)) {
      this.keydownTimestamps.set(e.code, now);
    }

    // Shortcut detection (Ctrl/Cmd + C/V/A, Alt+Tab, F12)
    if (
      (e.ctrlKey || e.metaKey) &&
      ['c', 'v', 'a', 'x', 'f', 'p'].includes(e.key.toLowerCase())
    ) {
      this.shortcutCount++;
      const shortcutLabel = `${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key.toUpperCase()}`;
      if (this.debouncer.canEmit('SHORTCUT_TRIGGERED', now)) {
        this.debouncer.recordEmitted('SHORTCUT_TRIGGERED', now);
        this.emit({
          id: `evt-kshort-${now}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId: this.sessionId,
          timestamp: now,
          type: 'SHORTCUT_TRIGGERED',
          category: 'interaction',
          severity: ['c', 'v'].includes(e.key.toLowerCase()) ? 'medium' : 'low',
          confidence: 1.0,
          duration: 300,
          durationSeconds: 0.3,
          source: 'keystroke_detector',
          description: `Keyboard shortcut shortcut ${shortcutLabel} triggered during assessment.`,
          evidence: {
            additionalContext: `Shortcut key combination: ${shortcutLabel}`,
          },
        });
      }
    }

    // Inspect rolling speed for sudden speed burst
    const rolling5s = this.recentKeystrokeTimes.filter(t => now - t <= 5000);
    const currentKps = rolling5s.length / 5;

    if (
      currentKps >= 8.5 &&
      this.hasEstablishedBaseline &&
      currentKps > this.baselineSpeedKps * 1.8 &&
      this.debouncer.canEmit('TYPING_SPEED_CHANGE', now)
    ) {
      this.debouncer.recordEmitted('TYPING_SPEED_CHANGE', now);
      this.emit({
        id: `evt-kburst-${now}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId: this.sessionId,
        timestamp: now,
        type: 'TYPING_SPEED_CHANGE',
        category: 'interaction',
        severity: 'medium',
        confidence: 0.88,
        duration: 3000,
        durationSeconds: 3.0,
        source: 'keystroke_detector',
        description: `Sudden typing velocity increase detected (${currentKps.toFixed(1)} keys/sec vs baseline ${this.baselineSpeedKps.toFixed(1)} keys/sec).`,
        evidence: {
          typingSpeedKps: parseFloat(currentKps.toFixed(1)),
          baselineDeviationPct: Math.round(((currentKps - this.baselineSpeedKps) / this.baselineSpeedKps) * 100),
          additionalContext: 'Rapid typing burst deviating from established session rhythm.',
        },
      });
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const now = Date.now();
    this.lastKeyReleaseTime = now;

    const start = this.keydownTimestamps.get(e.code);
    if (start) {
      const dwell = now - start;
      this.dwellTimes.push(dwell);
      if (this.dwellTimes.length > 50) this.dwellTimes.shift();
      this.keydownTimestamps.delete(e.code);
    }
  };

  private emit(event: BehaviorEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
