/**
 * Invariant checks for the record.
 *
 * This is not a unit-test suite. It is the set of claims the interface makes
 * about its own data, checked against the fixtures, because a build that
 * displays a dangling signal id or a bundle that points at nothing is worse
 * than one that refuses to start.
 *
 * Run with: npm test
 */

import { services, CURRENT_EXAMINER } from '../src/services';
import { CHANNEL_LABEL } from '../src/domain/format';
import type { DecisionKind, EvidenceSignal, SessionRecord } from '../src/domain/types';

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail?: string): void {
  checks += 1;
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

async function main(): Promise<void> {
  console.log('BEHAVIOR-X — record invariants\n');

  const exams = await services.exam.listExams();
  const sessions = await services.sessions.list();
  const candidate = await services.exam.getCandidate();

  section('Fixture shape');
  check('examinations are returned', exams.length > 0, `${exams.length}`);
  check('sessions are returned', sessions.length > 0, `${sessions.length}`);
  check('a candidate is returned', Boolean(candidate.id));
  check(
    'every examination is marked simulated',
    exams.every(exam => exam.simulated === true),
  );
  check(
    'every session is marked simulated',
    sessions.every(session => session.provenance === 'simulated'),
  );
  check('an examiner is signed in', Boolean(CURRENT_EXAMINER.name));

  section('Referential integrity');
  for (const session of sessions) {
    const signalIds = new Set(session.signals.map(signal => signal.id));

    check(
      `${session.id}: every bundle references a real signal`,
      session.bundles.every(bundle => bundle.signalIds.every(id => signalIds.has(id))),
    );
    check(
      `${session.id}: every suppressed observation references a real signal`,
      session.suppressed.every(item => signalIds.has(item.signalId)),
    );
    check(
      `${session.id}: bundle dispositions are recorded`,
      session.bundles.every(bundle =>
        ['escalated', 'suppressed', 'observation_only'].includes(bundle.disposition),
      ),
    );
    check(
      `${session.id}: every suppressed item cites a clause`,
      session.suppressed.every(item => item.checks.length > 0 || item.reason.length > 0),
    );
    check(
      `${session.id}: coverage gaps are ordered and bounded`,
      session.coverageGaps.every(gap => gap.endSeconds >= gap.startSeconds),
    );
    check(
      `${session.id}: escalated count matches the escalated bundles`,
      session.escalatedCount === session.bundles.filter(bundle => bundle.disposition === 'escalated').length,
    );
  }

  section('Signal plausibility');
  const everySignal: EvidenceSignal[] = sessions.flatMap(session => session.signals);
  check('signals exist', everySignal.length > 0, `${everySignal.length}`);
  check(
    'confidence is a proportion',
    everySignal.every(signal => signal.confidence >= 0 && signal.confidence <= 1),
  );
  check(
    'offsets fall inside the session',
    sessions.every(session =>
      session.signals.every(signal => signal.offsetSeconds <= session.totalSeconds),
    ),
  );
  check(
    'strength is one of the three bands',
    everySignal.every(signal => ['strong', 'moderate', 'weak'].includes(signal.strength)),
  );
  check(
    'every signal names a channel that has a label',
    everySignal.every(signal => Boolean(CHANNEL_LABEL[signal.channel])),
  );

  section('Decisions');
  const decided = sessions.flatMap(session => session.decisions);
  const kinds: DecisionKind[] = ['confirmed', 'dismissed', 'uncertain', 'escalated'];
  check('at least one decision exists to audit', decided.length > 0, `${decided.length}`);
  check(
    'every decision is attributed to a named examiner',
    decided.every(decision => decision.examinerName.trim().length > 0),
  );
  check(
    'every decision has a kind this product recognises',
    decided.every(decision => kinds.includes(decision.decision)),
  );
  check(
    'every decision is written down',
    decided.every(decision => decision.note.trim().length > 0),
  );

  const recorded = await services.sessions.recordDecision({
    sessionId: sessions[0].id,
    decision: 'uncertain',
    note: 'Invariant check: a written reason is required, and this is one.',
    examiner: CURRENT_EXAMINER,
  });
  check('a decision can be recorded', recorded.settled === true);
  check('a recorded decision is attributed', recorded.examinerName === CURRENT_EXAMINER.name);

  section('Coverage arithmetic');
  for (const session of sessions as SessionRecord[]) {
    check(
      `${session.id}: coverage and quality are percentages`,
      session.observationCoverage >= 0 &&
        session.observationCoverage <= 100 &&
        session.observationQuality >= 0 &&
        session.observationQuality <= 100,
    );
    check(
      `${session.id}: elapsed never exceeds the allotted time`,
      session.elapsedSeconds <= session.totalSeconds,
    );
  }

  section('Failure handling');
  await checkRejects('an unknown session is rejected, not invented', () =>
    services.sessions.get('no-such-session'),
  );
  await checkRejects('an unknown examination is rejected', () => services.exam.getExam('no-such-exam'));
  await checkRejects('evidence for an unknown session is rejected', () =>
    services.evidence.timeline('no-such-session'),
  );

  section('Condition switching');
  const { setServiceCondition, getServiceCondition } = await import('../src/services');
  setServiceCondition('offline');
  check('the condition is reported back', getServiceCondition() === 'offline');
  let refused = false;
  try {
    await services.sessions.list();
  } catch {
    refused = true;
  }
  check('an offline service refuses rather than inventing data', refused);
  setServiceCondition('nominal');
  check('the condition can be restored', getServiceCondition() === 'nominal');
  const recovered = await services.sessions.list();
  check('the service recovers', recovered.length === sessions.length);

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    console.log(`${failures} failed`);
    process.exitCode = 1;
  }
}

async function checkRejects(label: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
    check(label, false, 'resolved instead of rejecting');
  } catch {
    check(label, true);
  }
}

void main();
