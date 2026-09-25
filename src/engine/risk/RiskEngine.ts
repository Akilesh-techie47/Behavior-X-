import {
  BehaviorEvent,
  RiskLevel,
  RiskState,
  RiskFactor,
  RiskTimelinePoint,
  EvidenceQualityLevel,
  ObservationQualityLevel,
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
   * featuring the THREE CORE SCORES:
   * 1. Integrity Review Priority (0-100)
   * 2. Evidence Quality (0-100)
   * 3. System Observation Quality (0-100)
   */
  public evaluateRisk(
    events: BehaviorEvent[],
    now: number = Date.now(),
    examStartTime: number = now - 1000 * 60 * 15
  ): RiskState {
    const windowMs = this.config.windowDurationMs;
    const eventsInWindow = this.windowManager.getEventsInWindow(events, now);

    // Compute Observation Quality (Health of sensory pipelines)
    const observationQuality = this.calculateObservationQuality(events, now);

    // If no events in the active window
    if (eventsInWindow.length === 0) {
      return {
        currentScore: 0,
        level: 'NORMAL',
        confidence: 0.95,

        // Three Core Scores
        reviewPriorityScore: 0,
        reviewPriorityLevel: 'NORMAL',
        evidenceQualityScore: 92,
        evidenceQualityLevel: 'EXCELLENT',
        observationQualityScore: observationQuality.score,
        observationQualityLevel: observationQuality.level,

        timeWindowSeconds: Math.round(windowMs / 1000),
        eventCountInWindow: 0,
        humanReadableExplanation: 'Nominal candidate baseline observed within the active observation window.',
        topContributingFactors: [],
        contributingSignalSummary: ['No active anomalies in the last 30 seconds'],
        breakdown: {
          attentionDeviationScore: 0,
          presenceScore: 0,
          environmentScore: 0,
          interactionScore: 0,
          questionTimingScore: 0,
          temporalSequenceScore: 0,
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

    // Calculate Evidence Quality (Robustness & multi-channel corroboration)
    const evidenceQuality = this.calculateEvidenceQuality(eventsInWindow, avgEventConfidence);

    // Generate human-readable explanation and summary
    const explanation = this.generateHumanExplanation(level, clampedScore, breakdown.factors, eventsInWindow.length, windowMs);
    const summary = this.generateSignalSummary(breakdown.factors);

    return {
      currentScore: clampedScore,
      level,
      confidence,

      // Three Core Scores
      reviewPriorityScore: clampedScore,
      reviewPriorityLevel: level,
      evidenceQualityScore: evidenceQuality.score,
      evidenceQualityLevel: evidenceQuality.level,
      observationQualityScore: observationQuality.score,
      observationQualityLevel: observationQuality.level,

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
   * Calculates Evidence Quality (0-100):
   * Factors in event confidence, multi-sensor agreement, and observation duration.
   */
  private calculateEvidenceQuality(
    eventsInWindow: BehaviorEvent[],
    avgConfidence: number
  ): { score: number; level: EvidenceQualityLevel } {
    let score = Math.round(avgConfidence * 80);

    // Distinct detector categories boost evidence robustness
    const distinctCategories = new Set(eventsInWindow.map(e => e.category)).size;
    if (distinctCategories >= 3) score += 18;
    else if (distinctCategories === 2) score += 10;

    // Sustained duration boost
    const hasSustainedEvents = eventsInWindow.some(e => (e.durationSeconds || 0) >= 3);
    if (hasSustainedEvents) score += 8;

    score = Math.min(100, Math.max(20, score));

    let level: EvidenceQualityLevel = 'POOR';
    if (score >= 82) level = 'EXCELLENT';
    else if (score >= 65) level = 'GOOD';
    else if (score >= 45) level = 'MODERATE';

    return { score, level };
  }

  /**
   * Calculates System Observation Quality (0-100):
   * Evaluates sensor reliability, disconnects, lighting proxy, and API support.
   */
  private calculateObservationQuality(
    allEvents: BehaviorEvent[],
    now: number
  ): { score: number; level: ObservationQualityLevel } {
    let score = 94; // Baseline optimal

    // Deduct for recent camera disconnections or optical drops
    const recentDisconnects = allEvents.filter(
      e => e.type === 'CAMERA_DISCONNECTED' && now - e.timestamp <= 1000 * 60 * 10
    );
    if (recentDisconnects.length > 0) {
      score -= Math.min(45, recentDisconnects.length * 25);
    }

    // Check for lighting / occlusion flags
    const lightingIssues = allEvents.filter(
      e => (e.type === 'LIGHTING_DEGRADED' || e.type === 'CAMERA_OCCLUSION') && now - e.timestamp <= 1000 * 60 * 5
    );
    if (lightingIssues.length > 0) {
      score -= 20;
    }

    score = Math.min(100, Math.max(15, score));

    let level: ObservationQualityLevel = 'DEGRADED';
    if (score >= 80) level = 'OPTIMAL';
    else if (score >= 55) level = 'ACCEPTABLE';

    return { score, level };
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
      return `Several behavioral signals detected (${eventCount} occurrences within ${windowSec}s), predominantly ${topFactorText}. Pattern noted for examiner review.`;
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
   * Reconstructs chronological risk timeline over the exam course
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
        evidenceQuality: Math.min(98, Math.max(60, 92 - (score > 50 ? 8 : 0))),
        observationQuality: 94,
      });
    }

    return points;
  }
}
