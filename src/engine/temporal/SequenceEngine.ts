import { BehaviorEvent } from '../../types';
import { EventDebouncer } from '../EventDebouncer';

export interface SequenceStep {
  eventType: string;
  timestamp: number;
  description: string;
}

export interface DetectedSequence {
  id: string;
  name: string;
  confidence: number;
  steps: SequenceStep[];
  startedAt: number;
  completedAt: number;
  durationSeconds: number;
  recommendation: string;
}

export class SequenceEngine {
  private sessionId: string;
  private debouncer: EventDebouncer;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private recentEvents: BehaviorEvent[] = [];

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
   * Ingests event into chronological sequence window (sliding 45 seconds)
   */
  public ingestEvent(event: BehaviorEvent): DetectedSequence | null {
    const now = Date.now();
    this.recentEvents.push(event);

    // Keep events within 45 seconds
    this.recentEvents = this.recentEvents.filter(e => now - e.timestamp <= 45000);

    // 1. Check for AI-Era External Interaction Pattern:
    // Window Blur -> Return Focus -> Paste or High-Speed Typing -> Rapid Answer Selection
    const hasBlur = this.recentEvents.some(
      e => e.type === 'WINDOW_BLUR' || e.type === 'TAB_VISIBILITY_CHANGE'
    );
    const hasPasteOrTypingBurst = this.recentEvents.some(
      e => e.type === 'CLIPBOARD_PASTE' || e.type === 'TYPING_SPEED_CHANGE'
    );
    const hasRapidAnswer = this.recentEvents.some(
      e => e.type === 'QUESTION_RAPID_ANSWER'
    );

    if (hasBlur && (hasPasteOrTypingBurst || hasRapidAnswer)) {
      if (this.debouncer.canEmit('AI_ERA_INTERACTION_PATTERN', now)) {
        this.debouncer.recordEmitted('AI_ERA_INTERACTION_PATTERN', now);

        const blurEvt = this.recentEvents.find(
          e => e.type === 'WINDOW_BLUR' || e.type === 'TAB_VISIBILITY_CHANGE'
        );
        const secondEvt = this.recentEvents.find(
          e => e.type === 'CLIPBOARD_PASTE' || e.type === 'TYPING_SPEED_CHANGE' || e.type === 'QUESTION_RAPID_ANSWER'
        );

        const syntheticSequenceEvent: BehaviorEvent = {
          id: `evt-seq-ai-${now}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId: this.sessionId,
          timestamp: now,
          type: 'AI_ERA_INTERACTION_PATTERN',
          category: 'fusion',
          severity: 'high',
          confidence: 0.92,
          duration: 15000,
          durationSeconds: 15,
          source: 'temporal_engine',
          description: 'Correlated multi-signal sequence: Exam focus exit followed promptly by external interaction or rapid response submission.',
          evidence: {
            additionalContext: `Sequential pattern: ${blurEvt?.description || 'Focus exit'} → ${secondEvt?.description || 'Interaction burst'}. Human examiner review requested.`,
          },
        };

        if (this.onEventCallback) {
          this.onEventCallback(syntheticSequenceEvent);
        }

        return {
          id: syntheticSequenceEvent.id,
          name: 'External Interaction & Rapid Answer Sequence',
          confidence: 0.92,
          steps: this.recentEvents.map(e => ({
            eventType: e.type,
            timestamp: e.timestamp,
            description: e.description,
          })),
          startedAt: this.recentEvents[0]?.timestamp || now,
          completedAt: now,
          durationSeconds: Math.round((now - (this.recentEvents[0]?.timestamp || now)) / 1000),
          recommendation: 'Evaluate question attempt answer against external reference timeline.',
        };
      }
    }

    return null;
  }
}
