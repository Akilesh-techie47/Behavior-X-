import React, { useState } from 'react';
import { Network, Link2 } from 'lucide-react';
import { EvidenceGraphData } from '../../types';
import { Card } from '../common/Card';

interface EvidenceGraphViewerProps {
  graphData: EvidenceGraphData;
  className?: string;
}

export const EvidenceGraphViewer: React.FC<EvidenceGraphViewerProps> = ({ graphData, className = '' }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    graphData.nodes.length > 0 ? graphData.nodes[0].id : null
  );

  const selectedNode = graphData.nodes.find(n => n.id === selectedNodeId) || graphData.nodes[0];

  // Connected relationships for selected node
  const connectedRelationships = graphData.relationships.filter(
    r => r.source === selectedNodeId || r.target === selectedNodeId
  );

  const nodeTone = (type: string) => {
    switch (type) {
      case 'RISK_CONTRIBUTION':
        return 'border-rose-200 bg-rose-50/60 text-rose-800';
      case 'QUESTION':
        return 'border-brand-200 bg-brand-50/60 text-brand-800';
      case 'FUSION':
        return 'border-amber-200 bg-amber-50/60 text-amber-900';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  };

  return (
    <Card
      title="Causal evidence graph"
      subtitle="Trace review priority back to observable telemetry"
      badge={
        <span className="data inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 whitespace-nowrap">
          <Network className="w-3 h-3" />
          {graphData.nodes.length} nodes · {graphData.relationships.length} edges
        </span>
      }
      className={className}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Node canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="eyebrow">Observable telemetry nodes</span>
              <span className="text-[11.5px] text-slate-400">Select a node to inspect</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {graphData.nodes.map(node => {
                const isSelected = node.id === selectedNodeId;

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    aria-pressed={isSelected}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-[3px] border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.04em] ${
                          isSelected
                            ? 'border-white/25 text-slate-300'
                            : nodeTone(node.type).split(' ').slice(0, 2).join(' ')
                        }`}
                      >
                        {node.type}
                      </span>
                      <span
                        className={`data text-[10.5px] ${
                          isSelected ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {Math.round(node.confidence * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 text-[12.5px] font-semibold leading-snug">
                      {node.label}
                    </div>
                    <div
                      className={`mt-1.5 text-[11.5px] leading-snug line-clamp-2 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {node.details}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Relationship links */}
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
              <span className="eyebrow">
                Evidence relationship links ({graphData.relationships.length})
              </span>
              <div className="space-y-1.5">
                {graphData.relationships.slice(0, 5).map(rel => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Link2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-[12px] font-medium text-slate-900 truncate">
                        {rel.relationshipType}
                      </span>
                      <span className="text-[11.5px] text-slate-500 truncate">({rel.label})</span>
                    </div>
                    <span className="data text-[11px] text-slate-500 flex-shrink-0">
                      {rel.strength.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Node inspector */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="panel-inset bg-white space-y-3.5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <span className="eyebrow">Node inspector</span>
                <span className="rounded-[3px] bg-slate-900 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.04em] text-white">
                  {selectedNode.type}
                </span>
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-slate-900 leading-snug">
                  {selectedNode.label}
                </h3>
                <p className="text-[12.5px] text-slate-600 mt-1.5 leading-relaxed">
                  {selectedNode.details}
                </p>
              </div>

              <dl className="space-y-2 pt-3 border-t border-slate-200">
                {[
                  { label: 'Confidence', value: `${Math.round(selectedNode.confidence * 100)}%` },
                  { label: 'Mathematical weight', value: `${selectedNode.weight} pts` },
                  ...(selectedNode.category
                    ? [{ label: 'Modality category', value: selectedNode.category }]
                    : []),
                  ...(selectedNode.relatedQuestionNumber
                    ? [
                        {
                          label: 'Correlated question',
                          value: `Question ${selectedNode.relatedQuestionNumber}`,
                        },
                      ]
                    : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="text-[12px] text-slate-500">{row.label}</dt>
                    <dd className="data text-[12.5px] font-medium text-slate-900 capitalize truncate">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="eyebrow">Active links ({connectedRelationships.length})</span>
                {connectedRelationships.length === 0 ? (
                  <span className="text-[12px] text-slate-500">No active links.</span>
                ) : (
                  <div className="space-y-1.5">
                    {connectedRelationships.map(r => (
                      <div
                        key={r.id}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2"
                      >
                        <div className="text-[12px] font-medium text-slate-900">
                          {r.relationshipType}
                        </div>
                        <div className="text-[11.5px] text-slate-500 mt-0.5">{r.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-[13px] text-slate-500">
              Select a node to inspect its evidence.
            </div>
          )}

          {/* Signal contribution share */}
          <div className="panel-inset bg-white space-y-3">
            <span className="eyebrow">Signal contribution share</span>
            <div className="space-y-2.5">
              {graphData.contributions.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-slate-800 truncate">
                      {c.name}
                    </span>
                    <span className="data text-[11.5px] text-slate-500">
                      {c.percentageOfTotal}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-700 transition-[width] duration-300"
                      style={{ width: `${Math.min(100, c.percentageOfTotal)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
