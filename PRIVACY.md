# Behavior-X: Privacy-Preserving Architecture & Technical Charter
**HACKEX '26 Hackathon Engineering Document**  
*Core Architectural Axiom:* **"Don't watch the student. Understand the behavior."**

---

## 1. Architectural Philosophy: Privacy as an Invariant Property

Conventional proctoring tools treat privacy as an afterthought or a legal disclaimer while uploading gigabytes of high-definition video of students' living spaces to centralized servers.

**Behavior-X treats privacy as an invariant technical constraint.** Privacy is enforced through client-side edge computing, transient volatile memory buffers, and mathematical signal extraction.

> **Design Standard:** Behavior-X is designed strictly around data minimization and privacy-preserving processing principles.

---

## 2. Technical Data Minimization Matrix

| Data Domain | What Behavior-X Collects | What Behavior-X Strictly Avoids |
| :--- | :--- | :--- |
| **Video & Camera** | Ingested transiently in browser RAM for <100ms; downsampled to calculate contour deltas; discarded immediately. | **Zero raw video recordings**, zero screenshots, zero frame persistence to disk. |
| **Facial Telemetry** | Spatial orientation vectors (yaw, pitch) and presence counts (0, 1, or >1). | **Zero biometric templates**, zero facial recognition embeddings, zero demographic profiling (race, age, gender). |
| **Browser Environment**| Timestamped `blur` and `visibilitychange` duration in milliseconds. | No keystroke logging, no external browser history inspection, no background file system access. |
| **Candidate Identity** | University student ID token and institutional email address. | No residential address, phone numbers, or government biometric identifiers. |
| **Examiner Reports** | Structured mathematical JSON events (timestamp, type, duration, confidence). | No video replays, no audio listening streams. |

---

## 3. Transient Edge Processing Pipeline

```
WebCam Hardware Device
         │
         ▼
navigator.mediaDevices.getUserMedia (Client RAM only)
         │
         ▼
HTML5 Canvas (160x120 transient buffer)
         │
         ├── Calculated: Estimated Yaw / Pitch Angles
         ├── Calculated: Presence Contour Count
         │
         ▼
Canvas dereferenced ──► Volatile Frame Garbage Collected (0ms Retention)
         │
         ▼
Emitted: Structured Mathematical JSON Event (e.g. `LOOKING_AWAY`, duration: 2400ms)
```

---

## 4. Explainable Scoring, Not Automated Accusation

- **No Guilt Determinations:** Behavior-X algorithms output an **anomaly index (0–100)** indicating review priority.
- **Neutral Terminology:** The system uses neutral terminology such as *"Attention deviation"*, *"Multiple-person presence"*, and *"Window visibility change"*. It never uses accusations like *"Cheating detected"*.
- **Human-In-The-Loop:** Academic examiners remain the sole decision makers. Alerts explain exactly which observable signals contributed to the review state.

---

## 5. Retention & Auto-Purge Policy

- **Raw Optical Video:** 0ms retention. Never saved.
- **Behavioral Events:** Session-limited. Kept only during active testing and temporarily stored in candidate metadata for academic integrity review (maximum 30 days for board appeals).
- **Audit Reports:** Sealed JSON telemetry without media assets.

---

## 6. Security Guarantees for MVP

- **No Client Secrets:** All authentication and telemetry use client tokens with zero hardcoded backend keys in bundle assets.
- **Local Storage Isolation:** Saved state is scoped solely to the student workspace origin and sanitized against script injection.
- **Continuous Disconnection Tracking:** Optical tracks immediately trigger `CAMERA_DISCONNECTED` telemetry when interrupted or revoked.
