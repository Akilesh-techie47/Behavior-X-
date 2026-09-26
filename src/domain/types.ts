/**
 * BEHAVIOR-X domain model
 *
 * The vocabulary here is deliberately evidence-first. There is no "risk score",
 * no "cheating probability", no "suspicion level". A session is a set of
 * recorded *signals*; a *bundle* is a group of signals that occurred close
 * together and may deserve a human decision; a *decision* is what a person
 * concluded. The system never concludes on its own.
 */

export type Simulated = true;

/* ------------------------------------------------------------------ *
 * Candidates & institutions
 * ------------------------------------------------------------------ */

export interface Candidate {
  id: string;
  name: string;
  registrationId: string;
  email: string;
  institution: string;
  faculty: string;
  cohort: string;
  accommodationNotes?: string;
}

export interface Examiner {
  id: string;
  name: string;
  role: string;
  certification: string;
}

/* ------------------------------------------------------------------ *
 * Examinations
 * ------------------------------------------------------------------ */

export type QuestionKind = 'code' | 'mcq' | 'written' | 'numeric';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  section: string;
  kind: QuestionKind;
  prompt: string;
  points: number;
  codeStub?: string;
  starterCode?: string;
  options?: QuestionOption[];
  expectedSeconds: number;
  guidance?: string;
}

export interface PolicyClause {
  id: string;
  reference: string;
  text: string;
  appliesTo: EvidenceCategory[];
}

export interface ExamSection {
  id: string;
  title: string;
  questionNumbers: number[];
}

export type ExamStatus = 'draft' | 'scheduled' | 'live' | 'closed' | 'archived';

export interface ExamDefinition {
  id: string;
  code: string;
  title: string;
  course: string;
  faculty: string;
  term: string;
  status: ExamStatus;
  durationMinutes: number;
  questionCount: number;
  totalPoints: number;
  scheduledWindow: { opensAt: string; closesAt: string };
  candidateCount: number;
  completedCount: number;
  flaggedCount: number;
  sections: ExamSection[];
  policy: PolicyClause[];
  questions: Question[];
  requiresSecondaryDevice: boolean;
  /** Every artefact in this exam is generated, not recorded. */
  simulated: true;
}

/* ------------------------------------------------------------------ *
 * Devices & environment
 * ------------------------------------------------------------------ */

export type DeviceKind =
  | 'laptop'
  | 'phone'
  | 'camera'
  | 'microphone'
  | 'screen'
  | 'network'
  | 'browser';

export type DeviceStatus =
  | 'connected'
  | 'ready'
  | 'active'
  | 'degraded'
  | 'disconnected'
  | 'denied'
  | 'unavailable'
  | 'not_required';

export interface DeviceState {
  kind: DeviceKind;
  label: string;
  status: DeviceStatus;
  detail: string;
  /** Technical readout, e.g. "1920x1080 at 30fps". */
  readout?: string;
  required: boolean;
}

export type CheckState =
  | 'pending'
  | 'running'
  | 'passed'
  | 'warned'
  | 'failed'
  | 'unavailable'
  | 'skipped';

export interface EnvironmentCheck {
  id: string;
  label: string;
  state: CheckState;
  summary: string;
  measurement?: string;
  requirement: string;
  remedy?: string;
}

export type PermissionName =
  | 'camera'
  | 'microphone'
  | 'screen'
  | 'fullscreen'
  | 'clipboard_read'
  | 'notifications';

export interface PermissionState {
  name: PermissionName;
  label: string;
  purpose: string;
  status: 'unknown' | 'granted' | 'denied' | 'prompting' | 'unavailable';
  required: boolean;
  /** Plain-language statement of what is and is not captured. */
  handling: string;
}

export interface CoverageQuality {
  coverage: number;
  quality: number;
  lapsedSeconds: number;
  reason: string;
}

export interface AlignmentCheck {
  id: 'candidate_visible' | 'laptop_visible' | 'workspace_visible' | 'lighting' | 'distance';
  label: string;
  satisfied: boolean;
  guidance: string;
  measured: string;
}

export interface AlignmentReport {
  coverage: CoverageQuality;
  checks: AlignmentCheck[];
  capturedAt: string;
  simulated: true;
}

/* ------------------------------------------------------------------ *
 * Phone pairing
 * ------------------------------------------------------------------ */

export type PairingPhase =
  | 'awaiting_scan'
  | 'device_found'
  | 'handshake'
  | 'connected'
  | 'expired'
  | 'declined';

export interface PairingSession {
  id: string;
  code: string;
  pairingUrl: string;
  phase: PairingPhase;
  deviceName?: string;
  batteryPercent?: number;
  network?: string;
  expiresInSeconds: number;
  cameraFacing?: 'rear' | 'front';
  simulated: true;
}

export interface CompanionStatus {
  paired: boolean;
  deviceName?: string;
  sessionId?: string;
  examTitle?: string;
  batteryPercent: number;
  charging: boolean;
  network: 'stable' | 'weak' | 'offline';
  rttMs: number;
  cameraActive: boolean;
  cameraFacing: 'rear' | 'front';
  coverage: number;
  coverageNote: string;
  framesDelivered: number;
  framesDropped: number;
  emergencyContact: string;
  lastSyncAt: string;
  simulated: true;
}

/* ------------------------------------------------------------------ *
 * Evidence
 * ------------------------------------------------------------------ */

export type EvidenceChannel =
  | 'laptop_camera'
  | 'phone_camera'
  | 'browser'
  | 'keyboard'
  | 'mouse'
  | 'code'
  | 'clipboard'
  | 'system';

export type EvidenceCategory = 'observation' | 'browser' | 'interaction' | 'integrity' | 'system';

export type ObservationKind =
  | 'gaze_deviation'
  | 'secondary_person'
  | 'audio_activity'
  | 'posture_change'
  | 'face_absent'
  | 'lighting_change';

export type InteractionKind =
  | 'focus_change'
  | 'tab_hidden'
  | 'fullscreen_exit'
  | 'window_blur'
  | 'typing_burst'
  | 'typing_pause'
  | 'shortcut_used'
  | 'mouse_velocity'
  | 'cursor_idle'
  | 'clipboard_copy'
  | 'clipboard_paste'
  | 'clipboard_cut';

export type IntegrityKind = 'answer_rewritten' | 'question_switch' | 'response_time' | 'device_gap';

export type SignalKind = ObservationKind | InteractionKind | IntegrityKind | 'question_opened' | 'answer_saved';

export type SignalStrength = 'strong' | 'moderate' | 'weak';

export interface EvidenceSignal {
  id: string;
  sessionId: string;
  /** Seconds from examination start. */
  offsetSeconds: number;
  /** Wall clock at the moment of recording, e.g. "10:31:42". */
  wallClock: string;
  kind: SignalKind;
  label: string;
  channel: EvidenceChannel;
  category: EvidenceCategory;
  /** 0-1. Detection certainty for *the signal*, not for any conclusion. */
  confidence: number;
  strength: SignalStrength;
  durationSeconds?: number;
  questionNumber?: number;
  /** Neutral, factual description. No interpretation. */
  detail: string;
  measured: Record<string, string | number>;
  /** Which subsystem produced the record. */
  source: string;
  simulated: true;
}

export type LinkRelation =
  | 'temporal'
  | 'same_question'
  | 'corroborates'
  | 'contradicts'
  | 'supersedes';

export interface EvidenceLink {
  id: string;
  from: string;
  to: string;
  relation: LinkRelation;
  note: string;
}

export type Disposition = 'escalated' | 'suppressed' | 'observation_only';

/**
 * A bundle is the unit a human actually decides on: a short window of signals,
 * the facts that support them, the facts that are missing, and at least one
 * innocent explanation.
 */
export interface EvidenceBundle {
  id: string;
  sessionId: string;
  windowStart: number;
  windowEnd: number;
  questionNumber?: number;
  title: string;
  /** One-paragraph neutral account of the window. */
  summary: string;
  signalIds: string[];
  channels: EvidenceChannel[];
  evidenceQuality: number;
  observationQuality: number;
  /** How many independent subsystems contributed. */
  independentChannels: number;
  /** Policy clauses that bear on this window. */
  policyClauses: PolicyClause[];
  /** What the record positively shows. */
  supporting: string[];
  /** What the record does *not* show. Named explicitly. */
  gaps: string[];
  alternativeExplanation: string;
  disposition: Disposition;
  dispositionReason: string;
  /** Set for bundles that were considered and dropped. */
  suppressionChecklist?: SuppressionCheck[];
  simulated: true;
}

export interface SuppressionCheck {
  id: string;
  label: string;
  result: 'pass' | 'fail' | 'unknown';
  observation: string;
}

/** A signal that was recorded, examined, and deliberately not escalated. */
export interface SuppressedObservation {
  id: string;
  sessionId: string;
  /** The observation this explains away, so a reader can check the claim. */
  signalId: string;
  offsetSeconds: number;
  wallClock: string;
  label: string;
  channel: EvidenceChannel;
  detail: string;
  reason: string;
  checks: SuppressionCheck[];
  baseline: string;
  simulated: true;
}

export interface CoverageGap {
  id: string;
  channel: EvidenceChannel;
  startSeconds: number;
  endSeconds: number;
  reason: string;
}

export interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  column: number;
  row: number;
  kind: 'question' | 'signal' | 'event' | 'decision' | 'policy';
  channel: EvidenceChannel;
  weight: number;
  simulated: true;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation: LinkRelation;
  label: string;
}

export interface EvidenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  columns: string[];
}

/* ------------------------------------------------------------------ *
 * Sessions
 * ------------------------------------------------------------------ */

export type SessionStatus =
  | 'scheduled'
  | 'live'
  | 'submitted'
  | 'in_review'
  | 'closed'
  | 'terminated';

export type ReviewStatus =
  | 'not_required'
  | 'queued'
  | 'in_review'
  | 'confirmed'
  | 'dismissed'
  | 'uncertain';

export type DecisionKind = 'confirmed' | 'dismissed' | 'uncertain' | 'escalated';

export interface ReviewDecisionRecord {
  id: string;
  sessionId: string;
  bundleId?: string;
  decision: DecisionKind;
  examinerId: string;
  examinerName: string;
  note: string;
  recordedAt: string;
  /** False while the record is being persisted. */
  settled: boolean;
}

export interface SessionTimelineSegment {
  id: string;
  channel: EvidenceChannel;
  startSeconds: number;
  endSeconds: number;
  state: 'recording' | 'lapsed' | 'degraded';
  label: string;
}

export interface SessionRecord {
  id: string;
  examId: string;
  examTitle: string;
  examCode: string;
  candidate: Candidate;
  status: SessionStatus;
  reviewStatus: ReviewStatus;
  startedAt: string;
  endedAt: string | null;
  elapsedSeconds: number;
  totalSeconds: number;
  questionCount: number;
  currentQuestion: number;
  answeredCount: number;
  devices: DeviceState[];
  observationCoverage: number;
  observationQuality: number;
  evidenceQuality: number;
  coverageGaps: CoverageGap[];
  lastSignalAt: string;
  lastSignalLabel: string;
  signalCount: number;
  suppressedCount: number;
  escalatedCount: number;
  signals: EvidenceSignal[];
  bundles: EvidenceBundle[];
  suppressed: SuppressedObservation[];
  decisions: ReviewDecisionRecord[];
  timelineSegments: SessionTimelineSegment[];
  provenance: 'simulated';
}

/* ------------------------------------------------------------------ *
 * Operations metrics
 * ------------------------------------------------------------------ */

export interface OperationsMetrics {
  activeSessions: number;
  scheduledSessions: number;
  submittedToday: number;
  reviewQueue: number;
  reviewResolved: number;
  observationCoverage: number;
  observationQuality: number;
  evidenceQuality: number;
  suppressedSignals: number;
  escalatedBundles: number;
  companionDevicesOnline: number;
  companionDevicesExpected: number;
  /** Share of bundles a human upheld, of those decided. */
  confirmationRate: number | null;
  coverageTrend: TrendPoint[];
  qualityTrend: TrendPoint[];
  channelHealth: ChannelHealth[];
  observedAt: string;
  simulated: true;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface ChannelHealth {
  channel: EvidenceChannel;
  label: string;
  coverage: number;
  quality: number;
  sessionsAffected: number;
  note: string;
}

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

export interface QuestionAnalytics {
  questionNumber: number;
  section: string;
  medianResponseSeconds: number;
  answerChangeRate: number;
  revisitRate: number;
  unansweredRate: number;
}

export interface SystemAnalytics {
  metric: string;
  value: string;
  unit?: string;
  target?: string;
  reading: 'nominal' | 'watch' | 'action';
  note: string;
}

export interface DistributionBucket {
  label: string;
  count: number;
}

export interface AnalyticsModel {
  examId: string;
  generatedAt: string;
  sessionsAnalysed: number;
  meanSessionSeconds: number;
  completionRate: number;
  bundlesRaised: number;
  bundlesSuppressed: number;
  questions: QuestionAnalytics[];
  system: SystemAnalytics[];
  observationDistribution: DistributionBucket[];
  dispositionSplit: DistributionBucket[];
  topEscalationReasons: { label: string; count: number; share: number }[];
}

/* ------------------------------------------------------------------ *
 * Reports
 * ------------------------------------------------------------------ */

export interface ReportRow {
  id: string;
  examCode: string;
  examTitle: string;
  term: string;
  sessions: number;
  coverage: number;
  evidenceQuality: number;
  reviewCandidates: number;
  confirmed: number;
  dismissed: number;
  uncertain: number;
  generatedAt: string;
  downloadable: boolean;
}

export interface ReportModel {
  rows: ReportRow[];
  generatedAt: string;
  retentionDays: number;
  simulated: true;
}

/* ------------------------------------------------------------------ *
 * AI assistant
 * ------------------------------------------------------------------ */

export type BriefingSectionKey =
  | 'observed'
  | 'correlated'
  | 'context'
  | 'evidence'
  | 'alternative'
  | 'suggestion';

export interface BriefingSection {
  key: BriefingSectionKey;
  title: string;
  body: string;
  signalIds: string[];
}

export interface ExaminerBriefing {
  id: string;
  sessionId: string;
  question: string;
  sections: BriefingSection[];
  /** Explicitly says what the assistant cannot do. */
  standing: string;
  model: string;
  generatedAt: string;
  confidenceCaveat: string;
  simulated: true;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
}

/* ------------------------------------------------------------------ *
 * Student-side run state
 * ------------------------------------------------------------------ */

export type StageId =
  | 'login'
  | 'environment'
  | 'permissions'
  | 'pairing'
  | 'alignment'
  | 'ready'
  | 'exam'
  | 'submitted';

export interface Stage {
  id: StageId;
  label: string;
  caption: string;
}

export type AnswerState = 'unanswered' | 'answered' | 'flagged' | 'empty_flagged';

export interface Answer {
  questionId: string;
  questionNumber: number;
  value: string;
  state: AnswerState;
  lastEditedAt: string;
  edits: number;
}

export interface SubmissionReceipt {
  submissionId: string;
  examCode: string;
  submittedAt: string;
  questionsAnswered: number;
  questionsTotal: number;
  flaggedCount: number;
  /** What happens to the record next, stated plainly. */
  handling: string;
  reviewWindow: string;
  simulated: true;
}

/* ------------------------------------------------------------------ *
 * Data-source conditions
 *
 * Every service in this product is asynchronous and can fail. Rather than
 * pretending otherwise, the condition is exposed in Settings so each screen's
 * loading, empty, error, offline and permission-denied paths can be seen
 * without breaking the device.
 * ------------------------------------------------------------------ */

export type SourceCondition = 'nominal' | 'slow' | 'flaky' | 'offline';

export interface DataSourceConfig {
  condition: SourceCondition;
  /** True while any response should be marked as generated, not recorded. */
  simulated: true;
}
