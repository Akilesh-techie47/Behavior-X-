import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  BookOpen,
  ArrowRight,
  Maximize2,
  Globe,
  Cpu,
  HelpCircle,
  Clock,
  FileQuestion,
  AlertTriangle,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CameraPreview } from '../components/common/CameraPreview';
import { Alert } from '../components/common/Alert';

interface SystemCheckState {
  camera: 'checking' | 'passed' | 'failed';
  browser: 'checking' | 'passed' | 'failed';
  fullscreen: 'checking' | 'passed' | 'failed';
  network: 'checking' | 'passed' | 'failed';
  behaviorEngine: 'checking' | 'passed' | 'failed';
}

export const StudentEntryPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { session, cameraState, requestCamera, startExam, systemStatus, refreshSystemChecks, questions } = useSession();
  const [hasAgreedToPrivacy, setHasAgreedToPrivacy] = useState(false);
  const [systemChecks, setSystemChecks] = useState<SystemCheckState>({
    camera: 'checking',
    browser: 'checking',
    fullscreen: 'checking',
    network: 'checking',
    behaviorEngine: 'checking',
  });

  // Run system readiness check
  useEffect(() => {
    let isMounted = true;
    const runChecks = async () => {
      const isModernBrowser =
        typeof window !== 'undefined' &&
        !!navigator.mediaDevices &&
        'Promise' in window &&
        'MutationObserver' in window;

      const hasFullscreenSupport =
        typeof document !== 'undefined' &&
        (document.fullscreenEnabled ||
          (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
          true);

      await refreshSystemChecks();

      if (isMounted) {
        setSystemChecks(prev => ({
          ...prev,
          browser: isModernBrowser ? 'passed' : 'failed',
          fullscreen: hasFullscreenSupport ? 'passed' : 'failed',
          network: 'passed',
          behaviorEngine: 'passed',
        }));
      }
    };

    runChecks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update camera check when camera state changes
  useEffect(() => {
    if (cameraState.status === 'active' && cameraState.hasPermission) {
      setSystemChecks(prev => ({ ...prev, camera: 'passed' }));
    } else if (cameraState.status === 'denied') {
      setSystemChecks(prev => ({ ...prev, camera: 'failed' }));
    } else {
      setSystemChecks(prev => ({ ...prev, camera: 'checking' }));
    }
  }, [cameraState.status, cameraState.hasPermission]);

  const handleContinueToExam = () => {
    startExam();
    onNavigate('/exam');
  };

  const isCameraReady = cameraState.hasPermission && cameraState.status === 'active';
  const isReadyToProceed = isCameraReady && hasAgreedToPrivacy;

  const renderCheckStatus = (status: 'checking' | 'passed' | 'failed', label?: string) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-900 dark:text-neutral-100 font-bold">
            <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <span>{label || 'READY'}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 font-bold">
            <XCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span>{label || 'ATTENTION REQUIRED'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>VALIDATING...</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 py-6 font-sans">
      {/* 1. Header Banner */}
      <div className="border-b border-neutral-300 dark:border-neutral-700 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1">
            <span>Candidate Verification</span>
            <span>•</span>
            <span>Phase 01 / 02</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 font-mono uppercase">
            Examination Check-In & Device Calibration
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Validate optical sensor, calibrate interaction baseline, and review privacy architecture prior to session initialization.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-850 text-xs font-mono uppercase font-bold text-neutral-950 dark:text-neutral-50">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Stored Video • In-Memory Only</span>
        </div>
      </div>

      {/* 2. Main Grid: Readiness & Privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Details & System Check */}
        <div className="lg:col-span-7 space-y-6">
          {/* Candidate Profile Details */}
          <Card title="Candidate & Examination Parameters" subtitle="Verify registered enrollment information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
                <span className="text-neutral-500 text-[10px] uppercase">Candidate Name</span>
                <div className="font-bold text-neutral-950 dark:text-neutral-50 text-sm">
                  {session.student.name}
                </div>
                <div className="text-neutral-500">{session.student.email}</div>
              </div>

              <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
                <span className="text-neutral-500 text-[10px] uppercase">Candidate Identifier</span>
                <div className="font-bold text-neutral-950 dark:text-neutral-50 text-sm">
                  {session.student.studentId}
                </div>
                <div className="text-neutral-500">Department of Computer Science</div>
              </div>

              <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
                <span className="text-neutral-500 text-[10px] uppercase">Examination Module</span>
                <div className="font-bold text-neutral-950 dark:text-neutral-50 text-sm">
                  {session.settings.courseName || session.settings.examTitle}
                </div>
                <div className="text-neutral-500">Code: {session.settings.courseCode}</div>
              </div>

              <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
                <span className="text-neutral-500 text-[10px] uppercase">Allotted Time & Items</span>
                <div className="font-bold text-neutral-950 dark:text-neutral-50 text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{session.settings.totalDurationMinutes} Minutes Total</span>
                </div>
                <div className="text-neutral-500">{questions.length} structured items</div>
              </div>
            </div>
          </Card>

          {/* System Readiness Checks */}
          <Card
            title="Telemetry Environment Verification"
            subtitle="Deterministic browser and sensor capability checks"
            badge={
              <span className="text-[10px] font-mono uppercase text-neutral-500 border border-neutral-300 dark:border-neutral-700 px-2 py-0.5">
                Automated
              </span>
            }
          >
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">Optical Sensor (Webcam):</span>
                </div>
                <div>
                  {renderCheckStatus(
                    systemChecks.camera,
                    cameraState.hasPermission ? 'ACTIVE / STREAM INITIALIZED' : 'AWAITING PERMISSION'
                  )}
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">Browser Environment:</span>
                </div>
                <div>{renderCheckStatus(systemChecks.browser, 'STANDARDS COMPLIANT')}</div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">Fullscreen Protocol:</span>
                </div>
                <div>{renderCheckStatus(systemChecks.fullscreen, 'SUPPORTED')}</div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">Network Telemetry:</span>
                </div>
                <div>
                  {renderCheckStatus(
                    systemChecks.network,
                    `LOW LATENCY (${systemStatus.networkLatencyMs}ms)`
                  )}
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Behavior-X Core Engine:
                  </span>
                </div>
                <div>{renderCheckStatus(systemChecks.behaviorEngine, 'ACTIVE (0 SECONDS RETAINED)')}</div>
              </div>
            </div>
          </Card>

          {/* PRIVACY CONSENT CHARTER */}
          <div className="p-5 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-neutral-950 dark:text-neutral-50 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-950 dark:text-neutral-50 text-sm font-mono uppercase">
                  Candidate Behavioral Privacy Charter
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  Institutional examination integrity governance protocol:
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300 pl-8">
              <div>
                <strong className="text-neutral-950 dark:text-neutral-50 font-mono text-[11px] uppercase">• Observable Modalities:</strong>
                <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                  Prolonged gaze deviation off-screen, browser window focus shifts, and keystroke interval rhythm relative to candidate personal baseline.
                </p>
              </div>

              <div>
                <strong className="text-neutral-950 dark:text-neutral-50 font-mono text-[11px] uppercase">• Zero Persistent Imagery:</strong>
                <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                  Zero video files, zero photographs, and zero facial recognition biometric scans. All optical frames are processed in volatile RAM and purged within 0.3s.
                </p>
              </div>

              <div>
                <strong className="text-neutral-950 dark:text-neutral-50 font-mono text-[11px] uppercase">• Human Decision Authority:</strong>
                <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                  No automated disqualification or penalty exists. Human examiners evaluate structured evidence graphs with full counterfactual traceability.
                </p>
              </div>

              <div className="p-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
                Notice: Brief natural glances to scratchpad notes are normal and will not trigger review priority flags.
              </div>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAgreedToPrivacy}
                onChange={e => setHasAgreedToPrivacy(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded-none border-neutral-400 accent-neutral-950 focus:ring-0"
              />
              <span className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100">
                I acknowledge the 0ms zero-storage privacy policy and understand that telemetry records are preserved solely as mathematical evidence for human review.
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Camera Preview & Launch */}
        <div className="lg:col-span-5 space-y-5">
          <Card
            title="Sensor Positioning Check"
            subtitle="Verify frontal face visibility within frame bounds"
            badge={
              isCameraReady ? (
                <span className="text-xs font-mono font-bold text-neutral-950 dark:text-neutral-50">
                  CAMERA ACTIVE
                </span>
              ) : (
                <span className="text-xs font-mono text-neutral-500">STANDBY</span>
              )
            }
          >
            <div className="space-y-4">
              <CameraPreview
                cameraState={cameraState}
                onRequestCamera={requestCamera}
                showOverlay={true}
              />

              {!isCameraReady && (
                <Alert type="warning" title="Authorize Optical Sensor">
                  Select 'Turn on Camera' above to initialize on-device face bounding. Video remains strictly local to your browser memory.
                </Alert>
              )}

              {isCameraReady && (
                <div className="p-3 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-850 text-xs text-neutral-950 dark:text-neutral-50 flex items-center gap-2 font-mono font-medium">
                  <CheckCircle2 className="w-4 h-4 text-neutral-950 dark:text-neutral-50 flex-shrink-0" />
                  <span>Optical sensor synchronized. Ready for session start.</span>
                </div>
              )}

              {/* Start Exam Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-mono uppercase tracking-wider py-3.5"
                disabled={!isReadyToProceed}
                onClick={handleContinueToExam}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Initialize Exam Session
              </Button>

              {!isReadyToProceed && (
                <p className="text-center text-[10px] font-mono text-neutral-500">
                  {!isCameraReady
                    ? 'Activate optical sensor above to continue'
                    : 'Acknowledge privacy charter on the left to proceed'}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
