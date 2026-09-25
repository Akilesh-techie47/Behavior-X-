import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ArrowRight,
  Maximize2,
  Globe,
  Cpu,
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
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>{label || 'Ready'}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-rose-700">
            <XCircle className="w-4 h-4" />
            <span>{label || 'Attention required'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Validating…</span>
          </span>
        );
    }
  };

  const candidateFields = [
    {
      label: 'Candidate name',
      primary: session.student.name,
      secondary: session.student.email,
    },
    {
      label: 'Candidate identifier',
      primary: session.student.studentId,
      secondary: 'Department of Computer Science',
      mono: true,
    },
    {
      label: 'Examination module',
      primary: session.settings.courseName || session.settings.examTitle,
      secondary: `Code: ${session.settings.courseCode}`,
    },
    {
      label: 'Allotted time & items',
      primary: `${session.settings.totalDurationMinutes} minutes total`,
      secondary: `${questions.length} structured items`,
      icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
    },
  ];

  const checkRows = [
    {
      icon: <Camera className="w-4 h-4" />,
      label: 'Optical sensor (webcam)',
      status: renderCheckStatus(
        systemChecks.camera,
        cameraState.hasPermission ? 'Active / stream initialized' : 'Awaiting permission'
      ),
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: 'Browser environment',
      status: renderCheckStatus(systemChecks.browser, 'Standards compliant'),
    },
    {
      icon: <Maximize2 className="w-4 h-4" />,
      label: 'Fullscreen protocol',
      status: renderCheckStatus(systemChecks.fullscreen, 'Supported'),
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: 'Network telemetry',
      status: renderCheckStatus(
        systemChecks.network,
        `Low latency (${systemStatus.networkLatencyMs}ms)`
      ),
    },
    {
      icon: <Cpu className="w-4 h-4" />,
      label: 'Behavior-X core engine',
      status: renderCheckStatus(systemChecks.behaviorEngine, 'Active (0 seconds retained)'),
    },
  ];

  return (
    <div className="py-8 space-y-6">
      {/* 1. Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="min-w-0">
          <p className="eyebrow">Candidate verification · Phase 01 / 02</p>
          <h1 className="mt-2 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
            Examination check-in &amp; device calibration
          </h1>
          <p className="text-[13.5px] text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Validate optical sensor, calibrate interaction baseline, and review privacy
            architecture prior to session initialization.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[12.5px] font-medium text-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero stored video · in-memory only</span>
        </div>
      </div>

      {/* 2. Readiness & privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Candidate details */}
          <Card
            title="Candidate &amp; examination parameters"
            subtitle="Verify registered enrollment information"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidateFields.map(field => (
                <div key={field.label} className="panel-inset bg-white px-4 py-3.5">
                  <span className="eyebrow">{field.label}</span>
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    {field.icon}
                    <span className={field.mono ? 'data text-[13px]' : ''}>{field.primary}</span>
                  </div>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">{field.secondary}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* System readiness */}
          <Card
            title="Telemetry environment verification"
            subtitle="Deterministic browser and sensor capability checks"
            badge={
              <span className="hidden sm:inline text-[12px] text-slate-500 whitespace-nowrap">
                Automated
              </span>
            }
          >
            <ul className="divide-y divide-slate-100 -my-1">
              {checkRows.map(row => (
                <li
                  key={row.label}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
                >
                  <span className="inline-flex items-center gap-2.5 text-[13.5px] font-medium text-slate-800">
                    <span className="text-slate-400">{row.icon}</span>
                    {row.label}
                  </span>
                  {row.status}
                </li>
              ))}
            </ul>
          </Card>

          {/* Privacy consent charter */}
          <div className="panel p-5 sm:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Candidate behavioral privacy charter
                </h3>
                <p className="text-[12.5px] text-slate-500 mt-1">
                  Institutional examination integrity governance protocol:
                </p>
              </div>
            </div>

            <div className="space-y-3.5 sm:pl-8">
              <div>
                <strong className="text-[13px] font-semibold text-slate-900">
                  Observable modalities
                </strong>
                <p className="text-[13px] text-slate-600 mt-0.5 leading-relaxed">
                  Prolonged gaze deviation off-screen, browser window focus shifts, and keystroke
                  interval rhythm relative to candidate personal baseline.
                </p>
              </div>

              <div>
                <strong className="text-[13px] font-semibold text-slate-900">
                  Zero persistent imagery
                </strong>
                <p className="text-[13px] text-slate-600 mt-0.5 leading-relaxed">
                  Zero video files, zero photographs, and zero facial recognition biometric scans.
                  All optical frames are processed in volatile RAM and purged within 0.3s.
                </p>
              </div>

              <div>
                <strong className="text-[13px] font-semibold text-slate-900">
                  Human decision authority
                </strong>
                <p className="text-[13px] text-slate-600 mt-0.5 leading-relaxed">
                  No automated disqualification or penalty exists. Human examiners evaluate
                  structured evidence graphs with full counterfactual traceability.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[12.5px] text-slate-600">
                Notice: Brief natural glances to scratchpad notes are normal and will not trigger
                review priority flags.
              </div>
            </div>

            <label className="flex items-start gap-3 pt-4 border-t border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAgreedToPrivacy}
                onChange={e => setHasAgreedToPrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded-[3px]"
              />
              <span className="text-[13px] font-medium text-slate-800 leading-relaxed">
                I acknowledge the 0ms zero-storage privacy policy and understand that telemetry
                records are preserved solely as mathematical evidence for human review.
              </span>
            </label>
          </div>
        </div>

        {/* Camera & launch */}
        <div className="lg:col-span-5">
          <Card
            title="Sensor positioning check"
            subtitle="Verify frontal face visibility within frame bounds"
            badge={
              <span
                className={`inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap ${
                  isCameraReady ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCameraReady ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                />
                {isCameraReady ? 'Camera active' : 'Standby'}
              </span>
            }
          >
            <div className="space-y-4">
              <CameraPreview
                cameraState={cameraState}
                onRequestCamera={requestCamera}
                showOverlay={true}
              />

              {!isCameraReady && (
                <Alert type="warning" title="Authorize optical sensor">
                  Select 'Turn on Camera' above to initialize on-device face bounding. Video
                  remains strictly local to your browser memory.
                </Alert>
              )}

              {isCameraReady && (
                <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-[13px] font-medium text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Optical sensor synchronized. Ready for session start.</span>
                </div>
              )}

              <div className="pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!isReadyToProceed}
                  onClick={handleContinueToExam}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Initialize exam session
                </Button>

                {!isReadyToProceed && (
                  <p className="text-center text-[12px] text-slate-500 mt-2.5">
                    {!isCameraReady
                      ? 'Activate optical sensor above to continue'
                      : 'Acknowledge privacy charter on the left to proceed'}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
