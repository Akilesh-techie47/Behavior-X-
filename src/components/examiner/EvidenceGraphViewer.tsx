import React, { useState } from 'react';
import { Network, Info, Link2, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { EvidenceGraphData, EvidenceNode, EvidenceRelationship } from '../../types';
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

  const formatOffset = (ts: number) => {
    const totalSec = Math.floor(ts / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      title="Monochrome Evidence Graph"
      subtitle="Interactive causal link map tracing review priority to observable evidence"
      badge={
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-mono font-semibold">
          <Network className="w-3 h-3" />
          <span>{graphData.nodes.length} NODES • {graphData.relationships.length} EDGES</span>
        </div>
      }
      className={className}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Visual Graph Canvas & Node Selector */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-3 flex items-center justify-between">
              <span>Observable Telemetry Nodes (Click Node to Inspect)</span>
              <span>Monochrome High-Contrast Graph</span>
            </div>

            {/* Nodes Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {graphData.nodes.map(node => {
                const isSelected = node.id === selectedNodeId;
                const isRoot = node.type === 'RISK_CONTRIBUTION';
                const isQuestion = node.type === 'QUESTION';

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3 rounded-md text-left transition-all duration-150 border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm ring-1 ring-black dark:ring-white'
                        : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className={`px-1.5 py-0.2 rounded border ${
                          isSelected
                            ? 'border-white/30 text-white dark:border-black/30 dark:text-black'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                        }`}>
                          {node.type}
                        </span>
                        <span>{Math.round(node.confidence * 100)}% CONF</span>
                      </div>
                      <div className="font-bold text-xs leading-tight tracking-tight mt-1">
                        {node.label}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono opacity-80 truncate">
                      {node.details}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Relationships Table */}
            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-850 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                Evidence Relationship Links ({graphData.relationships.length})
              </span>
              <div className="space-y-1.5">
                {graphData.relationships.slice(0, 5).map(rel => (
                  <div
                    key={rel.id}
                    className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Link2 className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {rel.relationshipType}
                      </span>
                      <span className="text-neutral-500 truncate">({rel.label})</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono flex-shrink-0">
                      STR: {rel.strength.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Details Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Node Inspector
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black text-white dark:bg-white dark:text-black">
                  {selectedNode.type}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-950 dark:text-white leading-tight">
                  {selectedNode.label}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  {selectedNode.details}
                </p>
              </div>

              <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Confidence:</span>
                  <strong className="text-neutral-950 dark:text-white">{Math.round(selectedNode.confidence * 100)}%</strong>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Mathematical Weight:</span>
                  <strong className="text-neutral-950 dark:text-white">{selectedNode.weight} pts</strong>
                </div>
                {selectedNode.category && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Modality Category:</span>
                    <strong className="text-neutral-950 dark:text-white capitalize">{selectedNode.category}</strong>
                  </div>
                )}
                {selectedNode.relatedQuestionNumber && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Correlated Question:</span>
                    <strong className="text-neutral-950 dark:text-white">Question {selectedNode.relatedQuestionNumber}</strong>
                  </div>
                )}
              </div>

              {/* Connected Relationships for this node */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                  Active Links ({connectedRelationships.length})
                </span>
                {connectedRelationships.length === 0 ? (
                  <span className="text-[11px] text-neutral-400">No active links</span>
                ) : (
                  <div className="space-y-1">
                    {connectedRelationships.map(r => (
                      <div
                        key={r.id}
                        className="text-[11px] text-neutral-700 dark:text-neutral-300 p-2 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
                      >
                        <div className="font-semibold text-black dark:text-white">{r.relationshipType}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{r.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-neutral-400">Select a node to inspect evidence</div>
          )}

          {/* Factors Contribution Breakdown */}
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
              Signal Contribution Share
            </span>
            <div className="space-y-2 text-xs">
              {graphData.contributions.map((c, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{c.name}</span>
                    <span className="text-neutral-500">{c.percentageOfTotal}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white rounded-full transition-all"
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
