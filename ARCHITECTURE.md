# BEHAVIOR-X V2 — MODULAR SYSTEM ARCHITECTURE & DATA PIPELINE

## 1. The 11-Stage Intelligence Pipeline

Behavior-X V2 implements a strictly decoupled, modular behavioral intelligence architecture:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        1. MULTIMODAL SENSORS                           │
│  Camera (Orientation/Gaze) │ Browser Visibility │ Keystroke / Mouse    │
│  Question Duration Timing │ In-Page Clipboard  │ Fullscreen Protocol   │
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

## 2. Mathematical Formulation of the Three Core Scores

### 2.1 Metric 1: Integrity Review Priority ($P$)
Evaluates how urgently the observed pattern warrants human examiner inspection over a sliding window ($W = 30\text{s}$):

$$P = \min\left(100, \sum_{i=1}^{n} \left( w_i \cdot c_i \cdot \text{decay}(t_i) \right) \cdot \mu_{\text{synergy}} + S_{\text{seq}} + S_{\text{base}}\right)$$

Where:
- $w_i$: Base severity weight of event $i$ (`MULTIPLE_FACES` = 35, `AI_ERA_PATTERN` = 32, `TAB_BLUR` = 18, `PROLONGED_GAZE` = 16, `LOOKING_AWAY` = 8).
- $c_i$: Sensory detector statistical confidence ($0.0 \le c_i \le 1.0$).
- $\text{decay}(t_i) = 0.5^{\frac{t_{\text{now}} - t_i}{45000\text{ms}}}$: Half-life exponential decay.
- $\mu_{\text{synergy}}$: Cross-category synergy multiplier:
  - 1 Modality: $1.0\times$
  - 2 Modalities: $1.35\times$
  - 3 Modalities: $1.70\times$
  - $\ge 4$ Modalities: $2.10\times$
- $S_{\text{seq}}$: Temporal sequence bonus (+15 when composite multi-signal pattern triggered).
- $S_{\text{base}}$: Personal baseline deviation bonus (+10 when candidate typing or response speed deviates $>80\%$).

### 2.2 Metric 2: Evidence Quality ($Q_E$)
Measures the corroboration and precision of recorded observations:

$$Q_E = \text{round}\left( \overline{c} \cdot 80 + \min(20, \text{channelCount} \times 6) \right)$$

- Evaluates whether signals from one modality (e.g. camera) are corroborated by another (e.g. browser focus change).
- Penalizes isolated or transient sensor noise.

### 2.3 Metric 3: System Observation Quality ($Q_O$)
Measures sensor and browser operational integrity:

$$Q_O = \max\left(10, 100 - \text{penalties}\right)$$

Where penalties are applied for:
- Low optical illuminance / darkness: -20
- High frame latency / stutter: -15
- Camera disconnection: -40
- Window geometry / devtools anomaly: -15

---

## 3. Formal Causal Evidence Graph Model

Every major review event is backed by a directed graph $G = (V, E)$:
- **Vertices ($V$):**
  - `EVENT`: Raw sensory observation node (timestamp, confidence, source).
  - `SIGNAL`: Aggregated behavioral category (e.g., Attention Cluster, Browser Exit).
  - `QUESTION`: Academic context (difficulty, expected duration, question number).
  - `RISK_CONTRIBUTION`: Mathematical weight allocated to the score.
- **Edges ($E$):**
  - Directed causal relationships (`TRIGGERS`, `CORRELATED_WITH`, `OCCURS_DURING`, `CONTRIBUTES_TO`).
  - Edges possess temporal offsets and confidence weights.

---

## 4. True Mathematical Counterfactual Engine

When an examiner inspects: *"Why did the review priority increase?"*, the counterfactual engine **does not guess or use hardcoded values**.

For each observable signal $S_k$:
1. $E_{\text{omitted}} = E \setminus \{ e \in E \mid e.\text{type} = S_k \}$
2. $P_{\text{without}} = \text{RiskEngine.evaluateRisk}(E_{\text{omitted}})$
3. $\Delta_k = P - P_{\text{without}}$

The examiner is shown the exact mathematical score difference $\Delta_k$ caused by each signal.
