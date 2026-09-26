import { useMemo, useState } from 'react';
import { CHANNEL_LABEL, formatOffset } from '../../domain/format';
import type { EvidenceGraph, EvidenceSignal, GraphNode } from '../../domain/types';
import { Panel, PanelBody, PanelHeader } from '../layout/Panel';
import { ChannelTag, Tag } from '../primitives/Status';
import { SimulatedMark } from '../feedback/StateBlock';

/**
 * The evidence graph.
 *
 * Drawn with SVG, laid out in the columns the data model supplies, because a
 * force simulation tells a reviewer nothing they can act on — the positions
 * would be arbitrary and the eye would learn nothing from them. Here the
 * position is meaningful and auditable: question, then the signals recorded
 * against it, then the events drawn from them, then the policy and decision.
 *
 * Nodes are filled in proportion to their weight, and every weight is also
 * written out in the list below, because an encoding you cannot read back as a
 * number is decoration rather than evidence.
 */

const NODE_W = 172;
const NODE_H = 52;
const GAP_X = 60;
const GAP_Y = 18;
const HEADER_H = 26;

export function EvidenceGraphView({
  graph,
  signals,
  onSelectSignal,
  selectedSignalId,
}: {
  graph: EvidenceGraph;
  signals: EvidenceSignal[];
  onSelectSignal: (signal: EvidenceSignal) => void;
  selectedSignalId: string | null;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const signalById = useMemo(() => new Map(signals.map(s => [s.id, s])), [signals]);

  const dimensions = useMemo(() => {
    const maxColumn = graph.nodes.reduce((max, n) => Math.max(max, n.column), 0);
    const maxRow = graph.nodes.reduce((max, n) => Math.max(max, n.row), 0);
    return {
      width: (maxColumn + 1) * (NODE_W + GAP_X) + 8,
      height: HEADER_H + (maxRow + 1) * (NODE_H + GAP_Y) + 8,
    };
  }, [graph.nodes]);

  const position = (node: GraphNode) => ({
    x: node.column * (NODE_W + GAP_X) + 4,
    y: HEADER_H + node.row * (NODE_H + GAP_Y) + 4,
  });

  const nodeFor = (id: string) => graph.nodes.find(n => n.id === id);

  if (graph.nodes.length === 0) {
    return (
      <Panel>
        <PanelHeader
          title="Evidence graph"
          description="How the observations of this session relate to one another."
        />
        <PanelBody>
          <p className="text-[12.5px] leading-relaxed text-neutral-500 max-w-[68ch]">
            Nothing was escalated for this session, and nothing was suppressed. The record
            contains observations, but no policy-relevant relationship between them — which
            is a normal outcome, not a gap in the review.
          </p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Evidence graph"
        description="Question, the signals recorded against it, the events drawn from them, and the policy and decision that followed."
        actions={<SimulatedMark />}
      />

      <div className="overflow-x-auto border-b border-neutral-200 bg-neutral-50/50 p-4">
        <svg
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full min-w-[680px] h-auto"
          role="img"
          aria-label="Evidence graph relating recorded signals to events, policy and decision"
        >
          {/* Column headings come from the model, so the drawing cannot
              disagree with the data about its own structure. */}
          {graph.columns.map((heading, index) => (
            <text
              key={heading}
              x={index * (NODE_W + GAP_X) + 4}
              y="14"
              fill="#a3a3a3"
              fontSize="9.5"
              letterSpacing="0.09em"
              fontFamily="inherit"
            >
              {heading.toUpperCase()}
            </text>
          ))}

          {graph.edges.map(edge => {
            const from = nodeFor(edge.from);
            const to = nodeFor(edge.to);
            if (!from || !to) return null;
            const a = position(from);
            const b = position(to);
            const active =
              hovered === edge.from ||
              hovered === edge.to ||
              (selectedSignalId !== null &&
                from.kind === 'signal' &&
                from.label === selectedSignalId);
            return (
              <g key={edge.id}>
                <line
                  x1={a.x + NODE_W}
                  y1={a.y + NODE_H / 2}
                  x2={b.x}
                  y2={b.y + NODE_H / 2}
                  stroke={active ? '#525252' : '#d4d4d4'}
                  strokeWidth={active ? 1.75 : 1.25}
                  strokeDasharray={edge.relation === 'contradicts' ? '5 3' : undefined}
                />
                {active && (
                  <text
                    x={(a.x + NODE_W + b.x) / 2}
                    y={(a.y + b.y) / 2 + NODE_H / 2 - 5}
                    textAnchor="middle"
                    fill="#525252"
                    fontSize="9"
                    fontFamily="inherit"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {graph.nodes.map(node => {
            const pos = position(node);
            const isDecision = node.kind === 'decision' || node.kind === 'policy';
            const isSelected = node.kind === 'signal' && node.label === selectedSignalId;
            const signal = node.kind === 'signal' ? signalById.get(node.label) : undefined;
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => signal && onSelectSignal(signal)}
                className={signal ? 'cursor-pointer' : ''}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  fill={isDecision ? '#171717' : '#ffffff'}
                  stroke={isSelected ? '#171717' : isDecision ? '#171717' : '#a3a3a3'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                {/* Weight as a fill bar along the base of the node. */}
                <rect
                  x="0"
                  y={NODE_H - 4}
                  width={Math.max(2, Math.min(1, node.weight) * NODE_W)}
                  height="4"
                  fill={isDecision ? '#737373' : '#525252'}
                />
                <text
                  x="9"
                  y="16"
                  fill={isDecision ? '#a3a3a3' : '#a3a3a3'}
                  fontSize="8.5"
                  letterSpacing="0.1em"
                  fontFamily="inherit"
                >
                  {node.kind.toUpperCase()}
                </text>
                <text
                  x="9"
                  y="31"
                  fill={isDecision ? '#ffffff' : '#171717'}
                  fontSize="10.5"
                  fontFamily="inherit"
                >
                  {truncate(node.label, 27)}
                </text>
                <text
                  x="9"
                  y="43"
                  fill={isDecision ? '#737373' : '#a3a3a3'}
                  fontSize="9"
                  fontFamily="inherit"
                >
                  {truncate(node.sublabel, 32)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="px-4 py-3 border-b border-neutral-200">
        <div className="eyebrow mb-2">Nodes and their weights</div>
        <ul className="space-y-1.5">
          {graph.nodes.map(node => (
            <li key={node.id} className="flex flex-wrap items-baseline gap-x-2.5 text-[12px]">
              <ChannelTag channel={node.channel} />
              <span className="text-neutral-900">{node.label}</span>
              <span className="text-neutral-400">{node.sublabel}</span>
              <span className="data text-[11px] text-neutral-500">weight {node.weight.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 py-3 border-b border-neutral-200">
        <div className="eyebrow mb-2">Relationships</div>
        <ul className="space-y-1.5">
          {graph.edges.map(edge => (
            <li key={edge.id} className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
              <span className="text-neutral-900">{nodeFor(edge.from)?.label ?? edge.from}</span>
              <span className="text-neutral-400">{edge.label || edge.relation}</span>
              <span className="text-neutral-900">{nodeFor(edge.to)?.label ?? edge.to}</span>
            </li>
          ))}
        </ul>
      </div>

      {signals.length > 0 && (
        <div className="px-4 py-3">
          <div className="eyebrow mb-2">Signals drawn into this graph</div>
          <ul className="space-y-2">
            {graph.nodes
              .filter(node => node.kind === 'signal' && signalById.has(node.label))
              .map(node => {
                const signal = signalById.get(node.label)!;
                return (
                  <li key={node.id} className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <ChannelTag channel={signal.channel} />
                    <span className="data text-[11px] text-neutral-400 w-12 shrink-0">
                      {formatOffset(signal.offsetSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSignal(signal)}
                      className="text-[12.5px] text-neutral-800 text-left hover:underline underline-offset-2 flex-1 min-w-[200px]"
                    >
                      {signal.label}
                    </button>
                    <Tag>{CHANNEL_LABEL[signal.channel]}</Tag>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
