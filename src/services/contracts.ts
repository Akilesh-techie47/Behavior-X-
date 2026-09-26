/**
 * Service contracts.
 *
 * These interfaces are the seam between the interface and whatever is behind
 * it. Nothing in `components/` or `screens/` imports a fixture directly; every
 * screen goes through `services`. Replacing the mock implementations with real
 * ones is a change to `services/index.ts` and nothing else.
 *
 * Every method is asynchronous and every method can fail. Callers are expected
 * to handle loading, empty, error and offline — see `useAsync`.
 */

import type {
  AlignmentReport,
  AnalyticsModel,
  Candidate,
  CompanionStatus,
  DataSourceConfig,
  EnvironmentCheck,
  EvidenceBundle,
  EvidenceGraph,
  EvidenceSignal,
  ExamDefinition,
  Examiner,
  ExaminerBriefing,
  OperationsMetrics,
  PairingSession,
  PermissionState,
  ReportModel,
  ReviewDecisionRecord,
  DecisionKind,
  SessionRecord,
  SubmissionReceipt,
  SuppressedObservation,
} from '../domain/types';

export type ServiceCondition = DataSourceConfig['condition'];

/** Raised by every service when the data source is unreachable. */
export class ServiceUnavailableError extends Error {
  readonly kind = 'unavailable';
  readonly retryable = true;

  constructor(message = 'The examination data service is unreachable.') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

/** Raised when a request is answered slowly enough to look broken. */
export class ServiceTimeoutError extends Error {
  readonly kind = 'timeout';
  readonly retryable = true;

  constructor(message = 'The request exceeded the response budget.') {
    super(message);
    this.name = 'ServiceTimeoutError';
  }
}

export interface SessionQuery {
  examId?: string;
  status?: SessionRecord['status'] | 'all';
  reviewStatus?: SessionRecord['reviewStatus'] | 'all';
  search?: string;
  /** Only sessions whose coverage is below this percentage. */
  maxCoverage?: number;
}

export interface SubmissionInput {
  examId: string;
  answers: Record<string, string>;
  flagged: string[];
  durationSeconds: number;
}

export interface DecisionInput {
  sessionId: string;
  bundleId?: string;
  decision: DecisionKind;
  note: string;
  examiner: Examiner;
}

/**
 * One environment probe, run individually so the environment screen can reveal
 * results as they land rather than pretending to measure six things at once.
 */
export interface CheckPlanItem {
  id: string;
  label: string;
  requirement: string;
  run(): Promise<EnvironmentCheck>;
}

/* ------------------------------------------------------------------ *
 * Contracts
 * ------------------------------------------------------------------ */

export interface ExamService {
  listExams(): Promise<ExamDefinition[]>;
  getExam(examId: string): Promise<ExamDefinition>;
  getCandidate(): Promise<Candidate>;
  submit(input: SubmissionInput): Promise<SubmissionReceipt>;
}

export interface SessionService {
  list(query?: SessionQuery): Promise<SessionRecord[]>;
  get(sessionId: string): Promise<SessionRecord>;
  metrics(): Promise<OperationsMetrics>;
  recordDecision(input: DecisionInput): Promise<ReviewDecisionRecord>;
}

export interface DeviceService {
  checkPlan(): CheckPlanItem[];
  runEnvironmentCheck(): Promise<EnvironmentCheck[]>;
  permissionStates(): Promise<PermissionState[]>;
  requestPermission(name: PermissionState['name']): Promise<PermissionState>;
  beginPairing(): Promise<PairingSession>;
  pollPairing(pairingId: string): Promise<PairingSession>;
  measureAlignment(pairingId: string): Promise<AlignmentReport>;
  companion(): Promise<CompanionStatus>;
  disconnectCompanion(): Promise<CompanionStatus>;
}

export interface EvidenceService {
  timeline(sessionId: string): Promise<EvidenceSignal[]>;
  bundles(sessionId: string): Promise<EvidenceBundle[]>;
  suppressed(sessionId: string): Promise<SuppressedObservation[]>;
  graph(sessionId: string, bundleId?: string): Promise<EvidenceGraph>;
}

export interface AIService {
  ask(sessionId: string, question: string, signalId?: string): Promise<ExaminerBriefing>;
  /** Canned prompts offered before anything is typed. */
  suggestions(sessionId: string): Promise<{ id: string; label: string; prompt: string }[]>;
}

export interface AnalyticsService {
  exam(examId: string): Promise<AnalyticsModel>;
  reports(): Promise<ReportModel>;
}

export interface Services {
  exam: ExamService;
  sessions: SessionService;
  devices: DeviceService;
  evidence: EvidenceService;
  ai: AIService;
  analytics: AnalyticsService;
}
