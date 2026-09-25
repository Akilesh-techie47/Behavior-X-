# BEHAVIOR-X V2 — SECURITY & ANTI-TAMPERING ARCHITECTURE

## 1. Principles of Academic Security
Behavior-X V2 operates on a foundational tenet of honesty:
> **A web browser application cannot provide OS-level kernel security. It can, however, provide cryptographic auditability, client tampering detection, and multi-signal triangulation.**

We do not claim impossible capabilities (e.g. inspecting native OS processes or preventing physical hardware taps). Instead, we enforce cryptographic integrity and detect tampering within observable browser APIs.

---

## 2. Browser Environment Integrity Checks

Behavior-X executes automated environment checks upon session initialization:

### 2.1 Native Function Tampering Detection
Attackers frequently override `Date.now()`, `performance.now()`, or `Math.random()` to slow down countdown timers or forge event timestamps.
- **Check:** Behavior-X inspects `Function.prototype.toString.call(Date.now)` to ensure it contains native C++ bytecode (`[native code]`).
- **Response:** If modified, an `ENVIRONMENT_TAMPER_SIGNAL` is recorded with 1.0 confidence.

### 2.2 Window Geometry & Dock Inspection (DevTools Heuristics)
When a candidate opens Developer Tools (F12 or Inspect Element), the viewport experiences an asymmetric geometry delta:
- **Heuristic:** Delta between `window.outerWidth - window.innerWidth` and `window.outerHeight - window.innerHeight` is continuously evaluated.
- **Response:** Discrepancies exceeding 160px flag developer tools activity without throwing intrusive false positives during standard window resizing.

### 2.3 Frame & Video Stream Lifecycle Integrity
- If the optical camera stream is closed via hardware kill switch, permission revocation, or OS background interruption, `stream.getVideoTracks().forEach(track => track.onended)` triggers an immediate `CAMERA_DISCONNECTED` event.

---

## 3. Secret Management & Zero Frontend Secrets (Rule 10)

- **Gemini API Keys:** Never embedded in client-side bundles.
- **Backend Architecture:** In production deployments, Gemini calls are routed through the Node.js/Express reverse proxy (`/api/gemini/explain`) using server-side environment variables (`GEMINI_API_KEY`).
- **Deterministic Offline Fallback:** If no API key is provisioned, the client-side `GeminiExplanationService` transparently uses the deterministic explanation engine rather than failing or exposing keys.

---

## 4. Cryptographic Telemetry Ledger

Every telemetry event emitted by the Behavioral Event Store contains:
1. `id`: Cryptographically random UUID v4 with millisecond timestamp.
2. `sessionId`: Unique exam attempt identifier.
3. `timestamp`: Relative exam millisecond counter matched against monotonic clock (`performance.now()`).
4. `source`: Declared sensory detector layer (e.g., `keystroke_detector`, `visibility_detector`, `camera_lifecycle`).
5. `confidence`: Statistical certainty index (0.0 to 1.0).

---

## 5. Privacy-By-Design & 0ms Video Storage

- **Transient In-Memory Buffers:** Optical frames from `<video>` are rendered onto an off-screen `<canvas>` buffer for vector calculation.
- **Zero Video Persistence:** Raw frames are never encoded to MP4, WebM, or JPEG, and are never saved to disk, IndexedDB, or transmitted over network sockets.
- **RAM Purge:** Frames are garbage collected every animation frame (~33ms).
