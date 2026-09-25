import React, { useRef, useEffect } from 'react';
import { Camera, CameraOff, Shield, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      <div className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video shadow-md ${className}`}>
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
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-500 text-center">
            <CameraOff className="w-6 h-6 mb-1 text-slate-600" />
            <span className="text-[10px] tracking-tight">Camera Inactive</span>
            {onRequestCamera && (
              <button
                onClick={onRequestCamera}
                className="mt-1 text-[10px] text-indigo-400 hover:underline"
              >
                Reconnect
              </button>
            )}
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono text-emerald-400 border border-emerald-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>RAM ONLY • 0ms RETENTION</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center justify-center aspect-video ${className}`}
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
            <div className="absolute inset-0 pointer-events-none border border-slate-700/40 rounded-2xl flex flex-col justify-between p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-xs font-mono text-emerald-400 border border-emerald-800/40 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>EDGE TELEMETRY: ACTIVE</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-xs text-slate-300 border border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>No Video Stored</span>
                </div>
              </div>

              {/* Subdued perimeter target bounding guide for clear student framing */}
              <div className="self-center w-52 h-60 border-2 border-dashed border-indigo-400/50 rounded-3xl flex flex-col items-center justify-center gap-2 bg-indigo-950/10 backdrop-blur-[1px]">
                <div className="w-16 h-16 rounded-full border border-indigo-400/40 flex items-center justify-center text-indigo-300/60 font-mono text-xs">
                  FACE
                </div>
                <span className="text-[11px] font-mono text-indigo-200/80 tracking-wider font-semibold">
                  CENTER FRAMING
                </span>
                <span className="text-[9px] text-slate-400 max-w-[130px] text-center">
                  Position head and eyes in this central area
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/85 px-3 py-1.5 rounded-md border border-slate-800">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sensor Framing Clear
                </span>
                <span className="text-slate-500">640x480 @ 30 FPS</span>
              </div>
            </div>
          )}
        </>
      ) : cameraState.status === 'requesting' ? (
        <div className="text-center p-6 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-200">Accessing Camera Sensor...</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Please approve the camera permission prompt appearing in your browser address bar.
          </p>
        </div>
      ) : cameraState.status === 'denied' ? (
        <div className="text-center p-6 flex flex-col items-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mb-3">
            <CameraOff className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Camera Unavailable or Denied</h4>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {cameraState.errorMessage ||
              'Behavior-X requires client-side camera access to verify presence during the examination. Video frames are processed in volatile RAM only.'}
          </p>
          {onRequestCamera && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                onClick={onRequestCamera}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Camera Connection
              </Button>
              <span className="text-[10px] text-slate-500">
                Tip: If permission was blocked, click the lock icon in your browser URL bar to allow.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-6 flex flex-col items-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center justify-center mb-3">
            <Camera className="w-6 h-6 text-indigo-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Camera Sensor Standby</h4>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Local browser camera access is needed for framing verification before the exam begins.
          </p>
          {onRequestCamera && (
            <Button
              variant="primary"
              size="sm"
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={onRequestCamera}
              icon={<Camera className="w-3.5 h-3.5" />}
            >
              Initialize Camera Preview
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
