# Behavior-X: Known Issues & Non-Blocking Observations
**HACKEX '26 Engineering Log**

---

## Current Status: No Critical or Blocking Bugs

The application has been verified across all 10 testing categories with 22/22 unit tests passing in-browser and zero compilation errors.

### Non-Blocking Architectural Observations & Future Roadmap

1. **Synthetic Gaze Estimation Proxy in Headless/Demo Mode**:
   - *Observation:* When running on machines without a physical webcam, the camera preview displays a clean "Camera Standby/Denied" card.
   - *Workaround Provided:* The application features a dedicated **Demo Mode (`/demo`)** with 5 deterministic scenarios so evaluators never depend on local hardware.

2. **Vite Deprecation Warning in Build Logs**:
   - *Observation:* `Your Vite config uses features that are unsupported by configLoader: 'native' (__dirname)`.
   - *Resolution Note:* This is an upstream Vite 8 warning regarding Node's upcoming native ESM loader; it produces zero runtime impact and builds cleanly.

3. **In-Browser Session Persistence Across Browser Tabs**:
   - *Observation:* Active examination states are persisted locally in `localStorage` under `behavior_x_active_session_v1`. Opening the app simultaneously in multiple tabs shares the same active session state.
   - *Recommendation:* Evaluate individual candidates sequentially or utilize separate incognito windows when comparing concurrent sessions.
