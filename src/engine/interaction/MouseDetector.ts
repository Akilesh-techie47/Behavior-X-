import { BehaviorEvent, MouseMetrics } from '../../types';
import { BehaviorConfig } from '../config';
import { EventDebouncer } from '../EventDebouncer';
import { SignalDetector } from '../detectors/SignalDetector';

export class MouseDetector implements SignalDetector {
  readonly id = 'mouse_detector';
  private running = false;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;
  private sessionId: string;

  // Tracking state
  private lastX: number = 0;
  private lastY: number = 0;
  private lastMoveTime: number = 0;
  private lastVelocity: number = 0;
  private maxAcceleration: number = 0;
  private totalDistance: number = 0;
  private clickCount: number = 0;
  private hesitationCount: number = 0;
  private idleCheckTimer: number | null = null;
  private lastActiveTimestamp: number = Date.now();

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
    this.lastActiveTimestamp = Date.now();

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('click', this.handleClick);

      // Periodic check for cursor idle (> 30 seconds inactivity)
      this.idleCheckTimer = window.setInterval(this.checkIdleState, 5000);
    }
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onEventCallback = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('click', this.handleClick);
      if (this.idleCheckTimer !== null) {
        clearInterval(this.idleCheckTimer);
        this.idleCheckTimer = null;
      }
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getMetrics(): MouseMetrics {
    const now = Date.now();
    const idleDurationMs = now - this.lastActiveTimestamp;

    return {
      totalDistancePx: Math.round(this.totalDistance),
      currentVelocityPxSec: Math.round(this.lastVelocity),
      maxAcceleration: Math.round(this.maxAcceleration),
      clickCount: this.clickCount,
      hesitationCount: this.hesitationCount,
      idleDurationMs,
      lastMoveTime: this.lastMoveTime || now,
    };
  }

  private handleMouseMove = (e: MouseEvent) => {
    const now = Date.now();
    this.lastActiveTimestamp = now;

    if (this.lastMoveTime > 0) {
      const dt = (now - this.lastMoveTime) / 1000;
      if (dt > 0.01) {
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.totalDistance += dist;

        const velocity = dist / dt; // px/sec
        const acceleration = Math.abs(velocity - this.lastVelocity) / dt;
        if (acceleration > this.maxAcceleration) {
          this.maxAcceleration = acceleration;
        }

        // Hesitation indicator: sudden deceleration in vicinity of interactive zone
        if (this.lastVelocity > 800 && velocity < 40 && dist < 15) {
          this.hesitationCount++;
          if (this.debouncer.canEmit('MOUSE_HESITATION', now)) {
            this.debouncer.recordEmitted('MOUSE_HESITATION', now);
            this.emit({
              id: `evt-hes-${now}-${Math.random().toString(36).substring(2, 6)}`,
              sessionId: this.sessionId,
              timestamp: now,
              type: 'MOUSE_HESITATION',
              category: 'interaction',
              severity: 'low',
              confidence: 0.76,
              duration: 800,
              durationSeconds: 0.8,
              source: 'mouse_detector',
              description: 'Cursor hesitation recorded prior to answer selection (cognitive deliberation pattern).',
              evidence: {
                mouseSpeedPxSec: Math.round(velocity),
                additionalContext: 'Deliberate hesitation noted near option area.',
              },
            });
          }
        }

        this.lastVelocity = velocity;
      }
    }

    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastMoveTime = now;
  };

  private handleClick = () => {
    this.clickCount++;
    this.lastActiveTimestamp = Date.now();
  };

  private checkIdleState = () => {
    const now = Date.now();
    const idleDuration = now - this.lastActiveTimestamp;

    if (idleDuration >= 35000 && this.debouncer.canEmit('CURSOR_IDLE_ANOMALY', now)) {
      this.debouncer.recordEmitted('CURSOR_IDLE_ANOMALY', now);
      this.emit({
        id: `evt-idle-${now}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId: this.sessionId,
        timestamp: now,
        type: 'CURSOR_IDLE_ANOMALY',
        category: 'interaction',
        severity: 'low',
        confidence: 0.9,
        duration: idleDuration,
        durationSeconds: Math.round(idleDuration / 1000),
        source: 'mouse_detector',
        description: `Extended candidate inactivity (${Math.round(idleDuration / 1000)}s with no mouse or cursor movement).`,
        evidence: {
          durationMs: idleDuration,
          additionalContext: 'Zero mouse or cursor activity during active assessment window.',
        },
      });
    }
  };

  private emit(event: BehaviorEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
