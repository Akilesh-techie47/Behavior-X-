import { BehaviorEvent, EventType } from '../types';
import { BehaviorConfig, DEFAULT_BEHAVIOR_CONFIG } from './config';
import { EventDebouncer } from './EventDebouncer';

export interface AggregatorOptions {
  windowMs?: number;
  minEventsForAggregation?: number;
  repeatedEventWindowMs?: number;
  repeatedEventCountThreshold?: number;
}

export class EventAggregator {
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;

  constructor(
    configOrOptions: BehaviorConfig | AggregatorOptions = DEFAULT_BEHAVIOR_CONFIG,
    debouncer?: EventDebouncer
  ) {
    const baseConfig = { ...DEFAULT_BEHAVIOR_CONFIG };
    if ('windowMs' in configOrOptions && (configOrOptions as AggregatorOptions).windowMs !== undefined) {
      baseConfig.repeatedEventWindowMs = (configOrOptions as AggregatorOptions).windowMs!;
    }
    if ('minEventsForAggregation' in configOrOptions && (configOrOptions as AggregatorOptions).minEventsForAggregation !== undefined) {
      baseConfig.repeatedEventCountThreshold = (configOrOptions as AggregatorOptions).minEventsForAggregation!;
    }
    this.config = { ...baseConfig, ...(configOrOptions as Partial<BehaviorConfig>) };
    this.debouncer = debouncer ?? new EventDebouncer(this.config.eventCooldownMs);
  }

  /**
   * Checks if recent behavioral events warrant a compound / aggregated event
   * e.g., 3 attention deviations or window changes in 45 seconds -> RAPID_REPEATED_DEVIATION
   */
  public evaluateAggregation(
    recentEvents: BehaviorEvent[],
    sessionId: string,
    now: number = Date.now()
  ): BehaviorEvent | null {
    // Only aggregate if cooldown permits
    if (!this.debouncer.canEmit('RAPID_REPEATED_DEVIATION', now)) {
      return null;
    }

    const windowMs = this.config.repeatedEventWindowMs;
    // Count attention or visibility deviations within recent time window
    const targetCategories = new Set(['attention', 'visibility', 'presence']);
    const eligibleEvents = recentEvents.filter(
      e =>
        targetCategories.has(e.category) &&
        e.type !== 'RAPID_REPEATED_DEVIATION' &&
        Math.abs(now - e.timestamp) <= windowMs
    );

    if (eligibleEvents.length >= this.config.repeatedEventCountThreshold) {
      this.debouncer.recordEmitted('RAPID_REPEATED_DEVIATION', now);

      return {
        id: `evt-agg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId,
        timestamp: now,
        type: 'RAPID_REPEATED_DEVIATION',
        category: 'aggregated',
        severity: 'high',
        confidence: 0.95,
        duration: windowMs,
        durationSeconds: Math.round(windowMs / 1000),
        source: 'event_aggregator',
        description: `Rapid repeated behavioral deviations detected (${eligibleEvents.length} occurrences in ${Math.round(windowMs / 1000)}s).`,
        evidence: {
          repeatedCount: eligibleEvents.length,
          additionalContext: `Cluster of events: ${eligibleEvents.map(e => e.type).slice(0, 4).join(', ')}`,
        },
      };
    }

    return null;
  }
}
