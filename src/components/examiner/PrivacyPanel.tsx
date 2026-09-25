import React, { useState } from 'react';
import {
  ShieldCheck,
  ServerOff,
  EyeOff,
  Lock,
  Database,
  Trash2,
  Cpu,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PrivacyState } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const defaultPrivacyState: PrivacyState = {
  cameraProcessing: 'transient_ram_canvas',
  rawVideoStorage: 'disabled_enforced',
  biometricIdentification: 'disabled_no_embeddings',
  eventStorage: 'session_limited_telemetry',
  retentionPolicy: {
    rawVideo: 'never_stored_0ms',
    behaviorEvents: 'session_limited_auto_purge',
    aggregatedReport: 'retained_audit_policy',
    maxRetentionDays: 30,
  },
  dataMinimizationVerified: true,
};

interface PrivacyPanelProps {
  privacyState?: PrivacyState;
  className?: string;
}

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({
  privacyState = defaultPrivacyState,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card
        title="Privacy Architecture & Data Minimization"
        subtitle="Technical enforcement parameters for ethical exam proctoring"
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
            HARDWARE & RAM CONSTRAINTS ENFORCED
          </span>
        }
        className={className}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<Info className="w-3.5 h-3.5" />}
          >
            Explain Privacy Model
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Raw Video Storage */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ServerOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                Raw Video Storage
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                Not Enabled (0ms RAM)
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Camera frames discarded immediately after geometry vector extraction.
              </p>
            </div>
          </div>

          {/* 2. Behavioral Events */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                Behavioral Events
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                Enabled (Structured Telemetry)
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Mathematical indicators (timestamps, event type, duration).
              </p>
            </div>
          </div>

          {/* 3. Student Identity */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                Student Identity
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                Minimized (ID Token Only)
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                No biometric IDs, phone numbers, or residential data collected.
              </p>
            </div>
          </div>

          {/* 4. Biometric Identification */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                Biometric Identification
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                Disabled (No Face Vectors)
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Zero facial recognition embedding databases or demographic profiling.
              </p>
            </div>
          </div>
        </div>

        {/* Retention Policy Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>
              DATA RETENTION: Events purged post-exam ({privacyState.retentionPolicy.maxRetentionDays} days maximum for board appeals).
            </span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Principles of Data Minimization Validated
          </span>
        </div>
      </Card>

      {/* Explanatory Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Behavior-X Technical Privacy Guarantees"
        subtitle="Design around data minimization and privacy-preserving processing principles"
        maxWidth="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
            Close Inspector
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl space-y-1">
            <h4 className="font-bold text-indigo-950 dark:text-indigo-200">
              1. Transient In-Memory Optical Ingestion
            </h4>
            <p className="text-indigo-900/80 dark:text-indigo-300/80 text-[11px]">
              The user camera stream exists solely inside client-side browser RAM for under 100ms. It is sampled at low resolution (160x120), spatial orientation deltas are calculated, and the frame is immediately dereferenced for garbage collection.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-slate-900 dark:text-white">
              2. What Behavior-X Collects vs. Discards
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block mb-1">COLLECTED (MINIMAL):</span>
                <ul className="list-disc pl-3 space-y-0.5">
                  <li>Event type (e.g. WINDOW_BLUR)</li>
                  <li>Duration in milliseconds</li>
                  <li>Approximate yaw/pitch angles</li>
                  <li>Active question index</li>
                </ul>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                <span className="font-bold block mb-1">STRICTLY DISCARDED:</span>
                <ul className="list-disc pl-3 space-y-0.5">
                  <li>Raw video recordings</li>
                  <li>Continuous screenshots</li>
                  <li>Facial identity vectors</li>
                  <li>Voice audio recordings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-500">
            <strong className="text-slate-700 dark:text-slate-300">Human-In-The-Loop Principle:</strong>
            <p>
              The system calculates an attention review priority score. It never reaches an accusation of guilt. Certified academic examiners review timestamped signal evidence before making any decisions.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
