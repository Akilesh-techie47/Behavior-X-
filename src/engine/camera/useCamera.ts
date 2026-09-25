import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraState, BehaviorEvent } from '../../types';
import { BehaviorEngine } from '../BehaviorEngine';

export interface UseCameraOptions {
  engine?: BehaviorEngine | null;
  sessionId?: string;
  autoStart?: boolean;
  videoConstraints?: MediaTrackConstraints;
  onCameraDisconnected?: (event: BehaviorEvent) => void;
  onCameraError?: (error: Error) => void;
}

export interface UseCameraReturn {
  cameraState: CameraState;
  requestCamera: () => Promise<MediaStream | null>;
  stopCamera: () => void;
  attachVideoElement: (video: HTMLVideoElement | null) => void;
  isSupported: boolean;
}

/**
 * Standard browser API media constraints for privacy-preserving edge observation.
 * Uses 640x480 resolution (optimized for fast edge processing and minimal RAM consumption)
 * and locks to front-facing user camera with audio disabled.
 */
export const DEFAULT_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 15, max: 30 },
    facingMode: 'user',
  },
  audio: false,
};

/**
 * Custom React hook for the Behavior-X engine managing camera lifecycle,
 * enforcing browser media constraints, and emitting 'CAMERA_DISCONNECTED'
 * behavioral telemetry whenever video tracks end or mute unexpectedly.
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    engine,
    sessionId = 'active-session',
    autoStart = false,
    videoConstraints,
    onCameraDisconnected,
    onCameraError,
  } = options;

  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'idle',
    hasPermission: false,
    stream: null,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  // Emit CAMERA_DISCONNECTED behavior event
  const emitDisconnectEvent = useCallback((reason: string) => {
    const disconnectEvent: BehaviorEvent = {
      id: `evt-cam-disc-${Date.now()}`,
      sessionId,
      timestamp: Date.now(),
      type: 'CAMERA_DISCONNECTED',
      category: 'system',
      severity: 'high',
      confidence: 1.0,
      duration: 1000,
      durationSeconds: 1,
      source: 'camera_lifecycle',
      description: `Camera video track was terminated or disconnected (${reason}).`,
      evidence: {
        additionalContext: reason,
      },
    };

    if (engine) {
      engine.handleIncomingEvent(disconnectEvent);
    }

    if (onCameraDisconnected) {
      onCameraDisconnected(disconnectEvent);
    }
  }, [engine, sessionId, onCameraDisconnected]);

  // Clean up existing tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.onended = null;
        track.onmute = null;
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }

    setCameraState({
      status: 'idle',
      hasPermission: false,
      stream: null,
    });
  }, []);

  // Request camera using MediaStreamConstraints
  const requestCamera = useCallback(async (): Promise<MediaStream | null> => {
    if (!isSupported) {
      const err = new Error('Camera API (getUserMedia) is unsupported on this browser.');
      setCameraState({
        status: 'unsupported',
        hasPermission: false,
        stream: null,
        errorMessage: err.message,
      });
      if (onCameraError) onCameraError(err);
      return null;
    }

    setCameraState(prev => ({ ...prev, status: 'requesting' }));

    try {
      const constraints: MediaStreamConstraints = {
        video: videoConstraints || DEFAULT_CAMERA_CONSTRAINTS.video,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Attach lifecycle listeners to each video track
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available on acquired stream.');
      }

      videoTracks.forEach(track => {
        // Track ended (e.g. user revoked permission in browser chrome, device unplugged)
        track.onended = () => {
          setCameraState({
            status: 'denied',
            hasPermission: false,
            stream: null,
            errorMessage: 'Optical sensor was disconnected or closed by system.',
          });
          emitDisconnectEvent('track_ended');
        };

        // Track mute / hardware switch toggled
        track.onmute = () => {
          emitDisconnectEvent('track_muted');
        };
      });

      // Update state
      setCameraState({
        status: 'active',
        hasPermission: true,
        stream,
      });

      // If video element already attached, link stream
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play().catch(() => {});
      }

      // Attach to behavior engine face detector if available
      if (engine && videoElementRef.current) {
        engine.faceDetector.attachVideo(videoElementRef.current);
      }

      return stream;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unable to access camera device.');
      const isPermissionDenied = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';

      setCameraState({
        status: isPermissionDenied ? 'denied' : 'unsupported',
        hasPermission: false,
        stream: null,
        errorMessage: error.message,
      });

      if (onCameraError) onCameraError(error);
      return null;
    }
  }, [isSupported, videoConstraints, emitDisconnectEvent, onCameraError, engine]);

  // Attach video DOM element
  const attachVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoElementRef.current = video;
    if (video) {
      if (streamRef.current) {
        video.srcObject = streamRef.current;
        video.play().catch(() => {});
      }
      if (engine) {
        engine.faceDetector.attachVideo(video);
      }
    }
  }, [engine]);

  // Handle auto-start
  useEffect(() => {
    if (autoStart) {
      requestCamera();
    }

    return () => {
      stopCamera();
    };
  }, [autoStart]);

  return {
    cameraState,
    requestCamera,
    stopCamera,
    attachVideoElement,
    isSupported,
  };
}
