import { BehaviorEvent, EventType } from '../types';

export class EventDebouncer {
  private lastEmittedAt: Map<string, number> = new Map();
  private cooldownMap: Record<string, number>;

  constructor(cooldownMap: Record<string, number> = {}) {
    this.cooldownMap = cooldownMap;
  }

  /**
   * Evaluates if an event of given type should be emitted based on configured cooldown
   */
  public canEmit(type: EventType, now: number = Date.now()): boolean {
    const cooldown = this.cooldownMap[type] || 3000;
    const lastTime = this.lastEmittedAt.get(type) || 0;
    return now - lastTime >= cooldown;
  }

  /**
   * Marks that an event of given type was emitted at timestamp
   */
  public recordEmitted(type: EventType, now: number = Date.now()): void {
    this.lastEmittedAt.set(type, now);
  }

  /**
   * Resets all cooldowns
   */
  public reset(): void {
    this.lastEmittedAt.clear();
  }

  public setCooldown(type: EventType, cooldownMs: number): void {
    this.cooldownMap[type] = cooldownMs;
  }
}
