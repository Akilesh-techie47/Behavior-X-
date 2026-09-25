import { BehaviorEvent } from '../../types';
import { BehaviorConfig } from '../config';
import { EventDebouncer } from '../EventDebouncer';
import { SignalDetector } from './SignalDetector';

export class AttentionDetector implements SignalDetector {
  readonly id = 'attention_detector';
  private running = false;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;
  private sessionId: string;

  private lookingAwayStartTime: number | null = null;
  private currentDirection: 'center' | 'left' | 'right' | 'down' | 'up' = 'center';

  constructor(sessionId: string, config: BehaviorConfig, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.config = config;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public start(onEvent: (event: BehaviorEvent) => void): void {
    this.running = true;
    this.onEventCallback = onEvent;
  }

  public stop(): void {
    this.running = false;
    this.onEventCallback = null;
    this.lookingAwayStartTime = null;
  }

  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Called by optical processing or simulated input with estimated head/gaze orientation
   */
  public reportOrientation(
    direction: 'center' | 'left' | 'right' | 'down' | 'up',
    headYawDeg: number = 0,
    headPitchDeg: number = 0,
    now: number = Date.now()
  ): void {
    if (!this.running) return;

    this.currentDirection = direction;

    if (direction === 'center') {
      this.lookingAwayStartTime = null;
      return;
    }

    // Direction is away from center
    if (!this.lookingAwayStartTime) {
      this.lookingAwayStartTime = now;
      return;
    }

    const duration = now - this.lookingAwayStartTime;

    // 1. Prolonged off-screen gaze check (> 5000ms)
    if (
      duration >= this.config.prolongedGazeThresholdMs &&
      this.debouncer.canEmit('PROLONGED_OFF_SCREEN_GAZE', now)
    ) {
      this.debouncer.recordEmitted('PROLONGED_OFF_SCREEN_GAZE', now);
      this.emit({
        id: `evt-gaze-prolonged-${now}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId: this.sessionId,
        timestamp: now,
        type: 'PROLONGED_OFF_SCREEN_GAZE',
        category: 'attention',
        severity: 'high',
        confidence: 0.88,
        duration,
        durationSeconds: Math.round(duration / 1000),
        source: 'attention_detector',
        description: `Prolonged off-screen gaze deviation (${direction.toUpperCase()}) sustained for ${(duration / 1000).toFixed(1)}s.`,
        evidence: {
          gazeDirection: direction,
          headYawDeg,
          headPitchDeg,
          durationMs: duration,
        },
      });
      return;
    }

    // 2. Standard looking away check (> 2000ms)
    if (
      duration >= this.config.lookingAwayThresholdMs &&
      this.debouncer.canEmit('LOOKING_AWAY', now)
    ) {
      this.debouncer.recordEmitted('LOOKING_AWAY', now);
      const eventType =
        direction === 'left'
          ? 'HEAD_TURN_LEFT'
          : direction === 'right'
          ? 'HEAD_TURN_RIGHT'
          : 'LOOKING_AWAY';

      this.emit({
        id: `evt-look-${now}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId: this.sessionId,
        timestamp: now,
        type: eventType,
        category: 'attention',
        severity: 'medium',
        confidence: 0.82,
        duration,
        durationSeconds: Math.round(duration / 1000),
        source: 'attention_detector',
        description: `Attention deviation observed (${direction.toUpperCase()}) for ${(duration / 1000).toFixed(1)}s.`,
        evidence: {
          gazeDirection: direction,
          headYawDeg,
          headPitchDeg,
          durationMs: duration,
        },
      });
    }
  }

  private emit(event: BehaviorEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
