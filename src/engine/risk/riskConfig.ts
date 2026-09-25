/**
 * Risk Scoring Configuration & Documented Heuristic Weights
 *
 * Scoring Philosophy:
 * - A single brief signal should NEVER cause HIGH risk.
 * - Single weak signal (e.g. looking away once) = LOW risk.
 * - Repeated signals in window = MEDIUM risk.
 * - Correlated compound signals (e.g. gaze + window blur, or multiple people) = HIGH / REVIEW risk.
 * - Old events undergo smooth exponential decay so recovery to NORMAL is possible.
 */

export interface RiskConfig {
  // Duration of active temporal analysis window (e.g. 30 seconds)
  windowDurationMs: number;

  // Half-life for temporal event decay (in ms)
  // Events at (now - decayHalfLifeMs) have 50% weight
  decayHalfLifeMs: number;

  // Base raw point weights per signal type
  weights: {
    // Presence signals
    multipleFaces: number;          // High contribution (stronger signal)
    faceNotDetected: number;        // Low/moderate contribution (candidate stepped away or sensor obscured)

    // Attention signals
    prolongedOffScreenGaze: number; // Moderate contribution (sustained reading away)
    lookingAway: number;            // Low contribution (natural cognitive glance)
    headTurn: number;               // Low contribution

    // Visibility signals
    windowBlur: number;             // Moderate contribution (OS window focus switch)
    tabVisibilityChange: number;    // Moderate contribution (tab hidden)
    fullscreenExit: number;         // Moderate contribution (exited locked fullscreen)

    // Compound & System signals
    rapidRepeatedDeviation: number; // Higher contribution (compound cluster)
    cameraDisconnected: number;     // Moderate contribution
  };

  // Cross-category synergy multiplier:
  // When signals span >= 2 categories (e.g. Attention + Visibility), multiplier applies
  multiCategorySynergyMultiplier: number;

  // Normalized score boundaries (0-100)
  levelThresholds: {
    LOW: number;     // e.g. 15
    MEDIUM: number;  // e.g. 35
    HIGH: number;    // e.g. 65
    REVIEW: number;  // e.g. 85
  };
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  windowDurationMs: 30000, // 30-second sliding time window
  decayHalfLifeMs: 45000,  // 45-second decay half life

  weights: {
    multipleFaces: 35,          // Strong signal
    faceNotDetected: 18,        // Low/moderate
    prolongedOffScreenGaze: 16, // Moderate
    lookingAway: 8,             // Low
    headTurn: 8,                // Low
    windowBlur: 18,             // Moderate
    tabVisibilityChange: 20,    // Moderate
    fullscreenExit: 15,         // Moderate
    rapidRepeatedDeviation: 26, // Higher contribution
    cameraDisconnected: 22,     // Moderate
  },

  multiCategorySynergyMultiplier: 1.25, // 25% boost when multiple distinct signal types correlate

  levelThresholds: {
    LOW: 15,
    MEDIUM: 35,
    HIGH: 65,
    REVIEW: 85,
  },
};
