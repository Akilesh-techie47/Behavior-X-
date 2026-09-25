# BEHAVIOR-X V2

## AI-Powered Multimodal Examination Integrity & Behavioral Intelligence Platform

> **"Don't watch the student. Understand the evidence."**

Behavior-X V2 upgrades conventional webcam proctoring into an advanced **multimodal examination intelligence platform**. Rather than recording hours of invasive candidate home video, Behavior-X continuously fuses observable telemetry across camera orientation, browser visibility, keystroke dynamics, mouse velocity, and question response timing into **structured, explainable, causal evidence graphs for human examiner review**.

---

## 1. The Three Core Telemetry Metrics

Behavior-X strictly avoids collapsing complex behavior into an arbitrary "cheating probability" percentage. Instead, the platform computes three independent dimensions:

1. **Integrity Review Priority (0–100):** How strongly the observed multi-signal pattern warrants human examiner review.
2. **Evidence Quality (0–100):** How statistically reliable and corroborated the underlying sensory observations are.
3. **System Observation Quality (0–100):** How optimally the candidate's sensor and browser monitoring environment operated.

```text
┌────────────────────────────────────────────────────────────┐
│ INTEGRITY REVIEW PRIORITY │ EVIDENCE QUALITY │ OBSERVATION QUALITY │
│         74 / 100          │     88 / 100     │      94 / 100       │
│           HIGH            │       GOOD       │      OPTIMAL        │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Key Architecture Innovations in V2

- **Personal Behavioral Baseline:** The platform establishes a candidate-specific baseline during the first 8 interaction samples (typing speed, pause rate, question reading duration, gaze deviation frequency). Anomalies are detected relative to the student's *own* session rhythm rather than generalized population stereotypes.
- **Multimodal Signal Fusion:** Cross-category synergy engine correlates camera, browser, keyboard, mouse, and question-level timing with synergy multipliers (1.0x to 2.1x).
- **Temporal Sequence Engine:** Sliding 45-second sequence analyzer recognizes composite external digital assistance patterns (e.g. Question opened → Long pause → Window blur → Return → Large paste injection → Sub-5s submission).
- **Question-Level Integrity Heatmap:** Every question item maintains its own behavioral dossier, response duration, and anomaly index.
- **Formal Causal Evidence Graph:** Directed causal graph mapping raw sensory observations to temporal relationships and risk contributions. Every node is interactive and traceable.
- **True Mathematical Counterfactual Engine:** Re-runs the scoring engine omitting each observable signal to calculate true score deltas (e.g. "Without browser event: Review Priority drops from 68 to 52").
- **Behavioral Session Replay:** Examiners can scrub, step through, and replay the chronological telemetry sequence without storing or streaming raw video.
- **Human-in-the-Loop Review:** Structured review workflow enabling examiners to Confirm, Dismiss, or mark signals Uncertain, with auditable examiner notes.
- **Deterministic Offline Demo Mode (`/demo`):** 5 pre-configured scenarios operable without a webcam, internet access, or backend availability.
- **Strict Black-and-White Monochrome Visual Design:** Re-architected with Apple, Linear, and Vercel design aesthetics using pure monochrome tones (`#000000`, `#FFFFFF`, neutral grays). Zero colors.

---

## 3. Technology Stack

- **Frontend Core:** React 19 SPA, TypeScript, Vite
- **Styling System:** Vanilla CSS & Tailwind CSS tokens strictly restricted to monochrome scale
- **Iconography:** Lucide React
- **Generative AI Layer:** `@google/genai` TypeScript SDK (`gemini-2.5-flash`) with deterministic offline explanation fallback
- **Behavioral Pipeline:** Modular sensory detectors, event store, personal baseline engine, sequence engine, multimodal fusion engine, risk engine, counterfactual engine, and evidence graph engine.

---

## 4. Quickstart & Verification

```bash
# 1. Install dependencies
npm install

# 2. Run automated verification suite (18/18 tests pass)
npm test

# 3. Start local development server
npm run dev
# Server runs at http://localhost:3000

# 4. Production build validation
npm run build
```

---

## 5. Hackathon Demonstration Flow (2 Minutes)

To demonstrate Behavior-X V2 to judges:

1. **Landing Page (`/`):** View the monochrome Apple/Linear design system, product positioning ("Don't watch the student. Understand the evidence"), and the 6-stage telemetry pipeline diagram.
2. **Launch Demo (`/demo`):** Click **"Launch Demo"** or navigate to `/demo`.
3. **Select Scenario 5 (Complex Multimodal & AI-Era Sequence):** Click **"Play Scenario"** or step through with **"Next Step"**.
4. **Watch Live Graph Construction:** Notice how window blur + clipboard paste + typing speed burst + rapid question answer combine into an **AI-Era Integrity Signal**.
5. **Inspect the Three Core Scores:** Observe Review Priority rising while Evidence Quality remains high and Observation Quality confirms camera health.
6. **Examiner Console (`/examiner`):** View the live roster, filter by High Review Priority, and click **"Investigate Dossier"**.
7. **Interactive Evidence Graph & Counterfactuals:** Click graph nodes to inspect causal links, and review the Counterfactual Engine showing exact score impact when signals are removed.
8. **Behavioral Session Replay:** Scrub the timeline to replay the candidate's exact interaction sequence.
9. **Human Review Decision:** Select **"Confirm Evidence"** or **"Dismiss"**, add reviewer rationale, and export the official structured JSON telemetry record (0ms video stored).

---

## 6. Privacy & Legal Compliance

- **Zero Stored Video (0ms):** Optical frames are processed in volatile RAM buffers and purged in <300ms.
- **Zero Facial Biometrics:** No facial templates or demographic traits are ever inferred or saved.
- **Honest Capability Boundaries:** Browser sandbox limitations (e.g. no access to OS process trees) are openly disclosed in the [Known Limitations](KNOWN_LIMITATIONS.md) charter.
