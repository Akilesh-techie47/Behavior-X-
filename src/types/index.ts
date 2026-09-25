export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EventCategory =
  | 'presence'
  | 'attention'
  | 'visibility'
  | 'system'
  | 'aggregated'
  | 'interaction'
  | 'question'
  | 'fusion'
  | 'security';

export type EventType =
  | 'FACE_PRESENT'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES'
  | 'HEAD_TURN_LEFT'
  | 'HEAD_TURN_RIGHT'
  | 'LOOKING_AWAY'
  | 'PROLONGED_OFF_SCREEN_GAZE'
  | 'WINDOW_BLUR'
  | 'TAB_VISIBILITY_CHANGE'
  | 'FULLSCREEN_EXIT'
  | 'CAMERA_DISCONNECTED'
  | 'RAPID_REPEATED_DEVIATION'
  | 'FACE_ABSENCE'
  | 'MULTIPLE_PERSONS'
  | 'ATTENTION_DEVIATION'
  | 'OFF_SCREEN_GAZE'
  | 'TAB_SWITCH'
  | 'AUDIO_ANOMALY'
  | 'SUSPICIOUS_POSTURE'
  // V2 Interaction Signals
  | 'KEYSTROKE_BURST'
  | 'TYPING_SPEED_CHANGE'
  | 'TYPING_PAUSE_ANOMALY'
  | 'SHORTCUT_TRIGGERED'
  | 'MOUSE_VELOCITY_SPIKE'
  | 'MOUSE_HESITATION'
  | 'CURSOR_IDLE_ANOMALY'
  | 'CLIPBOARD_COPY'
  | 'CLIPBOARD_PASTE'
  | 'CLIPBOARD_CUT'
  // V2 Question-Level Signals
  | 'QUESTION_RAPID_ANSWER'
  | 'QUESTION_REPEATED_SWITCH'
  | 'QUESTION_RESPONSE_TIME_ANOMALY'
  // V2 Fusion & AI-Era Integrity Signals
  | 'AI_ERA_INTERACTION_PATTERN'
  | 'EXTERNAL_ASSISTANCE_SEQUENCE'
  | 'DEVTOOLS_SUSPECTED'
  | 'CAMERA_OCCLUSION'
  | 'LIGHTING_DEGRADED'
  | 'ENVIRONMENTAL_ANOMALY';

export type RiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW' | 'nominal' | 'elevated' | 'high';

export type EvidenceQualityLevel = 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';
export type ObservationQualityLevel = 'DEGRADED' | 'ACCEPTABLE' | 'OPTIMAL';

export type ReviewStatus = 'UNREVIEWED' | 'MARK_FOR_REVIEW' | 'REVIEWED' | 'NEEDS_FOLLOW_UP' | 'CONFIRMED' | 'DISMISSED' | 'UNCERTAIN';

export type MonitoringProfile = 'STANDARD' | 'BEHAVIORAL' | 'ENHANCED';

export interface ObservableSignals {
  faceCount?: number;
  gazeDirection?: 'center' | 'left' | 'right' | 'up' | 'down';
  headPitchDeg?: number;
  headYawDeg?: number;
  windowFocused?: boolean;
  visibilityState?: 'visible' | 'hidden';
  isFullscreen?: boolean;
  durationMs?: number;
  repeatedCount?: number;
  audioPeakDb?: number;
  additionalContext?: string;
  // Interaction Telemetry
  typingSpeedKps?: number;
  keystrokeCount?: number;
  clipboardLength?: number;
  clipboardTextSnippet?: string;
  mouseSpeedPxSec?: number;
  mouseAcceleration?: number;
  questionResponseSec?: number;
  expectedResponseSec?: number;
  baselineDeviationPct?: number;
  lightingScore?: number;
}

export interface BehaviorEvent {
  id: string;
  sessionId: string;
  timestamp: number; // offset ms from exam start or absolute epoch ms
  type: EventType;
  category: EventCategory;
  severity: EventSeverity;
  confidence: number; // 0.0 - 1.0
  duration: number; // in milliseconds
  durationSeconds?: number;
  source:
    | 'face_detector'
    | 'visibility_detector'
    | 'fullscreen_detector'
    | 'attention_detector'
    | 'camera_lifecycle'
    | 'event_aggregator'
    | 'demo_mode'
    | 'keystroke_detector'
    | 'mouse_detector'
    | 'question_engine'
    | 'fusion_engine'
    | 'temporal_engine'
    | 'security_checker';
  description: string;
  evidence: ObservableSignals;
  metadata?: Record<string, unknown>;
  questionNumberAtTrigger?: number;
  resolved?: boolean;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  institution: string;
  avatarUrl?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  section: string;
  category?: string;
  prompt: string;
  codeSnippet?: string;
  options: QuestionOption[];
  correctOptionId?: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  expectedResponseTimeSeconds?: number;
}

export interface QuestionAttempt {
  questionId: string;
  questionNumber: number;
  openedAt: number;
  firstInteractionAt: number | null;
  submittedAt: number | null;
  responseDurationMs: number;
  answerChanges: number;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDurationSeconds: number;
  selectedOptionId: string | null;
  isFlagged: boolean;
  anomalyScore: number; // 0-100
  signals: string[];
  isRapidAnswer: boolean;
}

export type SessionStatus = 'not_started' | 'active' | 'in_review' | 'submitted' | 'terminated';

export interface RiskFactor {
  name: string;
  category: EventCategory;
  count: number;
  contributionPoints: number;
  description: string;
}

export interface RiskTimelinePoint {
  timestamp: number; // epoch ms
  offsetMinutes: number; // minutes from exam start
  formattedTime: string; // "10:02"
  score: number; // 0-100
  level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';
  activeEventCount: number;
  primarySignal: string;
  evidenceQuality?: number; // 0-100
  observationQuality?: number; // 0-100
}

export interface RiskBreakdown {
  attentionDeviationScore: number;
  presenceScore: number;
  environmentScore: number;
  interactionScore?: number;
  questionTimingScore?: number;
  temporalSequenceScore?: number;
}

// ==========================================
// V2 THREE CORE SCORES & RISK STATE
// ==========================================
export interface RiskState {
  currentScore: number; // 0 to 100 (Integrity Review Priority)
  level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';
  confidence?: number; // 0.0 to 1.0

  // 1. INTEGRITY REVIEW PRIORITY
  reviewPriorityScore?: number; // 0-100
  reviewPriorityLevel?: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';

  // 2. EVIDENCE QUALITY
  evidenceQualityScore?: number; // 0-100
  evidenceQualityLevel?: EvidenceQualityLevel;

  // 3. SYSTEM OBSERVATION QUALITY
  observationQualityScore?: number; // 0-100
  observationQualityLevel?: ObservationQualityLevel;

  timeWindowSeconds?: number; // e.g. 30s
  eventCountInWindow?: number;
  humanReadableExplanation?: string;
  topContributingFactors?: RiskFactor[];
  contributingSignalSummary?: string[];
  breakdown: RiskBreakdown;
  timeline?: RiskTimelinePoint[];
  primaryContributingFactor?: string; // backwards compatibility
  lastCalculatedAt: number;
}

// ==========================================
// V2 EVIDENCE GRAPH MODELS
// ==========================================
export type EvidenceNodeType =
  | 'EVENT'
  | 'SIGNAL'
  | 'QUESTION'
  | 'TEMPORAL_LINK'
  | 'RISK_CONTRIBUTION'
  | 'BASELINE_DEVIATION';

export interface EvidenceNode {
  id: string;
  label: string;
  type: EvidenceNodeType;
  timestamp: number;
  confidence: number;
  weight: number;
  details: string;
  category?: EventCategory;
  relatedQuestionNumber?: number;
  isTrigger?: boolean;
}

export type EvidenceRelationshipType =
  | 'CAUSED_BY'
  | 'TEMPORAL_PROXIMITY'
  | 'SYNERGY'
  | 'EVIDENCE_FOR'
  | 'CONCURRENT';

export interface EvidenceRelationship {
  id: string;
  source: string; // source node id
  target: string; // target node id
  relationshipType: EvidenceRelationshipType;
  strength: number; // 0.0 to 1.0
  label: string;
}

export interface EvidenceContribution {
  name: string;
  rawPoints: number;
  decayedPoints: number;
  percentageOfTotal: number;
  category: EventCategory;
  description: string;
}

export interface EvidenceGraphData {
  nodes: EvidenceNode[];
  relationships: EvidenceRelationship[];
  contributions: EvidenceContribution[];
  summary: string;
}

// ==========================================
// V2 COUNTERFACTUAL EXPLANATION
// ==========================================
export interface CounterfactualScenario {
  signalId: string;
  label: string;
  originalScore: number;
  scoreWithoutSignal: number;
  delta: number;
  explanation: string;
}

// ==========================================
// V2 PERSONAL SESSION BASELINE
// ==========================================
export interface SessionBaseline {
  establishedAt: number | null;
  sampleCount: number;
  baselineTypingSpeedKps: number;
  baselinePauseDurationSec: number;
  baselineQuestionResponseSec: number;
  baselineGazeDeviationRate: number; // per minute
  baselineMouseVelocity: number;
  isEstablished: boolean;
}

// ==========================================
// V2 INTERACTION & KEYBOARD/MOUSE TELEMETRY
// ==========================================
export interface KeystrokeMetrics {
  currentSpeedKps: number;
  avgDwellTimeMs: number;
  avgIntervalMs: number;
  pauseCount: number;
  shortcutCount: number;
  suddenShiftRatio: number;
  lastKeystrokeTime: number;
}

export interface MouseMetrics {
  totalDistancePx: number;
  currentVelocityPxSec: number;
  maxAcceleration: number;
  clickCount: number;
  hesitationCount: number;
  idleDurationMs: number;
  lastMoveTime: number;
}

// ==========================================
// V2 BROWSER CAPABILITY & SECURITY
// ==========================================
export type BrowserCapabilityStatus =
  | 'SUPPORTED'
  | 'PARTIAL'
  | 'NOT AVAILABLE IN BROWSER'
  | 'SIMULATION ONLY';

export interface BrowserCapability {
  id: string;
  name: string;
  status: BrowserCapabilityStatus;
  notes: string;
  verifiedInEnvironment: boolean;
}

export interface BrowserIntegrityReport {
  capabilities: BrowserCapability[];
  isTampered: boolean;
  tamperSignals: string[];
  devToolsLikelyOpen: boolean;
  checkedAt: number;
}

// ==========================================
// V2 HUMAN-IN-THE-LOOP AUDIT
// ==========================================
export interface ReviewDecision {
  id: string;
  sessionId: string;
  eventId?: string;
  decision: 'CONFIRMED' | 'DISMISSED' | 'UNCERTAIN' | 'MARK_FOR_REVIEW';
  examinerId: string;
  examinerName: string;
  note: string;
  timestamp: number;
}

// ==========================================
// V2 SYSTEM QUALITY & FAIRNESS
// ==========================================
export interface SystemQualitySnapshot {
  detectionQualityScore: number; // 0-100
  cameraQualityScore: number; // 0-100
  environmentScore: number; // 0-100
  browserCompatibilityScore: number; // 0-100
  falsePositiveSuppressionRate: number; // 0-100
  overallSystemHealthScore: number; // 0-100
  timestamp: number;
}

export interface PrivacyState {
  cameraProcessing: 'transient_ram_canvas' | 'off';
  rawVideoStorage: 'disabled_enforced';
  biometricIdentification: 'disabled_no_embeddings';
  eventStorage: 'session_limited_telemetry';
  monitoringProfile?: MonitoringProfile;
  retentionPolicy: {
    rawVideo: 'never_stored_0ms';
    behaviorEvents: 'session_limited_auto_purge';
    aggregatedReport: 'retained_audit_policy';
    maxRetentionDays: number;
  };
  dataMinimizationVerified: boolean;
}

export interface CameraState {
  status: 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'simulated';
  hasPermission: boolean;
  stream: MediaStream | null;
  errorMessage?: string;
  deviceId?: string;
  mode?: 'real' | 'demo';
  lightingLevel?: 'poor' | 'fair' | 'good';
  videoResolution?: { width: number; height: number };
}

export interface SystemStatus {
  cameraReady: boolean;
  edgeEngineReady: boolean;
  networkLatencyMs: number;
  privacyMode: 'strict_edge_only';
  browserSupported: boolean;
  engineMode: 'real' | 'demo';
  monitoringProfile?: MonitoringProfile;
}

export interface ExamSettings {
  examTitle: string;
  courseCode: string;
  courseName?: string;
  totalDurationMinutes: number;
  allowReviewAfterSubmission: boolean;
  edgeVisionSamplingHz: number;
  strictGazeThresholdSeconds: number;
  requireFullscreen: boolean;
  monitoringProfile?: MonitoringProfile;
  allowedBrowserBehavior?: string[];
}

export interface ExamSession {
  id: string;
  student: Student;
  settings: ExamSettings;
  startedAt: number | null;
  endedAt: number | null;
  status: SessionStatus;
  reviewStatus?: ReviewStatus;
  durationSeconds: number;
  questionCount: number;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  flaggedQuestionIds: string[];
  questionAttempts?: Record<string, QuestionAttempt>;
  riskState: RiskState;
  events: BehaviorEvent[];
  baseline?: SessionBaseline;
  evidenceGraph?: EvidenceGraphData;
  counterfactuals?: CounterfactualScenario[];
  reviewDecisions?: ReviewDecision[];
  privacyState?: PrivacyState;
  notes?: string;
}
