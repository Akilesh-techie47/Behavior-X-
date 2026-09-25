# Behavior-X: System Architecture & Data Flow
**Technical Specifications Document**

---

## 1. High-Level Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   CANDIDATE BROWSER                    │
│                                                        │
│  [Webcam Stream] ──► HTML5 Canvas (160x120 transient)  │
│                           │                            │
│                           ▼ (0ms RAM dereference)      │
│  [Browser Window] ──► Visibility / Fullscreen Events   │
│                           │                            │
│                           ▼                            │
│               ┌───────────────────────┐                │
│               │    BEHAVIOR ENGINE    │                │
│               │ - Debounce & Cooldown │                │
│               │ - Minimum Thresholds  │                │
│               └───────────┬───────────┘                │
│                           ▼                            │
│               ┌───────────────────────┐                │
│               │ BEHAVIOR EVENT STORE  │                │
│               └───────────┬───────────┘                │
│                           ▼                            │
│               ┌───────────────────────┐                │
│               │      RISK ENGINE      │                │
│               │ - 30s Sliding Window  │                │
│               │ - Temporal Decay      │                │
│               │ - Documented Weights  │                │
│               └───────────┬───────────┘                │
│                           ▼                            │
│               ┌───────────────────────┐                │
│               │    EXPLAINABLE AI     │                │
│               │ (Gemini 3.8 Flash /   │                │
│               │  Deterministic Engine)│                │
│               └───────────┬───────────┘                │
└───────────────────────────┼────────────────────────────┘
                            ▼
              ┌───────────────────────────┐
              │  EXAMINER COMMAND CENTER  │
              │ - Chronological Timelines │
              │ - Signal Breakdown        │
              │ - Review Decisions        │
              └───────────────────────────┘
```

---

## 2. Event Ingestion & Debouncing Rules

To prevent alert flooding and noise, every detector adheres to minimum duration thresholds and per-event cooldown windows:

- **Face Absence (`FACE_NOT_DETECTED`):** Minimum duration threshold = `2500ms`, cooldown = `6000ms`.
- **Multiple Faces (`MULTIPLE_FACES`):** Minimum duration threshold = `1500ms`, cooldown = `4000ms`.
- **Prolonged Off-Screen Gaze (`PROLONGED_OFF_SCREEN_GAZE`):** Minimum duration threshold = `5000ms`, cooldown = `5000ms`.
- **Looking Away (`LOOKING_AWAY`):** Minimum duration threshold = `2000ms`, cooldown = `3000ms`.
- **Window Blur (`WINDOW_BLUR`):** Minimum duration threshold = `1000ms`, cooldown = `5000ms`.

---

## 3. Mathematical Risk Engine Formulation

Risk scores are computed dynamically over a **30-second sliding temporal window** ($W = 30000\text{ms}$).

### Base Weights ($w_i$)
- `MULTIPLE_FACES`: 35
- `RAPID_REPEATED_DEVIATION`: 26
- `CAMERA_DISCONNECTED`: 22
- `TAB_VISIBILITY_CHANGE`: 20
- `FACE_NOT_DETECTED`: 18
- `WINDOW_BLUR`: 18
- `PROLONGED_OFF_SCREEN_GAZE`: 16
- `FULLSCREEN_EXIT`: 15
- `LOOKING_AWAY`: 8
- `HEAD_TURN`: 8

### Exponential Temporal Decay
For an event occurring at $t_{\text{event}}$ relative to reference time $t_{\text{now}}$ with half-life $t_{1/2} = 45000\text{ms}$:
$$\text{decay} = 0.5^{\frac{t_{\text{now}} - t_{\text{event}}}{t_{1/2}}}$$

### Multi-Domain Synergy Multiplier
If active signals span $\ge 2$ distinct categories (e.g. Attention + Visibility):
$$\text{Multiplier} = 1.25$$

### Risk Levels
- **NORMAL:** $0 \le \text{Score} < 15$
- **LOW:** $15 \le \text{Score} < 35$
- **MEDIUM:** $35 \le \text{Score} < 65$
- **HIGH:** $65 \le \text{Score} < 85$
- **REVIEW:** $85 \le \text{Score} \le 100$
