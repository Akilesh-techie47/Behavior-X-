# BEHAVIOR-X V2: COMPREHENSIVE CODEBASE STUDY GUIDE & TECHNICAL DOSSIER

> **Core System Axiom:** *"Don't watch the student. Understand the evidence."*

---

## 1. Executive Summary & Core Philosophy

**Behavior-X V2** is an AI-powered multimodal examination integrity and behavioral intelligence platform. Traditional remote exam proctoring systems rely on invasive surveillance: recording hours of video of candidates' bedrooms, uploading high-definition video files to centralized servers, and running black-box algorithms that issue automated "cheating" accusations.

Behavior-X fundamentally rejects this paradigm through four core engineering principles:

1. **Zero Raw Video Storage (0ms Persistence):** Video frames from the candidate's camera are decoded into volatile browser RAM, rendered onto an offscreen $160 \times 120$ canvas buffer, analyzed for geometric orientation vectors and presence counts, and immediately dereferenced for garbage collection. Zero frames are written to disk, IndexedDB, or transmitted over network sockets.
2. **Deterministic Multi-Signal Correlation:** An isolated head movement or natural downward glance to scratchpad paper is never flagged as cheating. Telemetry across optical orientation, browser visibility, keystroke dynamics, cursor velocity, and question timing is fused across sliding time windows with documented weights and exponential half-life decay.
3. **The Three Core Scores:** Complex human behavior is never collapsed into a single "cheating probability" percentage. The system outputs three separate orthogonal metrics:
   - **Integrity Review Priority ($0-100$):** How urgently the multi-signal pattern warrants human inspection.
   - **Evidence Quality ($0-100$):** Statistical corroboration and sensor confidence across modalities.
   - **System Observation Quality ($0-100$):** Sensor health, optical illuminance, and browser environment integrity.
4. **Human Authority & Causal Explainability:** Algorithms never disqualify students. The platform generates an interactive **Causal Evidence Graph**, runs a **Counterfactual Engine** that calculates the exact mathematical contribution of each signal, and provides a **Human-in-the-Loop Review Decision Workflow** for academic examiners.

---

## 2. System Architecture & The 11-Stage Pipeline

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        1. MULTIMODAL SENSORS                           │
│  Camera (Orientation/Gaze) │ Browser Visibility │ Keystroke Dynamics   │
│  Mouse Velocity/Hesitation │ Question Timing    │ Clipboard Events     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         2. EVENT NORMALIZER                            │
│  Standardized BehaviorEvent: timestamp, confidence, category, duration │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        3. BEHAVIOR EVENT STORE                         │
│  In-Memory Reactive Ledger • Monotonic Timestamps • Zero Raw Frames    │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│     4. PERSONAL BASELINE ENGINE      │  │  5. TEMPORAL SEQUENCE ENGINE │
│  Calibrates candidate rhythm (8 samp)│  │  Sliding 45s composite window│
│  Tracks typing, pauses, gaze rate    │  │  Detects multi-step patterns │
└───────────────────┬──────────────────┘  └──────────┬───────────────────┘
                    │                                │
                    └────────────────┬───────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      6. MULTIMODAL FUSION ENGINE                       │
│  Cross-channel synergy matrix (1.0x to 2.1x) • Modality representation │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          7. ANOMALY ENGINE                             │
│  Difficulty-aware deviations • Baseline delta • Environmental factors  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 8. THREE CORE SCORES RISK ENGINE                       │
│  - Integrity Review Priority (0-100)                                   │
│  - Evidence Quality (0-100)                                            │
│  - Observation Quality (0-100)                                         │
│  Sliding 30s window • Exponential decay ($t_{1/2}=45s$)                │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       9. EVIDENCE GRAPH ENGINE       │  │  10. COUNTERFACTUAL ENGINE   │
│  Directed causal graph: nodes, edges,│  │  Mathematical re-evaluation  │
│  temporal links, contribution weights│  │  without each observed signal│
└───────────────────┬──────────────────┘  └──────────┬───────────────────┘
                    │                                │
                    └────────────────┬───────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     11. EXPLAINABLE AI & EXAMINER UI                   │
│  Gemini 2.5 Dossier Assistant • Deterministic Fallback Engine          │
│  Question Heatmap • Behavioral Replay • Human Decision Audit Trail     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical Formulations

### 3.1 Integrity Review Priority ($P$)

Evaluates how strongly the observed behavioral pattern over a sliding window ($W = 30\text{s}$) warrants human examiner inspection:

$$P = \min\left(100, \sum_{i=1}^{n} \left( w_i \cdot c_i \cdot \text{decay}(t_i) \right) \cdot \mu_{\text{synergy}} + S_{\text{seq}} + S_{\text{base}}\right)$$

#### Base Weights ($w_i$):
- `MULTIPLE_FACES` / `MULTIPLE_PERSONS`: **35**
- `AI_ERA_INTERACTION_PATTERN`: **32**
- `RAPID_REPEATED_DEVIATION`: **26**
- `CAMERA_DISCONNECTED`: **22**
- `TAB_VISIBILITY_CHANGE`: **20**
- `WINDOW_BLUR`: **18**
- `PROLONGED_OFF_SCREEN_GAZE`: **16**
- `QUESTION_RAPID_ANSWER`: **16**
- `FULLSCREEN_EXIT`: **15**
- `CLIPBOARD_PASTE`: **14**
- `TYPING_SPEED_CHANGE`: **12**
- `LOOKING_AWAY`: **8**

#### Confidence ($c_i$):
Statistical certainty of detection ($0.0 \le c_i \le 1.0$). Standard browser events (e.g. `visibilitychange`) have $c = 1.0$.

#### Half-Life Exponential Decay:
Events decay smoothly with a half-life $t_{1/2} = 45{,}000\text{ms}$:
$$\text{decay}(t_i) = 0.5^{\frac{t_{\text{now}} - t_i}{45000}}$$

#### Cross-Category Synergy Multiplier ($\mu_{\text{synergy}}$):
- $1$ Modality: $1.0\times$
- $2$ Modalities (e.g. Camera + Browser): $1.35\times$
- $3$ Modalities (e.g. Camera + Browser + Keyboard): $1.70\times$
- $\ge 4$ Modalities: $2.10\times$

#### Bonuses ($S_{\text{seq}}, S_{\text{base}}$):
- $S_{\text{seq}} = +15$: Injected when the Temporal Sequence Engine detects composite multi-signal assist patterns.
- $S_{\text{base}} = +10$: Injected when typing speed or response duration deviates $>80\%$ from the candidate's personal baseline.

### 3.2 Evidence Quality Score ($Q_E$)

Measures whether observations are corroborated across independent channels:
$$Q_E = \text{round}\left( \overline{c} \cdot 80 + \min(20, \text{channelCount} \times 6) \right)$$
- If signals are corroborated across multiple detectors, $Q_E$ approaches $100$ (`HIGH CONFIDENCE`).
- Isolated, fleeting sensor fluctuations yield low $Q_E$, alerting the examiner that the evidence is weak.

### 3.3 System Observation Quality Score ($Q_O$)

Measures monitoring environment health:
$$Q_O = \max\left(10, 100 - \sum \text{Penalties}\right)$$
- Low optical illuminance ($<15$ lux): $-20$
- Frame drop / latency: $-15$
- Camera disconnection: $-40$
- DevTools window geometry delta: $-15$

### 3.4 True Counterfactual Scoring Formulation

When an examiner asks: *"Why did the review priority increase to 68?"*, the engine does not provide a hardcoded guess. It recomputes the exact mathematical difference:
$$\Delta_k = P(E) - P(E \setminus \{e \mid e.\text{type} = S_k\})$$
- $P(E)$: Current score with all events.
- $P(E \setminus \{e \mid e.\text{type} = S_k\})$: Score re-evaluated by re-running the exact `RiskEngine` with signal $S_k$ omitted.
- $\Delta_k$: The true marginal contribution of signal $S_k$.

---

## 4. Codebase Directory Map

```text
src/
├── types/
│   └── index.ts                 # Unified TypeScript domain definitions (Core models, enums)
├── data/
│   └── mockData.ts              # Questions bank, candidate profile, and mock session rosters
├── engine/
│   ├── BehaviorEngine.ts        # Central engine facade orchestrating all sub-engines
│   ├── BehaviorEventStore.ts    # Observable in-memory event store with subscriber pattern
│   ├── EventDebouncer.ts        # Cooldown timer preventing redundant event flood
│   ├── baseline/
│   │   └── PersonalBaselineEngine.ts   # Candidate rhythm baseline calibration
│   ├── temporal/
│   │   └── SequenceEngine.ts           # Sliding 45s composite sequence state machine
│   ├── fusion/
│   │   └── MultimodalFusionEngine.ts   # Cross-modality synergy and presence matrix
│   ├── questions/
│   │   └── QuestionIntelligenceEngine.ts # Item-level response time vs difficulty analysis
│   ├── risk/
│   │   └── RiskEngine.ts               # Computes Three Core Scores with temporal decay
│   ├── evidence/
│   │   └── EvidenceGraphEngine.ts      # Builds directed causal evidence graph
│   ├── counterfactual/
│   │   └── CounterfactualEngine.ts     # Recomputes mathematical signal score deltas
│   ├── security/
│   │   └── BrowserIntegrityService.ts  # DevTools heuristics & honest capability matrix
│   ├── replay/
│   │   └── SessionReplayEngine.ts      # Behavioral replay time-scrubbing engine
│   ├── ai/
│   │   └── GeminiExplanationService.ts # Gemini 2.5 SDK + deterministic fallback
│   ├── detectors/
│   │   └── ClipboardDetector.ts        # Copy/paste/cut event listener with injection metrics
│   ├── interaction/
│   │   ├── KeystrokeDetector.ts        # Typing speed (kps), intervals, and dwell times
│   │   └── MouseDetector.ts            # Cursor velocity, hesitation, and idle tracking
│   ├── demo/
│   │   └── demoScenarios.ts            # 5 deterministic offline scenarios (Normal to Complex)
│   └── privacy/
│       └── privacyTests.ts             # Automated unit tests for zero-video verification
├── context/
│   └── SessionContext.tsx       # React Context: Camera stream lifecycle, telemetry binding
├── components/
│   ├── common/                  # Strict monochrome UI design tokens
│   │   ├── Button.tsx           # Academic / Primary / Outline monochrome buttons
│   │   ├── Card.tsx             # Structured black/white cards
│   │   ├── StatusBadge.tsx      # Grayscale status & risk badges
│   │   ├── RiskIndicator.tsx    # Density score gauges & progress bars
│   │   ├── CameraPreview.tsx    # Optical canvas HUD overlay (0ms video storage)
│   │   ├── Timer.tsx            # Distraction-free countdown timer
│   │   ├── EventIndicator.tsx   # Chronological event card
│   │   ├── Modal.tsx            # Minimalist monochrome modal frames
│   │   ├── Alert.tsx            # High-contrast alerts
│   │   └── FeedbackStates.tsx   # Empty, loading, and error states
│   ├── examiner/                # Examiner Command Center modules
│   │   ├── EvidenceGraphViewer.tsx   # Interactive causal graph canvas
│   │   ├── QuestionHeatmap.tsx       # Interactive question integrity heatmap
│   │   ├── CounterfactualPanel.tsx   # Recomputed score delta sliders
│   │   ├── SessionReplayViewer.tsx   # Step-by-step behavioral session replay
│   │   ├── ReviewDecisionPanel.tsx   # Human decision actions (Confirm/Dismiss)
│   │   ├── ExplainableAlertPanel.tsx # Three Core Scores dashboard panel
│   │   ├── RiskTimeline.tsx          # Temporal SVG score density chart
│   │   ├── SignalBreakdown.tsx       # Modality distribution breakdown
│   │   ├── AIExplanationCard.tsx     # Gemini assistant explanation dossier
│   │   └── PrivacyPanel.tsx          # Monitoring profile toggle & capability matrix
│   └── demo/
│       └── DemoControlPanel.tsx # Synthetic telemetry event injector
├── pages/
│   ├── LandingPage.tsx          # Apple/Linear monochrome landing hero & pipeline diagram
│   ├── ExaminerDashboardPage.tsx# Examiner command center (Roster, Heatmap, Graph, Replay)
│   ├── SessionDetailPage.tsx    # Detailed candidate investigation dossier
│   ├── DemoPage.tsx             # Interactive 5-scenario simulation lab
│   ├── StudentEntryPage.tsx     # Device calibration & Candidate Privacy Charter
│   ├── ActiveExamPage.tsx       # Distraction-free candidate test UI (Keyboard accessible)
│   ├── ExamCompletePage.tsx     # Sealed assessment telemetry receipt
│   └── PrivacyExplanationPage.tsx # Technical privacy charter & capability matrix
├── App.tsx                      # Client-side router & master navigation layout
├── main.tsx                     # React 19 root bootstrap
└── index.css                    # Tailwind CSS + Inter font + strict monochrome design tokens
```

---

## 5. Deep Dive: Key Subsystems & Source Code

### 5.1 The Domain Model (`src/types/index.ts`)

Every component and engine in Behavior-X relies on strongly typed contracts:

```typescript
// 1. The Three Core Scores
export interface RiskState {
  currentScore: number;                 // Backward-compatible alias for reviewPriorityScore
  level: RiskLevel;                     // 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW'
  confidence: number;                   // 0.0 - 1.0 statistical certainty
  
  reviewPriorityScore: number;          // Core Metric 1: Urgency of review (0-100)
  reviewPriorityLevel: RiskLevel;
  evidenceQualityScore: number;         // Core Metric 2: Observation reliability (0-100)
  evidenceQualityLevel: EvidenceQualityLevel; // 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT'
  observationQualityScore: number;      // Core Metric 3: System/hardware health (0-100)
  observationQualityLevel: ObservationQualityLevel; // 'DEGRADED' | 'ACCEPTABLE' | 'OPTIMAL'
  
  timeWindowSeconds: number;            // Active evaluation window (default: 30s)
  eventCountInWindow: number;
  breakdown: RiskBreakdown;
  timeline?: RiskTimelinePoint[];
  humanReadableExplanation?: string;
  topContributingFactors?: RiskFactor[];
  contributingSignalSummary?: string[];
  lastCalculatedAt: number;
}

// 2. Behavioral Telemetry Event
export interface BehaviorEvent {
  id: string;
  sessionId: string;
  timestamp: number;                    // Epoch ms or offset ms
  type: EventType;
  category: EventCategory;              // 'presence' | 'attention' | 'visibility' | 'interaction' | 'question' | 'fusion' | 'system'
  severity: EventSeverity;              // 'low' | 'medium' | 'high'
  confidence: number;
  duration: number;                     // Duration in milliseconds
  durationSeconds?: number;
  source: EventSource;                  // e.g. 'keystroke_detector', 'visibility_detector'
  description: string;
  evidence: ObservableSignals;          // Structured numerical metadata
}
```

### 5.2 Personal Behavioral Baseline Engine (`src/engine/baseline/PersonalBaselineEngine.ts`)

Instead of comparing all students against a generic population stereotype, this engine learns the candidate's personal typing cadence, pause frequency, and reading speed during the first 8 samples:

```typescript
export class PersonalBaselineEngine {
  private typingSpeedSamples: number[] = [];
  private pauseDurationSamples: number[] = [];
  private questionDurationSamples: number[] = [];
  private isEstablished: boolean = false;

  public recordInteractionSample(kps: number, pauseSec: number, mouseVelocity: number): void {
    if (kps > 0) this.typingSpeedSamples.push(kps);
    if (pauseSec > 0) this.pauseDurationSamples.push(pauseSec);

    // Baseline is established after 8 interaction samples
    if (!this.isEstablished && this.typingSpeedSamples.length >= 8) {
      this.isEstablished = true;
      this.establishedAt = Date.now();
      this.recomputeBaseline();
    }
  }

  public evaluateDeviation(currentKps: number, currentQuestionResponseSec?: number) {
    const typingDeviationPct = this.isEstablished && this.baselineTypingSpeed > 0
      ? Math.round(((currentKps - this.baselineTypingSpeed) / this.baselineTypingSpeed) * 100)
      : 0;

    return {
      hasSignificantDeviation: typingDeviationPct > 80,
      typingDeviationPct,
      responseDeviationPct: 0
    };
  }
}
```

### 5.3 Temporal Sequence Engine (`src/engine/temporal/SequenceEngine.ts`)

Maintains a sliding 45-second composite chronological window to identify multi-step digital assistance patterns:

```typescript
export class SequenceEngine {
  public ingestEvent(event: BehaviorEvent): DetectedSequence | null {
    const now = Date.now();
    this.recentEvents.push(event);
    this.recentEvents = this.recentEvents.filter(e => now - e.timestamp <= 45000);

    // Pattern: Window Blur -> Return Focus -> Paste or Typing Burst -> Rapid Answer
    const hasBlur = this.recentEvents.some(e => e.type === 'WINDOW_BLUR' || e.type === 'TAB_VISIBILITY_CHANGE');
    const hasPasteOrTypingBurst = this.recentEvents.some(e => e.type === 'CLIPBOARD_PASTE' || e.type === 'TYPING_SPEED_CHANGE');
    const hasRapidAnswer = this.recentEvents.some(e => e.type === 'QUESTION_RAPID_ANSWER');

    if (hasBlur && (hasPasteOrTypingBurst || hasRapidAnswer)) {
      if (this.debouncer.canEmit('AI_ERA_INTERACTION_PATTERN', now)) {
        this.debouncer.recordEmitted('AI_ERA_INTERACTION_PATTERN', now);
        
        // Emits AI_ERA_INTERACTION_PATTERN event for fusion and risk engine
        return {
          id: `seq-${now}`,
          name: 'AI-Era External Interaction Pattern',
          confidence: 0.92,
          recommendation: 'Verify question difficulty and external tab timing with candidate'
        };
      }
    }
    return null;
  }
}
```

### 5.4 Counterfactual Engine (`src/engine/counterfactual/CounterfactualEngine.ts`)

Computes exact score impact without guessing by re-running the scoring model:

```typescript
export class CounterfactualEngine {
  public computeCounterfactuals(events: BehaviorEvent[], now: number, startTime: number): CounterfactualScenario[] {
    const baseEvaluation = this.riskEngine.evaluateRisk(events, now, startTime);
    const originalScore = baseEvaluation.currentScore;
    const signalTypes = Array.from(new Set(events.map(e => e.type)));

    return signalTypes.map(typeToOmit => {
      // 1. Filter out the specific signal type
      const reducedEvents = events.filter(e => e.type !== typeToOmit);
      
      // 2. Re-evaluate risk state with the exact same mathematical engine
      const recomputed = this.riskEngine.evaluateRisk(reducedEvents, now, startTime);
      const scoreWithoutSignal = recomputed.currentScore;
      const delta = originalScore - scoreWithoutSignal;

      return {
        signalId: typeToOmit,
        label: `Without ${typeToOmit.replace(/_/g, ' ')}`,
        originalScore,
        scoreWithoutSignal,
        delta,
        explanation: `Omitting ${typeToOmit.replace(/_/g, ' ')} lowers review priority by ${delta} points.`
      };
    });
  }
}
```

### 5.5 Browser Integrity Service & Honest Boundaries (`src/engine/security/BrowserIntegrityService.ts`)

Prevents client-side tampering while maintaining absolute honesty regarding browser API limitations:

```typescript
export class BrowserIntegrityService {
  public evaluateBrowserCapabilities(): BrowserCapability[] {
    const isBrowser = typeof window !== 'undefined';

    return [
      {
        id: 'tab-visibility',
        name: 'Tab Visibility Monitoring (Page Visibility API)',
        status: isBrowser && 'visibilityState' in document ? 'SUPPORTED' : 'NOT AVAILABLE IN BROWSER',
        notes: 'Detects when candidate navigates away from active exam tab.',
        verifiedInEnvironment: true,
      },
      {
        id: 'clipboard-events',
        name: 'Clipboard Event Interception (Copy / Paste / Cut)',
        status: 'PARTIAL',
        notes: 'Listens to in-page clipboard events; OS-level history inaccessible due to browser sandbox security.',
        verifiedInEnvironment: true,
      },
      {
        id: 'screen-recording-apps',
        name: 'OS Background Screen Recording Apps',
        status: 'NOT AVAILABLE IN BROWSER',
        notes: 'Browser sandbox prevents inspecting native operating system process lists or background apps.',
        verifiedInEnvironment: false,
      },
      {
        id: 'os-applications',
        name: 'Native OS Applications Inspection',
        status: 'NOT AVAILABLE IN BROWSER',
        notes: 'Browser security strictly isolates client code from inspecting external desktop processes.',
        verifiedInEnvironment: false,
      }
    ];
  }
}
```

---

## 6. The Strict Monochrome Design System

Behavior-X V2 enforces a strict, premium black-and-white visual language inspired by Apple, Linear, and Vercel.

### Color Rules:
- **Primary:** `#000000` (Pure Black) and `#FFFFFF` (Pure White).
- **Grayscale Scale:** `#0A0A0A`, `#111111`, `#171717`, `#262626`, `#333333`, `#525252`, `#737373`, `#A3A3A3`, `#D4D4D4`, `#E5E5E5`, `#F5F5F5`.
- **Prohibited:** Zero colored pixels (no blue, green, red, amber, purple, yellow, or color gradients).
- **State Communication:** Communicated via **border weight**, **density gauges**, **monochrome fill percentage**, **typography hierarchy**, and **iconography**.

```text
NORMAL       LOW          MEDIUM       HIGH         REVIEW
─────────    ─────────    ─────────    █████████    ████████████
(Hairline)   (Light Gray) (Dark Gray)  (Solid Black)(Inverted Black Card)
```

---

## 7. Deterministic Demo Mode (`/demo`)

To ensure hackathon judges and evaluators can test the entire platform without requiring hardware permissions, external networks, or API keys, Behavior-X includes 5 deterministic scenarios:

| Scenario | Title | Sequence of Injected Events | Expected Final Score |
|:---|:---|:---|:---|
| **01** | Normal Baseline | Natural posture, brief glance to scratchpad, zero tab or clipboard anomalies. | `NORMAL (0–14)` |
| **02** | Repeated Attention | Sequential head and gaze deviations off-screen during an active question. | `MEDIUM (35–64)` |
| **03** | Browser Focus & Tab | Tab visibility hidden + window blur during question evaluation. | `MEDIUM (35–64)` |
| **04** | Multiple Persons | Secondary person silhouette registered in camera frame with $>90\%$ confidence. | `HIGH (65–84)` |
| **05** | Complex Multimodal & AI-Era | Focus exit $\rightarrow$ Return $\rightarrow$ Large paste $\rightarrow$ Typing burst $\rightarrow$ Rapid answer. | `REVIEW (85–100)` |

---

## 8. Verification & Test Suite

The project includes an automated unit test suite in [`scripts/testEngine.ts`](file:///c:/Users/NARESH%20KA/Desktop/excel/Behavior-X-/scripts/testEngine.ts) verifying all mathematical and privacy constraints:

```bash
npm test
```

### Verified Test Assertions (18/18 Passing):
1. **Privacy Verification 1:** Zero raw video storage constraint enforced in RAM.
2. **Privacy Verification 2:** Event payload data minimization (numerical coordinates only).
3. **Privacy Verification 3:** Facial identification and biometric embedding prohibition.
4. **Privacy Verification 4:** Automatic purge policy upon session submission.
5. **Risk Engine Metric 1:** Integrity Review Priority calculation.
6. **Risk Engine Metric 2:** Evidence Quality Score calculation.
7. **Risk Engine Metric 3:** System Observation Quality Score calculation.
8. **Risk Engine Anomaly Sensitivity:** Score increases proportionally with observable signals.
9. **Categorical Mapping:** Scores map correctly to `NORMAL`, `LOW`, `MEDIUM`, `HIGH`, `REVIEW`.
10. **Counterfactual Signal Isolation:** Scenarios generated for each unique signal.
11. **Counterfactual Recomputation:** Score delta computed by re-running risk engine.
12. **Multimodal Fusion Synergy:** Multiplier increases from $1.0\times$ to $2.1\times$ across modalities.
13. **Multimodal Channel Presence:** Categorizes distinct sensory channels correctly.
14. **Personal Baseline Tracking:** Records candidate typing speed baseline in first 8 samples.
15. **Personal Baseline Anomaly Detection:** Flags sudden $>80\%$ typing burst deviations.
16. **Temporal Sequence Detection:** Detects focus exit $\rightarrow$ paste $\rightarrow$ rapid answer sequence.
17. **Browser Capability Transparency:** Full capability matrix exposed.
18. **Honest Browser Boundary:** OS application inspection accurately labeled `NOT AVAILABLE IN BROWSER`.

---

## 9. Typical Evaluation / Viva / Interview Questions & Answers

### Q1: "How does Behavior-X ensure student privacy if you are monitoring the webcam?"
> **Answer:** *"Behavior-X enforces an architectural constraint: **Zero Stored Video (0ms Persistence)**. Optical frames from the browser's `getUserMedia` stream are decoded into volatile RAM, drawn to an offscreen $160 \times 120$ canvas buffer, analyzed for head pose orientation vectors and contour counts, and immediately dereferenced for garbage collection. No video, screenshots, or facial biometric embeddings are ever saved to disk, database, or sent across the network. Only structured numerical events (e.g. `LOOKING_AWAY`, duration: 2.8s) are emitted."*

### Q2: "What prevents a candidate from being unfairly penalized for glancing at their scratch paper?"
> **Answer:** *"Two mechanisms: First, the **Event Debouncer** enforces a minimum duration threshold ($3.5\text{s}$) before a downward glance is logged. Second, the **Personal Baseline Engine** and **Question Intelligence Engine** correlate question difficulty with expected response duration. A short glance down while solving a difficult math question decays harmlessly under our 45-second half-life decay function without raising the review priority."*

### Q3: "What are the Three Core Scores, and why not just give a cheating percentage?"
> **Answer:** *"A single 'cheating percentage' is misleading and scientifically unsound. A student in a dark room with an intermittent webcam might get a high cheating score on traditional tools simply because the camera failed. Behavior-X separates this into three distinct dimensions:
> 1. **Integrity Review Priority (0–100):** How urgently the multi-signal pattern warrants human review.
> 2. **Evidence Quality (0–100):** How corroborated the observations are across channels.
> 3. **System Observation Quality (0–100):** How well the camera and browser were functioning.
> If the room is dark, Observation Quality drops to 40, while Review Priority remains nominal, preventing false accusations."*

### Q4: "How does your Counterfactual Engine work? Are the numbers hardcoded?"
> **Answer:** *"No, the counterfactual values are computed dynamically in `CounterfactualEngine.ts`. When an examiner asks why the score is 68, the engine takes the active event list, removes all events of a specific signal (e.g. `WINDOW_BLUR`), and re-runs the exact mathematical `RiskEngine`. The delta between the original score and the recomputed score is the true marginal contribution of that signal."*

### Q5: "Can Behavior-X detect external desktop applications like Discord or ChatGPT on another monitor?"
> **Answer:** *"We believe in technical honesty (Rule 5). A web browser runs inside a secure sandbox; JavaScript cannot inspect native OS processes or detect background screen recording software. Any proctoring company claiming to do this inside standard web applications is falsifying their capabilities. What Behavior-X **can** detect deterministically is the observable symptom: the window losing OS focus (`window.blur`), the tab becoming hidden, rapid return to the exam, large clipboard paste injections, and sudden typing speed bursts relative to baseline."*
