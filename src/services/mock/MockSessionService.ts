import type { OperationsMetrics, ReviewDecisionRecord, SessionRecord } from '../../domain/types';
import type { DecisionInput, SessionQuery, SessionService } from '../contracts';
import { getSessions } from '../fixtures/sessions';
import { buildOperationsMetrics } from '../fixtures/analytics';
import { transport } from './transport';

/**
 * Decisions live in memory for the life of the page. A real implementation
 * would append to an append-only store keyed by decision id, which is why
 * `settled` is exposed on the record: the interface shows a decision as saved
 * only once the write has been acknowledged.
 */
const decisionLog: ReviewDecisionRecord[] = [];

function matches(session: SessionRecord, query: SessionQuery): boolean {
  if (query.examId && session.examId !== query.examId) return false;
  if (query.status && query.status !== 'all' && session.status !== query.status) return false;
  if (
    query.reviewStatus &&
    query.reviewStatus !== 'all' &&
    session.reviewStatus !== query.reviewStatus
  ) {
    return false;
  }
  if (query.maxCoverage !== undefined && session.observationCoverage > query.maxCoverage) return false;
  if (query.search) {
    const needle = query.search.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
      session.id,
      session.candidate.name,
      session.candidate.registrationId,
      session.examTitle,
      session.examCode,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }
  return true;
}

export class MockSessionService implements SessionService {
  async list(query: SessionQuery = {}): Promise<SessionRecord[]> {
    return transport(() =>
      getSessions().filter(s => matches(s, query)).sort((a, b) => {
        const rank = (s: SessionRecord) => (s.status === 'live' ? 0 : s.status === 'in_review' ? 1 : 2);
        const byRank = rank(a) - rank(b);
        return byRank !== 0 ? byRank : b.elapsedSeconds - a.elapsedSeconds;
      }),
    );
  }

  async get(sessionId: string): Promise<SessionRecord> {
    return transport(() => {
      const session = getSessions().find(s => s.id === sessionId);
      if (!session) throw new Error(`Unknown session: ${sessionId}`);
      return withDecisions(session);
    });
  }

  async metrics(): Promise<OperationsMetrics> {
    return transport(() => buildOperationsMetrics(getSessions()));
  }

  async recordDecision(input: DecisionInput): Promise<ReviewDecisionRecord> {
    const record: ReviewDecisionRecord = {
      id: `dec-${Date.now().toString(36)}`,
      sessionId: input.sessionId,
      bundleId: input.bundleId,
      decision: input.decision,
      examinerId: input.examiner.id,
      examinerName: input.examiner.name,
      note: input.note,
      recordedAt: new Date().toISOString(),
      settled: false,
    };
    await transport(() => record);
    // Acknowledged, then marked settled. The delay is what the interface would
    // be waiting on if the write were going to a server.
    await new Promise(resolve => setTimeout(resolve, 180));
    record.settled = true;
    decisionLog.unshift(record);
    return record;
  }
}

function withDecisions(session: SessionRecord): SessionRecord {
  const extra = decisionLog.filter(d => d.sessionId === session.id);
  if (extra.length === 0) return session;
  return { ...session, decisions: [...extra, ...session.decisions] };
}

export { decisionLog };
