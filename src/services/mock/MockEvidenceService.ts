/**
 * Evidence service.
 *
 * The graph is built as a layered DAG and laid out by the interface, which
 * receives columns and per-column row indices rather than pixel coordinates.
 * It is deliberately a graph of *records and relationships*, not a picture of a
 * model: question → recorded signals → correlated window → policy → outcome.
 * There are no learned weights, no confidence arcs and nothing that implies a
 * network was consulted.
 */

import type {
  EvidenceBundle,
  EvidenceGraph,
  EvidenceSignal,
  GraphEdge,
  GraphNode,
  SessionRecord,
  SuppressedObservation,
} from '../../domain/types';
import type { EvidenceService } from '../contracts';
import { getSessions } from '../fixtures/sessions';
import { CHANNEL_SHORT, formatDurationFine, formatOffset } from '../../domain/format';
import { transport } from './transport';

function requireSession(sessionId: string): SessionRecord {
  const session = getSessions().find(s => s.id === sessionId);
  if (!session) throw new Error(`Unknown session: ${sessionId}`);
  return session;
}

function shortLabel(label: string, max = 34): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function buildBundleGraph(session: SessionRecord, bundle: EvidenceBundle): EvidenceGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const signals = bundle.signalIds
    .map(id => session.signals.find(s => s.id === id))
    .filter((s): s is EvidenceSignal => Boolean(s))
    .sort((a, b) => a.offsetSeconds - b.offsetSeconds);

  const question = bundle.questionNumber ?? signals[0]?.questionNumber ?? 1;

  nodes.push({
    id: 'node-question',
    label: `Question ${question}`,
    sublabel: `${formatOffset(bundle.windowStart)}–${formatOffset(bundle.windowEnd)}`,
    column: 0,
    row: 0,
    kind: 'question',
    channel: 'system',
    weight: 1,
    simulated: true,
  });

  signals.forEach((signal, index) => {
    nodes.push({
      id: signal.id,
      label: shortLabel(signal.label, 30),
      sublabel: `${CHANNEL_SHORT[signal.channel]} · ${signal.wallClock} · ${Math.round(
        signal.confidence * 100,
      )}%`,
      column: 1,
      row: index,
      kind: 'signal',
      channel: signal.channel,
      weight: signal.confidence,
      simulated: true,
    });
    edges.push({
      id: `edge-q-${signal.id}`,
      from: 'node-question',
      to: signal.id,
      relation: 'same_question',
      label: `Q${question}`,
    });
  });

  const windowNodeId = 'node-window';
  nodes.push({
    id: windowNodeId,
    label: `${bundle.independentChannels}-channel correlation`,
    sublabel: formatDurationFine(bundle.windowEnd - bundle.windowStart),
    column: 2,
    row: 0,
    kind: 'event',
    channel: 'system',
    weight: 1,
    simulated: true,
  });

  for (const signal of signals) {
    edges.push({
      id: `edge-s-${signal.id}`,
      from: signal.id,
      to: windowNodeId,
      relation: 'corroborates',
      label: CHANNEL_SHORT[signal.channel],
    });
  }

  bundle.policyClauses.slice(0, 3).forEach((clause, index) => {
    const id = `node-policy-${index}`;
    nodes.push({
      id,
      label: clause.reference.split('—')[0].trim(),
      sublabel: clause.reference.split('—')[1]?.trim() ?? '',
      column: 3,
      row: index,
      kind: 'policy',
      channel: 'system',
      weight: 0.9,
      simulated: true,
    });
    edges.push({
      id: `edge-p-${index}`,
      from: windowNodeId,
      to: id,
      relation: 'temporal',
      label: 'bears on',
    });
  });

  const outcomeId = 'node-outcome';
  const escalated = bundle.disposition === 'escalated';
  nodes.push({
    id: outcomeId,
    label: escalated ? 'Review candidate' : 'Not escalated',
    sublabel: escalated
      ? `${bundle.evidenceQuality}% evidence quality`
      : bundle.dispositionReason.split('.')[0],
    column: 4,
    row: 0,
    kind: 'decision',
    channel: 'system',
    weight: 1,
    simulated: true,
  });
  bundle.policyClauses.slice(0, 3).forEach((_, index) => {
    edges.push({
      id: `edge-o-${index}`,
      from: `node-policy-${index}`,
      to: outcomeId,
      relation: 'corroborates',
      label: 'applies',
    });
  });

  // Every signal that contradicts the reading gets an explicit edge. Absence of
  // a contradiction is not the same as its presence, so they are shown.
  const contradicting = signals.filter(s => s.category === 'observation' && s.confidence < 0.8);
  contradicting.forEach(signal => {
    edges.push({
      id: `edge-c-${signal.id}`,
      from: signal.id,
      to: windowNodeId,
      relation: 'contradicts',
      label: 'weak',
    });
  });

  return {
    nodes,
    edges,
    columns: ['Question', 'Recorded signals', 'Correlated window', 'Policy', 'Outcome'],
  };
}

function buildSuppressedGraph(
  session: SessionRecord,
  observation: SuppressedObservation,
): EvidenceGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const question =
    session.signals.find(s => Math.abs(s.offsetSeconds - observation.offsetSeconds) < 1)?.questionNumber ??
    1;

  nodes.push({
    id: 'node-question',
    label: `Question ${question}`,
    sublabel: formatOffset(observation.offsetSeconds),
    column: 0,
    row: 0,
    kind: 'question',
    channel: 'system',
    weight: 1,
    simulated: true,
  });

  nodes.push({
    id: 'node-signal',
    label: shortLabel(observation.label, 30),
    sublabel: `${CHANNEL_SHORT[observation.channel]} · ${observation.wallClock}`,
    column: 1,
    row: 0,
    kind: 'signal',
    channel: observation.channel,
    weight: 0.8,
    simulated: true,
  });
  edges.push({
    id: 'edge-q-s',
    from: 'node-question',
    to: 'node-signal',
    relation: 'same_question',
    label: `Q${question}`,
  });

  observation.checks.forEach((check, index) => {
    const id = `node-check-${index}`;
    nodes.push({
      id,
      label: check.label,
      sublabel: check.observation,
      column: 2,
      row: index,
      kind: check.result === 'pass' ? 'event' : 'policy',
      channel: 'system',
      weight: check.result === 'pass' ? 0.8 : 0.4,
      simulated: true,
    });
    edges.push({
      id: `edge-c-${index}`,
      from: 'node-signal',
      to: id,
      relation: check.result === 'pass' ? 'corroborates' : 'contradicts',
      label: check.result,
    });
  });

  nodes.push({
    id: 'node-outcome',
    label: 'Not escalated',
    sublabel: observation.reason.split('.')[0],
    column: 3,
    row: 0,
    kind: 'decision',
    channel: 'system',
    weight: 1,
    simulated: true,
  });
  observation.checks.forEach((_, index) => {
    edges.push({
      id: `edge-o-${index}`,
      from: `node-check-${index}`,
      to: 'node-outcome',
      relation: 'corroborates',
      label: 'check',
    });
  });

  return {
    nodes,
    edges,
    columns: ['Question', 'Observation', 'Suppression checks', 'Outcome'],
  };
}

function buildSessionGraph(session: SessionRecord): EvidenceGraph {
  const focus =
    session.bundles.find(b => b.disposition === 'escalated') ??
    session.bundles[0] ??
    null;
  if (focus) return buildBundleGraph(session, focus);
  if (session.suppressed.length > 0) return buildSuppressedGraph(session, session.suppressed[0]);
  return { nodes: [], edges: [], columns: [] };
}

export class MockEvidenceService implements EvidenceService {
  async timeline(sessionId: string): Promise<EvidenceSignal[]> {
    return transport(() => requireSession(sessionId).signals);
  }

  async bundles(sessionId: string): Promise<EvidenceBundle[]> {
    return transport(() => requireSession(sessionId).bundles);
  }

  async suppressed(sessionId: string): Promise<SuppressedObservation[]> {
    return transport(() => requireSession(sessionId).suppressed);
  }

  async graph(sessionId: string, bundleId?: string): Promise<EvidenceGraph> {
    return transport(() => {
      const session = requireSession(sessionId);
      if (!bundleId) return buildSessionGraph(session);
      const bundle = session.bundles.find(b => b.id === bundleId);
      if (bundle) return buildBundleGraph(session, bundle);
      const observation = session.suppressed.find(s => s.id === bundleId);
      if (observation) return buildSuppressedGraph(session, observation);
      return buildSessionGraph(session);
    });
  }
}
