import { BehaviorEvent } from '../../types';
import { BehaviorConfig } from '../config';
import { EventDebouncer } from '../EventDebouncer';
import { SignalDetector } from './SignalDetector';

export class VisibilityDetector implements SignalDetector {
  readonly id = 'visibility_detector';
  private running = false;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private blurStartTime: number | null = null;
  private hiddenStartTime: number | null = null;
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;
  private sessionId: string;

  constructor(sessionId: string, config: BehaviorConfig, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.config = config;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public start(onEvent: (event: BehaviorEvent) => void): void {
    if (this.running) return;
    this.running = true;
    this.onEventCallback = onEvent;

    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('focus', this.handleFocus);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onEventCallback = null;

    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public isRunning(): boolean {
    return this.running;
  }

  private handleBlur = () => {
    this.blurStartTime = Date.now();
  };

  private handleFocus = () => {
    if (!this.blurStartTime) return;
    const duration = Date.now() - this.blurStartTime;
    this.blurStartTime = null;

    if (duration >= this.config.windowBlurThresholdMs && this.debouncer.canEmit('WINDOW_BLUR')) {
      this.debouncer.recordEmitted('WINDOW_BLUR');
      this.emit({
        id: `evt-blur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        type: 'WINDOW_BLUR',
        category: 'visibility',
        severity: duration > 5000 ? 'high' : 'medium',
        confidence: 1.0,
        duration,
        durationSeconds: Math.round(duration / 1000),
        source: 'visibility_detector',
        description: `Exam window lost active focus for ${(duration / 1000).toFixed(1)}s.`,
        evidence: {
          windowFocused: false,
          durationMs: duration,
        },
      });
    }
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.hiddenStartTime = Date.now();
    } else {
      if (this.hiddenStartTime) {
        const duration = Date.now() - this.hiddenStartTime;
        this.hiddenStartTime = null;

        if (this.debouncer.canEmit('TAB_VISIBILITY_CHANGE')) {
          this.debouncer.recordEmitted('TAB_VISIBILITY_CHANGE');
          this.emit({
            id: `evt-vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            type: 'TAB_VISIBILITY_CHANGE',
            category: 'visibility',
            severity: duration > 4000 ? 'high' : 'medium',
            confidence: 1.0,
            duration,
            durationSeconds: Math.round(duration / 1000),
            source: 'visibility_detector',
            description: `Browser tab visibility changed to hidden for ${(duration / 1000).toFixed(1)}s.`,
            evidence: {
              visibilityState: 'hidden',
              durationMs: duration,
            },
          });
        }
      }
    }
  };

  private emit(event: BehaviorEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
