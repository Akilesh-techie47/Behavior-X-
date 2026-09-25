import { BehaviorEvent } from '../../types';

export class RiskWindow {
  private windowDurationMs: number;

  constructor(windowDurationMs: number = 30000) {
    this.windowDurationMs = windowDurationMs;
  }

  public setWindowDuration(ms: number): void {
    this.windowDurationMs = ms;
  }

  public getWindowDuration(): number {
    return this.windowDurationMs;
  }

  /**
   * Filters events that occurred within the sliding window from reference timestamp
   */
  public getEventsInWindow(events: BehaviorEvent[], now: number = Date.now()): BehaviorEvent[] {
    return events.filter(e => {
      const delta = now - e.timestamp;
      return delta >= 0 && delta <= this.windowDurationMs;
    });
  }

  /**
   * Calculates exponential decay multiplier for an event based on its age
   * Returns a factor from 0.0 to 1.0 (recent events ≈ 1.0; older events decay)
   */
  public calculateDecay(eventTimestamp: number, now: number, halfLifeMs: number = 45000): number {
    const ageMs = Math.max(0, now - eventTimestamp);
    // Exponential decay: e ^ (-ln(2) * age / halfLife)
    return Math.pow(0.5, ageMs / halfLifeMs);
  }
}
