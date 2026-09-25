import { BehaviorEvent } from '../../types';
import { EventDebouncer } from '../EventDebouncer';
import { SignalDetector } from './SignalDetector';

export class FullscreenDetector implements SignalDetector {
  readonly id = 'fullscreen_detector';
  private running = false;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private debouncer: EventDebouncer;
  private sessionId: string;

  constructor(sessionId: string, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public start(onEvent: (event: BehaviorEvent) => void): void {
    if (this.running) return;
    this.running = true;
    this.onEventCallback = onEvent;

    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onEventCallback = null;

    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  public isRunning(): boolean {
    return this.running;
  }

  private handleFullscreenChange = () => {
    const isFullscreenNow = !!document.fullscreenElement;
    if (!isFullscreenNow && this.debouncer.canEmit('FULLSCREEN_EXIT')) {
      this.debouncer.recordEmitted('FULLSCREEN_EXIT');
      if (this.onEventCallback) {
        this.onEventCallback({
          id: `evt-fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          type: 'FULLSCREEN_EXIT',
          category: 'visibility',
          severity: 'medium',
          confidence: 1.0,
          duration: 1000,
          durationSeconds: 1,
          source: 'fullscreen_detector',
          description: 'Exam workspace exited full-screen presentation mode.',
          evidence: {
            isFullscreen: false,
          },
        });
      }
    }
  };
}
