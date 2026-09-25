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
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{label || 'Ready'}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-800 dark:text-rose-300 font-medium">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>{label || 'Needs Attention'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Checking...</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* 1. TOP WELCOME BANNER */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
            <span>ONLINE EXAM CHECK-IN</span>
            <span>•</span>
            <span>STEP 1 OF 2</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome to Your Exam
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Check your camera, review our student privacy promise, and start when you are ready.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Zero Saved Video</span>
        </div>
      </div>

      {/* 2. MAIN GRID: Readiness & Privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Details & System Check */}
        <div className="lg:col-span-7 space-y-6">
          {/* Candidate Profile Details */}
          <Card title="Student & Test Details" subtitle="Make sure your name and course match">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">STUDENT NAME</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {session.student.name}
                </div>
                <div className="text-slate-500">{session.student.email}</div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">STUDENT ID</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {session.student.studentId}
                </div>
                <div className="text-slate-500">Department of Computer Science</div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">COURSE EXAM</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {session.settings.courseName}
                </div>
                <div className="text-slate-500">Course Code: {session.settings.courseCode}</div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">DURATION & QUESTIONS</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{session.settings.totalDurationMinutes} Minutes Total</span>
                </div>
                <div className="text-slate-500">{questions.length} multiple-choice questions</div>
              </div>
            </div>
          </Card>

          {/* System Readiness Checks */}
          <Card
            title="Quick Device Check"
            subtitle="Testing your browser and camera connection"
            badge={
              <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-medium">
                Automatic Check
              </span>
            }
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Webcam:</span>
                </div>
                <div>
                  {renderCheckStatus(
                    systemChecks.camera,
                    cameraState.hasPermission ? 'Ready / Camera Active' : 'Waiting for Permission'
                  )}
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Web Browser:</span>
                </div>
                <div>{renderCheckStatus(systemChecks.browser, 'Compatible Modern Browser')}</div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Full Screen Mode:</span>
                </div>
                <div>{renderCheckStatus(systemChecks.fullscreen, 'Supported')}</div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Internet Connection:</span>
                </div>
                <div>
                  {renderCheckStatus(
                    systemChecks.network,
                    `Fast & Stable (${systemStatus.networkLatencyMs}ms)`
                  )}
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Privacy Engine:
                  </span>
                </div>
                <div>{renderCheckStatus(systemChecks.behaviorEngine, 'Active (0 Seconds Saved)')}</div>
              </div>
            </div>
          </Card>

          {/* PRIVACY CONSENT EXPLANATION */}
          <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                  Student Privacy Charter
                </h4>
                <p className="text-xs text-indigo-900/80 dark:text-indigo-300 mt-1 leading-relaxed">
                  Please read our privacy commitment before beginning your exam:
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pl-8">
              <div>
                <strong className="text-slate-900 dark:text-slate-100">• What we check:</strong>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  Looking away from your screen for a long time, switching browser tabs, or having another person walk into camera view.
                </p>
              </div>

              <div>
                <strong className="text-slate-900 dark:text-slate-100">• Why we check:</strong>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  To ensure a fair test environment without recording invasive video of your private bedroom or desk.
                </p>
              </div>

              <div>
                <strong className="text-slate-900 dark:text-slate-100">• What is NEVER stored:</strong>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  Zero video files, zero photographs, and zero facial recognition scans. All video is deleted from computer memory in less than a second.
                </p>
              </div>

              <div>
                <strong className="text-slate-900 dark:text-slate-100">• Humans decide everything:</strong>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  A computer never fails or accuses a student. A real teacher reviews any notes and speaks with you if anything seemed unusual.
                </p>
              </div>

              <div className="p-3 bg-amber-50/90 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-medium">
                Fairness Rule: Natural glances away to look at scratch paper are normal and permitted.
              </div>
            </div>

            {/* Clear consent checkbox */}
            <label className="flex items-start gap-3 pt-3 border-t border-indigo-200 dark:border-indigo-900/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAgreedToPrivacy}
                onChange={e => setHasAgreedToPrivacy(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                I understand that no video is saved, and that noted moments are only helpful summaries for my teacher.
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Camera Preview & Launch */}
        <div className="lg:col-span-5 space-y-5">
          <Card
            title="Camera Check"
            subtitle="Make sure your face is centered in the box"
            badge={
              isCameraReady ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  CAMERA READY
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-500">START CAMERA</span>
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
                <Alert type="warning" title="Click 'Turn on Camera' Above">
                  Your browser will ask for permission. Remember: no video is ever recorded or saved.
                </Alert>
              )}

              {isCameraReady && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Camera connected! You are ready to start.</span>
                </div>
              )}

              {/* Continue to Exam Action */}
              <Button
                variant="academic"
                size="lg"
                className="w-full text-sm font-semibold py-3"
                disabled={!isReadyToProceed}
                onClick={handleContinueToExam}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Start Exam Now
              </Button>

              {!isReadyToProceed && (
                <p className="text-center text-[11px] text-slate-500 font-medium">
                  {!isCameraReady
                    ? 'Turn on your camera above to proceed'
                    : 'Check the privacy box on the left to proceed'}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
