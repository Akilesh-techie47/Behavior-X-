# BEHAVIOR-X V2 — HONEST CAPABILITY BOUNDARIES & KNOWN LIMITATIONS

In strict compliance with **Rule 5 (Browser Limitations)** and **Rule 8 (Never Claim Certainty of Misconduct)**, this document outlines what web-based examination integrity systems can and cannot technically observe.

---

## 1. Browser Capability Matrix

| Capability | Status | Implementation Truth |
|:---|:---|:---|
| **Tab Visibility (Page Visibility API)** | `SUPPORTED` | Deterministically detects when the exam tab is active vs hidden. |
| **Window Blur & Focus** | `SUPPORTED` | Detects when candidate clicks outside the exam browser window. |
| **Fullscreen Mode Lock** | `SUPPORTED` | Uses standard Fullscreen API; detects fullscreen exit immediately. |
| **In-Page Clipboard Events** | `PARTIAL` | Intercepts copy, cut, and paste within the exam DOM. **Cannot** inspect external OS clipboard history due to browser sandbox security. |
| **Keystroke & Mouse Dynamics** | `SUPPORTED` | Measures in-page key intervals, dwell times, cursor velocity, and acceleration. |
| **Optical Facial Orientation & Gaze** | `SUPPORTED` | Estimates head orientation (pitch, yaw, roll) and gaze vectors on device. Subject to lighting and occlusion. |
| **Multiple-Person Detection** | `SUPPORTED` | Identifies multiple facial contours in active camera frame. |
| **External Monitor Detection** | `LIMITED / PARTIAL` | Browsers can detect total screen resolution (`window.screen.availWidth`), but physical cable topology requires experimental permissions not universally supported across all browsers. |
| **Native OS Screen Recording Apps** | `NOT AVAILABLE IN BROWSER` | Web sandboxes strictly prohibit inspecting OS process trees. Any platform claiming to detect all OBS/background capture apps in pure client JS is falsifying capabilities. |
| **Native Non-Browser Desktop Apps** | `NOT AVAILABLE IN BROWSER` | Browser security architecture isolates web execution from desktop processes (e.g. running Discord or WhatsApp on a secondary monitor). |

---

## 2. Sensory & Environmental Limitations

### 2.1 Ambient Lighting & Hardware Sensor Quality
- In low-illumination environments (<15 lux), facial landmark bounding certainty drops.
- **Behavior-X Mitigation:** The platform reports this as a drop in **Observation Quality** (e.g. 45/100) and **Evidence Quality**, rather than falsely flagging the student for cheating.

### 2.2 Legitimate Dual-Display Workspaces
- Students with legitimate dual-monitor configurations (e.g. laptop connected to larger ergonomic display) may naturally turn their heads.
- **Behavior-X Mitigation:** Cooldown thresholds suppress brief glances, and examiners can inspect question difficulty before reviewing.

### 2.3 Scratchpad & Rough Calculations
- Candidates solving complex mathematics or data structure problems will naturally look down at rough paper.
- **Behavior-X Mitigation:** downward glances under 3.5 seconds do not accumulate critical risk. The Question Heatmap correlates difficulty with expected solving pauses.

---

## 3. Algorithmic Decision Boundaries

- **Zero Automated Disqualification:** The platform produces an **Integrity Review Priority** index (0-100), not an accusation or failing grade.
- **Zero Demographic Inference (Rule 9):** Appearance, ethnicity, gender, medical traits, and emotional state are never inferred or stored.
- **Human Authority:** All decisions must be confirmed, dismissed, or annotated by human academic examiners.
