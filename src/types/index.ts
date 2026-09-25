export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EventCategory =
  | 'presence'
  | 'attention'
  | 'visibility'
  | 'system'
  | 'aggregated';

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
  | 'TAB_SWITCH';

export type RiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW' | 'nominal' | 'elevated' | 'high';

export type ReviewStatus = 'UNREVIEWED' | 'MARK_FOR_REVIEW' | 'REVIEWED' | 'NEEDS_FOLLOW_UP';

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
}

export interface BehaviorEvent {
  id: string;
  sessionId: string;
  timestamp: number; // offset ms from exam start or absolute epoch ms
  type: EventType;
  category: EventCategory;
  severity: EventSeverity;
  confidence: number; // 0.0 - 1.0
  duration: number; // in milliseconds or seconds (durationSeconds compatibility)
  durationSeconds?: number;
  source: 'face_detector' | 'visibility_detector' | 'fullscreen_detector' | 'attention_detector' | 'camera_lifecycle' | 'event_aggregator' | 'demo_mode';
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
  prompt: string;
  codeSnippet?: string;
  options: QuestionOption[];
  correctOptionId?: string;
  points: number;
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
}

export interface RiskState {
  currentScore: number; // 0 to 100
  level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';
  confidence: number; // 0.0 to 1.0
  timeWindowSeconds: number; // e.g. 30s
  eventCountInWindow: number;
  humanReadableExplanation: string;
  topContributingFactors: RiskFactor[];
  contributingSignalSummary: string[];
  breakdown: {
    attentionDeviationScore: number;
    presenceScore: number;
    environmentScore: number;
  };
  timeline?: RiskTimelinePoint[];
  primaryContributingFactor?: string; // backwards compatibility
  lastCalculatedAt: number;
}

export interface PrivacyState {
  cameraProcessing: 'transient_ram_canvas' | 'off';
  rawVideoStorage: 'disabled_enforced';
  biometricIdentification: 'disabled_no_embeddings';
  eventStorage: 'session_limited_telemetry';
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
}

export interface SystemStatus {
  cameraReady: boolean;
  edgeEngineReady: boolean;
  networkLatencyMs: number;
  privacyMode: 'strict_edge_only';
  browserSupported: boolean;
  engineMode: 'real' | 'demo';
}

export interface ExamSettings {
  examTitle: string;
  courseCode: string;
  totalDurationMinutes: number;
  allowReviewAfterSubmission: boolean;
  edgeVisionSamplingHz: number;
  strictGazeThresholdSeconds: number;
  requireFullscreen: boolean;
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
  riskState: RiskState;
  events: BehaviorEvent[];
  privacyState?: PrivacyState;
  notes?: string;
}
