import { BehaviorEvent, EventType, RiskLevel } from '../types';

export interface DemoStep {
  delaySeconds: number; // offset from scenario start
  type: EventType;
  category: 'presence' | 'attention' | 'visibility' | 'system' | 'aggregated';
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  durationSeconds: number;
  description: string;
  evidence: Record<string, unknown>;
  expectedRiskLevel: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';
  annotation: string; // What the user should notice
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
    name: 'Scenario 1: Normal Exam',
    description: 'Clean exam session. The student stays focused; small glances are normal; risk level remains safely NORMAL.',
    expectedFinalRisk: 'NORMAL',
    totalDurationSeconds: 15,
    summary: 'The student solves test questions naturally. Eyes stay forward on screen; no other person enters.',
    steps: [
      {
        delaySeconds: 3,
        type: 'FACE_PRESENT',
        category: 'presence',
        severity: 'low',
        confidence: 0.98,
        durationSeconds: 3,
        description: 'Student is centered and sitting directly in front of the screen.',
        evidence: { faceCount: 1, windowFocused: true },
        expectedRiskLevel: 'NORMAL',
        annotation: 'Normal student starting position confirmed at 0% concern level.',
      },
      {
        delaySeconds: 8,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.75,
        durationSeconds: 1.2,
        description: 'Quick 1-second glance down at rough scratch paper.',
        evidence: { faceCount: 1, gazeDirection: 'down' },
        expectedRiskLevel: 'NORMAL',
        annotation: 'Brief natural glances are allowed and do not raise the score. Status stays NORMAL.',
      },
    ],
  },
  {
    id: 'scenario-2-attention',
    name: 'Scenario 2: Looking Away',
    description: 'Student turns and looks away from the screen 3 times in a row. Risk level rises smoothly: LOW → MEDIUM.',
    expectedFinalRisk: 'MEDIUM',
    totalDurationSeconds: 24,
    summary: 'Multiple prolonged glances away occur within 20 seconds, prompting a routine review notice.',
    steps: [
      {
        delaySeconds: 4,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.88,
        durationSeconds: 2.8,
        description: 'Student looked away toward the right side for almost 3 seconds.',
        evidence: { gazeDirection: 'right', headYawDeg: 28 },
        expectedRiskLevel: 'LOW',
        annotation: 'First glance away adds a minor score (+8 points), gently shifting to LOW.',
      },
      {
        delaySeconds: 12,
        type: 'PROLONGED_OFF_SCREEN_GAZE',
        category: 'attention',
        severity: 'medium',
        confidence: 0.91,
        durationSeconds: 5.4,
        description: 'Student looked away for over 5 seconds while a question was active.',
        evidence: { gazeDirection: 'right', headYawDeg: 34 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Looking away for 5+ seconds adds moderate weight (+16 points); score climbs into MEDIUM.',
      },
      {
        delaySeconds: 19,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'medium',
        confidence: 0.89,
        durationSeconds: 3.5,
        description: 'Another downward glance away from the exam window.',
        evidence: { gazeDirection: 'down', headPitchDeg: 26 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Repeated glances within 30 seconds set a MEDIUM review reminder for the teacher.',
      },
    ],
  },
  {
    id: 'scenario-3-repeated',
    name: 'Scenario 3: Repeated Distractions',
    description: 'Looking away coincides with clicking out of the exam window. Combining two different cues alerts the teacher.',
    expectedFinalRisk: 'MEDIUM',
    totalDurationSeconds: 25,
    summary: 'Combined pattern: Turning head followed immediately by switching browser windows.',
    steps: [
      {
        delaySeconds: 4,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.86,
        durationSeconds: 2.5,
        description: 'Student turned head away toward the left.',
        evidence: { gazeDirection: 'left' },
        expectedRiskLevel: 'LOW',
        annotation: 'Initial glance away recorded.',
      },
      {
        delaySeconds: 11,
        type: 'WINDOW_BLUR',
        category: 'visibility',
        severity: 'medium',
        confidence: 1.0,
        durationSeconds: 4.8,
        description: 'Exam window was minimized or student clicked onto another app.',
        evidence: { windowFocused: false, durationMs: 4800 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Switching windows plus looking away triggers combined cue multiplier.',
      },
      {
        delaySeconds: 18,
        type: 'RAPID_REPEATED_DEVIATION',
        category: 'aggregated',
        severity: 'high',
        confidence: 0.95,
        durationSeconds: 6.0,
        description: 'Frequent back-and-forth window and head movements detected in a short time.',
        evidence: { repeatedCount: 3 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'System groups these related events together so the reviewer sees the full context.',
      },
    ],
  },
  {
    id: 'scenario-4-multiple-person',
    name: 'Scenario 4: Second Person in View',
    description: 'Another person walks into the camera frame. This major event immediately flags a HIGH priority review.',
    expectedFinalRisk: 'HIGH',
    totalDurationSeconds: 18,
    summary: 'Second person seen in camera view. High weight causes an instant HIGH review alert.',
    steps: [
      {
        delaySeconds: 3,
        type: 'FACE_PRESENT',
        category: 'presence',
        severity: 'low',
        confidence: 0.99,
        durationSeconds: 3,
        description: 'Primary student sitting normally at desk.',
        evidence: { faceCount: 1 },
        expectedRiskLevel: 'NORMAL',
        annotation: 'Student is alone and ready at the test screen.',
      },
      {
        delaySeconds: 8,
        type: 'MULTIPLE_FACES',
        category: 'presence',
        severity: 'high',
        confidence: 0.92,
        durationSeconds: 4.5,
        description: 'Second person was seen standing or sitting beside the student.',
        evidence: { faceCount: 2, durationMs: 4500 },
        expectedRiskLevel: 'HIGH',
        annotation: 'Second person detected (+35 points); score escalates immediately to HIGH.',
      },
      {
        delaySeconds: 14,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'medium',
        confidence: 0.89,
        durationSeconds: 3.2,
        description: 'Student turned head to speak or look toward the second person.',
        evidence: { gazeDirection: 'left', headYawDeg: 35 },
        expectedRiskLevel: 'HIGH',
        annotation: 'Correlated head turn confirms the pattern for the teacher to review.',
      },
    ],
  },
  {
    id: 'scenario-5-complex',
    name: 'Scenario 5: Multi-Factor Review',
    description: 'High complexity scenario: Looking away + Tab switching + Second person. Escalates to priority REVIEW.',
    expectedFinalRisk: 'REVIEW',
    totalDurationSeconds: 30,
    summary: 'High-activity evaluation demonstrating multiple combined cues across presence, tabs, and gaze.',
    steps: [
      {
        delaySeconds: 3,
        type: 'LOOKING_AWAY',
        category: 'attention',
        severity: 'low',
        confidence: 0.85,
        durationSeconds: 3.0,
        description: 'Student looked away toward desk side.',
        evidence: { gazeDirection: 'right' },
        expectedRiskLevel: 'LOW',
        annotation: 'Initial glance away recorded.',
      },
      {
        delaySeconds: 9,
        type: 'TAB_VISIBILITY_CHANGE',
        category: 'visibility',
        severity: 'medium',
        confidence: 1.0,
        durationSeconds: 5.5,
        description: 'Browser tab was switched or minimized during a question.',
        evidence: { visibilityState: 'hidden', durationMs: 5500 },
        expectedRiskLevel: 'MEDIUM',
        annotation: 'Tab switch increases the concern score.',
      },
      {
        delaySeconds: 16,
        type: 'MULTIPLE_FACES',
        category: 'presence',
        severity: 'high',
        confidence: 0.94,
        durationSeconds: 4.2,
        description: 'Second person detected entering the camera view.',
        evidence: { faceCount: 2 },
        expectedRiskLevel: 'HIGH',
        annotation: 'Second person pushes the status into HIGH.',
      },
      {
        delaySeconds: 23,
        type: 'RAPID_REPEATED_DEVIATION',
        category: 'aggregated',
        severity: 'high',
        confidence: 0.96,
        durationSeconds: 7.0,
        description: 'Multiple connected events happened within 30 seconds.',
        evidence: { repeatedCount: 4 },
        expectedRiskLevel: 'REVIEW',
        annotation: 'Score crosses 85%: Clear summary prepared for the teacher to review with the student.',
      },
    ],
  },
];
