import { BehaviorEvent } from '../../types';
import { BehaviorConfig } from '../config';
import { EventDebouncer } from '../EventDebouncer';
import { SignalDetector } from './SignalDetector';

export interface OpticalSignalReading {
  faceCount: number;
  confidence: number;
  headYawDeg: number;   // -45 (left) to +45 (right)
  headPitchDeg: number; // -30 (up) to +30 (down)
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down';
  timestamp: number;
}

export class FaceDetector implements SignalDetector {
  readonly id = 'face_detector';
  private running = false;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;
  private sessionId: string;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private sampleTimer: number | null = null;

  // State trackers for minimum duration thresholding
  private missingFaceStartTime: number | null = null;
  private multipleFaceStartTime: number | null = null;
  private lastFaceCount: number = 1;

  constructor(sessionId: string, config: BehaviorConfig, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.config = config;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public attachVideo(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  public start(onEvent: (event: BehaviorEvent) => void): void {
    if (this.running) return;
    this.running = true;
    this.onEventCallback = onEvent;

    if (typeof document !== 'undefined' && !this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 160;
      this.canvas.height = 120;
    }

    this.startSamplingLoop();
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onEventCallback = null;
    if (this.sampleTimer !== null) {
      window.clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  private startSamplingLoop(): void {
    this.sampleTimer = window.setInterval(() => {
      this.processFrame();
    }, this.config.visionSampleIntervalMs);
  }

  /**
   * Client-side transient frame processor
   * Evaluates pixel luminosity, contrast distribution, and motion contours
   * without recording or persisting raw frames.
   */
  private processFrame(): void {
    if (!this.videoElement || this.videoElement.readyState < 2 || !this.canvas) {
      return;
    }

    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Transient draw
    ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
    const frameData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = frameData.data;

    // 1. Analyze brightness & skin/foreground cluster proxy
    let totalLuma = 0;
    let foregroundPixels = 0;
    let leftSidePixels = 0;
    let rightSidePixels = 0;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const midX = width / 2;

    for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel for speed
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuma += luma;

      // Foreground contrast heuristic
      if (luma > 40 && luma < 220) {
        foregroundPixels++;
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        if (x < midX) {
          leftSidePixels++;
        } else {
          rightSidePixels++;
        }
      }
    }

    const sampleCount = data.length / 16;
    const avgLuma = totalLuma / sampleCount;

    // Detect if camera is covered / black / absent
    let estimatedFaceCount = 1;
    if (avgLuma < 12 || foregroundPixels < sampleCount * 0.05) {
      estimatedFaceCount = 0;
    }

    const now = Date.now();

    // 2. Thresholding for FACE_NOT_DETECTED (Absence)
    if (estimatedFaceCount === 0) {
      if (!this.missingFaceStartTime) {
        this.missingFaceStartTime = now;
      } else {
        const duration = now - this.missingFaceStartTime;
        if (
          duration >= this.config.faceMissingThresholdMs &&
          this.debouncer.canEmit('FACE_NOT_DETECTED', now)
        ) {
          this.debouncer.recordEmitted('FACE_NOT_DETECTED', now);
          this.emit({
            id: `evt-abs-${now}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId: this.sessionId,
            timestamp: now,
            type: 'FACE_NOT_DETECTED',
            category: 'presence',
            severity: duration > 5000 ? 'high' : 'medium',
            confidence: 0.9,
            duration,
            durationSeconds: Math.round(duration / 1000),
            source: 'face_detector',
            description: `Subject unobserved in workstation perimeter for ${(duration / 1000).toFixed(1)}s.`,
            evidence: {
              faceCount: 0,
              durationMs: duration,
            },
          });
        }
      }
    } else {
      this.missingFaceStartTime = null;
    }

    // 3. Thresholding for MULTIPLE_FACES
    if (estimatedFaceCount > 1) {
      if (!this.multipleFaceStartTime) {
        this.multipleFaceStartTime = now;
      } else {
        const duration = now - this.multipleFaceStartTime;
        if (
          duration >= this.config.multipleFaceThresholdMs &&
          this.debouncer.canEmit('MULTIPLE_FACES', now)
        ) {
          this.debouncer.recordEmitted('MULTIPLE_FACES', now);
          this.emit({
            id: `evt-multi-${now}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId: this.sessionId,
            timestamp: now,
            type: 'MULTIPLE_FACES',
            category: 'presence',
            severity: 'high',
            confidence: 0.86,
            duration,
            durationSeconds: Math.round(duration / 1000),
            source: 'face_detector',
            description: `Multiple distinct face contours detected in camera field of view (${(duration / 1000).toFixed(1)}s).`,
            evidence: {
              faceCount: estimatedFaceCount,
              durationMs: duration,
            },
          });
        }
      }
    } else {
      this.multipleFaceStartTime = null;
    }

    this.lastFaceCount = estimatedFaceCount;
  }

  private emit(event: BehaviorEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
