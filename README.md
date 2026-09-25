# Behavior-X: Privacy-Preserving Intelligent Proctoring
**HACKEX '26 Hackathon Flagship Project**  
*Core Architectural Axiom:* **"Don't watch the student. Understand the behavior."**

---

## 1. Project Overview

Behavior-X is a privacy-first proctoring and behavioral intelligence platform designed for higher education. Conventional remote proctoring software captures continuous high-definition video of students' private living spaces, uploads recordings to cloud servers, and subjects candidates to automated "cheating" accusations.

**Behavior-X changes this paradigm:**
1. **Zero Video Retention:** Video frames are analyzed in transient volatile RAM for under 100ms and discarded immediately. No video is ever saved to disk or broadcasted.
2. **Deterministic Multi-Signal Correlation:** Anomaly detection uses a 30-second sliding temporal window with documented weights and exponential decay. A momentary glance away is never flagged as cheating.
3. **Ethical Non-Accusatory AI Layer:** Powered by Gemini 3.8 Flash, the system synthesizes clear, objective explanations of observable telemetry for human academic examiners. It never accuses or infers guilt.
4. **Offline Deterministic Fallback:** 100% operational even without a webcam, internet connection, or API keys.

---

## 2. Key Features

- **Interactive Candidate Exam Workspace:** Real-time assessment interface with countdown timer, direct question navigator, review flags, and keyboard shortcuts (`A-D`, `1-4`, `M`, arrows).
- **Transient Edge Optical Ingestion:** In-memory luminosity, contrast, and spatial contour analyzer extracting yaw/pitch proxy angles and presence states without biometric storage.
- **Explainable Multi-Signal Risk Engine:** Documented weights for attention deviations, window blurs, tab switches, and multiple persons with cross-category synergy multipliers.
- **Examiner Command Center:** Cohort oversight, risk distribution, chronological risk timeline, observable signal breakdowns, and examiner review workflow states (`Mark for Review`, `Reviewed`, `Needs Follow-up`).
- **Dedicated Interactive Demo Sandbox (`/demo`):** 5 pre-built deterministic scenarios with play/pause, time acceleration, step annotations, and a one-click "Launch Judge Demo" mode.
- **In-Browser Verification Suite:** 22 automated unit test scenarios validating privacy constraints, risk scoring weights, debounce logic, and AI prompt sanitization.

---

## 3. Technology Stack

- **Framework:** React 19 SPA, TypeScript, Vite
- **Styling:** Tailwind CSS (modern CSS-first theme)
- **Icons:** Lucide React
- **AI Assist:** `@google/genai` TypeScript SDK (`gemini-3.8-flash`) with deterministic fallback
- **State & Signal Storage:** Reactive Event Store with temporal window subscriber patterns

---

## 4. Local Development Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 5. Live Demo for Evaluators & Judges

To evaluate the system without webcam setup:
1. Navigate directly to `/demo` or click **"Live Demo"** in the top navigation bar.
2. Click **"Launch Judge Demo (Quick Run)"** to execute Scenario 4 (Multiple-Person Signal).
3. Observe how individual signals correlate into an elevated review priority, view the chronological score graph, and inspect the Gemini AI explanation.
4. Click **"Verification Suites (22/22)"** in the top navigation to run the automated test suite directly in the browser.

---

## 6. Privacy Principles Summary

- **Zero Raw Video Storage (0ms):** Enforced by architecture.
- **No Facial Recognition:** No face identity embeddings or demographic profiling.
- **Session-Limited Event Storage:** Telemetry automatically purged after academic appeal periods.
- **Human-In-The-Loop:** The certified academic examiner remains the sole decision maker.
