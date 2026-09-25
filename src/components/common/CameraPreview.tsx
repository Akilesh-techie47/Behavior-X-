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

  const isLive = cameraState.status === 'active' && !!cameraState.stream;

  /* Compact variant — used where the feed only needs to be present, not inspected. */
  if (minimal) {
    return (
      <div
        className={`relative overflow-hidden rounded-md bg-slate-900 border border-slate-800 aspect-video ${className}`}
      >
        {isLive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
            aria-label="Student camera preview"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-3 text-center">
            <CameraOff className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] text-slate-400">Camera offline</span>
            {onRequestCamera && (
              <button
                onClick={onRequestCamera}
                className="text-[11px] font-medium text-slate-200 underline underline-offset-2 hover:text-white"
              >
                Reconnect
              </button>
            )}
          </div>
        )}
        <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-[3px] bg-slate-950/70 ring-1 ring-inset ring-white/10 text-[10px] font-medium text-white">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span>Transient RAM · 0ms retention</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center aspect-video ${className}`}
    >
      {isLive ? (
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
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
              {/* Status rail */}
              <div className="flex items-start justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-slate-950/70 ring-1 ring-inset ring-white/10 text-[11px] font-medium text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Edge telemetry active</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-slate-950/70 ring-1 ring-inset ring-white/10 text-[11px] font-medium text-slate-200">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>0ms video storage</span>
                </div>
              </div>

              {/* Framing guide */}
              <div className="self-center w-40 h-48 sm:w-44 sm:h-52 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2.5">
                <div className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-medium tracking-[0.08em] text-white/50">
                  FACE
                </div>
                <span className="text-[10px] font-medium tracking-[0.08em] text-white/50 uppercase">
                  Subject perimeter
                </span>
              </div>

              {/* Telemetry footer */}
              <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-[4px] bg-slate-950/60 ring-1 ring-inset ring-white/5 data text-[10px] text-slate-300">
                <span>FPS 15 · volatile canvas</span>
                <span>Biometrics disabled</span>
              </div>
            </div>
          )}
        </>
      ) : cameraState.status === 'requesting' ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
          <div className="space-y-1.5">
            <h4 className="font-medium text-white text-sm">Requesting camera sensor</h4>
            <p className="text-[13px] text-slate-400 max-w-xs leading-relaxed">
              Please grant browser permission to initialize transient edge telemetry.
            </p>
          </div>
        </div>
      ) : cameraState.status === 'denied' ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <div className="space-y-1.5">
            <h4 className="font-medium text-white text-sm">Sensor unavailable</h4>
            <p className="text-[13px] text-slate-400 max-w-xs leading-relaxed">
              {cameraState.errorMessage || 'Camera access was blocked by system settings or browser permissions.'}
            </p>
          </div>
          {onRequestCamera && (
            <Button variant="primary" size="sm" onClick={onRequestCamera}>
              Retry sensor permission
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <CameraOff className="w-5 h-5 text-slate-400" />
          <div className="space-y-1.5">
            <h4 className="font-medium text-white text-sm">Optical ingestion standby</h4>
            <p className="text-[13px] text-slate-400 max-w-xs leading-relaxed">
              Camera will only activate during exam questions. Raw frames are never recorded or saved.
            </p>
          </div>
          {onRequestCamera && (
            <Button variant="primary" size="sm" onClick={onRequestCamera}>
              Initialize edge camera
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
