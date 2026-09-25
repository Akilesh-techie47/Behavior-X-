# Behavior-X: Live Demo Guide & Judge Walkthrough
**HACKEX '26 Presentation Playbook**

---

## 1. Quick Launch (30 Seconds)
1. Open the app URL and click **"Live Demo"** in the top navigation bar or go directly to `/demo`.
2. Click the high-visibility button: **"Launch Judge Demo (Quick Run)"**.
3. Watch the demo scenario execute:
   - Candidate baseline confirmed (`NORMAL`, 0% risk).
   - Second person enters camera perimeter at second 8 (`MULTIPLE_FACES`).
   - Notice the risk index jump dynamically to **HIGH (78%)**.
   - Notice the **Judge Highlight** callout explaining the exact mathematical weighting.
4. Scroll down to review the **AI Explanation Layer** summarizing the incident and generating audit recommendations without accusations of cheating.
5. Click **"Verification Suites (22/22)"** in the top header to run all unit tests in real time in front of the judges.

---

## 2. 3-Minute Comprehensive Demo Script

- **Minute 1: The Problem & Paradigm Shift**
  - *"Conventional proctoring records gigabytes of private student bedroom video and uses black-box algorithms to accuse students of cheating. Behavior-X takes an entirely different stance: Don't watch the student. Understand the behavior."*
  - Show the **Privacy Architecture Panel** at the bottom of `/demo`: 0ms RAM video retention, zero biometric identity vectors, structured JSON telemetry only.

- **Minute 2: Multi-Signal Deterministic Correlation**
  - Select **Scenario 3: Repeated Behavioral Anomaly**.
  - Show that a single glance away triggers only a mild score (+8 pts, LOW risk).
  - Show how the correlation with a window visibility change activates the **1.25x Cross-Domain Synergy Multiplier**, transitioning the state to MEDIUM.
  - Explain that no single event causes high risk—the 30s sliding window ensures natural cognitive glances decay harmlessly back to baseline.

- **Minute 3: Examiner Oversight & Ethical AI**
  - Switch to `/examiner` to show the cohort view.
  - Click on a candidate to view the **Chronological Risk Timeline** and **Signal Breakdown**.
  - Point to the **Examiner Review States** (`Mark for Review`, `Reviewed`, `Needs Follow-up`) to emphasize that humans make the final academic determination.
  - Conclude by running the **22 In-Browser Unit Tests** from the top header to demonstrate software reliability.

---

## 3. Fallback Demo Procedure (Zero Dependencies)
If local camera permissions are blocked by browser settings or the venue network is restricted:
- The entire demonstration runs locally via `/demo` without hardware or network calls.
- The AI Explanation Layer automatically invokes the deterministic fallback generator, producing complete executive summaries and review points with zero latency.
