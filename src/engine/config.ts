/**
 * Behavior-X Configurable Signal & Aggregation Thresholds
 */

export interface BehaviorConfig {
  // Thresholds in ms before considering an event valid
  faceMissingThresholdMs: number;      // e.g. 2500ms continuous absence before emitting FACE_NOT_DETECTED
  multipleFaceThresholdMs: number;     // e.g. 1500ms continuous presence before emitting MULTIPLE_FACES
  lookingAwayThresholdMs: number;      // e.g. 2000ms continuous looking away
  prolongedGazeThresholdMs: number;    // e.g. 5000ms continuous looking away
  windowBlurThresholdMs: number;       // e.g. 1000ms blur
  
  // Debounce & Cooldown rules
  eventCooldownMs: Record<string, number>; // Minimum gap between emitting the same event type
  
  // Repeated Event Aggregation window
  repeatedEventWindowMs: number;       // e.g. 45000ms: if >= repeatedEventCount occurrences happen, trigger RAPID_REPEATED_DEVIATION
  repeatedEventCountThreshold: number; // e.g. 3 events
  
  // Optical sampling rate
  visionSampleIntervalMs: number;      // e.g. 200ms = 5 FPS (lightweight on CPU)
}

export const DEFAULT_BEHAVIOR_CONFIG: BehaviorConfig = {
  faceMissingThresholdMs: 2500,
  multipleFaceThresholdMs: 1500,
  lookingAwayThresholdMs: 2000,
  prolongedGazeThresholdMs: 5000,
  windowBlurThresholdMs: 1000,

  eventCooldownMs: {
    FACE_NOT_DETECTED: 6000,
    MULTIPLE_FACES: 8000,
    HEAD_TURN_LEFT: 4000,
    HEAD_TURN_RIGHT: 4000,
    LOOKING_AWAY: 5000,
    PROLONGED_OFF_SCREEN_GAZE: 10000,
    WINDOW_BLUR: 5000,
    TAB_VISIBILITY_CHANGE: 5000,
    FULLSCREEN_EXIT: 5000,
    CAMERA_DISCONNECTED: 10000,
    RAPID_REPEATED_DEVIATION: 15000,
  },

  repeatedEventWindowMs: 45000,
  repeatedEventCountThreshold: 3,
  visionSampleIntervalMs: 250, // 4 FPS for maximum browser performance
};
