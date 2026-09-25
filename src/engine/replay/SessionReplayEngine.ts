import { BehaviorEvent, ExamSession, RiskState } from '../../types';
import { RiskEngine } from '../risk/RiskEngine';

export interface ReplayState {
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  currentTimestamp: number;
  progressPct: number;
  activeEvents: BehaviorEvent[];
  currentRiskState: RiskState;
  currentQuestionIndex: number;
}

export class SessionReplayEngine {
  private session: ExamSession;
  private riskEngine: RiskEngine;
  private isPlaying: boolean = false;
  private speed: 1 | 2 | 4 = 1;
  private currentTimestamp: number = 0;
  private timer: number | null = null;
  private onStateChangeCallback: ((state: ReplayState) => void) | null = null;

  constructor(session: ExamSession, riskEngine?: RiskEngine) {
    this.session = session;
    this.riskEngine = riskEngine || new RiskEngine();
    this.currentTimestamp = session.startedAt || Date.now() - 1000 * 60 * 30;
  }

  public setSession(session: ExamSession): void {
    this.session = session;
    this.reset();
  }

  public onStateChange(cb: (state: ReplayState) => void): void {
    this.onStateChangeCallback = cb;
    this.notifyState();
  }

  public play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const endTimestamp = this.session.endedAt || Date.now();
    const intervalMs = 250;
    const stepDurationMs = 2000 * this.speed;

    this.timer = window.setInterval(() => {
      this.currentTimestamp += stepDurationMs;

      if (this.currentTimestamp >= endTimestamp) {
        this.currentTimestamp = endTimestamp;
        this.pause();
      }
      this.notifyState();
    }, intervalMs);

    this.notifyState();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notifyState();
  }

  public reset(): void {
    this.pause();
    this.currentTimestamp = this.session.startedAt || Date.now() - 1000 * 60 * 30;
    this.notifyState();
  }

  public setSpeed(speed: 1 | 2 | 4): void {
    this.speed = speed;
    if (this.isPlaying) {
      this.pause();
      this.play();
    } else {
      this.notifyState();
    }
  }

  public stepForward(): void {
    const endTimestamp = this.session.endedAt || Date.now();
    this.currentTimestamp = Math.min(endTimestamp, this.currentTimestamp + 15000);
    this.notifyState();
  }

  public stepBackward(): void {
    const startTimestamp = this.session.startedAt || 0;
    this.currentTimestamp = Math.max(startTimestamp, this.currentTimestamp - 15000);
    this.notifyState();
  }

  public jumpToTimestamp(timestamp: number): void {
    const startTimestamp = this.session.startedAt || 0;
    const endTimestamp = this.session.endedAt || Date.now();
    this.currentTimestamp = Math.max(startTimestamp, Math.min(endTimestamp, timestamp));
    this.notifyState();
  }

  private notifyState(): void {
    if (!this.onStateChangeCallback) return;

    const startTimestamp = this.session.startedAt || this.currentTimestamp - 1000 * 60 * 30;
    const endTimestamp = this.session.endedAt || Date.now();
    const totalDuration = Math.max(1000, endTimestamp - startTimestamp);
    const elapsed = Math.max(0, this.currentTimestamp - startTimestamp);
    const progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    // Filter events up to current timestamp
    const activeEvents = (this.session.events || []).filter(
      e => e.timestamp <= this.currentTimestamp
    );

    // Compute risk at this point in time
    const currentRisk = this.riskEngine.evaluateRisk(
      activeEvents,
      this.currentTimestamp,
      startTimestamp
    );

    // Approximate question index based on progress
    const questionCount = Math.max(1, this.session.questionCount || 10);
    const currentQuestionIndex = Math.min(
      questionCount - 1,
      Math.floor((progressPct / 100) * questionCount)
    );

    this.onStateChangeCallback({
      isPlaying: this.isPlaying,
      speed: this.speed,
      currentTimestamp: this.currentTimestamp,
      progressPct,
      activeEvents,
      currentRiskState: currentRisk,
      currentQuestionIndex,
    });
  }
}
