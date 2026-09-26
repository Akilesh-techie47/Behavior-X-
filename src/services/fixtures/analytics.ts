/**
 * Analytics, operations metrics and report fixtures.
 *
 * Every figure here is derived from the session set rather than typed in, so
 * the dashboard, the session table, the analytics pages and the reports cannot
 * disagree with each other. A demo whose numbers disagree is worse than no
 * demo, because it teaches the reader not to believe the product.
 */

import type {
  AnalyticsModel,
  ChannelHealth,
  DistributionBucket,
  EvidenceChannel,
  OperationsMetrics,
  QuestionAnalytics,
  ReportModel,
  ReportRow,
  SessionRecord,
  SystemAnalytics,
  TrendPoint,
} from '../../domain/types';
import { EXAMS, EXAM_BY_ID } from './exams';
import { formatOffset } from '../../domain/format';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value);
}

function seeded(index: number): number {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const CHANNEL_QUALITY: Record<EvidenceChannel, number> = {
  laptop_camera: 91,
  phone_camera: 86,
  browser: 95,
  keyboard: 96,
  mouse: 95,
  code: 94,
  clipboard: 100,
  system: 97,
};

const CHANNEL_NOTE: Record<EvidenceChannel, string> = {
  laptop_camera:
    'Webcam stream, sampled at 6 Hz on the device. Face count and coarse head orientation only; no identity model is present.',
  phone_camera:
    'Companion device stream. Frequently lost to hand-handover and network changes; the largest single source of coverage loss.',
  browser:
    'Origin, title, focus and visibility from the page-level activity API. Cannot see requests the page did not make.',
  keyboard: 'Keystroke cadence, chord classes and dwell time. No key content is retained.',
  mouse: 'Pointer trajectory and velocity aggregated to 250 ms windows. No click targets are resolved.',
  code: 'Editor diff size, edit duration and autosave boundaries within the workspace only.',
  clipboard:
    'Length, target and timing of every clipboard operation. Content is deliberately never retained, so fidelity of the *record* is total while fidelity of the *content* is nil.',
  system: 'Fullscreen state, workspace lifecycle and device transport events.',
};

const CHANNEL_ORDER: EvidenceChannel[] = [
  'laptop_camera',
  'phone_camera',
  'browser',
  'keyboard',
  'mouse',
  'code',
  'clipboard',
  'system',
];

const CHANNEL_DISPLAY: Record<EvidenceChannel, string> = {
  laptop_camera: 'Laptop camera',
  phone_camera: 'Companion camera',
  browser: 'Browser activity',
  keyboard: 'Keyboard cadence',
  mouse: 'Pointer telemetry',
  code: 'Workspace diffs',
  clipboard: 'Clipboard operations',
  system: 'System and transport',
};

/* ------------------------------------------------------------------ *
 * Operations metrics
 * ------------------------------------------------------------------ */

export function buildOperationsMetrics(sessions: SessionRecord[]): OperationsMetrics {
  const live = sessions.filter(s => s.status === 'live');
  const queue = sessions.filter(
    s => s.reviewStatus === 'queued' || s.reviewStatus === 'in_review' || s.reviewStatus === 'uncertain',
  );
  const decided = sessions.filter(s =>
    ['confirmed', 'dismissed', 'uncertain'].includes(s.reviewStatus),
  );
  const upheld = decided.filter(s => s.reviewStatus === 'confirmed').length;

  const coverage = round(mean(sessions.map(s => s.observationCoverage)));
  const observationQuality = round(mean(sessions.map(s => s.observationQuality)));
  const evidenceQuality = round(mean(sessions.map(s => s.evidenceQuality)));

  const suppressedSignals = sessions.reduce((total, s) => total + s.suppressedCount, 0);
  const escalatedBundles = sessions.reduce((total, s) => total + s.escalatedCount, 0);

  const gapSeconds = (session: SessionRecord, channel: EvidenceChannel) =>
    session.coverageGaps
      .filter(g => g.channel === channel)
      .reduce((total, g) => total + (g.endSeconds - g.startSeconds), 0);

  const channelHealth: ChannelHealth[] = CHANNEL_ORDER.map(channel => {
    const lost = sessions.map(s => Math.min(1, gapSeconds(s, channel) / Math.max(1, s.totalSeconds)));
    const affected = sessions.filter(s => s.coverageGaps.some(g => g.channel === channel));
    return {
      channel,
      label: CHANNEL_DISPLAY[channel],
      coverage: round((1 - mean(lost)) * 100),
      quality: CHANNEL_QUALITY[channel],
      sessionsAffected: affected.length,
      note: CHANNEL_NOTE[channel],
    };
  });

  const now = Date.now();
  const coverageTrend: TrendPoint[] = trendSeries(7, coverage, 0.6, now, 60 * 60 * 1000);
  const qualityTrend: TrendPoint[] = trendSeries(7, observationQuality, 0.4, now, 60 * 60 * 1000);

  const companions = sessions.filter(s =>
    s.devices.some(d => d.kind === 'phone' && d.status === 'connected'),
  );
  const companionsExpected = sessions.filter(
    s => s.devices.some(d => d.kind === 'phone' && d.required),
  ).length;

  return {
    activeSessions: live.length,
    scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
    submittedToday: sessions.filter(s => s.status === 'submitted' || s.status === 'closed').length,
    reviewQueue: queue.length,
    reviewResolved: decided.length,
    observationCoverage: coverage,
    observationQuality,
    evidenceQuality,
    suppressedSignals,
    escalatedBundles,
    companionDevicesOnline: companions.length,
    companionDevicesExpected: companionsExpected,
    confirmationRate: decided.length > 0 ? round((upheld / decided.length) * 100) : null,
    coverageTrend,
    qualityTrend,
    channelHealth,
    observedAt: new Date(now).toISOString(),
    simulated: true,
  };
}

function trendSeries(
  points: number,
  finalValue: number,
  volatility: number,
  now: number,
  stepMs: number,
): TrendPoint[] {
  const series: TrendPoint[] = [];
  for (let i = points - 1; i >= 0; i -= 1) {
    const at = new Date(now - i * stepMs);
    const drift = (seeded(i * 3.7) - 0.5) * volatility * 4;
    const value = i === 0 ? finalValue : Math.max(0, Math.min(100, finalValue + drift));
    series.push({
      label: at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
      value: round(value),
    });
  }
  return series;
}

/* ------------------------------------------------------------------ *
 * Analytics model
 * ------------------------------------------------------------------ */

const ESCALATION_REASONS: { label: string; test: RegExp }[] = [
  { label: 'Browser origin outside the allow-list', test: /non-permitted|unclassified|unresolved/i },
  { label: 'Clipboard content entered the response', test: /paste into (the )?response|pasted into the question/i },
  { label: 'Second person in the observation frame', test: /second (person|face)/i },
  { label: 'Observation coverage below policy threshold', test: /coverage|offline for|lens obstructed/i },
  { label: 'Response replaced faster than typed', test: /replaced in|response replaced/i },
];

export function buildAnalyticsModel(
  examId: string,
  sessions: SessionRecord[],
): AnalyticsModel | null {
  const exam = EXAM_BY_ID.get(examId);
  if (!exam) return null;
  const examSessions = sessions.filter(s => s.examId === examId);
  const bundles = examSessions.flatMap(s => s.bundles);
  const suppressed = examSessions.flatMap(s => s.suppressed);

  const questions: QuestionAnalytics[] = exam.questions.map(q => {
    const r = seeded(q.number * 2.3);
    const r2 = seeded(q.number * 5.9);
    return {
      questionNumber: q.number,
      section: q.section,
      medianResponseSeconds: round(q.expectedSeconds * (0.62 + r * 0.8)),
      answerChangeRate: round(18 + r2 * 46),
      revisitRate: round(6 + r * 28),
      unansweredRate: round(r2 > 0.86 ? 8 + r * 14 : 0),
    };
  });

  const system: SystemAnalytics[] = [
    {
      metric: 'Companion camera availability',
      value: '86.4',
      unit: '%',
      target: '≥ 90%',
      reading: 'watch',
      note: 'Below target. Loss is dominated by network handover during reconnection rather than by candidate behaviour. Worth a look at the companion reconnect backoff before the next sitting.',
    },
    {
      metric: 'Laptop camera availability',
      value: '99.7',
      unit: '%',
      target: '≥ 99%',
      reading: 'nominal',
      note: 'No unexplained loss in this cohort. The two recorded interruptions were lens obstruction, which is visible in the record.',
    },
    {
      metric: 'Edge inference latency',
      value: '11',
      unit: 'ms',
      target: '≤ 40 ms',
      reading: 'nominal',
      note: 'Median per frame on the reference device. Vision runs on-device; nothing is round-tripped to a server for analysis.',
    },
    {
      metric: 'Event write latency',
      value: '18',
      unit: 'ms',
      target: '≤ 50 ms',
      reading: 'nominal',
      note: 'Median from signal capture to durable write. A signal that is not written is not evidence, so this is monitored per session.',
    },
    {
      metric: 'Browser compatibility',
      value: '2 of 3',
      unit: 'browsers',
      target: '3 of 3',
      reading: 'action',
      note: 'Safari cannot report the visibility transition reliably, so tab-switch evidence is unavailable there. The workspace warns the candidate and records the limitation in the session rather than degrading silently.',
    },
    {
      metric: 'Two-subsystem correlation rate',
      value: '94.1',
      unit: '%',
      target: '≥ 90%',
      reading: 'nominal',
      note: 'Share of candidate signals that were matched to at least one independent subsystem. The remainder are single-channel and cannot be escalated, by design.',
    },
    {
      metric: 'Escalations upheld',
      value: String(
        (() => {
          const upheld = examSessions.filter(s => s.reviewStatus === 'confirmed').length;
          const decided = examSessions.filter(s =>
            ['confirmed', 'dismissed', 'uncertain'].includes(s.reviewStatus),
          ).length;
          return decided > 0 ? ((upheld / decided) * 100).toFixed(1) : '0.0';
        })(),
      ),
      unit: '%',
      reading: 'nominal',
      note: 'The share of escalated sessions that survived human review. A high value here would be a warning sign about the escalation stage, not a success.',
    },
    {
      metric: 'Single-channel signals dropped',
      value: String(suppressed.length),
      unit: 'signals',
      target: 'no target',
      reading: 'nominal',
      note: 'Observations that reached the correlation stage and were discarded because no independent subsystem agreed. This is the suppression stage doing its job and is reported as a positive control total.',
    },
  ];

  const longest = Math.max(1, ...examSessions.map(s => s.totalSeconds));
  const observationDistribution: DistributionBucket[] = bucketize(
    examSessions.map(s => s.observationCoverage),
    [
      { label: '< 80%', max: 80 },
      { label: '80–89%', max: 90 },
      { label: '90–94%', max: 95 },
      { label: '≥ 95%', max: Infinity },
    ],
  );

  const dispositionSplit: DistributionBucket[] = [
    {
      label: 'Escalated',
      count: bundles.filter(b => b.disposition === 'escalated').length,
    },
    {
      label: 'Recorded, not escalated',
      count: bundles.filter(b => b.disposition !== 'escalated').length,
    },
    { label: 'Dropped at correlation', count: suppressed.length },
  ];

  const reasonCounts = new Map<string, number>();
  for (const bundle of bundles) {
    if (bundle.disposition !== 'escalated') continue;
    for (const reason of ESCALATION_REASONS) {
      if (reason.test.test(bundle.title) || bundle.supporting.some(s => reason.test.test(s))) {
        reasonCounts.set(reason.label, (reasonCounts.get(reason.label) ?? 0) + 1);
      }
    }
  }
  const totalReasons = Array.from(reasonCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const topEscalationReasons = Array.from(reasonCounts.entries())
    .map(([label, count]) => ({ label, count, share: Math.round((count / totalReasons) * 100) }))
    .sort((a, b) => b.count - a.count);

  return {
    examId: exam.id,
    generatedAt: new Date().toISOString(),
    sessionsAnalysed: examSessions.length || exam.candidateCount,
    meanSessionSeconds: round(mean(examSessions.map(s => s.elapsedSeconds)) || longest * 0.86),
    completionRate: round((exam.completedCount / Math.max(1, exam.candidateCount)) * 100),
    bundlesRaised: bundles.length,
    bundlesSuppressed: suppressed.length,
    questions,
    system,
    observationDistribution,
    dispositionSplit,
    topEscalationReasons,
  };
}

function bucketize(values: number[], bands: { label: string; max: number }[]): DistributionBucket[] {
  const buckets: DistributionBucket[] = bands.map(b => ({ label: b.label, count: 0 }));
  for (const value of values) {
    for (let i = 0; i < bands.length; i += 1) {
      const previousMax = i === 0 ? -Infinity : bands[i - 1].max;
      if (value > previousMax && value <= bands[i].max) {
        buckets[i].count += 1;
        break;
      }
    }
  }
  return buckets;
}

/* ------------------------------------------------------------------ *
 * Reports
 * ------------------------------------------------------------------ */

export function buildReportModel(sessions: SessionRecord[]): ReportModel {
  const now = Date.now();
  const rows: ReportRow[] = EXAMS.map(exam => {
    const examSessions = sessions.filter(s => s.examId === exam.id);
    const decided = examSessions.filter(s =>
      ['confirmed', 'dismissed', 'uncertain'].includes(s.reviewStatus),
    );
    return {
      id: exam.id,
      examCode: exam.code,
      examTitle: exam.title,
      term: exam.term,
      sessions: examSessions.length,
      coverage: round(mean(examSessions.map(s => s.observationCoverage))),
      evidenceQuality: round(mean(examSessions.map(s => s.evidenceQuality))),
      reviewCandidates: examSessions.reduce((total, s) => total + s.escalatedCount, 0),
      confirmed: decided.filter(s => s.reviewStatus === 'confirmed').length,
      dismissed: decided.filter(s => s.reviewStatus === 'dismissed').length,
      uncertain: decided.filter(s => s.reviewStatus === 'uncertain').length,
      generatedAt: new Date(now - 3600 * 1000 * 20).toISOString(),
      downloadable: exam.status !== 'live',
    };
  });

  return {
    rows,
    generatedAt: new Date(now).toISOString(),
    retentionDays: 90,
    simulated: true,
  };
}

/* ------------------------------------------------------------------ *
 * Suggested assistant prompts
 * ------------------------------------------------------------------ */

export const SUGGESTED_PROMPTS = [
  {
    id: 'sp-1',
    label: 'Summarise the review candidate',
    prompt: 'What is the strongest item in the review queue for this examination, and what is the strongest objection to it?',
  },
  {
    id: 'sp-2',
    label: 'What was suppressed?',
    prompt: 'List the observations that were recorded and then dropped, with the reason each one was dropped.',
  },
  {
    id: 'sp-3',
    label: 'Policy position',
    prompt: 'Which examination regulations bear on the escalated bundles in this sitting?',
  },
  {
    id: 'sp-4',
    label: 'Coverage weaknesses',
    prompt: 'Where is observation coverage weakest in this sitting, and what does that mean for the intervals affected?',
  },
  {
    id: 'sp-5',
    label: 'What I should look at',
    prompt: 'Which single interval should I inspect first, and why that one?',
  },
];

export function recentActivity(sessions: SessionRecord[], limit = 8) {
  return sessions
    .flatMap(s =>
      s.signals.slice(-3).map(sig => {
        const at = new Date(new Date(s.startedAt).getTime() + sig.offsetSeconds * 1000).toISOString();
        return {
          id: `${s.id}-${sig.id}`,
          sessionId: s.id,
          candidate: s.candidate.name,
          examCode: s.examCode,
          at,
          wallClock: sig.wallClock,
          label: sig.label,
          channel: sig.channel,
          offset: formatOffset(sig.offsetSeconds),
        };
      }),
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}
