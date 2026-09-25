# BEHAVIOR-X V2 — HACKATHON DEMO GUIDE & JUDGE PLAYBOOK

## Presentation Objective
Demonstrate how Behavior-X V2 transforms exam behavioral telemetry into **explainable, causal evidence graphs** without recording private video or making unfounded accusations.

---

## 1. Quick Launch (60-Second Express Demo)

1. Open the application and click **"Demo"** in the navigation header (or navigate to `/demo`).
2. Click **"Launch Judge Demo (Complex AI-Era)"**.
3. Watch the deterministic simulation execute in real time:
   - **t = 3s:** Candidate departs exam tab during difficult Question 7 (`TAB_VISIBILITY_CHANGE`).
   - **t = 10s:** Candidate returns and injects 340-character clipboard block (`CLIPBOARD_PASTE`).
   - **t = 16s:** Candidate exhibits 9.4 keys/sec typing burst (+120% above personal baseline 4.2 kps) (`TYPING_SPEED_CHANGE`).
   - **t = 22s:** Candidate submits complex answer in 4.1s (difficulty baseline: 45.0s) (`QUESTION_RAPID_ANSWER`).
   - **t = 28s:** Multimodal Fusion Engine triggers **AI-Era Integrity Pattern** (`AI_ERA_INTERACTION_PATTERN`).
4. Observe the **Three Core Scores**:
   - **Integrity Review Priority:** Rises dynamically to `88 / 100 (REVIEW)`.
   - **Evidence Quality:** Stays high at `92 / 100 (HIGH CONFIDENCE)`.
   - **Observation Quality:** Confirms sensor health at `95 / 100 (OPTIMAL)`.
5. Scroll down to inspect the **Causal Evidence Graph**:
   - Click on the central `Review Priority` node to see all connected sensory inputs.
   - Click the `AI-Era Pattern` node to inspect the directed causal edges.
6. Scroll down to the **Gemini AI Explanation Layer** to view the structured examiner summary.

---

## 2. Comprehensive 3-Minute Presentation Script

### Minute 1: The Core Innovation ("Don't Watch the Student. Understand the Evidence.")
- *"Traditional online proctoring invades candidate privacy by recording hours of bedroom video, yet fails to detect modern digital assistance. Behavior-X takes an entirely different stance: Don't watch the student. Understand the evidence."*
- Point to the **Strict Monochrome Visual System**: Clean, serious, scientific aesthetic inspired by Apple, Linear, and Vercel.
- Highlight the **0ms Video Storage Guarantee**: Optical frames are processed in volatile RAM and purged within 300ms. Zero footage is ever stored or uploaded.

### Minute 2: Multimodal Fusion & Personal Baseline
- Select **Scenario 2: Repeated Attention Deviations** vs **Scenario 5: Complex Multimodal**:
- Explain that isolated glances are suppressed by cooldowns and decay.
- Demonstrate that **Personal Baseline Calibration** measures deviations against the student's *own* established rhythm (typing speed, pause rate, question reading duration), not generalized stereotypes.
- Show the **Synergy Multiplier**: Combining camera + browser + keystroke dynamics escalates Review Priority systematically.

### Minute 3: Explainable Evidence, Counterfactuals & Human Authority
- Navigate to `/examiner` and click **"Investigate Dossier"** for `Session BX-103`.
- Show the **Question Integrity Heatmap**: Click Question 7 to inspect question-specific response timing vs difficulty.
- Open the **Counterfactual Engine**:
  - Show judges the true recomputed values: *"Without browser event: Review Priority drops from 68 to 52."*
  - Emphasize that these deltas are computed by re-running the scoring engine, not hardcoded.
- Open the **Behavioral Session Replay**:
  - Scrub through the event timeline to demonstrate step-by-step playback without video.
- Execute a **Human Review Decision**:
  - Select **"Confirm Evidence"**, type an examiner note, and click **"Record Determination"**.
  - Show the auditable timestamped decision ledger.
- Conclude by clicking **"Verification Suites"** in the top navigation to run all 18 automated unit tests live in front of the judges.

---

## 3. The 5 Deterministic Scenarios

| Scenario | Title | Description | Expected Final Priority |
|:---|:---|:---|:---|
| **Scenario 1** | Normal Candidate Baseline | Natural posture, brief glance to scratchpad, zero tab or clipboard anomalies. | `NORMAL (0–14)` |
| **Scenario 2** | Repeated Attention Deviations | Sequential head/gaze deviations off-screen during active question evaluation. | `MEDIUM (35–64)` |
| **Scenario 3** | Browser Focus & Tab Anomalies | Tab hidden state combined with OS-level window blur and immediate return. | `MEDIUM (35–64)` |
| **Scenario 4** | Multiple-Person Intrusion | Secondary silhouette detected within camera perimeter with >90% confidence. | `HIGH (65–84)` |
| **Scenario 5** | Complex Multimodal & AI-Era | Temporal sequence: Inactivity → Tab exit → Clipboard paste → Rapid answer. | `REVIEW (85–100)` |

---

## 4. Offline & Venue Resilience Guarantee
- **Zero Internet Required:** The `/demo` route is 100% deterministic and self-contained in client-side TypeScript.
- **Zero Webcam Required:** Synthetic events can be triggered via UI controls or scenario playback.
- **Zero API Key Required:** If the Gemini API is offline or unreachable, the built-in deterministic explanation engine seamlessly generates structured dossier summaries with zero latency.
