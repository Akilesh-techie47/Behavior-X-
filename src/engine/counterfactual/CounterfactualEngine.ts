import { BehaviorEvent, CounterfactualScenario } from '../../types';
import { RiskEngine } from '../risk/RiskEngine';

export class CounterfactualEngine {
  private riskEngine: RiskEngine;

  constructor(riskEngine?: RiskEngine) {
    this.riskEngine = riskEngine || new RiskEngine();
  }

  /**
   * Re-evaluates risk score by omitting each signal group to calculate true mathematical counterfactual contribution
   */
  public computeCounterfactuals(
    events: BehaviorEvent[],
    now: number = Date.now(),
    examStartTime: number = now - 1000 * 60 * 15
  ): CounterfactualScenario[] {
    const baseEvaluation = this.riskEngine.evaluateRisk(events, now, examStartTime);
    const originalScore = baseEvaluation.currentScore;

    if (events.length === 0 || originalScore === 0) {
      return [
        {
          signalId: 'none',
          label: 'All signals nominal',
          originalScore: 0,
          scoreWithoutSignal: 0,
          delta: 0,
          explanation: 'Score is at nominal baseline (0). No elevated signals to remove.',
        },
      ];
    }

    // Identify unique signal types present in the active events
    const signalTypes = Array.from(new Set(events.map(e => e.type)));
    const scenarios: CounterfactualScenario[] = [];

    signalTypes.forEach(typeToOmit => {
      // Filter out events of this specific type
      const reducedEvents = events.filter(e => e.type !== typeToOmit);

      // Recompute risk state using the EXACT same scoring engine
      const recomputed = this.riskEngine.evaluateRisk(reducedEvents, now, examStartTime);
      const scoreWithoutSignal = recomputed.currentScore;
      const delta = originalScore - scoreWithoutSignal;

      const formattedName = typeToOmit.replace(/_/g, ' ');
      const explanation =
        delta > 0
          ? `Omitting ${formattedName} lowers review priority by ${delta} points (from ${originalScore} to ${scoreWithoutSignal}).`
          : `Omitting ${formattedName} has no impact on current score (active window or decay factors dominant).`;

      scenarios.push({
        signalId: typeToOmit,
        label: `Without ${formattedName}`,
        originalScore,
        scoreWithoutSignal,
        delta,
        explanation,
      });
    });

    // Sort by largest impact (highest delta first)
    scenarios.sort((a, b) => b.delta - a.delta);

    return scenarios;
  }
}
