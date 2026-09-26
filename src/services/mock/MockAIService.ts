/**
 * Examiner assistant.
 *
 * This is a rule-based responder over the same evidence record the interface
 * shows. It exists to prove two things about the product: that an assistant can
 * be useful inside a review without being the decision-maker, and that the
 * interface has somewhere to put the parts of an answer that a model is bad at
 * — the standing, the caveat, and the interval a human should look at.
 *
 * The response is assembled from the session record, not from a template, so
 * the numbers in it always match the panels beside it.
 */

import type {
  EvidenceBundle,
  ExaminerBriefing,
  SessionRecord,
  SuppressedObservation,
} from '../../domain/types';
import type { AIService } from '../contracts';
import { getSessions } from '../fixtures/sessions';
import { SUGGESTED_PROMPTS } from '../fixtures/analytics';
import { formatOffset } from '../../domain/format';
import { transport } from './transport';

const STANDING =
  'This assistant reads the event record and the examination regulations. It does not watch video, because no video exists. It cannot decide a case, and nothing it produces is a finding. Every answer is assembled from the same record shown in the panels beside it.';

const CAVEAT =
  'Generated from the structured event record. It can be wrong in the same way a summary can be wrong: by omitting something. Treat every section as a reading aid for a human decision, never as the decision.';

interface Intent {
  focus: 'escalated' | 'suppressed' | 'coverage' | 'policy' | 'general';
  bundle?: EvidenceBundle;
  observation?: SuppressedObservation;
}

function detectIntent(question: string, session: SessionRecord): Intent {
  const q = question.toLowerCase();

  const wantsSuppressed = /suppress|dropped|discard|false positive|not escalate|why not/.test(q);
  if (wantsSuppressed && session.suppressed.length > 0) {
    return { focus: 'suppressed', observation: session.suppressed[0] };
  }

  const wantsCoverage = /coverage|lapse|gap|weak|missing|unavailable|offline/.test(q);
  if (wantsCoverage) return { focus: 'coverage' };

  const wantsPolicy = /polic|regulation|clause|rule|permitted|breach|allow/.test(q);
  if (wantsPolicy) return { focus: 'policy' };

  const queued = session.bundles.filter(b => b.disposition === 'escalated');
  const bundle = queued[0] ?? session.bundles[0];
  return { focus: 'escalated', bundle };
}

function bullet(items: string[]): string {
  return items.map(item => `· ${item}`).join('\n');
}

function buildEscalatedAnswer(session: SessionRecord, bundle: EvidenceBundle): ExaminerBriefing['sections'] {
  const signals = bundle.signalIds
    .map(id => session.signals.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const observed = bullet([
    `${formatOffset(bundle.windowStart)} to ${formatOffset(bundle.windowEnd)}, a window of ${Math.round(
      bundle.windowEnd - bundle.windowStart,
    )} s on question ${bundle.questionNumber ?? '—'}.`,
    ...signals
      .slice(0, 5)
      .map(
        s =>
          `${s.wallClock} · ${s.label.toLowerCase()} (${s.channel.replace('_', ' ')}, ${
            s.confidence >= 0.9 ? 'high' : s.confidence >= 0.75 ? 'medium' : 'low'
          } detector confidence).`,
      ),
  ]);

  const correlated = bullet([
    `${bundle.independentChannels} independent subsystems recorded activity in the same window: ${bundle.channels
      .map(c => c.replace('_', ' '))
      .join(', ')}.`,
    `Evidence quality ${bundle.evidenceQuality}%. Observation quality ${bundle.observationQuality}%.`,
    bundle.supporting[0] ?? '',
  ]);

  const context = bullet(
    bundle.policyClauses.map(
      clause => `${clause.reference}: ${clause.text}`,
    ),
  );

  const evidence = `${bullet(
    bundle.supporting.map(item => item),
  )}\n\nWhat the record does not contain:\n${bullet(bundle.gaps.map(item => item))}`;

  const alternative = bundle.alternativeExplanation;

  const suggestion = `Open the evidence workstation at ${formatOffset(
    bundle.windowStart + 4,
  )} and read forward. The ordering of the paste, the response replacement and the typing burst is what carries this bundle; the individual signals do not. Compare the interval with the candidate's baseline panel before deciding, and record the gaps above in your note if you uphold it.`;

  return [
    { key: 'observed', title: 'Observed', body: observed, signalIds: signals.map(s => s.id) },
    { key: 'correlated', title: 'Correlated', body: correlated, signalIds: [] },
    { key: 'context', title: 'Context', body: context, signalIds: [] },
    { key: 'evidence', title: 'Evidence', body: evidence, signalIds: [] },
    { key: 'alternative', title: 'Alternative explanation', body: alternative, signalIds: [] },
    { key: 'suggestion', title: 'Review suggestion', body: suggestion, signalIds: [] },
  ];
}

function buildSuppressedAnswer(
  session: SessionRecord,
  observation: SuppressedObservation,
): ExaminerBriefing['sections'] {
  const passes = observation.checks.filter(c => c.result === 'pass');
  const failures = observation.checks.filter(c => c.result === 'fail');

  return [
    {
      key: 'observed',
      title: 'Observed',
      body: bullet([
        `${observation.wallClock} · ${observation.label.toLowerCase()} on the ${observation.channel.replace('_', ' ')} channel.`,
        observation.detail,
      ]),
      signalIds: [],
    },
    {
      key: 'correlated',
      title: 'Correlated',
      body: bullet([
        `${passes.length} of ${observation.checks.length} suppression checks passed.`,
        ...observation.checks.map(c => `${c.label}: ${c.observation}`),
      ]),
      signalIds: [],
    },
    {
      key: 'context',
      title: 'Context',
      body: observation.baseline,
      signalIds: [],
    },
    {
      key: 'evidence',
      title: 'Evidence',
      body: failures.length > 0
        ? `${bullet(failures.map(c => `Failed: ${c.label.toLowerCase()} — ${c.observation}`))}\n\nThis is the reason it was dropped. A single-channel observation cannot be corroborated by an independent subsystem, so it cannot be escalated regardless of how confident the detector was.`
        : 'All checks passed. The observation is consistent with the candidate\'s own working pattern on every dimension tested.',
      signalIds: [],
    },
    {
      key: 'alternative',
      title: 'Alternative explanation',
      body: observation.reason,
      signalIds: [],
    },
    {
      key: 'suggestion',
      title: 'Review suggestion',
      body: `Nothing requires review here. If you want to confirm the suppression was correct, the interval at ${formatOffset(
        observation.offsetSeconds,
      )} on session ${session.id} has the full record, including the ${session.suppressed.length} other dropped observation${
        session.suppressed.length === 1 ? '' : 's'
      } on this session.`,
      signalIds: [],
    },
  ];
}

function buildCoverageAnswer(session: SessionRecord): ExaminerBriefing['sections'] {
  const gaps = session.coverageGaps;
  const deviceIssues = session.devices.filter(
    d => d.status === 'degraded' || d.status === 'disconnected',
  );

  return [
    {
      key: 'observed',
      title: 'Observed',
      body:
        gaps.length === 0
          ? 'Observation coverage is continuous across all eight channels for the whole session. No interval was lost.'
          : bullet(
              gaps.map(
                gap =>
                  `${gap.channel.replace('_', ' ')} · ${formatOffset(gap.startSeconds)} to ${formatOffset(
                    gap.endSeconds,
                  )} · ${Math.round(gap.endSeconds - gap.startSeconds)} s lost. ${gap.reason}`,
              ),
            ),
      signalIds: [],
    },
    {
      key: 'correlated',
      title: 'Correlated',
      body: bullet([
        `Session observation coverage ${session.observationCoverage}%, observation quality ${session.observationQuality}%, evidence quality ${session.evidenceQuality}%.`,
        ...deviceIssues.map(d => `${d.label}: ${d.status} — ${d.detail}`),
      ]),
      signalIds: [],
    },
    {
      key: 'context',
      title: 'Context',
      body:
        'Examination Regulation 9.1 requires that where coverage falls below 80% for more than 120 continuous seconds, the affected interval is excluded from any adverse inference. It is not evidence that the candidate did anything; it is evidence that the system was not watching, and it must be reported as such.',
      signalIds: [],
    },
    {
      key: 'evidence',
      title: 'Evidence',
      body: bullet([
        `${session.signalCount} signals recorded in total.`,
        `${session.suppressedCount} dropped at the correlation stage.`,
        `${session.escalatedCount} escalated for human review.`,
        'The channels that continued during the gap are recorded separately, so it is possible to state exactly what was and was not observed.',
      ]),
      signalIds: [],
    },
    {
      key: 'alternative',
      title: 'Alternative explanation',
      body:
        'Coverage loss in this product is dominated by the companion device losing its network during reconnection, not by candidate behaviour. A session with a coverage gap is more likely to indicate a device problem than a conduct problem, and the two should never be conflated in an examiner\'s note.',
      signalIds: [],
    },
    {
      key: 'suggestion',
      title: 'Review suggestion',
      body:
        'Treat this as an operational matter, not a candidate matter. Record it as a device incident so the companion reconnect behaviour can be fixed before the next sitting, and tell the candidate their session had a recorded irregularity.',
      signalIds: [],
    },
  ];
}

function buildPolicyAnswer(session: SessionRecord): ExaminerBriefing['sections'] {
  const escalated = session.bundles.filter(b => b.disposition === 'escalated');
  const clauses = new Map<string, { reference: string; text: string; count: number }>();
  for (const bundle of escalated) {
    for (const clause of bundle.policyClauses) {
      const entry = clauses.get(clause.id) ?? { reference: clause.reference, text: clause.text, count: 0 };
      entry.count += 1;
      clauses.set(clause.id, entry);
    }
  }
  const list = Array.from(clauses.values()).sort((a, b) => b.count - a.count);

  return [
    {
      key: 'observed',
      title: 'Observed',
      body:
        escalated.length === 0
          ? 'No bundles in this session were escalated, so no regulation is currently in question.'
          : `${escalated.length} bundle${escalated.length === 1 ? '' : 's'} in this session ${escalated.length === 1 ? 'touches' : 'touch'} the examination regulations.`,
      signalIds: [],
    },
    {
      key: 'correlated',
      title: 'Correlated',
      body: list.length === 0 ? '—' : bullet(list.map(c => `${c.reference} · cited by ${c.count} bundle${c.count === 1 ? '' : 's'}`)),
      signalIds: [],
    },
    {
      key: 'context',
      title: 'Context',
      body: list.length === 0 ? '—' : list.map(c => `${c.reference}\n${c.text}`).join('\n\n'),
      signalIds: [],
    },
    {
      key: 'evidence',
      title: 'Evidence',
      body:
        'Regulation 11.4 is the operative test: a review candidate may only be upheld where evidence originates from at least two independent subsystems and the recorded interval has complete coverage. Every escalation in this session states its own channel count for exactly this reason.',
      signalIds: [],
    },
    {
      key: 'alternative',
      title: 'Alternative explanation',
      body:
        'A regulation being cited is not a finding that it was breached. The clause identifies which question to ask; the evidence still has to answer it.',
      signalIds: [],
    },
    {
      key: 'suggestion',
      title: 'Review suggestion',
      body: 'When you write your note, quote the regulation by reference and state which recorded fact engages it. A decision that cites a clause without a fact is not reviewable by a panel.',
      signalIds: [],
    },
  ];
}

function buildGeneralAnswer(session: SessionRecord): ExaminerBriefing['sections'] {
  const bundle = session.bundles.find(b => b.disposition === 'escalated') ?? session.bundles[0];
  if (bundle) {
    const sections = buildEscalatedAnswer(session, bundle);
    return [
      { ...sections[0], body: `${bullet([session.candidate.name, session.examTitle, `${formatOffset(session.elapsedSeconds)} of ${formatOffset(session.totalSeconds)} elapsed.`])}\n\n${sections[0].body}` },
      ...sections.slice(1),
    ];
  }
  return buildSuppressedAnswer(session, {
    id: 'none',
    sessionId: session.id,
    signalId: session.signals[0]?.id ?? 'none',
    offsetSeconds: 0,
    wallClock: '--:--:--',
    label: 'No review candidate',
    channel: 'system',
    detail: 'Nothing in this session was escalated.',
    reason: 'No bundle was raised.',
    baseline: '—',
    checks: [],
    simulated: true,
  });
}

export class MockAIService implements AIService {
  async suggestions() {
    return transport(() => SUGGESTED_PROMPTS);
  }

  async ask(sessionId: string, question: string): Promise<ExaminerBriefing> {
    return transport(() => {
      const session = getSessions().find(s => s.id === sessionId);
      if (!session) throw new Error(`Unknown session: ${sessionId}`);

      const intent = detectIntent(question, session);

      let sections: ExaminerBriefing['sections'];
      switch (intent.focus) {
        case 'suppressed':
          sections = buildSuppressedAnswer(session, intent.observation!);
          break;
        case 'coverage':
          sections = buildCoverageAnswer(session);
          break;
        case 'policy':
          sections = buildPolicyAnswer(session);
          break;
        default:
          sections = buildGeneralAnswer(session);
      }

      return {
        id: `brief-${Date.now().toString(36)}`,
        sessionId,
        question,
        sections,
        standing: STANDING,
        model: 'behaviour-x-assistant · rule-based over the event record',
        generatedAt: new Date().toISOString(),
        confidenceCaveat: CAVEAT,
        simulated: true,
      };
    });
  }
}
