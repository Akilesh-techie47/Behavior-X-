import {
  BehaviorEvent,
  RiskLevel,
  RiskState,
  RiskFactor,
  RiskTimelinePoint,
} from '../../types';
import { RiskConfig, DEFAULT_RISK_CONFIG } from './riskConfig';
import { RiskWindow } from './RiskWindow';
import { RiskAggregator } from './RiskAggregator';

export class RiskEngine {
  private config: RiskConfig;
  private windowManager: RiskWindow;
  private aggregator: RiskAggregator;

  constructor(config: RiskConfig = DEFAULT_RISK_CONFIG) {
    this.config = config;
    this.windowManager = new RiskWindow(config.windowDurationMs);
    this.aggregator = new RiskAggregator(this.config, this.windowManager);
  }

  /**
   * Main evaluation method: converts raw behavior events into an explainable risk state
   */
  public evaluateRisk(
    events: BehaviorEvent[],
    now: number = Date.now(),
    examStartTime: number = now - 1000 * 60 * 15
  ): RiskState {
    const windowMs = this.config.windowDurationMs;
    const eventsInWindow = this.windowManager.getEventsInWindow(events, now);

    // If no events in the active window
    if (eventsInWindow.length === 0) {
      return {
        currentScore: 0,
        level: 'NORMAL',
        confidence: 0.95,
        timeWindowSeconds: Math.round(windowMs / 1000),
        eventCountInWindow: 0,
        humanReadableExplanation: 'Nominal physiological candidate baseline observed within the active window.',
        topContributingFactors: [],
        contributingSignalSummary: ['No active anomalies in the last 30 seconds'],
        breakdown: {
          attentionDeviationScore: 0,
          presenceScore: 0,
          environmentScore: 0,
        },
        primaryContributingFactor: 'Nominal physiological baseline',
        timeline: this.buildTimeline(events, examStartTime, now),
        lastCalculatedAt: now,
      };
    }

    // Aggregate factors and compute decayed score
    const breakdown = this.aggregator.aggregate(eventsInWindow, now);

    // Clamp score to [0, 100]
    const clampedScore = Math.min(100, Math.max(0, breakdown.rawScore));

    // Determine discrete Risk Level (NORMAL, LOW, MEDIUM, HIGH, REVIEW)
    const level = this.calculateRiskLevel(clampedScore);

    // Compute explainability confidence based on signal density & event confidence
    const avgEventConfidence =
      eventsInWindow.reduce((acc, e) => acc + (e.confidence || 0.8), 0) / eventsInWindow.length;
    const confidence = parseFloat(Math.min(0.99, Math.max(0.65, avgEventConfidence)).toFixed(2));

    // Generate human-readable explanation and summary
    const explanation = this.generateHumanExplanation(level, clampedScore, breakdown.factors, eventsInWindow.length, windowMs);
    const summary = this.generateSignalSummary(breakdown.factors);

    return {
      currentScore: clampedScore,
      level,
      confidence,
      timeWindowSeconds: Math.round(windowMs / 1000),
      eventCountInWindow: eventsInWindow.length,
      humanReadableExplanation: explanation,
      topContributingFactors: breakdown.factors,
      contributingSignalSummary: summary,
      breakdown: {
        attentionDeviationScore: breakdown.attentionScore,
        presenceScore: breakdown.presenceScore,
        environmentScore: breakdown.environmentScore,
      },
      primaryContributingFactor: explanation,
      timeline: this.buildTimeline(events, examStartTime, now),
      lastCalculatedAt: now,
    };
  }

  /**
   * Maps numeric score to discrete risk level
   */
  public calculateRiskLevel(score: number): 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW' {
    const t = this.config.levelThresholds;
    if (score >= t.REVIEW) return 'REVIEW';
    if (score >= t.HIGH) return 'HIGH';
    if (score >= t.MEDIUM) return 'MEDIUM';
    if (score >= t.LOW) return 'LOW';
    return 'NORMAL';
  }

  /**
   * Generates ethical, non-accusatory explanation of what triggered the risk score
   */
  private generateHumanExplanation(
    level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW',
    score: number,
    factors: RiskFactor[],
    eventCount: number,
    windowMs: number
  ): string {
    const windowSec = Math.round(windowMs / 1000);

    if (level === 'NORMAL' || factors.length === 0) {
      return 'Nominal physiological candidate baseline observed within the active window.';
    }

    const topFactor = factors[0];
    const topFactorText = `${topFactor.name} (${topFactor.count} event${topFactor.count > 1 ? 's' : ''})`;

    if (level === 'LOW') {
      return `Single minor behavioral deviation (${topFactor.name}) detected within the last ${windowSec}s. Within normal cognitive boundaries.`;
    }

    if (level === 'MEDIUM') {
      return `Several behavioral signals detected (${eventCount} occurrences within ${windowSec}s), predominantly ${topFactorText}. Pattern noted for review.`;
    }

    if (level === 'HIGH') {
      return `Multiple correlated behavioral signals (${topFactorText} alongside ${factors.length > 1 ? factors[1].name : 'environment changes'}) require human examiner review.`;
    }

    // REVIEW level (severe multiple signals)
    return `Priority review recommended: Compound behavioral anomaly cluster detected within ${windowSec}s. Academic examiner verification advised.`;
  }

  /**
   * Generates bullet-point list of contributing signals (including absence of certain signals)
   */
  private generateSignalSummary(factors: RiskFactor[]): string[] {
    const summary: string[] = [];

    // Add positive detections
    for (const factor of factors.slice(0, 3)) {
      summary.push(`${factor.count}× ${factor.description} (+${factor.contributionPoints} pts)`);
    }

    // Document non-detected critical signals for balanced context
    const hasMultipleFaces = factors.some(f => f.name.toLowerCase().includes('multiple'));
    if (!hasMultipleFaces) {
      summary.push('No secondary persons detected in camera perimeter');
    }

    const hasAbsence = factors.some(f => f.name.toLowerCase().includes('absence') || f.name.toLowerCase().includes('not detected'));
    if (!hasAbsence) {
      summary.push('Continuous candidate presence verified');
    }

    return summary;
  }

  /**
   * Reconstructs chronological risk timeline over the exam course (e.g. 10:02, 10:08, 10:11)
   */
  public buildTimeline(
    allEvents: BehaviorEvent[],
    examStartTime: number,
    currentTime: number
  ): RiskTimelinePoint[] {
    const points: RiskTimelinePoint[] = [];
    const totalDurationMs = Math.max(1000 * 60 * 15, currentTime - examStartTime);
    const intervalMs = 1000 * 60 * 2; // Every 2 minutes
    const stepCount = Math.min(15, Math.ceil(totalDurationMs / intervalMs));

    for (let i = 0; i <= stepCount; i++) {
      const stepTime = examStartTime + i * intervalMs;
      if (stepTime > currentTime + 1000) break;

      // Slice events active around that point in time
      const windowEvents = allEvents.filter(
        e => e.timestamp <= stepTime && e.timestamp >= stepTime - this.config.windowDurationMs
      );

      const offsetMinutes = Math.round((stepTime - examStartTime) / 60000);
      const date = new Date(stepTime);
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      let score = 0;
      let primarySignal = 'Nominal Baseline';

      if (windowEvents.length > 0) {
        const breakdown = this.aggregator.aggregate(windowEvents, stepTime);
        score = Math.min(100, breakdown.rawScore);
        if (breakdown.factors.length > 0) {
          primarySignal = breakdown.factors[0].name;
        }
      }

      points.push({
        timestamp: stepTime,
        offsetMinutes,
        formattedTime,
        score,
        level: this.calculateRiskLevel(score),
        activeEventCount: windowEvents.length,
        primarySignal,
      });
    }

    return points;
  }
}
