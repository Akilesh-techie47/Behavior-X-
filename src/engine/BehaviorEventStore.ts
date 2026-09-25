import { BehaviorEvent } from '../types';

export class BehaviorEventStore {
  private events: BehaviorEvent[] = [];
  private listeners: Array<(event: BehaviorEvent, allEvents: BehaviorEvent[]) => void> = [];

  constructor(initialEvents: BehaviorEvent[] = []) {
    this.events = [...initialEvents];
  }

  public addEvent(event: BehaviorEvent): void {
    // Maintain newest first
    this.events = [event, ...this.events];
    this.notify(event);
  }

  public getEvents(): BehaviorEvent[] {
    return [...this.events];
  }

  public getRecentEvents(windowMs: number, now: number = Date.now()): BehaviorEvent[] {
    return this.events.filter(e => {
      // Event timestamp might be epoch or exam offset. Normalize comparison
      const age = Math.abs(now - e.timestamp);
      return age <= windowMs;
    });
  }

  public clear(): void {
    this.events = [];
  }

  public subscribe(listener: (event: BehaviorEvent, allEvents: BehaviorEvent[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(newEvent: BehaviorEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(newEvent, this.events);
      } catch (err) {
        console.error('Error notifying event listener:', err);
      }
    }
  }
}
