import { BehaviorEvent, EventType, RiskLevel } from '../../types';

export interface DemoStep {
  delaySeconds: number; // offset from scenario start
  type: EventType;
  category: 'presence' | 'attention' | 'visibility' | 'system' | 'aggregated' | 'interaction' | 'question' | 'fusion';
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  durationSeconds: number;
  description: string;
  evidence: Record<string, unknown>;
  expectedRiskLevel: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';
  annotation: string; // What the user/examiner should observe
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  expectedFinalRisk: RiskLevel;
  totalDurationSeconds: number;
  summary: string;
  steps: DemoStep[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scenario-1-normal',
    name: 'Scenario 1: Normal Candidate Baseline',
    description: 'Clean exam session. Natural posture, minor brief glances to scratchpad, zero tab or clipboard anomalies. Risk remains NORMAL.',
    expectedFinalRisk: 'NORMAL',
    totalDurationSeconds: 15,
    summary: 'Candidate solves test questions naturally. Eyes remain centered on the question interface; baseline metrics stay consistent.',
    steps: [
      {
        delaySeconds: 3,
        type: 'FACE_PRESENT',
        category: 'presence',
        severity: 'low',
        confidence: 0.98,
        durationSeconds: 3,
        description: 'Candidate centered and sitting directly in front of the optical sensor.',
        evidence: { faceCount: 1, windowFocused: true },
        expectedRiskLevel: 'NORMAL',
        annotation: 'Normal candidate baseline confirmed at 0 Review Priority.',
      },
      {
        delaySeconds: 8,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.75,
        durationSeconds: 1.2,
        description: 'Brief 1-second glance down toward desk / scratchpad notes.',
        evidence: { faceCount: 1, gazeDirection: 'down' },
        expectedRiskLevel: 'NORMAL',
        annotation: 'Brief natural glances are suppressed by cooldown threshold. Status remains NORMAL.',
      },
    ],
  },
  {
    id: 'scenario-2-attention',
    name: 'Scenario 2: Repeated Attention Deviations',
    description: 'Candidate turns head away repeatedly during active question evaluation. Review Priority smoothly escalates: LOW → MEDIUM.',
    expectedFinalRisk: 'MEDIUM',
    totalDurationSeconds: 24,
    summary: 'Multiple prolonged glances away occur within a 20-second window, establishing an attention anomaly cluster.',
    steps: [
      {
        delaySeconds: 4,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.88,
        durationSeconds: 2.8,
        description: 'Candidate turned head toward right perimeter for 2.8s.',
        evidence: { gazeDirection: 'right', headYawDeg: 28 },
        expectedRiskLevel: 'LOW',
        annotation: 'Initial attention deviation adds +8 points. Review Priority shifts gently to LOW.',
      },
      {
        delaySeconds: 12,
        type: 'PROLONGED_OFF_SCREEN_GAZE',
        category: 'attention',
        severity: 'medium',
        confidence: 0.91,
        durationSeconds: 5.4,
        description: 'Candidate looked away off-screen for 5.4 seconds during Question 3.',
        evidence: { gazeDirection: 'right', headYawDeg: 34 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Off-screen gaze exceeding 4.0s activates severity multiplier. Score transitions to MEDIUM.',
      },
      {
        delaySeconds: 19,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'medium',
        confidence: 0.89,
        durationSeconds: 3.5,
        description: 'Third sequential attention deviation toward perimeter.',
        evidence: { gazeDirection: 'down', headPitchDeg: 26 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Repeated pattern within sliding window triggers cluster flag for examiner inspection.',
      },
    ],
  },
  {
    id: 'scenario-3-browser',
    name: 'Scenario 3: Browser Focus & Tab Anomalies',
    description: 'Exam window loses focus, candidate switches tabs, and returns. Correlation between tab blur and navigation is mapped.',
    expectedFinalRisk: 'MEDIUM',
    totalDurationSeconds: 25,
    summary: 'Browser intelligence detects exam blur and visibility hidden state during an active response period.',
    steps: [
      {
        delaySeconds: 4,
        type: 'TAB_VISIBILITY_CHANGE',
        category: 'visibility',
        severity: 'medium',
        confidence: 1.0,
        durationSeconds: 4.8,
        description: 'Browser tab visibility changed to hidden (candidate switched to another application).',
        evidence: { visibilityState: 'hidden', durationMs: 4800 },
        expectedRiskLevel: 'LOW',
        annotation: 'Browser visibility event logged with 100% deterministic certainty (browser standard API).',
      },
      {
        delaySeconds: 12,
        type: 'WINDOW_BLUR',
        category: 'visibility',
        severity: 'medium',
        confidence: 1.0,
        durationSeconds: 5.2,
        description: 'Window focus terminated. Candidate interacted with an external window.',
        evidence: { windowFocused: false, durationMs: 5200 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Co-occurrence of tab hidden + window blur establishes external browser activity.',
      },
      {
        delaySeconds: 18,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.85,
        durationSeconds: 2.5,
        description: 'Candidate glances back to exam monitor upon returning to exam viewport.',
        evidence: { gazeDirection: 'center' },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Temporal correlation links browser return to immediate gaze realignment.',
      },
    ],
  },
  {
    id: 'scenario-4-multiple-person',
    name: 'Scenario 4: Multiple-Person Environmental Intrusion',
    description: 'Second person detected in camera view. Optical sensor confidence >90% triggers immediate HIGH priority review.',
    expectedFinalRisk: 'HIGH',
    totalDurationSeconds: 18,
    summary: 'Secondary facial landmark detected within candidate perimeter. High weight causes rapid escalation to HIGH.',
    steps: [
      {
        delaySeconds: 3,
        type: 'FACE_PRESENT',
        category: 'presence',
        severity: 'low',
        confidence: 0.99,
        durationSeconds: 3,
        description: 'Enrolled candidate seated in nominal position.',
        evidence: { faceCount: 1 },
        expectedRiskLevel: 'NORMAL',
        annotation: 'Single candidate confirmed at start.',
      },
      {
        delaySeconds: 8,
        type: 'MULTIPLE_FACES',
        category: 'presence',
        severity: 'high',
        confidence: 0.94,
        durationSeconds: 4.5,
        description: 'Multiple persons detected in active camera frame (faceCount: 2).',
        evidence: { faceCount: 2, durationMs: 4500 },
        expectedRiskLevel: 'HIGH',
        annotation: 'Secondary person detected (+35 weight). Score escalates immediately to HIGH.',
      },
      {
        delaySeconds: 14,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'medium',
        confidence: 0.89,
        durationSeconds: 3.2,
        description: 'Candidate oriented toward secondary person.',
        evidence: { gazeDirection: 'left', headYawDeg: 35 },
        expectedRiskLevel: 'HIGH',
        annotation: 'Correlated physical orientation reinforces the observation for examiner review.',
      },
    ],
  },
  {
    id: 'scenario-5-complex-ai-era',
    name: 'Scenario 5: Complex Multimodal & AI-Era Sequence',
    description: 'Full multimodal fusion: Extended pause → Tab switch → Return → Clipboard injection → Rapid answer submission.',
    expectedFinalRisk: 'REVIEW',
    totalDurationSeconds: 32,
    summary: 'Cross-modality temporal sequence detects external digital assistance pattern across browser, clipboard, and timing.',
    steps: [
      {
        delaySeconds: 3,
        type: 'TAB_VISIBILITY_CHANGE',
        category: 'visibility',
        severity: 'medium',
        confidence: 1.0,
        durationSeconds: 6.2,
        description: 'Exam tab switched away to external window during difficult question (Q7).',
        evidence: { visibilityState: 'hidden', questionId: 'q7', durationMs: 6200 },
        expectedRiskLevel: 'LOW',
        annotation: 'Sequence begins: Candidate departs exam window during complex question.',
      },
      {
        delaySeconds: 10,
        type: 'CLIPBOARD_PASTE',
        category: 'interaction',
        severity: 'medium',
        confidence: 1.0,
        durationSeconds: 1.0,
        description: 'Candidate returned and pasted large external text block (340 characters).',
        evidence: { textLength: 340, target: 'input' },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'External clipboard insertion immediately upon window re-entry.',
      },
      {
        delaySeconds: 16,
        type: 'TYPING_SPEED_CHANGE',
        category: 'interaction',
        severity: 'medium',
        confidence: 0.92,
        durationSeconds: 2.5,
        description: 'Candidate typing burst deviation: 9.4 keys/sec (+120% above personal baseline 4.2 kps).',
        evidence: { typingSpeedKps: 9.4, baselineKps: 4.2 },
        expectedRiskLevel: 'HIGH',
        annotation: 'Typing rhythm deviates significantly from established candidate baseline.',
      },
      {
        delaySeconds: 22,
        type: 'QUESTION_RAPID_ANSWER',
        category: 'question',
        severity: 'medium',
        confidence: 0.94,
        durationSeconds: 2.0,
        description: 'Question 7 submitted in 4.1s (Expected difficulty baseline: 45.0s).',
        evidence: { questionId: 'q7', responseDurationSec: 4.1, expectedDurationSec: 45.0 },
        expectedRiskLevel: 'HIGH',
        annotation: 'Sub-5s answer on hard question reinforces external interaction correlation.',
      },
      {
        delaySeconds: 28,
        type: 'AI_ERA_INTERACTION_PATTERN',
        category: 'fusion',
        severity: 'high',
        confidence: 0.96,
        durationSeconds: 8.0,
        description: 'Correlated behavioral sequence: Inactivity → Tab exit → Clipboard injection → Rapid answer submission.',
        evidence: { sequenceType: 'EXTERNAL_ASSISTED_ANSWER', signalsJoined: 4 },
        expectedRiskLevel: 'REVIEW',
        annotation: 'Multimodal Fusion Engine triggers AI-Era Integrity Signal. Score crosses threshold into REVIEW.',
      },
    ],
  },
];
