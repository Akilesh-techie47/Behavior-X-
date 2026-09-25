/**
 * Comprehensive Unit Test Suite for Explainable Multi-Signal Risk Engine
 *
 * Test Scenarios:
 * 1. No events -> Score: 0, Level: NORMAL
 * 2. One weak event -> Low score, Level: NORMAL or LOW
 * 3. Repeated weak events -> Higher score within window, Level: MEDIUM
 * 4. One strong event -> Significant score increase, Level: MEDIUM / HIGH
 * 5. Multiple simultaneous signals (cross-category synergy) -> High review priority
 * 6. Events separated by long periods -> Window filtering & rejection
 * 7. Event decay -> Old events have reduced contribution
 * 8. Score boundaries & clamping -> Guaranteed [0, 100] interval
 * 9. Risk level transitions (NORMAL -> LOW -> MEDIUM -> HIGH -> REVIEW)
 */

import { RiskEngine } from './RiskEngine';
import { BehaviorEvent } from '../../types';
import { DEFAULT_RISK_CONFIG } from './riskConfig';

export interface RiskTestResult {
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runRiskEngineTests(): RiskTestResult[] {
  const results: RiskTestResult[] = [];
  const engine = new RiskEngine(DEFAULT_RISK_CONFIG);
  const now = 1700000000000;

  // 1. No events
  {
    const start = performance.now();
    const state = engine.evaluateRisk([], now);
    const passed = state.currentScore === 0 && state.level === 'NORMAL' && state.eventCountInWindow === 0;
    results.push({
      name: 'Scenario 1: No Events (Zero Baseline)',
      passed,
      message: passed
        ? 'Risk state accurately assigned Score=0 and Level=NORMAL with nominal explanation.'
        : `Failed: score=${state.currentScore}, level=${state.level}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 2. One weak event
  {
    const start = performance.now();
    const weakEvent: BehaviorEvent = {
      id: 'e-weak',
      sessionId: 'sess-1',
      timestamp: now - 2000,
      type: 'LOOKING_AWAY',
      category: 'attention',
      severity: 'low',
      confidence: 0.85,
      duration: 2200,
      source: 'attention_detector',
      description: 'Brief glance off-screen',
      evidence: {},
    };

    const state = engine.evaluateRisk([weakEvent], now);
    const passed = state.currentScore > 0 && state.currentScore <= 15 && (state.level === 'NORMAL' || state.level === 'LOW');
    results.push({
      name: 'Scenario 2: One Weak Event (Cognitive Glance)',
      passed,
      message: passed
        ? `Weak event produced expected mild score (${state.currentScore}%) without falsely raising HIGH alarms.`
        : `Failed: score=${state.currentScore}, level=${state.level}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 3. Repeated weak events in window
  {
    const start = performance.now();
    const repeatedEvents: BehaviorEvent[] = [
      {
        id: 'e-r1',
        sessionId: 'sess-1',
        timestamp: now - 15000,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.85,
        duration: 2000,
        source: 'attention_detector',
        description: 'Glance 1',
        evidence: {},
      },
      {
        id: 'e-r2',
        sessionId: 'sess-1',
        timestamp: now - 8000,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.85,
        duration: 2100,
        source: 'attention_detector',
        description: 'Glance 2',
        evidence: {},
      },
      {
        id: 'e-r3',
        sessionId: 'sess-1',
        timestamp: now - 1000,
        type: 'PROLONGED_OFF_SCREEN_GAZE',
        category: 'attention',
        severity: 'medium',
        confidence: 0.9,
        duration: 5200,
        source: 'attention_detector',
        description: 'Prolonged glance 3',
        evidence: {},
      },
    ];

    const state = engine.evaluateRisk(repeatedEvents, now);
    const passed = state.currentScore >= 25 && state.eventCountInWindow === 3;
    results.push({
      name: 'Scenario 3: Repeated Weak Events In Window',
      passed,
      message: passed
        ? `Repeated events successfully accumulated in score (${state.currentScore}%) transitioning to ${state.level}.`
        : `Failed: score=${state.currentScore}, level=${state.level}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 4. One strong event (e.g. Multiple Faces)
  {
    const start = performance.now();
    const strongEvent: BehaviorEvent = {
      id: 'e-strong',
      sessionId: 'sess-1',
      timestamp: now - 1000,
      type: 'MULTIPLE_FACES',
      category: 'presence',
      severity: 'high',
      confidence: 0.92,
      duration: 3500,
      source: 'face_detector',
      description: 'Secondary person in frame',
      evidence: {},
    };

    const state = engine.evaluateRisk([strongEvent], now);
    const passed = state.currentScore >= 30 && state.level === 'MEDIUM';
    results.push({
      name: 'Scenario 4: One Strong Event (Multiple Faces)',
      passed,
      message: passed
        ? `Strong single signal generated appropriate review score (${state.currentScore}%, ${state.level}) without concluding guilt.`
        : `Failed: score=${state.currentScore}, level=${state.level}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 5. Multiple simultaneous signals (cross-category synergy)
  {
    const start = performance.now();
    const correlatedEvents: BehaviorEvent[] = [
      {
        id: 'e-c1',
        sessionId: 'sess-1',
        timestamp: now - 2000,
        type: 'MULTIPLE_FACES',
        category: 'presence',
        severity: 'high',
        confidence: 0.92,
        duration: 3500,
        source: 'face_detector',
        description: 'Secondary person',
        evidence: {},
      },
      {
        id: 'e-c2',
        sessionId: 'sess-1',
        timestamp: now - 3000,
        type: 'WINDOW_BLUR',
        category: 'visibility',
        severity: 'medium',
        confidence: 1.0,
        duration: 4000,
        source: 'visibility_detector',
        description: 'Window focus switch',
        evidence: {},
      },
      {
        id: 'e-c3',
        sessionId: 'sess-1',
        timestamp: now - 1000,
        type: 'PROLONGED_OFF_SCREEN_GAZE',
        category: 'attention',
        severity: 'medium',
        confidence: 0.88,
        duration: 5000,
        source: 'attention_detector',
        description: 'Off-screen gaze',
        evidence: {},
      },
    ];

    const state = engine.evaluateRisk(correlatedEvents, now);
    const passed = state.currentScore >= 65 && (state.level === 'HIGH' || state.level === 'REVIEW');
    results.push({
      name: 'Scenario 5: Multi-Signal Cross-Category Synergy',
      passed,
      message: passed
        ? `Coincident signals across Presence + Visibility + Attention correctly triggered synergy multiplier (${state.currentScore}%, ${state.level}).`
        : `Failed: score=${state.currentScore}, level=${state.level}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 6. Events separated by long periods
  {
    const start = performance.now();
    const staleEvents: BehaviorEvent[] = [
      {
        id: 'e-stale-1',
        sessionId: 'sess-1',
        timestamp: now - 1000 * 60 * 5, // 5 minutes ago
        type: 'WINDOW_BLUR',
        category: 'visibility',
        severity: 'medium',
        confidence: 1.0,
        duration: 4000,
        source: 'visibility_detector',
        description: 'Old blur',
        evidence: {},
      },
      {
        id: 'e-stale-2',
        sessionId: 'sess-1',
        timestamp: now - 1000 * 60 * 2, // 2 minutes ago
        type: 'MULTIPLE_FACES',
        category: 'presence',
        severity: 'high',
        confidence: 0.9,
        duration: 3000,
        source: 'face_detector',
        description: 'Old multiple face',
        evidence: {},
      },
    ];

    const state = engine.evaluateRisk(staleEvents, now);
    const passed = state.eventCountInWindow === 0 && state.currentScore === 0 && state.level === 'NORMAL';
    results.push({
      name: 'Scenario 6: Events Separated by Long Periods (Window Rejection)',
      passed,
      message: passed
        ? 'Events outside the active 30-second sliding window were successfully purged from active scoring.'
        : `Failed: score=${state.currentScore}, activeCount=${state.eventCountInWindow}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 7. Event decay test
  {
    const start = performance.now();
    const freshEvent: BehaviorEvent = {
      id: 'e-fresh',
      sessionId: 'sess-1',
      timestamp: now,
      type: 'MULTIPLE_FACES',
      category: 'presence',
      severity: 'high',
      confidence: 1.0,
      duration: 3000,
      source: 'face_detector',
      description: 'Instant event',
      evidence: {},
    };

    const agedEvent: BehaviorEvent = {
      id: 'e-aged',
      sessionId: 'sess-1',
      timestamp: now - 25000, // 25s old (decayed)
      type: 'MULTIPLE_FACES',
      category: 'presence',
      severity: 'high',
      confidence: 1.0,
      duration: 3000,
      source: 'face_detector',
      description: 'Aged event',
      evidence: {},
    };

    const freshState = engine.evaluateRisk([freshEvent], now);
    const agedState = engine.evaluateRisk([agedEvent], now);

    const passed = freshState.currentScore > agedState.currentScore;
    results.push({
      name: 'Scenario 7: Temporal Event Decay Functionality',
      passed,
      message: passed
        ? `Temporal decay verified: Fresh event score (${freshState.currentScore}%) > Decayed event score (${agedState.currentScore}%).`
        : `Failed: fresh=${freshState.currentScore}, aged=${agedState.currentScore}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 8. Score boundaries & clamping [0, 100]
  {
    const start = performance.now();
    // Flood with 10 heavy events
    const excessiveEvents: BehaviorEvent[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `e-flood-${i}`,
      sessionId: 'sess-1',
      timestamp: now - i * 1000,
      type: 'MULTIPLE_FACES',
      category: 'presence',
      severity: 'high',
      confidence: 1.0,
      duration: 3000,
      source: 'face_detector',
      description: 'Flood event',
      evidence: {},
    }));

    const state = engine.evaluateRisk(excessiveEvents, now);
    const passed = state.currentScore <= 100 && state.currentScore >= 0;
    results.push({
      name: 'Scenario 8: Score Boundary Clamping [0, 100]',
      passed,
      message: passed
        ? `Clamping strictly preserved: Result is ${state.currentScore}% under maximum event saturation.`
        : `Failed: score=${state.currentScore}`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  // 9. Risk level transitions
  {
    const start = performance.now();
    const lvl0 = engine.calculateRiskLevel(0);
    const lvl1 = engine.calculateRiskLevel(20);
    const lvl2 = engine.calculateRiskLevel(45);
    const lvl3 = engine.calculateRiskLevel(70);
    const lvl4 = engine.calculateRiskLevel(90);

    const passed =
      lvl0 === 'NORMAL' &&
      lvl1 === 'LOW' &&
      lvl2 === 'MEDIUM' &&
      lvl3 === 'HIGH' &&
      lvl4 === 'REVIEW';

    results.push({
      name: 'Scenario 9: Discrete Level Transitions (NORMAL ➔ REVIEW)',
      passed,
      message: passed
        ? 'All 5 risk state thresholds (NORMAL, LOW, MEDIUM, HIGH, REVIEW) validated according to spec.'
        : `Failed: levels=[${lvl0}, ${lvl1}, ${lvl2}, ${lvl3}, ${lvl4}]`,
      durationMs: Math.round(performance.now() - start),
    });
  }

  return results;
}
