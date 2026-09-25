import { BehaviorEvent, EventCategory, RiskFactor } from '../../types';
import { RiskConfig } from './riskConfig';
import { RiskWindow } from './RiskWindow';

export interface ScoredFactorBreakdown {
  rawScore: number;
  decayedScore: number;
  categoriesPresent: Set<EventCategory>;
  factors: RiskFactor[];
  attentionScore: number;
  presenceScore: number;
  environmentScore: number;
}

export class RiskAggregator {
  private config: RiskConfig;
  private windowManager: RiskWindow;

  constructor(config: RiskConfig, windowManager: RiskWindow) {
    this.config = config;
    this.windowManager = windowManager;
  }

  /**
   * Aggregates and applies documented weights and temporal decay to events in the current window
   */
  public aggregate(eventsInWindow: BehaviorEvent[], now: number = Date.now()): ScoredFactorBreakdown {
    const factorMap = new Map<string, { category: EventCategory; count: number; rawPoints: number; description: string }>();
    const categoriesPresent = new Set<EventCategory>();

    let totalDecayedScore = 0;
    let attentionScore = 0;
    let presenceScore = 0;
    let environmentScore = 0;

    for (const evt of eventsInWindow) {
      const weight = this.getBaseWeightForEventType(evt.type);
      const decay = this.windowManager.calculateDecay(evt.timestamp, now, this.config.decayHalfLifeMs);
      const eventScore = weight * decay;

      categoriesPresent.add(evt.category);
      totalDecayedScore += eventScore;

      // Category attribution
      if (evt.category === 'attention') {
        attentionScore += eventScore;
      } else if (evt.category === 'presence') {
        presenceScore += eventScore;
      } else if (evt.category === 'visibility' || evt.category === 'system') {
        environmentScore += eventScore;
      }

      // Aggregate factors for human-readable breakdown
      const factorKey = evt.type;
      const existing = factorMap.get(factorKey);
      if (existing) {
        existing.count += 1;
        existing.rawPoints += Math.round(eventScore);
      } else {
        factorMap.set(factorKey, {
          category: evt.category,
          count: 1,
          rawPoints: Math.round(eventScore),
          description: this.getReadableDescription(evt.type),
        });
      }
    }

    // Apply synergy multiplier if signals span multiple behavioral domains (e.g. looking away + window switch)
    if (categoriesPresent.size >= 2) {
      totalDecayedScore *= this.config.multiCategorySynergyMultiplier;
    }

    const factors: RiskFactor[] = Array.from(factorMap.entries())
      .map(([name, data]) => ({
        name: this.formatFactorName(name),
        category: data.category,
        count: data.count,
        contributionPoints: data.rawPoints,
        description: data.description,
      }))
      .sort((a, b) => b.contributionPoints - a.contributionPoints);

    return {
      rawScore: Math.round(totalDecayedScore),
      decayedScore: totalDecayedScore,
      categoriesPresent,
      factors,
      attentionScore: Math.min(40, Math.round(attentionScore)),
      presenceScore: Math.min(40, Math.round(presenceScore)),
      environmentScore: Math.min(20, Math.round(environmentScore)),
    };
  }

  private getBaseWeightForEventType(type: string): number {
    const w = this.config.weights;
    switch (type) {
      case 'MULTIPLE_FACES':
      case 'MULTIPLE_PERSONS':
        return w.multipleFaces;
      case 'FACE_NOT_DETECTED':
      case 'FACE_ABSENCE':
        return w.faceNotDetected;
      case 'PROLONGED_OFF_SCREEN_GAZE':
      case 'OFF_SCREEN_GAZE':
        return w.prolongedOffScreenGaze;
      case 'LOOKING_AWAY':
      case 'ATTENTION_DEVIATION':
        return w.lookingAway;
      case 'HEAD_TURN_LEFT':
      case 'HEAD_TURN_RIGHT':
        return w.headTurn;
      case 'WINDOW_BLUR':
        return w.windowBlur;
      case 'TAB_VISIBILITY_CHANGE':
      case 'TAB_SWITCH':
        return w.tabVisibilityChange;
      case 'FULLSCREEN_EXIT':
        return w.fullscreenExit;
      case 'RAPID_REPEATED_DEVIATION':
        return w.rapidRepeatedDeviation;
      case 'CAMERA_DISCONNECTED':
        return w.cameraDisconnected;
      default:
        return 5;
    }
  }

  private formatFactorName(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private getReadableDescription(type: string): string {
    switch (type) {
      case 'MULTIPLE_FACES':
        return 'Secondary person detected in field of view';
      case 'FACE_NOT_DETECTED':
        return 'Candidate absence from workstation perimeter';
      case 'PROLONGED_OFF_SCREEN_GAZE':
        return 'Sustained off-screen gaze orientation (>5s)';
      case 'LOOKING_AWAY':
        return 'Attention deviation away from forward baseline';
      case 'WINDOW_BLUR':
        return 'Exam window lost active operating system focus';
      case 'TAB_VISIBILITY_CHANGE':
        return 'Browser tab hidden or minimized';
      case 'FULLSCREEN_EXIT':
        return 'Assessment workspace exited full-screen view';
      case 'RAPID_REPEATED_DEVIATION':
        return 'Cluster of repeated deviations in short interval';
      default:
        return 'Observable behavioral telemetry anomaly';
    }
  }
}
