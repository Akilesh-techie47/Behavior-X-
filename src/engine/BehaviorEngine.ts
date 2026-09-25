import { BehaviorEvent, EventType } from '../types';
import { BehaviorConfig, DEFAULT_BEHAVIOR_CONFIG } from './config';
import { EventDebouncer } from './EventDebouncer';
import { BehaviorEventStore } from './BehaviorEventStore';
import { EventAggregator } from './EventAggregator';
import { RiskEngine } from './RiskEngine';
import { VisibilityDetector } from './detectors/VisibilityDetector';
import { FullscreenDetector } from './detectors/FullscreenDetector';
import { FaceDetector } from './detectors/FaceDetector';
import { AttentionDetector } from './detectors/AttentionDetector';

export class BehaviorEngine {
  private sessionId: string;
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;
  private eventStore: BehaviorEventStore;
  private aggregator: EventAggregator;
  private riskEngine: RiskEngine;

  // Independent modular detectors
  public visibilityDetector: VisibilityDetector;
  public fullscreenDetector: FullscreenDetector;
  public faceDetector: FaceDetector;
  public attentionDetector: AttentionDetector;

  private isRunningState: boolean = false;
  private engineMode: 'real' | 'demo' = 'real';

  constructor(
    sessionId: string,
    config: BehaviorConfig = DEFAULT_BEHAVIOR_CONFIG,
    eventStore?: BehaviorEventStore
  ) {
    this.sessionId = sessionId;
    this.config = config;
    this.debouncer = new EventDebouncer(config.eventCooldownMs);
    this.eventStore = eventStore || new BehaviorEventStore();
    this.aggregator = new EventAggregator(this.config, this.debouncer);
    this.riskEngine = new RiskEngine();

    // Initialize detectors
    this.visibilityDetector = new VisibilityDetector(sessionId, config, this.debouncer);
    this.fullscreenDetector = new FullscreenDetector(sessionId, this.debouncer);
    this.faceDetector = new FaceDetector(sessionId, config, this.debouncer);
    this.attentionDetector = new AttentionDetector(sessionId, config, this.debouncer);
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
    this.visibilityDetector.setSessionId(id);
    this.fullscreenDetector.setSessionId(id);
    this.faceDetector.setSessionId(id);
    this.attentionDetector.setSessionId(id);
  }

  public setMode(mode: 'real' | 'demo'): void {
    this.engineMode = mode;
  }

  public getMode(): 'real' | 'demo' {
    return this.engineMode;
  }

  public start(): void {
    if (this.isRunningState) return;
    this.isRunningState = true;

    const handleEvent = (event: BehaviorEvent) => {
      this.handleIncomingEvent(event);
    };

    this.visibilityDetector.start(handleEvent);
    this.fullscreenDetector.start(handleEvent);
    this.faceDetector.start(handleEvent);
    this.attentionDetector.start(handleEvent);
  }

  public stop(): void {
    if (!this.isRunningState) return;
    this.isRunningState = false;

    this.visibilityDetector.stop();
    this.fullscreenDetector.stop();
    this.faceDetector.stop();
    this.attentionDetector.stop();
  }

  public isRunning(): boolean {
    return this.isRunningState;
  }

  public getEventStore(): BehaviorEventStore {
    return this.eventStore;
  }

  public getRiskEngine(): RiskEngine {
    return this.riskEngine;
  }

  /**
   * Pipeline ingestion for detected events
   */
  public handleIncomingEvent(event: BehaviorEvent): void {
    // 1. Store event
    this.eventStore.addEvent(event);

    // 2. Check for event aggregation
    const recent = this.eventStore.getRecentEvents(this.config.repeatedEventWindowMs, event.timestamp);
    const aggregatedEvent = this.aggregator.evaluateAggregation(recent, this.sessionId, event.timestamp);

    if (aggregatedEvent) {
      this.eventStore.addEvent(aggregatedEvent);
    }
  }

  /**
   * Explicit synthetic trigger for Demo Mode
   */
  public triggerSyntheticEvent(
    type: EventType,
    customDescription?: string,
    evidenceOverride?: Record<string, unknown>
  ): BehaviorEvent {
    const now = Date.now();
    let category: 'presence' | 'attention' | 'visibility' | 'system' | 'aggregated' = 'attention';
    let severity: 'low' | 'medium' | 'high' = 'medium';

    if (type === 'MULTIPLE_FACES' || type === 'FACE_NOT_DETECTED') {
      category = 'presence';
      severity = 'high';
    } else if (type === 'WINDOW_BLUR' || type === 'TAB_VISIBILITY_CHANGE' || type === 'FULLSCREEN_EXIT') {
      category = 'visibility';
      severity = 'medium';
    } else if (type === 'CAMERA_DISCONNECTED') {
      category = 'system';
      severity = 'high';
    } else if (type === 'RAPID_REPEATED_DEVIATION') {
      category = 'aggregated';
      severity = 'high';
    }

    const syntheticEvent: BehaviorEvent = {
      id: `evt-demo-${now}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: this.sessionId,
      timestamp: now,
      type,
      category,
      severity,
      confidence: 0.95,
      duration: 3200,
      durationSeconds: 3.2,
      source: 'demo_mode',
      description:
        customDescription ||
        `[DEMO MODE] Controlled synthetic event generated for ${type.replace(/_/g, ' ')}.`,
      evidence: {
        durationMs: 3200,
        additionalContext: 'Demonstration simulation trigger',
        ...evidenceOverride,
      },
      metadata: { isSynthetic: true },
    };

    this.handleIncomingEvent(syntheticEvent);
    return syntheticEvent;
  }
}
