/**
 * Deterministic session construction.
 *
 * Two kinds of session are produced:
 *
 *   1. Hand-scripted sessions. Four sessions carry a specific, argued
 *      storyline, because the examiner interface is a review tool and review
 *      tools can only be judged on evidence that has a point of view:
 *        S-1025  a genuine, corroborated review candidate
 *        S-1031  a signal that was recorded, examined and deliberately dropped
 *        S-1029  a coverage failure that policy excludes from inference
 *        S-1016  a session an examiner upheld, with the reasoning recorded
 *
 *   2. Procedural sessions. Everything else is generated from a seeded
 *      generator, so the table looks like a real cohort instead of four
 *      carefully designed examples.
 *
 * Nothing here is recorded. Every artefact is stamped `simulated: true` and
 * every host name uses the reserved `.example` TLD so that no reader mistakes
 * generated data for a real observation.
 */

import type {
  CoverageGap,
  DeviceState,
  EvidenceBundle,
  EvidenceChannel,
  EvidenceSignal,
  ReviewDecisionRecord,
  SessionRecord,
  SessionStatus,
  SessionTimelineSegment,
  SuppressedObservation,
  SignalKind,
  SignalStrength,
  ReviewStatus,
} from '../../domain/types';
import { CANDIDATE_BY_ID } from './people';
import { EXAM_BY_ID, POLICY_BY_ID } from './exams';
import { formatWallClock } from '../../domain/format';

/* ------------------------------------------------------------------ *
 * Seeded generator
 * ------------------------------------------------------------------ */

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seedText: string) {
  let a = hashSeed(seedText);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

function between(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/* ------------------------------------------------------------------ *
 * Signal construction helpers
 * ------------------------------------------------------------------ */

interface SignalInput {
  offset: number;
  kind: SignalKind;
  label: string;
  channel: EvidenceChannel;
  category: EvidenceSignal['category'];
  confidence: number;
  strength: SignalStrength;
  detail: string;
  measured?: Record<string, string | number>;
  durationSeconds?: number;
  questionNumber?: number;
  source: string;
}

function strengthFromConfidence(confidence: number): SignalStrength {
  if (confidence >= 0.9) return 'strong';
  if (confidence >= 0.7) return 'moderate';
  return 'weak';
}

interface SignalContext {
  sessionId: string;
  startWallMs: number;
  /** Allotted seconds, used to keep every offset inside the record. */
  totalSeconds: number;
  signals: EvidenceSignal[];
}

function push(ctx: SignalContext, input: SignalInput): EvidenceSignal {
  /**
   * Offsets are clamped to the session. A signal recorded after the candidate
   * stopped working is not a rounding detail: it would render as an event on a
   * timeline that has already ended, and any window including it would be
   * describing time the session never had.
   */
  const offset = Math.max(0, Math.min(round1(input.offset), ctx.totalSeconds - 0.4));
  const offsetSeconds = round1(offset);
  const wallMs = ctx.startWallMs + Math.round(offset * 1000);
  const signal: EvidenceSignal = {
    id: `${ctx.sessionId}-sig-${String(ctx.signals.length + 1).padStart(3, '0')}`,
    sessionId: ctx.sessionId,
    offsetSeconds,
    wallClock: formatWallClock(new Date(wallMs).toISOString()),
    kind: input.kind,
    label: input.label,
    channel: input.channel,
    category: input.category,
    confidence: input.confidence,
    strength: input.strength ?? strengthFromConfidence(input.confidence),
    durationSeconds: input.durationSeconds,
    questionNumber: input.questionNumber,
    detail: input.detail,
    measured: input.measured ?? {},
    source: input.source,
    simulated: true,
  };
  ctx.signals.push(signal);
  return signal;
}

const SOURCE_EDGE = 'edge_vision_v3';
const SOURCE_BROWSER = 'browser_activity_api';
const SOURCE_INPUT = 'input_telemetry';
const SOURCE_WORKSPACE = 'exam_workspace';

/* ------------------------------------------------------------------ *
 * Session specifications
 * ------------------------------------------------------------------ */

type Storyline =
  | 'routine'
  | 'review_candidate'
  | 'second_review'
  | 'suppressed_gaze'
  | 'coverage_gap'
  | 'upheld'
  | 'camera_occluded'
  | 'uncertain_close';

interface SessionSpec {
  id: string;
  candidateId: string;
  examId: string;
  status: SessionStatus;
  reviewStatus: ReviewStatus;
  storyline: Storyline;
  elapsedSeconds: number;
  totalSeconds: number;
  currentQuestion: number;
  answeredCount: number;
  devices: Partial<Record<DeviceState['kind'], Partial<DeviceState>>>;
  coverage: number;
  observationQuality: number;
  evidenceQuality: number;
  minutesAgo: number;
}

const SPECS: SessionSpec[] = [
  {
    id: 'S-1025',
    candidateId: 'cand-001',
    examId: 'EX-4417',
    status: 'live',
    reviewStatus: 'queued',
    storyline: 'review_candidate',
    elapsedSeconds: 2292,
    totalSeconds: 3600,
    currentQuestion: 11,
    answeredCount: 10,
    devices: {},
    coverage: 91,
    observationQuality: 88,
    evidenceQuality: 82,
    minutesAgo: 38,
  },
  {
    id: 'S-1031',
    candidateId: 'cand-007',
    examId: 'EX-4417',
    status: 'live',
    reviewStatus: 'not_required',
    storyline: 'suppressed_gaze',
    elapsedSeconds: 1360,
    totalSeconds: 3600,
    currentQuestion: 8,
    answeredCount: 7,
    devices: {},
    coverage: 96,
    observationQuality: 92,
    evidenceQuality: 91,
    minutesAgo: 23,
  },
  {
    id: 'S-1021',
    candidateId: 'cand-002',
    examId: 'EX-4417',
    status: 'live',
    reviewStatus: 'not_required',
    storyline: 'routine',
    elapsedSeconds: 1636,
    totalSeconds: 3600,
    currentQuestion: 7,
    answeredCount: 6,
    devices: {},
    coverage: 94,
    observationQuality: 90,
    evidenceQuality: 88,
    minutesAgo: 27,
  },
  {
    id: 'S-1029',
    candidateId: 'cand-005',
    examId: 'EX-4417',
    status: 'live',
    reviewStatus: 'not_required',
    storyline: 'coverage_gap',
    elapsedSeconds: 1610,
    totalSeconds: 3600,
    currentQuestion: 9,
    answeredCount: 8,
    devices: {
      phone: {
        status: 'degraded',
        detail: 'Companion offline, reconnecting',
        readout: 'No stream',
      },
    },
    coverage: 71,
    observationQuality: 62,
    evidenceQuality: 58,
    minutesAgo: 27,
  },
  {
    id: 'S-1033',
    candidateId: 'cand-009',
    examId: 'EX-4417',
    status: 'live',
    reviewStatus: 'not_required',
    storyline: 'routine',
    elapsedSeconds: 968,
    totalSeconds: 3600,
    currentQuestion: 5,
    answeredCount: 4,
    devices: {},
    coverage: 97,
    observationQuality: 93,
    evidenceQuality: 90,
    minutesAgo: 16,
  },
  {
    id: 'S-1034',
    candidateId: 'cand-013',
    examId: 'EX-4417',
    status: 'live',
    reviewStatus: 'not_required',
    storyline: 'camera_occluded',
    elapsedSeconds: 741,
    totalSeconds: 3600,
    currentQuestion: 4,
    answeredCount: 3,
    devices: {
      camera: {
        status: 'degraded',
        detail: 'Hand moved across lens for 4 s',
        readout: 'Fixed loss',
      },
    },
    coverage: 86,
    observationQuality: 74,
    evidenceQuality: 79,
    minutesAgo: 12,
  },
  {
    id: 'S-1018',
    candidateId: 'cand-003',
    examId: 'EX-4417',
    status: 'submitted',
    reviewStatus: 'dismissed',
    storyline: 'routine',
    elapsedSeconds: 3600,
    totalSeconds: 3600,
    currentQuestion: 20,
    answeredCount: 19,
    devices: {},
    coverage: 95,
    observationQuality: 91,
    evidenceQuality: 89,
    minutesAgo: 96,
  },
  {
    id: 'S-1016',
    candidateId: 'cand-004',
    examId: 'EX-4417',
    status: 'submitted',
    reviewStatus: 'confirmed',
    storyline: 'upheld',
    elapsedSeconds: 3540,
    totalSeconds: 3600,
    currentQuestion: 20,
    answeredCount: 20,
    devices: {},
    coverage: 93,
    observationQuality: 87,
    evidenceQuality: 86,
    minutesAgo: 102,
  },
  {
    id: 'S-1012',
    candidateId: 'cand-006',
    examId: 'EX-4417',
    status: 'submitted',
    reviewStatus: 'not_required',
    storyline: 'routine',
    elapsedSeconds: 3600,
    totalSeconds: 3600,
    currentQuestion: 20,
    answeredCount: 20,
    devices: {},
    coverage: 98,
    observationQuality: 95,
    evidenceQuality: 93,
    minutesAgo: 118,
  },
  {
    id: 'S-1030',
    candidateId: 'cand-011',
    examId: 'EX-4417',
    status: 'in_review',
    reviewStatus: 'uncertain',
    storyline: 'uncertain_close',
    elapsedSeconds: 3600,
    totalSeconds: 3600,
    currentQuestion: 20,
    answeredCount: 18,
    devices: {},
    coverage: 88,
    observationQuality: 79,
    evidenceQuality: 71,
    minutesAgo: 78,
  },
  {
    id: 'S-0988',
    candidateId: 'cand-008',
    examId: 'EX-4402',
    status: 'closed',
    reviewStatus: 'dismissed',
    storyline: 'routine',
    elapsedSeconds: 2700,
    totalSeconds: 2700,
    currentQuestion: 8,
    answeredCount: 8,
    devices: {},
    coverage: 92,
    observationQuality: 89,
    evidenceQuality: 85,
    minutesAgo: 2640,
  },
  {
    id: 'S-0974',
    candidateId: 'cand-012',
    examId: 'EX-4402',
    status: 'closed',
    reviewStatus: 'confirmed',
    storyline: 'upheld',
    elapsedSeconds: 2700,
    totalSeconds: 2700,
    currentQuestion: 8,
    answeredCount: 8,
    devices: {},
    coverage: 94,
    observationQuality: 90,
    evidenceQuality: 88,
    minutesAgo: 3120,
  },
  {
    id: 'S-0971',
    candidateId: 'cand-010',
    examId: 'EX-4402',
    status: 'in_review',
    reviewStatus: 'queued',
    storyline: 'second_review',
    elapsedSeconds: 2700,
    totalSeconds: 2700,
    currentQuestion: 8,
    answeredCount: 8,
    devices: {},
    coverage: 90,
    observationQuality: 84,
    evidenceQuality: 78,
    minutesAgo: 2790,
  },
  {
    id: 'S-0968',
    candidateId: 'cand-016',
    examId: 'EX-4402',
    status: 'closed',
    reviewStatus: 'queued',
    storyline: 'second_review',
    elapsedSeconds: 2700,
    totalSeconds: 2700,
    currentQuestion: 8,
    answeredCount: 7,
    devices: {},
    coverage: 88,
    observationQuality: 80,
    evidenceQuality: 74,
    minutesAgo: 3300,
  },
  {
    id: 'S-0955',
    candidateId: 'cand-005',
    examId: 'EX-4402',
    status: 'closed',
    reviewStatus: 'queued',
    storyline: 'second_review',
    elapsedSeconds: 2700,
    totalSeconds: 2700,
    currentQuestion: 8,
    answeredCount: 8,
    devices: {},
    coverage: 93,
    observationQuality: 86,
    evidenceQuality: 80,
    minutesAgo: 3720,
  },
  {
    id: 'S-0963',
    candidateId: 'cand-009',
    examId: 'EX-4402',
    status: 'closed',
    reviewStatus: 'queued',
    storyline: 'second_review',
    elapsedSeconds: 2700,
    totalSeconds: 2700,
    currentQuestion: 8,
    answeredCount: 8,
    devices: {},
    coverage: 91,
    observationQuality: 83,
    evidenceQuality: 79,
    minutesAgo: 3010,
  },
  {
    id: 'S-0902',
    candidateId: 'cand-015',
    examId: 'EX-4310',
    status: 'closed',
    reviewStatus: 'not_required',
    storyline: 'routine',
    elapsedSeconds: 1800,
    totalSeconds: 1800,
    currentQuestion: 6,
    answeredCount: 6,
    devices: {},
    coverage: 96,
    observationQuality: 92,
    evidenceQuality: 90,
    minutesAgo: 9400,
  },
];

/* ------------------------------------------------------------------ *
 * Storyline: S-1025 — corroborated review candidate
 * ------------------------------------------------------------------ */

const FLAG_WINDOW = { start: 1498.2, end: 1520.4 };

function buildReviewCandidate(ctx: SignalContext, rng: () => number): void {
  const { start, end } = FLAG_WINDOW;

  // Routine lead-in so the window sits inside a plausible working session.
  push(ctx, {
    offset: 46,
    kind: 'question_opened',
    label: 'Question 8 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 8 and began editing the response field.',
    questionNumber: 8,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: 188,
    kind: 'gaze_deviation',
    label: 'Gaze deviation',
    channel: 'laptop_camera',
    category: 'observation',
    confidence: 0.71,
    strength: 'moderate',
    durationSeconds: 2.4,
    questionNumber: 8,
    detail: 'Gaze moved below the viewport for 2.4 s, then returned. No other channel recorded activity.',
    measured: { headPitchDeg: 19.4, durationSeconds: 2.4, baseline: 'within personal range' },
    source: SOURCE_EDGE,
  });
  push(ctx, {
    offset: 402,
    kind: 'clipboard_copy',
    label: 'Clipboard copy from reference tab',
    channel: 'clipboard',
    category: 'interaction',
    confidence: 1,
    strength: 'strong',
    durationSeconds: 0.4,
    questionNumber: 8,
    detail: '62 characters copied from the permitted reference tab into the workspace scratch field.',
    measured: { characters: 62, origin: 'docs.example.edu/reference/collections', permitted: 'yes' },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: 611,
    kind: 'answer_saved',
    label: 'Response 8 saved',
    channel: 'code',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Response 8 autosaved at 1,842 characters. No subsequent modification.',
    questionNumber: 8,
    measured: { characters: 1842, edits: 3 },
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: 1032,
    kind: 'tab_hidden',
    label: 'Workspace tab hidden',
    channel: 'browser',
    category: 'browser',
    confidence: 1,
    strength: 'strong',
    durationSeconds: 3.1,
    questionNumber: 10,
    detail: 'Workspace tab reported hidden for 3.1 s, consistent with an application switch.',
    measured: { hiddenSeconds: 3.1, returnedWithinThreshold: 'yes' },
    source: SOURCE_BROWSER,
  });
  push(ctx, {
    offset: 1041,
    kind: 'question_opened',
    label: 'Question 11 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 11. Bounded work queue implementation prompt.',
    questionNumber: 11,
    source: SOURCE_WORKSPACE,
  });

  /* --- the window under review -------------------------------------- */

  push(ctx, {
    offset: start,
    kind: 'focus_change',
    label: 'Browser focus moved to non-permitted origin',
    channel: 'browser',
    category: 'browser',
    confidence: 1,
    strength: 'strong',
    durationSeconds: 16.4,
    questionNumber: 11,
    detail:
      'Active origin changed from the examination workspace to an external discussion forum for 16.4 s. Regulation 4.1 permits only the supplied reference tab.',
    measured: {
      from: 'exam.example.edu/workspace',
      to: 'forum.example.edu/thread/8812',
      permitted: 'no',
      category: 'code discussion forum',
    },
    source: SOURCE_BROWSER,
  });
  push(ctx, {
    offset: start + 2.4,
    kind: 'shortcut_used',
    label: 'Paste shortcut used in workspace',
    channel: 'keyboard',
    category: 'interaction',
    confidence: 0.99,
    strength: 'strong',
    questionNumber: 11,
    detail: 'Ctrl+V pressed in the response editor, 2.4 s after focus returned to the workspace.',
    measured: { chord: 'Ctrl+V', latencyAfterFocusReturnSeconds: 2.4 },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: start + 2.9,
    kind: 'clipboard_paste',
    label: 'Clipboard paste into response editor',
    channel: 'clipboard',
    category: 'interaction',
    confidence: 0.99,
    strength: 'strong',
    questionNumber: 11,
    detail: '480 characters pasted into the question 11 response, replacing the 3-line draft.',
    measured: {
      characters: 480,
      linesReplaced: 3,
      target: 'response-editor',
      clipboardSourceRetained: 'no',
    },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: start + 5.2,
    kind: 'mouse_velocity',
    label: 'Cursor travel to address bar',
    channel: 'mouse',
    category: 'interaction',
    confidence: 0.86,
    strength: 'moderate',
    durationSeconds: 0.6,
    questionNumber: 11,
    detail: 'Cursor travelled 1,240 px in 0.6 s and came to rest in the browser address bar.',
    measured: { distancePx: 1240, durationSeconds: 0.6, velocityPxSec: 2066 },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: start + 7.8,
    kind: 'answer_rewritten',
    label: 'Response 11 replaced in 1.8 s',
    channel: 'code',
    category: 'integrity',
    confidence: 0.96,
    strength: 'strong',
    questionNumber: 11,
    detail: '412 characters replaced in 1.8 s. The prior response was 96 characters typed over 74 s.',
    measured: {
      charactersReplaced: 412,
      previousCharacters: 96,
      previousEditDurationSeconds: 74,
      burstSeconds: 1.8,
    },
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: start + 11,
    kind: 'typing_burst',
    label: 'Sustained typing above personal baseline',
    channel: 'keyboard',
    category: 'interaction',
    confidence: 0.92,
    strength: 'strong',
    durationSeconds: 2.1,
    questionNumber: 11,
    detail: '9.4 keys/s sustained for 2.1 s against a personal baseline of 3.8 keys/s.',
    measured: { keysPerSecond: 9.4, baselineKeysPerSecond: 3.8, ratio: 2.47, sampleCount: 41 },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: start + 13.8,
    kind: 'gaze_deviation',
    label: 'Gaze held on second screen',
    channel: 'laptop_camera',
    category: 'observation',
    confidence: 0.88,
    strength: 'moderate',
    durationSeconds: 4.6,
    questionNumber: 11,
    detail: 'Gaze held on a point to the right of the primary display for 4.6 s. Laptop camera view only.',
    measured: { headYawDeg: 28.1, durationSeconds: 4.6, secondScreenInFrame: 'partial' },
    source: SOURCE_EDGE,
  });
  push(ctx, {
    offset: end - 3.1,
    kind: 'focus_change',
    label: 'Focus returned to workspace',
    channel: 'browser',
    category: 'browser',
    confidence: 1,
    strength: 'strong',
    questionNumber: 11,
    detail: 'Active origin returned to the examination workspace and remained there.',
    measured: { to: 'exam.example.edu/workspace' },
    source: SOURCE_BROWSER,
  });
  push(ctx, {
    offset: end,
    kind: 'answer_saved',
    label: 'Response 11 saved',
    channel: 'code',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    questionNumber: 11,
    detail: 'Response 11 saved at 1,268 characters and left unchanged for the following 9 minutes.',
    measured: { characters: 1268, editsAfterSave: 0 },
    source: SOURCE_WORKSPACE,
  });

  push(ctx, {
    offset: 1904,
    kind: 'typing_pause',
    label: 'Extended typing pause',
    channel: 'keyboard',
    category: 'interaction',
    confidence: 0.93,
    strength: 'moderate',
    durationSeconds: 96,
    questionNumber: 12,
    detail: 'No keystrokes for 96 s while the candidate remained visible and on question 12.',
    measured: { pauseSeconds: 96, personalBaselinePauseSeconds: 34 },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: 2044,
    kind: 'posture_change',
    label: 'Posture change',
    channel: 'laptop_camera',
    category: 'observation',
    confidence: 0.7,
    strength: 'weak',
    questionNumber: 12,
    detail: 'Candidate leaned out of the upper camera frustum for 2.2 s and returned.',
    measured: { durationSeconds: 2.2, faceCount: 0 },
    source: SOURCE_EDGE,
  });
  push(ctx, {
    offset: 2214,
    kind: 'question_opened',
    label: 'Question 14 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate advanced to question 14.',
    questionNumber: 14,
    source: SOURCE_WORKSPACE,
  });

  // A little unstructured background so the timeline is not suspiciously clean.
  const jitter = between(rng, 3, 7);
  for (let i = 0; i < jitter; i += 1) {
    push(ctx, {
      offset: round1(between(rng, 60, 2200)),
      kind: 'mouse_velocity',
      label: 'Cursor movement burst',
      channel: 'mouse',
      category: 'interaction',
      confidence: round1(between(rng, 0.55, 0.72)),
      strength: 'weak',
      detail: 'Short cursor burst consistent with reading or repositioning within the workspace.',
      measured: { distancePx: Math.round(between(rng, 180, 640)) },
      source: SOURCE_INPUT,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Storyline: S-1031 — recorded, examined, deliberately not escalated
 * ------------------------------------------------------------------ */

const SUPPRESSED_WINDOW = { start: 252.6, end: 256.8 };

function buildSuppressedGaze(ctx: SignalContext, rng: () => number): void {
  const { start } = SUPPRESSED_WINDOW;

  push(ctx, {
    offset: 12,
    kind: 'question_opened',
    label: 'Question 1 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 1 and began answering immediately.',
    questionNumber: 1,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: 96,
    kind: 'clipboard_copy',
    label: 'Clipboard copy from reference tab',
    channel: 'clipboard',
    category: 'interaction',
    confidence: 1,
    strength: 'strong',
    durationSeconds: 0.3,
    questionNumber: 2,
    detail: '41 characters copied from the permitted reference tab.',
    measured: { characters: 41, permitted: 'yes' },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: 238,
    kind: 'typing_burst',
    label: 'Sustained typing at baseline',
    channel: 'keyboard',
    category: 'interaction',
    confidence: 0.9,
    strength: 'moderate',
    durationSeconds: 6.2,
    questionNumber: 4,
    detail: 'Typing continued without interruption at 3.9 keys/s, matching the personal baseline.',
    measured: { keysPerSecond: 3.9, baselineKeysPerSecond: 3.8 },
    source: SOURCE_INPUT,
  });

  push(ctx, {
    offset: start,
    kind: 'gaze_deviation',
    label: 'Downward gaze deviation',
    channel: 'laptop_camera',
    category: 'observation',
    confidence: 0.93,
    strength: 'strong',
    durationSeconds: 4.2,
    questionNumber: 4,
    detail:
      'Gaze directed below the viewport for 4.2 s. Phone camera recorded the candidate\'s hands and notes area throughout.',
    measured: {
      headPitchDeg: 31.7,
      durationSeconds: 4.2,
      phoneCameraVisibility: 'hands and desk visible',
      keystrokesDuring: 63,
    },
    source: SOURCE_EDGE,
  });
  push(ctx, {
    offset: start + 4.3,
    kind: 'answer_saved',
    label: 'Response 4 saved',
    channel: 'code',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    questionNumber: 4,
    detail: 'Response 4 saved at 1,102 characters immediately after the gaze deviation ended.',
    measured: { characters: 1102, edits: 5 },
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: start + 26,
    kind: 'question_opened',
    label: 'Question 5 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate advanced to question 5 with no further deviation recorded.',
    questionNumber: 5,
    source: SOURCE_WORKSPACE,
  });

  const jitter = between(rng, 4, 8);
  for (let i = 0; i < jitter; i += 1) {
    push(ctx, {
      offset: round1(between(rng, 20, 1300)),
      kind: 'gaze_deviation',
      label: 'Brief gaze shift',
      channel: 'laptop_camera',
      category: 'observation',
      confidence: round1(between(rng, 0.6, 0.8)),
      strength: 'weak',
      durationSeconds: round1(between(rng, 1.1, 2.6)),
      questionNumber: Math.ceil(between(rng, 1, 8)),
      detail: 'Gaze shifted briefly and returned within the personal threshold.',
      measured: { durationSeconds: round1(between(rng, 1.1, 2.6)) },
      source: SOURCE_EDGE,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Storyline: S-1029 — companion device lost
 * ------------------------------------------------------------------ */

const PHONE_GAP = { start: 252, end: 624 };

function buildCoverageGap(ctx: SignalContext, rng: () => number): void {
  push(ctx, {
    offset: 8,
    kind: 'question_opened',
    label: 'Question 1 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 1 and began answering immediately.',
    questionNumber: 1,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: PHONE_GAP.start - 4,
    kind: 'device_gap',
    label: 'Companion camera stream ended',
    channel: 'phone_camera',
    category: 'observation',
    confidence: 1,
    strength: 'strong',
    durationSeconds: PHONE_GAP.end - PHONE_GAP.start,
    questionNumber: 3,
    detail: `No frames received from the companion device for ${Math.round(
      PHONE_GAP.end - PHONE_GAP.start,
    )} s. Laptop camera, browser, keyboard, mouse and clipboard channels continued without interruption.`,
    measured: {
      missedSeconds: Math.round(PHONE_GAP.end - PHONE_GAP.start),
      otherChannelsContinued: 'yes',
      causeReportedByDevice: 'network handover',
    },
    source: 'companion_transport',
  });
  push(ctx, {
    offset: PHONE_GAP.end + 2,
    kind: 'question_opened',
    label: 'Question 7 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Companion stream resumed. Candidate had advanced to question 7.',
    questionNumber: 7,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: 880,
    kind: 'clipboard_paste',
    label: 'Clipboard paste from own notes',
    channel: 'clipboard',
    category: 'interaction',
    confidence: 0.95,
    strength: 'moderate',
    questionNumber: 8,
    detail: '96 characters pasted from a text file created before the sitting began.',
    measured: { characters: 96, sourceClassification: 'pre-sitting personal notes' },
    source: SOURCE_INPUT,
  });

  const jitter = between(rng, 5, 9);
  for (let i = 0; i < jitter; i += 1) {
    const offset = between(rng, 20, 1550);
    const inGap = offset > PHONE_GAP.start && offset < PHONE_GAP.end;
    push(ctx, {
      offset: round1(offset),
      kind: pick(rng, ['typing_pause', 'mouse_velocity', 'focus_change'] as SignalKind[]),
      label: 'Working pattern recorded',
      channel: pick(rng, ['keyboard', 'mouse', 'browser'] as EvidenceChannel[]),
      category: 'interaction',
      confidence: round1(between(rng, 0.6, 0.85)),
      strength: 'weak',
      questionNumber: Math.ceil(between(rng, 1, 9)),
      detail: inGap
        ? 'Activity recorded during the companion outage, from a channel that was not affected.'
        : 'Activity consistent with the candidate\'s established working pattern.',
      measured: {},
      source: SOURCE_INPUT,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Storyline: S-1016 / S-0974 — upheld by an examiner
 * ------------------------------------------------------------------ */

function buildUpheld(ctx: SignalContext, examId: string, rng: () => number): void {
  const isShortExam = examId === 'EX-4402';
  const span = isShortExam ? 2700 : 3540;
  const start = span * 0.44;
  const end = start + 26.4;
  const question = isShortExam ? 4 : 15;

  push(ctx, {
    offset: 20,
    kind: 'question_opened',
    label: 'Question 1 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 1.',
    questionNumber: 1,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: start,
    kind: 'focus_change',
    label: 'Browser focus moved to non-permitted origin',
    channel: 'browser',
    category: 'browser',
    confidence: 1,
    strength: 'strong',
    durationSeconds: 19.8,
    questionNumber: question,
    detail: 'Active origin changed to an external code-hosting origin for 19.8 s.',
    measured: {
      from: 'exam.example.edu/workspace',
      to: 'paste.example.dev/thread/3391',
      permitted: 'no',
      category: 'code hosting / snippet paste site',
    },
    source: SOURCE_BROWSER,
  });
  push(ctx, {
    offset: start + 1.9,
    kind: 'secondary_person',
    label: 'Second person in companion view',
    channel: 'phone_camera',
    category: 'observation',
    confidence: 0.9,
    strength: 'strong',
    durationSeconds: 11.4,
    questionNumber: question,
    detail:
      'A second face entered the companion camera frame and remained for 11.4 s while the browser was on the non-permitted origin.',
    measured: { faceCount: 2, durationSeconds: 11.4, secondFaceFrontal: 'yes' },
    source: SOURCE_EDGE,
  });
  push(ctx, {
    offset: start + 3.4,
    kind: 'clipboard_paste',
    label: 'Clipboard paste into response editor',
    channel: 'clipboard',
    category: 'interaction',
    confidence: 0.99,
    strength: 'strong',
    questionNumber: question,
    detail: '512 characters pasted into the response editor.',
    measured: { characters: 512, clipboardSourceRetained: 'no' },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: start + 4.1,
    kind: 'answer_rewritten',
    label: 'Response replaced in 2.1 s',
    channel: 'code',
    category: 'integrity',
    confidence: 0.97,
    strength: 'strong',
    questionNumber: question,
    detail: '512 characters replaced in 2.1 s, immediately after the paste.',
    measured: { charactersReplaced: 512, burstSeconds: 2.1 },
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: end,
    kind: 'answer_saved',
    label: 'Response saved',
    channel: 'code',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    questionNumber: question,
    detail: 'Response saved and not subsequently modified.',
    measured: { editsAfterSave: 0 },
    source: SOURCE_WORKSPACE,
  });

  const jitter = between(rng, 6, 12);
  for (let i = 0; i < jitter; i += 1) {
    push(ctx, {
      offset: round1(between(rng, 30, span - 30)),
      kind: 'gaze_deviation',
      label: 'Brief gaze shift',
      channel: 'laptop_camera',
      category: 'observation',
      confidence: round1(between(rng, 0.6, 0.83)),
      strength: 'weak',
      durationSeconds: round1(between(rng, 1, 2.8)),
      questionNumber: Math.ceil(between(rng, 1, isShortExam ? 8 : 20)),
      detail: 'Gaze shifted and returned within the personal threshold.',
      measured: {},
      source: SOURCE_EDGE,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Storyline: S-1030 — genuinely unresolved
 * ------------------------------------------------------------------ */

function buildUncertain(ctx: SignalContext, rng: () => number): void {
  push(ctx, {
    offset: 30,
    kind: 'question_opened',
    label: 'Question 1 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 1.',
    questionNumber: 1,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: 1420,
    kind: 'focus_change',
    label: 'Browser focus moved to unknown origin',
    channel: 'browser',
    category: 'browser',
    confidence: 1,
    strength: 'strong',
    durationSeconds: 41.2,
    questionNumber: 9,
    detail:
      'Active origin changed to an origin not present in the examination workspace allow-list, for 41.2 s. The workspace was restored manually by the candidate.',
    measured: {
      from: 'exam.example.edu/workspace',
      to: 'unclassified origin',
      permitted: 'unknown',
      restoredBy: 'candidate',
    },
    source: SOURCE_BROWSER,
  });
  push(ctx, {
    offset: 1424,
    kind: 'secondary_person',
    label: 'Voice detected in room',
    channel: 'phone_camera',
    category: 'observation',
    confidence: 0.62,
    strength: 'weak',
    durationSeconds: 9.4,
    questionNumber: 9,
    detail:
      'Low-amplitude speech-shaped audio detected in the room for 9.4 s. No speech was transcribed; audio content is not retained.',
    measured: { peakDb: -41, durationSeconds: 9.4, transcribed: 'no' },
    source: SOURCE_EDGE,
  });
  push(ctx, {
    offset: 1431,
    kind: 'face_absent',
    label: 'Candidate out of laptop frame',
    channel: 'laptop_camera',
    category: 'observation',
    confidence: 0.94,
    strength: 'strong',
    durationSeconds: 16.8,
    questionNumber: 9,
    detail: 'Candidate left the laptop camera frame for 16.8 s. Companion camera continued to record.',
    measured: { durationSeconds: 16.8, companionCoverage: 'continuous' },
    source: SOURCE_EDGE,
  });
  push(ctx, {
    offset: 1462,
    kind: 'answer_saved',
    label: 'Response 9 saved',
    channel: 'code',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    questionNumber: 9,
    detail: 'Response 9 saved at 640 characters. Provenance of the content cannot be established from the record.',
    measured: { characters: 640, contentProvenance: 'undetermined' },
    source: SOURCE_WORKSPACE,
  });

  const jitter = between(rng, 5, 10);
  for (let i = 0; i < jitter; i += 1) {
    push(ctx, {
      offset: round1(between(rng, 40, 3400)),
      kind: 'typing_pause',
      label: 'Typing pause',
      channel: 'keyboard',
      category: 'interaction',
      confidence: round1(between(rng, 0.62, 0.8)),
      strength: 'weak',
      detail: 'Pause in keyboard activity consistent with reading the question.',
      measured: { pauseSeconds: Math.round(between(rng, 12, 70)) },
      source: SOURCE_INPUT,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Storyline: routine
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Storyline: second_review — a weaker case, queued alongside the strong ones
 *
 * These exist so the review queue is not uniformly severe. Each of these has
 * a plausible innocent reading and a lower evidence quality than S-1025, and
 * an examiner should be able to dismiss all three on the record.
 * ------------------------------------------------------------------ */

function buildSecondReview(ctx: SignalContext, rng: () => number, spec: SessionSpec): void {
  const start = 1128.4;
  const end = start + 31.2;

  push(ctx, {
    offset: 14,
    kind: 'question_opened',
    label: 'Question 1 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 1 and worked steadily through the paper.',
    questionNumber: 1,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: 640,
    kind: 'clipboard_copy',
    label: 'Clipboard copy from reference tab',
    channel: 'clipboard',
    category: 'interaction',
    confidence: 1,
    strength: 'moderate',
    durationSeconds: 0.3,
    questionNumber: 3,
    detail: '38 characters copied from the permitted reference tab.',
    measured: { characters: 38, permitted: 'yes' },
    source: SOURCE_INPUT,
  });

  push(ctx, {
    offset: start,
    kind: 'focus_change',
    label: 'Browser focus moved to unclassified origin',
    channel: 'browser',
    category: 'browser',
    confidence: 0.94,
    strength: 'moderate',
    durationSeconds: 28.4,
    questionNumber: 5,
    detail:
      'Active origin changed to a host that responded to the allow-list probe with a redirect. The final host could not be determined from the page.',
    measured: {
      from: 'exam.example.edu/workspace',
      to: 'redirected host, unresolved',
      permitted: 'unknown',
    },
    source: SOURCE_BROWSER,
  });
  push(ctx, {
    offset: start + 4.8,
    kind: 'clipboard_paste',
    label: 'Clipboard paste into scratch field',
    channel: 'clipboard',
    category: 'interaction',
    confidence: 0.97,
    strength: 'strong',
    questionNumber: 5,
    detail: '218 characters pasted into the workspace scratch field, not into a response.',
    measured: { characters: 218, target: 'scratch-field', enteredResponse: 'no' },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: start + 6.2,
    kind: 'typing_burst',
    label: 'Sustained typing above personal baseline',
    channel: 'keyboard',
    category: 'interaction',
    confidence: 0.84,
    strength: 'moderate',
    durationSeconds: 4.4,
    questionNumber: 5,
    detail: '7.1 keys/s sustained for 4.4 s against a personal baseline of 4.0 keys/s.',
    measured: { keysPerSecond: 7.1, baselineKeysPerSecond: 4, ratio: 1.78 },
    source: SOURCE_INPUT,
  });
  push(ctx, {
    offset: start + 11.6,
    kind: 'answer_rewritten',
    label: 'Response 5 extended by 96 characters',
    channel: 'code',
    category: 'integrity',
    confidence: 0.9,
    strength: 'moderate',
    questionNumber: 5,
    detail: 'Response 5 grew by 96 characters over 19 s, in line with the candidate\'s normal edit cadence.',
    measured: { charactersAdded: 96, durationSeconds: 19, editCadence: 'normal' },
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: end,
    kind: 'answer_saved',
    label: 'Response 5 saved',
    channel: 'code',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    questionNumber: 5,
    detail: 'Response 5 saved at 742 characters and edited twice more in the ordinary way.',
    measured: { characters: 742, edits: 3 },
    source: SOURCE_WORKSPACE,
  });

  const jitter = between(rng, 6, 11);
  for (let i = 0; i < jitter; i += 1) {
    push(ctx, {
      offset: round1(between(rng, 30, spec.elapsedSeconds - 20)),
      kind: pick(rng, ['typing_pause', 'gaze_deviation', 'mouse_velocity', 'window_blur'] as SignalKind[]),
      label: 'Working pattern recorded',
      channel: pick(rng, ['keyboard', 'laptop_camera', 'mouse', 'browser'] as EvidenceChannel[]),
      category: pick(rng, ['interaction', 'observation', 'browser'] as const),
      confidence: round1(between(rng, 0.6, 0.84)),
      strength: 'weak',
      questionNumber: Math.ceil(between(rng, 1, 8)),
      detail: 'Activity consistent with the candidate\'s established working pattern.',
      measured: {},
      source: pick(rng, [SOURCE_INPUT, SOURCE_EDGE, SOURCE_BROWSER]),
    });
  }
}

function buildRoutine(ctx: SignalContext, rng: () => number, spec: SessionSpec): void {
  const total = spec.elapsedSeconds;
  const questionCount = spec.currentQuestion;
  const perQuestion = total / Math.max(1, questionCount);

  push(ctx, {
    offset: 6,
    kind: 'question_opened',
    label: 'Question 1 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 1 and began answering within 40 s.',
    questionNumber: 1,
    source: SOURCE_WORKSPACE,
  });

  for (let q = 1; q <= questionCount; q += 1) {
    const base = q * perQuestion;
    push(ctx, {
      offset: round1(base + between(rng, -8, 8)),
      kind: 'answer_saved',
      label: `Response ${q} saved`,
      channel: q % 3 === 0 ? 'code' : 'system',
      category: 'integrity',
      confidence: 1,
      strength: 'strong',
      questionNumber: q,
      detail: `Response ${q} saved. ${q} edits recorded across the response.`,
      measured: { characters: Math.round(between(rng, 180, 1900)), edits: Math.ceil(between(rng, 1, 5)) },
      source: SOURCE_WORKSPACE,
    });
  }

  const noiseCount = Math.round(between(rng, 8, 16));
  for (let i = 0; i < noiseCount; i += 1) {
    const offset = round1(between(rng, 15, total - 10));
    const roll = rng();
    const questionNumber = Math.min(questionCount, Math.max(1, Math.ceil(offset / perQuestion)));

    if (roll < 0.34) {
      push(ctx, {
        offset,
        kind: 'gaze_deviation',
        label: 'Brief gaze shift',
        channel: 'laptop_camera',
        category: 'observation',
        confidence: round1(between(rng, 0.62, 0.86)),
        strength: 'weak',
        durationSeconds: round1(between(rng, 1.1, 3.0)),
        questionNumber,
        detail: 'Gaze shifted and returned within the personal threshold.',
        measured: {
          headPitchDeg: round1(between(rng, 8, 26)),
          durationSeconds: round1(between(rng, 1.1, 3.0)),
        },
        source: SOURCE_EDGE,
      });
    } else if (roll < 0.55) {
      push(ctx, {
        offset,
        kind: 'typing_pause',
        label: 'Thinking pause',
        channel: 'keyboard',
        category: 'interaction',
        confidence: round1(between(rng, 0.6, 0.82)),
        strength: 'weak',
        durationSeconds: Math.round(between(rng, 8, 48)),
        questionNumber,
        detail: 'Pause in keyboard activity while the candidate read the question.',
        measured: { pauseSeconds: Math.round(between(rng, 8, 48)), personalBaselinePauseSeconds: 34 },
        source: SOURCE_INPUT,
      });
    } else if (roll < 0.72) {
      push(ctx, {
        offset,
        kind: 'window_blur',
        label: 'Window focus lost',
        channel: 'browser',
        category: 'browser',
        confidence: 1,
        strength: 'moderate',
        durationSeconds: round1(between(rng, 0.6, 2.2)),
        questionNumber,
        detail: 'Examination window lost focus briefly and returned without a tab switch.',
        measured: { lostFocusSeconds: round1(between(rng, 0.6, 2.2)) },
        source: SOURCE_BROWSER,
      });
    } else if (roll < 0.86) {
      push(ctx, {
        offset,
        kind: 'clipboard_copy',
        label: 'Clipboard copy from reference tab',
        channel: 'clipboard',
        category: 'interaction',
        confidence: 1,
        strength: 'moderate',
        durationSeconds: 0.3,
        questionNumber,
        detail: 'Short copy from the permitted reference tab into the workspace scratch field.',
        measured: { characters: Math.round(between(rng, 20, 90)), permitted: 'yes' },
        source: SOURCE_INPUT,
      });
    } else {
      push(ctx, {
        offset,
        kind: 'mouse_velocity',
        label: 'Cursor movement burst',
        channel: 'mouse',
        category: 'interaction',
        confidence: round1(between(rng, 0.55, 0.75)),
        strength: 'weak',
        questionNumber,
        detail: 'Short cursor burst consistent with reading or repositioning.',
        measured: { distancePx: Math.round(between(rng, 140, 720)) },
        source: SOURCE_INPUT,
      });
    }
  }
}

function buildCameraOccluded(ctx: SignalContext, rng: () => number, spec: SessionSpec): void {
  push(ctx, {
    offset: 5,
    kind: 'question_opened',
    label: 'Question 1 opened',
    channel: 'system',
    category: 'integrity',
    confidence: 1,
    strength: 'strong',
    detail: 'Candidate opened question 1.',
    questionNumber: 1,
    source: SOURCE_WORKSPACE,
  });
  push(ctx, {
    offset: 318,
    kind: 'face_absent',
    label: 'Laptop camera view obstructed',
    channel: 'laptop_camera',
    category: 'observation',
    confidence: 0.88,
    strength: 'moderate',
    durationSeconds: 4.1,
    questionNumber: 2,
    detail:
      'A hand crossed the lens for 4.1 s. Face tracking paused. Companion camera retained a clear view throughout.',
    measured: { durationSeconds: 4.1, companionCoverage: 'continuous', cause: 'hand occlusion' },
    source: SOURCE_EDGE,
  });
  const noiseCount = Math.round(between(rng, 5, 9));
  for (let i = 0; i < noiseCount; i += 1) {
    push(ctx, {
      offset: round1(between(rng, 20, spec.elapsedSeconds - 10)),
      kind: pick(rng, ['typing_pause', 'gaze_deviation', 'mouse_velocity'] as SignalKind[]),
      label: 'Working pattern recorded',
      channel: pick(rng, ['keyboard', 'laptop_camera', 'mouse'] as EvidenceChannel[]),
      category: pick(rng, ['interaction', 'observation'] as const),
      confidence: round1(between(rng, 0.6, 0.82)),
      strength: 'weak',
      questionNumber: Math.ceil(between(rng, 1, 4)),
      detail: 'Activity consistent with the candidate\'s established working pattern.',
      measured: {},
      source: pick(rng, [SOURCE_INPUT, SOURCE_EDGE]),
    });
  }
}

/* ------------------------------------------------------------------ *
 * Devices, gaps and timeline segments
 * ------------------------------------------------------------------ */

function baseDevices(examId: string): DeviceState[] {
  const exam = EXAM_BY_ID.get(examId);
  const needsPhone = exam?.requiresSecondaryDevice ?? true;
  return [
    {
      kind: 'laptop',
      label: 'Laptop',
      status: 'connected',
      detail: 'Windows 11 · Chrome 141 · 1920×1080',
      readout: 'x64 · 16 GB',
      required: true,
    },
    {
      kind: 'phone',
      label: 'Phone',
      status: needsPhone ? 'connected' : 'not_required',
      detail: needsPhone ? 'Companion observing · rear camera' : 'Not required for this examination',
      readout: needsPhone ? 'Pixel 8a · 82%' : undefined,
      required: needsPhone,
    },
    {
      kind: 'camera',
      label: 'Camera 1 — laptop',
      status: 'active',
      detail: 'Recording at 6 Hz edge sampling · 640×480',
      readout: 'Fixed loss 0.0%',
      required: true,
    },
    {
      kind: 'microphone',
      label: 'Microphone',
      status: 'active',
      detail: 'Level monitoring only · no content retained',
      readout: '-38 dB peak',
      required: false,
    },
    {
      kind: 'network',
      label: 'Network',
      status: 'ready',
      detail: 'Wired 1 Gbps · 21 ms to examination endpoint',
      readout: '21 ms',
      required: true,
    },
    {
      kind: 'browser',
      label: 'Browser',
      status: 'ready',
      detail: 'Fullscreen · 2 tabs · workspace allow-list active',
      readout: 'Chrome 141',
      required: true,
    },
  ];
}

function applyDeviceOverrides(
  devices: DeviceState[],
  overrides: SessionSpec['devices'],
): DeviceState[] {
  return devices.map(device => {
    const override = overrides[device.kind];
    if (!override) return device;
    return { ...device, ...override } as DeviceState;
  });
}

function buildCoverageGaps(spec: SessionSpec): CoverageGap[] {
  if (spec.storyline === 'coverage_gap') {
    return [
      {
        id: `${spec.id}-gap-1`,
        channel: 'phone_camera',
        startSeconds: PHONE_GAP.start,
        endSeconds: PHONE_GAP.end,
        reason: 'Companion device lost network during a handover. No frames received for 372 s.',
      },
    ];
  }
  if (spec.storyline === 'camera_occluded') {
    return [
      {
        id: `${spec.id}-gap-1`,
        channel: 'laptop_camera',
        startSeconds: 318,
        endSeconds: 322.1,
        reason: 'Lens obstructed by hand. Companion view remained continuous.',
      },
    ];
  }
  if (spec.storyline === 'review_candidate') {
    return [
      {
        id: `${spec.id}-gap-1`,
        channel: 'phone_camera',
        startSeconds: 1495,
        endSeconds: 1507,
        reason: 'Companion rear camera pointed away from the desk for 12 s. Laptop view continuous.',
      },
    ];
  }
  return [];
}

const ALL_CHANNELS: EvidenceChannel[] = [
  'laptop_camera',
  'phone_camera',
  'browser',
  'keyboard',
  'mouse',
  'code',
  'clipboard',
  'system',
];

function buildTimelineSegments(spec: SessionSpec, gaps: CoverageGap[]): SessionTimelineSegment[] {
  const segments: SessionTimelineSegment[] = [];
  for (const channel of ALL_CHANNELS) {
    const channelGaps = gaps.filter(g => g.channel === channel).sort((a, b) => a.startSeconds - b.startSeconds);
    let cursor = 0;
    let index = 0;
    for (const gap of channelGaps) {
      if (gap.startSeconds > cursor) {
        segments.push({
          id: `${spec.id}-seg-${channel}-${index++}`,
          channel,
          startSeconds: round1(cursor),
          endSeconds: round1(Math.min(gap.startSeconds, spec.elapsedSeconds)),
          state: 'recording',
          label: 'Recording',
        });
      }
      segments.push({
        id: `${spec.id}-seg-${channel}-${index++}`,
        channel,
        startSeconds: round1(gap.startSeconds),
        endSeconds: round1(Math.min(gap.endSeconds, spec.elapsedSeconds)),
        state: 'lapsed',
        label: gap.reason.split('.')[0],
      });
      cursor = Math.max(cursor, gap.endSeconds);
    }
    if (cursor < spec.elapsedSeconds) {
      segments.push({
        id: `${spec.id}-seg-${channel}-${index++}`,
        channel,
        startSeconds: round1(cursor),
        endSeconds: round1(spec.elapsedSeconds),
        state: 'recording',
        label: 'Recording',
      });
    }
  }
  return segments;
}

/* ------------------------------------------------------------------ *
 * Bundles and suppressions
 * ------------------------------------------------------------------ */

function signalsInWindow(
  signals: EvidenceSignal[],
  start: number,
  end: number,
): EvidenceSignal[] {
  return signals.filter(s => s.offsetSeconds >= start - 0.05 && s.offsetSeconds <= end + 0.05);
}

function buildBundles(
  spec: SessionSpec,
  signals: EvidenceSignal[],
  examId: string,
): EvidenceBundle[] {
  const bundles: EvidenceBundle[] = [];

  if (spec.storyline === 'review_candidate') {
    const window = signalsInWindow(signals, FLAG_WINDOW.start, FLAG_WINDOW.end);
    bundles.push({
      id: `${spec.id}-b1`,
      sessionId: spec.id,
      windowStart: FLAG_WINDOW.start,
      windowEnd: FLAG_WINDOW.end,
      questionNumber: 11,
      title: 'Non-permitted origin, paste and response replacement',
      summary:
        'Over 22.2 s the active browser origin moved to a discussion forum that is not on the examination allow-list. A paste of 480 characters followed 2.9 s after focus returned to the workspace, and 412 characters were replaced in the response within 1.8 s. Six independent subsystems recorded activity in this window. Coverage of the phone camera lapsed for the first 12 s of the window; that interval is excluded under Regulation 9.1 and no adverse inference is drawn from it.',
      signalIds: window.map(s => s.id),
      channels: Array.from(new Set(window.map(s => s.channel))),
      evidenceQuality: 82,
      observationQuality: 88,
      independentChannels: 6,
      policyClauses: [POLICY_BY_ID.get('pol-4.1')!, POLICY_BY_ID.get('pol-4.3')!, POLICY_BY_ID.get('pol-9.1')!, POLICY_BY_ID.get('pol-11.4')!],
      supporting: [
        'Active origin changed to forum.example.edu, which is not present on the workspace allow-list (Regulation 4.1).',
        '480 characters pasted into the question 11 response editor 2.9 s after focus returned.',
        '412 characters replaced in 1.8 s, against a prior response of 96 characters typed over 74 s.',
        'Typing ran at 9.4 keys/s against a personal baseline of 3.8 keys/s measured over the first 24 minutes.',
        'Candidate gaze held on a second display for 4.6 s during the same interval.',
      ],
      gaps: [
        'Clipboard content is not retained. Only length, target and timing are recorded, so the pasted text cannot be compared with the candidate\'s own draft.',
        'Phone camera coverage lapsed for the first 12 s of the window. No adverse inference is drawn from that interval (Regulation 9.1).',
        'No audio channel is recorded, so verbal assistance can be neither supported nor excluded.',
        'Network request logs are not held client-side, so the pages loaded from the non-permitted origin cannot be enumerated.',
      ],
      alternativeExplanation:
        'The candidate may have been consulting the language reference permitted under Regulation 4.1 and lost the correct tab, or may have been reading a general discussion of the same bounded-queue problem rather than copying a solution. The recorded origin is a forum rather than the supplied reference, which is inconsistent with the permitted resource, but a single mistaken navigation to the wrong site does not by itself establish that the pasted content came from there.',
      disposition: 'escalated',
      dispositionReason:
        'Six independent subsystems recorded activity in a 22.2 s window, two of them (browser origin and clipboard) are directly governed by Regulation 4.1 and 4.3, and the window has complete laptop coverage. This meets the two-subsystem test in Regulation 11.4. It does not establish intent, and the recorded gaps above must be shown to the panel.',
      simulated: true,
    });

    bundles.push({
      id: `${spec.id}-b2`,
      sessionId: spec.id,
      windowStart: 1032,
      windowEnd: 1035.1,
      questionNumber: 10,
      title: 'Workspace tab hidden for 3.1 s',
      summary:
        'The workspace tab reported hidden for 3.1 s. Focus returned within the workspace, the origin did not change, and the candidate continued typing. Phone camera was continuous throughout.',
      signalIds: signalsInWindow(signals, 1032, 1035.1).map(s => s.id),
      channels: ['browser', 'keyboard'],
      evidenceQuality: 90,
      observationQuality: 93,
      independentChannels: 2,
      policyClauses: [POLICY_BY_ID.get('pol-4.1')!],
      supporting: [
        'Tab hidden for 3.1 s, below the 5 s threshold at which the workspace treats a switch as a policy event.',
        'Active origin on return was the examination workspace.',
        'Keystroke cadence resumed at the personal baseline within 4 s.',
      ],
      gaps: ['The application that took focus is not identifiable from the browser APIs available to the page.'],
      alternativeExplanation:
        'An operating-system switch such as a notification, a system update prompt or an input-method popup produces an identical signature.',
      disposition: 'observation_only',
      dispositionReason:
        'Recorded for context only. Duration is below threshold, the origin is unchanged, and no second channel recorded anything unusual.',
      simulated: true,
    });
  }

  if (spec.storyline === 'upheld') {
    const isShortExam = examId === 'EX-4402';
    const span = isShortExam ? 2700 : 3540;
    const start = span * 0.44;
    const end = start + 26.4;
    const window = signalsInWindow(signals, start, end);
    bundles.push({
      id: `${spec.id}-b1`,
      sessionId: spec.id,
      windowStart: round1(start),
      windowEnd: round1(end),
      questionNumber: isShortExam ? 4 : 15,
      title: 'Non-permitted origin during a second-person contact',
      summary:
        'A second person entered the companion camera frame for 11.4 s at the same time as a 19.8 s visit to a code-hosting origin, followed by a 512-character paste and a same-length response replacement. Two independent subsystems — camera and browser — place the events in the same 27 s window with continuous coverage on both.',
      signalIds: window.map(s => s.id),
      channels: Array.from(new Set(window.map(s => s.channel))),
      evidenceQuality: 88,
      observationQuality: 90,
      independentChannels: 5,
      policyClauses: [POLICY_BY_ID.get('pol-4.1')!, POLICY_BY_ID.get('pol-4.3')!, POLICY_BY_ID.get('pol-4.6')!, POLICY_BY_ID.get('pol-7.2')!],
      supporting: [
        'Second face, frontal, 11.4 s, coincident with the non-permitted origin (Regulation 7.2 sustained presence).',
        '512 characters pasted and 512 characters replaced in 2.1 s, immediately after.',
        'Companion and laptop coverage were continuous for the whole window.',
      ],
      gaps: [
        'No audio was retained, so what was said between the two people is not recoverable.',
        'The paste content is not retained, so its origin cannot be confirmed.',
      ],
      alternativeExplanation:
        'A family member or housemate could have entered the room and spoken without assisting, and the paste could have come from the candidate\'s own pre-sitting notes. The simultaneity of the two is what makes this worth a decision, not either event alone.',
      disposition: 'escalated',
      dispositionReason:
        'Sustained second-person presence coincident with a non-permitted origin and a same-length response replacement, recorded by two independent subsystems with continuous coverage. Meets Regulation 11.4.',
      simulated: true,
    });
  }

  if (spec.storyline === 'coverage_gap') {
    bundles.push({
      id: `${spec.id}-b1`,
      sessionId: spec.id,
      windowStart: PHONE_GAP.start,
      windowEnd: PHONE_GAP.end,
      questionNumber: 3,
      title: 'Companion camera offline for 372 s',
      summary:
        'The companion device stopped delivering frames for 372 s during a network handover. Laptop camera, browser, keyboard, mouse and clipboard channels continued without interruption, and the candidate continued to work through questions 3 to 6. The candidate has not been informed of the loss in this build.',
      signalIds: signalsInWindow(signals, PHONE_GAP.start - 5, PHONE_GAP.end + 5).map(s => s.id),
      channels: ['phone_camera', 'system', 'keyboard', 'code'],
      evidenceQuality: 58,
      observationQuality: 62,
      independentChannels: 4,
      policyClauses: [POLICY_BY_ID.get('pol-9.1')!],
      supporting: [
        'No frames received from the companion device for 372 s.',
        'Six of eight channels continued to record without interruption.',
        'The candidate completed 4 questions during the outage.',
      ],
      gaps: [
        'Everything the companion camera would have seen during the outage is unrecoverable.',
        'The candidate was not notified, so they may have believed they were fully observed.',
      ],
      alternativeExplanation:
        'A network handover during a reconnect is an ordinary device event. Nothing in the retained channels indicates the candidate acted on the absence of observation.',
      disposition: 'observation_only',
      dispositionReason:
        'Regulation 9.1 requires the affected interval to be excluded from any adverse inference where coverage falls below 80% for more than 120 s. It does. This is a coverage incident, not a candidate incident, and it is reported to the invigilator as an operational matter.',
      simulated: true,
    });
  }

  if (spec.storyline === 'uncertain_close') {
    const start = 1420;
    const end = 1462;
    const window = signalsInWindow(signals, start, end);
    bundles.push({
      id: `${spec.id}-b1`,
      sessionId: spec.id,
      windowStart: start,
      windowEnd: end,
      questionNumber: 9,
      title: 'Unclassified origin, absent candidate, low-amplitude audio',
      summary:
        'The active origin changed to a host not on the allow-list for 41.2 s. During the same interval the candidate left the laptop frame for 16.8 s, the companion camera detected low-amplitude speech-shaped audio, and a 640-character response was saved whose provenance cannot be established. A first reviewer recorded the decision as uncertain and referred it to the panel.',
      signalIds: window.map(s => s.id),
      channels: Array.from(new Set(window.map(s => s.channel))),
      evidenceQuality: 71,
      observationQuality: 79,
      independentChannels: 4,
      policyClauses: [POLICY_BY_ID.get('pol-4.1')!, POLICY_BY_ID.get('pol-4.3')!, POLICY_BY_ID.get('pol-7.2')!],
      supporting: [
        'Active origin unclassified for 41.2 s, restored manually by the candidate.',
        'Candidate out of the laptop frame for 16.8 s; companion coverage continuous.',
        'Response 9 saved at 640 characters with content provenance undetermined.',
      ],
      gaps: [
        'Audio was not transcribed and is not retained, so the speech-shaped detection supports nothing either way.',
        'The host at the non-permitted origin could not be classified from the record.',
        'The saved content cannot be compared with any earlier draft at sufficient length.',
      ],
      alternativeExplanation:
        'The candidate may have needed to reach a reference, may have been called away, and may have been speaking to themselves while thinking. Each of these is unremarkable on its own; they are unremarkable here only if the origin is a permitted one, which the record does not establish.',
      disposition: 'escalated',
      dispositionReason:
        'Three subsystems place the events in the same 42 s window and one of them concerns a host the record cannot classify. Escalated on the strength of what is unresolved rather than what is proven, which is why the reviewer recorded the outcome as uncertain.',
      simulated: true,
    });
  }

  if (spec.storyline === 'second_review') {
    const start = 1128.4;
    const end = start + 31.2;
    const window = signalsInWindow(signals, start, end);
    bundles.push({
      id: `${spec.id}-b1`,
      sessionId: spec.id,
      windowStart: start,
      windowEnd: end,
      questionNumber: 5,
      title: 'Unresolved redirect, scratch-field paste, elevated typing',
      summary:
        'For 28.4 s the active origin could not be resolved because the first host returned a redirect. A 218-character paste landed in the workspace scratch field rather than in a response, typing ran at 1.8× the personal baseline for 4.4 s, and response 5 then grew by 96 characters over 19 s — a normal edit cadence. No channel recorded a second person, and neither camera recorded a deviation in the window.',
      signalIds: window.map(s => s.id),
      channels: Array.from(new Set(window.map(s => s.channel))),
      evidenceQuality: 79,
      observationQuality: 84,
      independentChannels: 3,
      policyClauses: [
        POLICY_BY_ID.get('pol-2.2') ?? POLICY_BY_ID.get('pol-4.1')!,
        POLICY_BY_ID.get('pol-8.3') ?? POLICY_BY_ID.get('pol-11.4')!,
      ],
      supporting: [
        'Active origin was unresolvable for 28.4 s because of a redirect; the workspace allow-list could not be evaluated.',
        '218 characters entered the scratch field, not a response, so nothing was submitted by paste.',
        'Typing ran at 7.1 keys/s against a 4.0 keys/s personal baseline.',
      ],
      gaps: [
        'The destination host was never identified, so whether it was permitted is genuinely unknown rather than probably permitted.',
        'Scratch-field content is discarded on submission and was not retained.',
        'Neither camera recorded any deviation in the window, which weakens any reading that assistance was received.',
      ],
      alternativeExplanation:
        'A permitted reference that redirected — a documentation site redirecting a versioned path to a canonical one is the ordinary case — would produce exactly this signature, as would a candidate checking an unrelated bookmarked page. The paste into a scratch field is more consistent with working notes than with composing an answer.',
      disposition: 'escalated',
      dispositionReason:
        'Two subsystems (browser and clipboard) recorded activity that touches Regulation 2.2, which is the two-subsystem test in Regulation 8.3. Escalated because the host is unresolved and cannot be resolved retrospectively, not because the recorded behaviour is serious. An examiner may reasonably dismiss it.',
      simulated: true,
    });
  }

  if (spec.storyline === 'camera_occluded') {
    bundles.push({
      id: `${spec.id}-b1`,
      sessionId: spec.id,
      windowStart: 318,
      windowEnd: 322.1,
      questionNumber: 2,
      title: 'Laptop lens obstructed for 4.1 s',
      summary:
        'A hand crossed the laptop lens for 4.1 s and face tracking paused. The companion camera retained a clear overhead view throughout, and keyboard activity continued without a break.',
      signalIds: signalsInWindow(signals, 318, 322.1).map(s => s.id),
      channels: ['laptop_camera', 'phone_camera', 'keyboard'],
      evidenceQuality: 79,
      observationQuality: 74,
      independentChannels: 3,
      policyClauses: [POLICY_BY_ID.get('pol-9.1')!],
      supporting: [
        'Laptop face tracking paused for 4.1 s.',
        'Companion camera coverage was continuous, so no observation was lost overall.',
        'Keystroke cadence did not change across the obstruction.',
      ],
      gaps: ['The obstruction reason is inferred from the frame-difference signal, not confirmed.'],
      alternativeExplanation:
        'Reaching for a drink, adjusting the screen or shielding it from a light source all produce the same signature.',
      disposition: 'observation_only',
      dispositionReason:
        'Total observation coverage was maintained by the companion device. Recorded so the coverage figure can be explained, not because any candidate behaviour is in question.',
      simulated: true,
    });
  }

  return bundles;
}

function buildSuppressed(
  spec: SessionSpec,
  signals: EvidenceSignal[],
  examId: string,
): SuppressedObservation[] {
  if (spec.storyline === 'suppressed_gaze') {
    const target = signals.find(
      signal =>
        signal.kind === 'gaze_deviation' &&
        Math.abs(signal.offsetSeconds - SUPPRESSED_WINDOW.start) < 1,
    );
    if (!target) return [];
    return [
      {
        id: `${spec.id}-sup-1`,
        sessionId: spec.id,
        signalId: target.id,
        offsetSeconds: target.offsetSeconds,
        wallClock: target.wallClock,
        label: 'Downward gaze deviation, 4.2 s',
        channel: 'laptop_camera',
        detail:
          'Gaze directed below the viewport for 4.2 s on question 4. This is the longest gaze deviation in the session and the only one above 3 s.',
        reason:
          'The deviation is fully accounted for by the candidate\'s own working pattern. Keystrokes continued at baseline throughout, the phone camera recorded the candidate\'s hands and notes area, and the response was completed immediately afterwards. No independent channel recorded anything else.',
        baseline: 'Consistent — 4.2 s sits inside the candidate\'s own range across the first 20 minutes (median 1.8 s, 94th percentile 3.4 s).',
        checks: [
          {
            id: 'sup-a',
            label: 'Keyboard interaction active during the interval',
            result: 'pass',
            observation: '63 keystrokes recorded across the 4.2 s, at 3.9 keys/s against a 3.8 baseline.',
          },
          {
            id: 'sup-b',
            label: 'Baseline consistent with the rest of the session',
            result: 'pass',
            observation: 'Four earlier deviations between 1.1 s and 2.6 s, same pitch range, same question pattern.',
          },
          {
            id: 'sup-c',
            label: 'Browser activity stable',
            result: 'pass',
            observation: 'No focus change, no tab switch and no origin change in the 60 s either side.',
          },
          {
            id: 'sup-d',
            label: 'External interaction detected',
            result: 'pass',
            observation: 'None. No second face, no audio, no pointer activity away from the workspace.',
          },
          {
            id: 'sup-e',
            label: 'Coverage complete for the interval',
            result: 'pass',
            observation: 'Laptop and phone cameras both recording; 96% session coverage.',
          },
        ],
        simulated: true,
      },
    ];
  }

  if (spec.storyline === 'review_candidate') {
    const target = signals.find(s => s.offsetSeconds > 180 && s.offsetSeconds < 240);
    if (target) {
      return [
        {
          id: `${spec.id}-sup-1`,
          sessionId: spec.id,
          signalId: target.id,
          offsetSeconds: target.offsetSeconds,
          wallClock: target.wallClock,
          label: 'Gaze deviation, 2.4 s',
          channel: 'laptop_camera',
          detail: 'Gaze moved below the viewport for 2.4 s on question 8, returning without a break in typing.',
          reason:
            'Single-channel observation below the 3 s threshold, with keyboard activity continuing at the personal baseline and no change of browser origin. Nothing here is independent of the laptop camera, so it cannot support a finding on its own.',
          baseline: 'Within personal range — the candidate\'s 4.2 s deviation later in the session was escalated on other channels, not on this one.',
          checks: [
            {
              id: 'sup-a',
              label: 'Second independent channel recorded activity',
              result: 'fail',
              observation: 'None. This is the reason the observation was dropped.',
            },
            {
              id: 'sup-b',
              label: 'Duration above the candidate\'s own threshold',
              result: 'fail',
              observation: '2.4 s against a 3.0 s working threshold; inside the personal range.',
            },
            {
              id: 'sup-c',
              label: 'Interaction continued unchanged',
              result: 'pass',
              observation: 'Keystrokes continuous at 3.7 keys/s across the interval.',
            },
          ],
          simulated: true,
        },
      ];
    }
  }

  if (spec.storyline === 'routine' && examId === 'EX-4417') {
    const target = signals.find(s => s.kind === 'gaze_deviation' && (s.durationSeconds ?? 0) > 2.4);
    if (target) {
      return [
        {
          id: `${spec.id}-sup-1`,
          sessionId: spec.id,
          signalId: target.id,
          offsetSeconds: target.offsetSeconds,
          wallClock: target.wallClock,
          label: `Gaze deviation, ${target.durationSeconds?.toFixed(1)} s`,
          channel: 'laptop_camera',
          detail: `${target.detail} Question ${target.questionNumber ?? '—'}.`,
          reason:
            'Single-channel observation with continuous keyboard activity and no browser or companion camera change. Dropped at the correlation stage: it cannot be corroborated by an independent subsystem.',
          baseline: 'Within personal range for this candidate.',
          checks: [
            {
              id: 'sup-a',
              label: 'Second independent channel recorded activity',
              result: 'fail',
              observation: 'None.',
            },
            {
              id: 'sup-b',
              label: 'Keyboard interaction continued',
              result: 'pass',
              observation: 'Continuous at the personal baseline.',
            },
            {
              id: 'sup-c',
              label: 'Browser origin unchanged',
              result: 'pass',
              observation: 'Workspace origin retained for the whole interval.',
            },
          ],
          simulated: true,
        },
      ];
    }
  }

  return [];
}

/* ------------------------------------------------------------------ *
 * Recorded decisions
 * ------------------------------------------------------------------ */

function buildDecisions(spec: SessionSpec): ReviewDecisionRecord[] {
  if (spec.storyline === 'upheld') {
    const isShort = spec.examId === 'EX-4402';
    const escalation: ReviewDecisionRecord = {
      id: `${spec.id}-dec-0`,
      sessionId: spec.id,
      bundleId: `${spec.id}-b1`,
      decision: 'escalated',
      examinerId: 'EX-4488',
      examinerName: 'D. Achterberg',
      note: 'Referred for a second opinion: two independent subsystems, one policy breach, one possible Regulation 7.2 breach.',
      recordedAt: new Date(Date.now() - (spec.minutesAgo - 95) * 60000).toISOString(),
      settled: true,
    };
    const upheldDecision: ReviewDecisionRecord = {
      id: `${spec.id}-dec-1`,
      sessionId: spec.id,
      bundleId: `${spec.id}-b1`,
      decision: 'confirmed',
      examinerId: 'EX-4471',
      examinerName: 'R. Whitlock',
      note: isShort
        ? 'Sustained second-person presence and a non-permitted code-hosting origin fall inside the same 27 s window, with a same-length paste and replacement immediately after. I cannot exclude a coincidental room entry, but the coincidence is not something I can dismiss. Upheld under Regulations 2.2 and 8.3. Recorded limitation: the paste content was not retained, so this finding rests on timing and length, not on the text itself.'
        : 'Sustained second-person presence and a non-permitted code-hosting origin fall inside the same 27 s window, with a same-length paste and replacement immediately after. I cannot exclude a coincidental room entry, but the coincidence is not something I can dismiss. Upheld under Regulations 4.1, 4.3 and 7.2. Recorded limitation: the paste content was not retained, so this finding rests on timing and length, not on the text itself.',
      recordedAt: new Date(Date.now() - (spec.minutesAgo - 40) * 60000).toISOString(),
      settled: true,
    };
    return [upheldDecision, escalation];
  }

  if (spec.storyline === 'uncertain_close') {
    return [
      {
        id: `${spec.id}-dec-1`,
        sessionId: spec.id,
        bundleId: `${spec.id}-b1`,
        decision: 'uncertain',
        examinerId: 'EX-4488',
        examinerName: 'D. Achterberg',
        note:
          'I cannot classify the origin and the audio was not transcribed, so the strongest item in this bundle is the one I can least rely on. Referring to the panel rather than deciding. If the network log is available it should be requested before this is resolved either way.',
        recordedAt: new Date(Date.now() - (spec.minutesAgo - 60) * 60000).toISOString(),
        settled: true,
      },
    ];
  }

  if (spec.storyline === 'second_review') {
    return [
      {
        id: `${spec.id}-dec-1`,
        sessionId: spec.id,
        bundleId: `${spec.id}-b1`,
        decision: 'escalated',
        examinerId: 'EX-4488',
        examinerName: 'D. Achterberg',
        note:
          'Queued rather than decided. The redirect means I cannot establish whether the origin was permitted, and I am not willing to escalate on an unresolvable host alone — nor to dismiss it, since the clipboard entry is real. Requesting the network log before this is decided.',
        recordedAt: new Date(Date.now() - (spec.minutesAgo - 210) * 60000).toISOString(),
        settled: true,
      },
    ];
  }

  if (spec.storyline === 'routine' && spec.reviewStatus === 'dismissed') {
    return [
      {
        id: `${spec.id}-dec-1`,
        sessionId: spec.id,
        decision: 'dismissed',
        examinerId: 'EX-4502',
        examinerName: 'S. Boateng',
        note:
          'Reviewed the full timeline. Six brief gaze deviations, all inside the personal baseline, each with continuous keyboard activity. No browser origin change, no paste, no coverage gap. Nothing to uphold.',
        recordedAt: new Date(Date.now() - (spec.minutesAgo - 130) * 60000).toISOString(),
        settled: true,
      },
    ];
  }

  if (spec.storyline === 'review_candidate') {
    return [
      {
        id: `${spec.id}-dec-1`,
        sessionId: spec.id,
        bundleId: `${spec.id}-b1`,
        decision: 'escalated',
        examinerId: 'EX-4471',
        examinerName: 'R. Whitlock',
        note:
          'Six subsystems in 22 s, two of them governed directly by the examination regulations. Queued for panel review. The phone coverage lapse at the start of the window is noted so the panel applies Regulation 9.1 to that interval.',
        recordedAt: new Date(Date.now() - 22 * 60000).toISOString(),
        settled: true,
      },
    ];
  }

  if (spec.storyline === 'coverage_gap') {
    return [
      {
        id: `${spec.id}-dec-1`,
        sessionId: spec.id,
        bundleId: `${spec.id}-b1`,
        decision: 'dismissed',
        examinerId: 'EX-4488',
        examinerName: 'D. Achterberg',
        note:
          'Companion device lost network for 372 s. Six of eight channels continued, and Regulation 9.1 excludes the interval from adverse inference. Referred to the invigilator as a device incident and to the candidate as a session irregularity to be recorded. No candidate inference drawn.',
        recordedAt: new Date(Date.now() - (spec.minutesAgo - 50) * 60000).toISOString(),
        settled: true,
      },
    ];
  }

  return [];
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

let cached: SessionRecord[] | null = null;

function assemble(nowMs: number): SessionRecord[] {
  return SPECS.map(spec => {
    const exam = EXAM_BY_ID.get(spec.examId);
    const candidate = CANDIDATE_BY_ID.get(spec.candidateId);
    if (!exam || !candidate) {
      throw new Error(`Session ${spec.id} references unknown exam or candidate`);
    }

    const startWallMs = nowMs - spec.elapsedSeconds * 1000 - spec.minutesAgo * 60000;
    const ctx: SignalContext = {
    sessionId: spec.id,
    startWallMs,
    totalSeconds: spec.totalSeconds,
    signals: [],
  };
    const rng = makeRng(spec.id);

    switch (spec.storyline) {
      case 'review_candidate':
        buildReviewCandidate(ctx, rng);
        break;
      case 'second_review':
        buildSecondReview(ctx, rng, spec);
        break;
      case 'suppressed_gaze':
        buildSuppressedGaze(ctx, rng);
        break;
      case 'coverage_gap':
        buildCoverageGap(ctx, rng);
        break;
      case 'upheld':
        buildUpheld(ctx, spec.examId, rng);
        break;
      case 'uncertain_close':
        buildUncertain(ctx, rng);
        break;
      case 'camera_occluded':
        buildCameraOccluded(ctx, rng, spec);
        break;
      default:
        buildRoutine(ctx, rng, spec);
    }

    const signals = ctx.signals.sort((a, b) => a.offsetSeconds - b.offsetSeconds);
    const gaps = buildCoverageGaps(spec);
    const bundles = buildBundles(spec, signals, spec.examId);
    const suppressed = buildSuppressed(spec, signals, spec.examId);
    const decisions = buildDecisions(spec);

    const last = signals[signals.length - 1];

    return {
      id: spec.id,
      examId: exam.id,
      examTitle: exam.title,
      examCode: exam.code,
      candidate,
      status: spec.status,
      reviewStatus: spec.reviewStatus,
      startedAt: new Date(startWallMs).toISOString(),
      endedAt:
        spec.status === 'live' ? null : new Date(startWallMs + spec.elapsedSeconds * 1000).toISOString(),
      elapsedSeconds: spec.elapsedSeconds,
      totalSeconds: spec.totalSeconds,
      questionCount: exam.questionCount,
      currentQuestion: spec.currentQuestion,
      answeredCount: spec.answeredCount,
      devices: applyDeviceOverrides(baseDevices(spec.examId), spec.devices),
      observationCoverage: spec.coverage,
      observationQuality: spec.observationQuality,
      evidenceQuality: spec.evidenceQuality,
      coverageGaps: gaps,
      lastSignalAt: last ? new Date(startWallMs + last.offsetSeconds * 1000).toISOString() : new Date(startWallMs).toISOString(),
      lastSignalLabel: last ? last.label : 'No activity recorded',
      signalCount: signals.length,
      suppressedCount: suppressed.length,
      escalatedCount: bundles.filter(b => b.disposition === 'escalated').length,
      signals,
      bundles,
      suppressed,
      decisions,
      timelineSegments: buildTimelineSegments(spec, gaps),
      provenance: 'simulated',
    };
  });
}

let cachedMinute = -1;

/** Full session set. Rebuilt whenever the minute changes so relative times stay honest. */
export function getSessions(nowMs: number = Date.now()): SessionRecord[] {
  const minute = Math.floor(nowMs / 60000);
  if (!cached || cachedMinute !== minute) {
    cached = assemble(nowMs);
    cachedMinute = minute;
  }
  return cached;
}

export const SESSION_SPEC_IDS = SPECS.map(s => s.id);
