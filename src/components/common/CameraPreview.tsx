import React, { useRef, useEffect } from 'react';
import { CameraOff, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { CameraState } from '../../types';
import { Button } from './Button';
import { useSession } from '../../context/SessionContext';

interface CameraPreviewProps {
  cameraState: CameraState;
  onRequestCamera?: () => void;
  showOverlay?: boolean;
  minimal?: boolean;
  className?: string;
  mirrored?: boolean;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  cameraState,
  onRequestCamera,
  showOverlay = true,
  minimal = false,
  className = '',
  mirrored = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { attachVideoElement } = useSession();

  useEffect(() => {
    if (videoRef.current && cameraState.stream) {
      videoRef.current.srcObject = cameraState.stream;
      attachVideoElement(videoRef.current);
    }
  }, [cameraState.stream, attachVideoElement]);

  if (minimal) {
    return (
      <div className={`relative rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 aspect-video shadow-xs ${className}`}>
        {cameraState.status === 'active' && cameraState.stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
            aria-label="Student camera preview"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-neutral-400 text-center">
            <CameraOff className="w-5 h-5 mb-1 text-neutral-500" />
            <span className="text-[10px] tracking-tight">Camera Offline</span>
            {onRequestCamera && (
              <button
                onClick={onRequestCamera}
                className="mt-1 text-[10px] text-white underline"
              >
                Reconnect
              </button>
            )}
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-mono text-white border border-neutral-700">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>TRANSIENT RAM • 0ms RETENTION</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 shadow-md flex flex-col items-center justify-center aspect-video ${className}`}
    >
      {cameraState.status === 'active' && cameraState.stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
            aria-label="Active student webcam video preview"
          />
          {showOverlay && (
            <div className="absolute inset-0 pointer-events-none border border-neutral-800 rounded-lg flex flex-col justify-between p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md text-[11px] font-mono text-white border border-neutral-700 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>EDGE TELEMETRY: ACTIVE</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/85 backdrop-blur-md text-[11px] font-mono text-neutral-300 border border-neutral-700">
                  <Shield className="w-3.5 h-3.5 text-white" />
                  <span>0ms Video Storage</span>
                </div>
              </div>

              {/* Subdued perimeter target bounding guide */}
              <div className="self-center w-48 h-56 border border-dashed border-neutral-500/60 rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-[0.5px]">
                <div className="w-14 h-14 rounded-full border border-neutral-400/50 flex items-center justify-center text-neutral-300 font-mono text-xs">
                  FACE
                </div>
                <span className="text-[10px] font-mono text-neutral-300 tracking-wider font-semibold uppercase">
                  Subject Perimeter
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 px-2 py-1 rounded bg-black/75 backdrop-blur-xs">
                <span>FPS: 15 (VOLATILE CANVAS)</span>
                <span>BIOMETRICS: DISABLED</span>
              </div>
            </div>
          )}
        </>
      ) : cameraState.status === 'requesting' ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <RefreshCw className="w-7 h-7 text-white animate-spin" />
          <div className="space-y-1">
            <h4 className="font-semibold text-white text-sm">Requesting Camera Sensor</h4>
            <p className="text-xs text-neutral-400 max-w-xs">
              Please grant browser permission to initialize transient edge telemetry.
            </p>
          </div>
        </div>
      ) : cameraState.status === 'denied' ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm">Sensor Unavailable</h4>
            <p className="text-xs text-neutral-400 max-w-xs">
              {cameraState.errorMessage || 'Camera access was blocked by system settings or browser permissions.'}
            </p>
          </div>
          {onRequestCamera && (
            <Button variant="primary" size="sm" onClick={onRequestCamera}>
              Retry Sensor Permission
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center">
            <CameraOff className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm">Optical Ingestion Standby</h4>
            <p className="text-xs text-neutral-400 max-w-xs">
              Camera will only activate during exam questions. Raw frames are never recorded or saved.
            </p>
          </div>
          {onRequestCamera && (
            <Button variant="primary" size="sm" onClick={onRequestCamera}>
              Initialize Edge Camera
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
