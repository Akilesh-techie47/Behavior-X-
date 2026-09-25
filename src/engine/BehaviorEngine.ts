import { BehaviorEvent, EventType, EvidenceGraphData, CounterfactualScenario } from '../types';
import { BehaviorConfig, DEFAULT_BEHAVIOR_CONFIG } from './config';
import { EventDebouncer } from './EventDebouncer';
import { BehaviorEventStore } from './BehaviorEventStore';
import { EventAggregator } from './EventAggregator';
import { RiskEngine } from './risk/RiskEngine';
import { VisibilityDetector } from './detectors/VisibilityDetector';
import { FullscreenDetector } from './detectors/FullscreenDetector';
import { FaceDetector } from './detectors/FaceDetector';
import { AttentionDetector } from './detectors/AttentionDetector';
import { ClipboardDetector } from './detectors/ClipboardDetector';
import { KeystrokeDetector } from './interaction/KeystrokeDetector';
import { MouseDetector } from './interaction/MouseDetector';
import { QuestionIntelligenceEngine } from './questions/QuestionIntelligenceEngine';
import { PersonalBaselineEngine } from './baseline/PersonalBaselineEngine';
import { SequenceEngine } from './temporal/SequenceEngine';
import { MultimodalFusionEngine } from './fusion/MultimodalFusionEngine';
import { EvidenceGraphEngine } from './evidence/EvidenceGraphEngine';
import { CounterfactualEngine } from './counterfactual/CounterfactualEngine';

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
  public clipboardDetector: ClipboardDetector;
  public keystrokeDetector: KeystrokeDetector;
  public mouseDetector: MouseDetector;

  // Intelligence Sub-Engines
  public questionEngine: QuestionIntelligenceEngine;
  public baselineEngine: PersonalBaselineEngine;
  public sequenceEngine: SequenceEngine;
  public fusionEngine: MultimodalFusionEngine;
  public evidenceGraphEngine: EvidenceGraphEngine;
  public counterfactualEngine: CounterfactualEngine;

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
    this.clipboardDetector = new ClipboardDetector(sessionId, config, this.debouncer);
    this.keystrokeDetector = new KeystrokeDetector(sessionId, config, this.debouncer);
    this.mouseDetector = new MouseDetector(sessionId, config, this.debouncer);

    // Initialize V2 Intelligence Sub-Engines
    this.questionEngine = new QuestionIntelligenceEngine(sessionId, this.debouncer);
    this.baselineEngine = new PersonalBaselineEngine(sessionId, this.debouncer);
    this.sequenceEngine = new SequenceEngine(sessionId, this.debouncer);
    this.fusionEngine = new MultimodalFusionEngine();
    this.evidenceGraphEngine = new EvidenceGraphEngine();
    this.counterfactualEngine = new CounterfactualEngine(this.riskEngine);

    // Wire callbacks
    this.sequenceEngine.setCallback(evt => this.handleIncomingEvent(evt));
    this.questionEngine.setCallback(evt => this.handleIncomingEvent(evt));
    this.baselineEngine.setCallback(evt => this.handleIncomingEvent(evt));
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
    this.visibilityDetector.setSessionId(id);
    this.fullscreenDetector.setSessionId(id);
    this.faceDetector.setSessionId(id);
    this.attentionDetector.setSessionId(id);
    this.clipboardDetector.setSessionId(id);
    this.keystrokeDetector.setSessionId(id);
    this.mouseDetector.setSessionId(id);
    this.questionEngine.setSessionId(id);
    this.baselineEngine.setSessionId(id);
    this.sequenceEngine.setSessionId(id);
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
    this.clipboardDetector.start(handleEvent);
    this.keystrokeDetector.start(handleEvent);
    this.mouseDetector.start(handleEvent);
  }

  public stop(): void {
    if (!this.isRunningState) return;
    this.isRunningState = false;

    this.visibilityDetector.stop();
    this.fullscreenDetector.stop();
    this.faceDetector.stop();
    this.attentionDetector.stop();
    this.clipboardDetector.stop();
    this.keystrokeDetector.stop();
    this.mouseDetector.stop();
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

    // 2. Correlate with active question attempt
    this.questionEngine.correlateEventToActiveQuestion(event);

    // 3. Ingest into Sequence Engine for multi-signal patterns
    this.sequenceEngine.ingestEvent(event);

    // 4. Ingest into Personal Baseline Engine if gaze deviation
    if (event.category === 'attention') {
      this.baselineEngine.recordGazeDeviation();
    }

    // 5. Check for event aggregation
    const recent = this.eventStore.getRecentEvents(this.config.repeatedEventWindowMs, event.timestamp);
    const aggregatedEvent = this.aggregator.evaluateAggregation(recent, this.sessionId, event.timestamp);

    if (aggregatedEvent) {
      this.eventStore.addEvent(aggregatedEvent);
    }
  }

  /**
   * Builds active session Evidence Graph
   */
  public getEvidenceGraph(questionNumber: number = 1): EvidenceGraphData {
    const allEvents = this.eventStore.getEvents();
    const currentRisk = this.riskEngine.evaluateRisk(allEvents);
    return this.evidenceGraphEngine.buildGraph(allEvents, currentRisk, questionNumber);
  }

  /**
   * Computes true mathematical counterfactual scenarios
   */
  public getCounterfactualScenarios(): CounterfactualScenario[] {
    const allEvents = this.eventStore.getEvents();
    return this.counterfactualEngine.computeCounterfactuals(allEvents);
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
    let category: 'presence' | 'attention' | 'visibility' | 'system' | 'aggregated' | 'interaction' | 'question' | 'fusion' = 'attention';
    let severity: 'low' | 'medium' | 'high' = 'medium';

    if (type === 'MULTIPLE_FACES' || type === 'FACE_NOT_DETECTED' || type === 'MULTIPLE_PERSONS' || type === 'FACE_ABSENCE') {
      category = 'presence';
      severity = 'high';
    } else if (type === 'WINDOW_BLUR' || type === 'TAB_VISIBILITY_CHANGE' || type === 'FULLSCREEN_EXIT') {
      category = 'visibility';
      severity = 'medium';
    } else if (type === 'CAMERA_DISCONNECTED') {
      category = 'system';
      severity = 'high';
    } else if (type === 'RAPID_REPEATED_DEVIATION' || type === 'AI_ERA_INTERACTION_PATTERN') {
      category = type === 'AI_ERA_INTERACTION_PATTERN' ? 'fusion' : 'aggregated';
      severity = 'high';
    } else if (type === 'CLIPBOARD_PASTE' || type === 'TYPING_SPEED_CHANGE') {
      category = 'interaction';
      severity = 'medium';
    } else if (type === 'QUESTION_RAPID_ANSWER') {
      category = 'question';
      severity = 'medium';
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
