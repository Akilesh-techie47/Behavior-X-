import { BehaviorEvent, SessionBaseline } from '../../types';
import { EventDebouncer } from '../EventDebouncer';

export class PersonalBaselineEngine {
  private sessionId: string;
  private debouncer: EventDebouncer;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;

  // Samples collected during early phase of exam
  private typingSpeedSamples: number[] = [];
  private pauseDurationSamples: number[] = [];
  private questionDurationSamples: number[] = [];
  private gazeDeviationTimestamps: number[] = [];

  private isEstablished: boolean = false;
  private establishedAt: number | null = null;

  // Established baseline metrics
  private baselineTypingSpeed: number = 4.2;
  private baselinePauseDuration: number = 4.5;
  private baselineQuestionResponse: number = 36;
  private baselineGazeDeviationRate: number = 0.5; // per minute
  private baselineMouseVelocity: number = 320; // px/sec

  constructor(sessionId: string, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public setCallback(cb: (event: BehaviorEvent) => void): void {
    this.onEventCallback = cb;
  }

  /**
   * Ingests periodic interaction telemetry to establish and update the baseline
   */
  public recordInteractionSample(kps: number, pauseSec: number, mouseVelocity: number): void {
    if (kps > 0) this.typingSpeedSamples.push(kps);
    if (pauseSec > 0) this.pauseDurationSamples.push(pauseSec);

    // Baseline considered established after 10 samples
    if (!this.isEstablished && this.typingSpeedSamples.length >= 8) {
      this.isEstablished = true;
      this.establishedAt = Date.now();
      this.recomputeBaseline();
    }
  }

  public recordQuestionDuration(durationSec: number): void {
    if (durationSec > 0) {
      this.questionDurationSamples.push(durationSec);
      if (this.isEstablished) {
        this.recomputeBaseline();
      }
    }
  }

  public recordGazeDeviation(): void {
    this.gazeDeviationTimestamps.push(Date.now());
  }

  private recomputeBaseline(): void {
    if (this.typingSpeedSamples.length > 0) {
      this.baselineTypingSpeed =
        this.typingSpeedSamples.reduce((a, b) => a + b, 0) / this.typingSpeedSamples.length;
    }
    if (this.pauseDurationSamples.length > 0) {
      this.baselinePauseDuration =
        this.pauseDurationSamples.reduce((a, b) => a + b, 0) / this.pauseDurationSamples.length;
    }
    if (this.questionDurationSamples.length > 0) {
      this.baselineQuestionResponse =
        this.questionDurationSamples.reduce((a, b) => a + b, 0) / this.questionDurationSamples.length;
    }
  }

  /**
   * Evaluates current metrics against baseline and returns deviation percentage
   */
  public evaluateDeviation(currentKps: number, currentQuestionResponseSec?: number): {
    hasSignificantDeviation: boolean;
    typingDeviationPct: number;
    responseDeviationPct: number;
  } {
    const typingDeviationPct =
      this.isEstablished && this.baselineTypingSpeed > 0
        ? Math.round(((currentKps - this.baselineTypingSpeed) / this.baselineTypingSpeed) * 100)
        : 0;

    let responseDeviationPct = 0;
    if (currentQuestionResponseSec && this.isEstablished && this.baselineQuestionResponse > 0) {
      responseDeviationPct = Math.round(
        ((currentQuestionResponseSec - this.baselineQuestionResponse) / this.baselineQuestionResponse) * 100
      );
    }

    const hasSignificantDeviation = Math.abs(typingDeviationPct) > 90 || Math.abs(responseDeviationPct) > 85;

    return {
      hasSignificantDeviation,
      typingDeviationPct,
      responseDeviationPct,
    };
  }

  public getBaseline(): SessionBaseline {
    return {
      establishedAt: this.establishedAt,
      sampleCount: this.typingSpeedSamples.length,
      baselineTypingSpeedKps: parseFloat(this.baselineTypingSpeed.toFixed(1)),
      baselinePauseDurationSec: parseFloat(this.baselinePauseDuration.toFixed(1)),
      baselineQuestionResponseSec: Math.round(this.baselineQuestionResponse),
      baselineGazeDeviationRate: parseFloat(this.baselineGazeDeviationRate.toFixed(2)),
      baselineMouseVelocity: Math.round(this.baselineMouseVelocity),
      isEstablished: this.isEstablished,
    };
  }
}
