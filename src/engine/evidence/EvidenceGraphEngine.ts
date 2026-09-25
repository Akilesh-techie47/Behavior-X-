import {
  BehaviorEvent,
  EvidenceContribution,
  EvidenceGraphData,
  EvidenceNode,
  EvidenceRelationship,
  RiskState,
} from '../../types';

export class EvidenceGraphEngine {
  /**
   * Constructs a formal Evidence Graph structure from observed events, risk breakdown, and active questions
   */
  public buildGraph(
    events: BehaviorEvent[],
    riskState: RiskState,
    currentQuestionNumber: number = 1
  ): EvidenceGraphData {
    const nodes: EvidenceNode[] = [];
    const relationships: EvidenceRelationship[] = [];
    const contributions: EvidenceContribution[] = [];

    // 1. Outcome Root Node: Integrity Review Priority
    const rootNodeId = 'node-review-priority';
    nodes.push({
      id: rootNodeId,
      label: `Review Priority: ${riskState.currentScore} (${riskState.level})`,
      type: 'RISK_CONTRIBUTION',
      timestamp: riskState.lastCalculatedAt || Date.now(),
      confidence: riskState.confidence || 0.9,
      weight: riskState.currentScore,
      details: riskState.humanReadableExplanation || 'Overall mathematical review rating.',
      isTrigger: false,
    });

    // 2. Question Context Node
    const questionNodeId = `node-q-${currentQuestionNumber}`;
    nodes.push({
      id: questionNodeId,
      label: `Question ${currentQuestionNumber}`,
      type: 'QUESTION',
      timestamp: Date.now() - 30000,
      confidence: 1.0,
      weight: 20,
      details: `Active question context during observation window.`,
      relatedQuestionNumber: currentQuestionNumber,
    });

    // 3. Process Significant Events (up to top 8)
    const significantEvents = events
      .slice(-12)
      .filter(e => e.severity === 'high' || e.severity === 'medium' || e.category === 'fusion');

    significantEvents.forEach((evt, idx) => {
      const nodeId = `node-evt-${evt.id || idx}`;
      const label = evt.type.replace(/_/g, ' ');

      nodes.push({
        id: nodeId,
        label,
        type: 'EVENT',
        timestamp: evt.timestamp,
        confidence: evt.confidence || 0.85,
        weight: evt.severity === 'high' ? 35 : 20,
        details: evt.description,
        category: evt.category,
        relatedQuestionNumber: evt.questionNumberAtTrigger || currentQuestionNumber,
        isTrigger: true,
      });

      // Relationship: Event -> Review Priority Root
      relationships.push({
        id: `rel-${nodeId}-${rootNodeId}`,
        source: nodeId,
        target: rootNodeId,
        relationshipType: 'EVIDENCE_FOR',
        strength: evt.confidence || 0.85,
        label: `Contributes to ${riskState.level} review priority`,
      });

      // Relationship: Event -> Question
      relationships.push({
        id: `rel-${nodeId}-${questionNodeId}`,
        source: nodeId,
        target: questionNodeId,
        relationshipType: 'CONCURRENT',
        strength: 0.8,
        label: `Occurred during Question ${currentQuestionNumber}`,
      });
    });

    // 4. Temporal Proximity Relationships between events within 15 seconds of each other
    for (let i = 0; i < significantEvents.length; i++) {
      for (let j = i + 1; j < significantEvents.length; j++) {
        const e1 = significantEvents[i];
        const e2 = significantEvents[j];
        const dt = Math.abs(e1.timestamp - e2.timestamp);

        if (dt <= 15000) {
          relationships.push({
            id: `rel-time-${e1.id}-${e2.id}`,
            source: `node-evt-${e1.id}`,
            target: `node-evt-${e2.id}`,
            relationshipType: 'TEMPORAL_PROXIMITY',
            strength: parseFloat(Math.max(0.4, 1 - dt / 15000).toFixed(2)),
            label: `Occurred within ${(dt / 1000).toFixed(1)}s`,
          });
        }
      }
    }

    // 5. Compute Mathematical Evidence Contributions
    const totalScore = Math.max(1, riskState.currentScore);
    const factors = riskState.topContributingFactors || [];

    if (factors.length > 0) {
      factors.forEach(f => {
        const pct = Math.round((f.contributionPoints / totalScore) * 100);
        contributions.push({
          name: f.name,
          rawPoints: f.contributionPoints,
          decayedPoints: f.contributionPoints,
          percentageOfTotal: Math.min(100, Math.max(0, pct)),
          category: f.category,
          description: f.description,
        });
      });
    } else {
      contributions.push({
        name: 'Nominal Baseline',
        rawPoints: 0,
        decayedPoints: 0,
        percentageOfTotal: 100,
        category: 'presence',
        description: 'Candidate activity aligns with nominal physiological baseline.',
      });
    }

    const summary = `Evidence graph constructed with ${nodes.length} nodes and ${relationships.length} relationships across ${contributions.length} contributing factors.`;

    return {
      nodes,
      relationships,
      contributions,
      summary,
    };
  }
}
