import { runPrivacyTests } from '../src/engine/privacy/privacyTests';
import { RiskEngine } from '../src/engine/risk/RiskEngine';
import { CounterfactualEngine } from '../src/engine/counterfactual/CounterfactualEngine';
import { MultimodalFusionEngine } from '../src/engine/fusion/MultimodalFusionEngine';
import { PersonalBaselineEngine } from '../src/engine/baseline/PersonalBaselineEngine';
import { SequenceEngine } from '../src/engine/temporal/SequenceEngine';
import { BrowserIntegrityService } from '../src/engine/security/BrowserIntegrityService';
import { EventDebouncer } from '../src/engine/EventDebouncer';
import { BehaviorEvent } from '../src/types';

console.log('====================================================');
console.log('BEHAVIOR-X V2 — AUTOMATED VERIFICATION SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName} ${detail ? ': ' + detail : ''}`);
  }
}

// 1. Privacy & Zero-Video Constraint Tests
console.log('--- 1. Privacy & Zero-Video Constraint Tests ---');
const privacyResults = runPrivacyTests();
privacyResults.forEach(res => {
  assert(res.passed, res.name, res.message);
});

// 2. Risk Engine & Three Core Scores Tests
console.log('\n--- 2. Risk Engine & Three Core Scores Tests ---');
const riskEngine = new RiskEngine();
const now = Date.now();
const mockEvents: BehaviorEvent[] = [
  {
    id: 'evt-1',
    sessionId: 'test-sess',
    timestamp: now - 15000,
    type: 'LOOKING_AWAY',
    category: 'attention',
    severity: 'medium',
    confidence: 0.9,
    duration: 3000,
    source: 'attention_detector',
    description: 'Looking away for 3s',
    evidence: { gazeDirection: 'right' },
  },
  {
    id: 'evt-2',
    sessionId: 'test-sess',
    timestamp: now - 8000,
    type: 'WINDOW_BLUR',
    category: 'visibility',
    severity: 'medium',
    confidence: 1.0,
    duration: 4000,
    source: 'visibility_detector',
    description: 'Window blur for 4s',
    evidence: { windowFocused: false },
  },
];

const riskResult = riskEngine.evaluateRisk(mockEvents, now, now - 60000);
assert(riskResult.reviewPriorityScore !== undefined, 'Integrity Review Priority computed');
assert(riskResult.evidenceQualityScore !== undefined, 'Evidence Quality Score computed');
assert(riskResult.observationQualityScore !== undefined, 'Observation Quality Score computed');
assert(riskResult.currentScore > 0, 'Risk score increases with observable anomaly signals');
assert(riskResult.reviewPriorityLevel !== undefined, 'Review Priority Level mapped to categorical level');

// 3. Counterfactual Engine Tests
console.log('\n--- 3. Counterfactual Engine Recomputation Tests ---');
const counterfactualEngine = new CounterfactualEngine(riskEngine);
const counterfactuals = counterfactualEngine.computeCounterfactuals(mockEvents, now, now - 60000);
assert(counterfactuals.length >= 2, 'Counterfactuals generated for each unique observable signal');
const lookingAwayScenario = counterfactuals.find(c => c.signalId === 'LOOKING_AWAY');
assert(
  lookingAwayScenario !== undefined && lookingAwayScenario.delta >= 0,
  'Counterfactual recomputation produces true score delta without LOOKING_AWAY'
);

// 4. Multimodal Fusion Engine Tests
console.log('\n--- 4. Multimodal Fusion Synergy Tests ---');
const fusionEngine = new MultimodalFusionEngine();
const fusionEvaluation = fusionEngine.fuse(mockEvents, 30000, now);
assert(fusionEvaluation.synergyMultiplier >= 1.0, 'Multimodal synergy multiplier computed');
assert(fusionEvaluation.activeCategories.length === 2, 'Two distinct behavioral channels recognized');

// 5. Personal Baseline Engine Tests
console.log('\n--- 5. Personal Baseline Engine Calibration Tests ---');
const debouncer = new EventDebouncer();
const baselineEngine = new PersonalBaselineEngine('test-sess', debouncer);
for (let i = 0; i < 10; i++) {
  baselineEngine.recordInteractionSample(4.2, 4.0, 300);
}
const baseline = baselineEngine.getBaseline();
assert(baseline.baselineTypingSpeedKps > 0, 'Candidate typing speed baseline recorded');
const deviation = baselineEngine.evaluateDeviation(9.5, 5);
assert(deviation.typingDeviationPct > 50, 'Sudden typing burst deviation detected relative to personal baseline');

// 6. Sequence Engine Tests
console.log('\n--- 6. Temporal Sequence Detection Tests ---');
const sequenceEngine = new SequenceEngine('test-sess', debouncer);
const seq1 = sequenceEngine.ingestEvent({
  id: 'seq-1',
  sessionId: 'test-sess',
  timestamp: now - 12000,
  type: 'WINDOW_BLUR',
  category: 'visibility',
  severity: 'medium',
  confidence: 1.0,
  duration: 3000,
  source: 'visibility_detector',
  description: 'Window focus lost',
  evidence: { windowFocused: false },
});

const seq2 = sequenceEngine.ingestEvent({
  id: 'seq-2',
  sessionId: 'test-sess',
  timestamp: now - 8000,
  type: 'CLIPBOARD_PASTE',
  category: 'interaction',
  severity: 'medium',
  confidence: 1.0,
  duration: 1000,
  source: 'visibility_detector',
  description: 'Large paste block',
  evidence: { clipboardLength: 250 },
});

const seq3 = sequenceEngine.ingestEvent({
  id: 'seq-3',
  sessionId: 'test-sess',
  timestamp: now - 4000,
  type: 'QUESTION_RAPID_ANSWER',
  category: 'question',
  severity: 'medium',
  confidence: 0.95,
  duration: 1000,
  source: 'question_engine',
  description: 'Rapid answer submission',
  evidence: { durationMs: 4100 },
});

assert(seq2 !== null || seq3 !== null, 'Temporal sequence engine detected multi-signal pattern');

// 7. Browser Integrity & Capability Matrix Tests
console.log('\n--- 7. Browser Integrity & Honest Capability Matrix Tests ---');
const capabilities = BrowserIntegrityService.getCapabilities();
assert(capabilities.length >= 7, 'Complete browser capability matrix exposed');
const osAppCapability = capabilities.find(c => c.id === 'os-applications');
assert(
  osAppCapability?.status === 'NOT AVAILABLE IN BROWSER',
  'Honest browser boundary: OS application inspection labeled NOT AVAILABLE IN BROWSER'
);

console.log('\n====================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
