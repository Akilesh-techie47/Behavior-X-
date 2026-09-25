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
  Layers,
} from 'lucide-react';
import { PrivacyState, MonitoringProfile } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { browserIntegrityService } from '../../engine/security/BrowserIntegrityService';

export const defaultPrivacyState: PrivacyState = {
  cameraProcessing: 'transient_ram_canvas',
  rawVideoStorage: 'disabled_enforced',
  biometricIdentification: 'disabled_no_embeddings',
  eventStorage: 'session_limited_telemetry',
  monitoringProfile: 'BEHAVIORAL',
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
  onProfileChange?: (profile: MonitoringProfile) => void;
}

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({
  privacyState = defaultPrivacyState,
  className = '',
  onProfileChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const capabilities = browserIntegrityService.evaluateBrowserCapabilities();

  return (
    <>
      <Card
        title="Privacy Architecture & Configurable Monitoring"
        subtitle="Hardware and transient RAM constraints with verified zero raw video retention"
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 font-bold uppercase tracking-wider">
            TRANSIENT EDGE ENFORCED (0ms)
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
            Browser Capability Matrix
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Monitoring Profile Selector */}
          <div className="p-3.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Active Institutional Monitoring Profile
              </span>
              <strong className="text-sm font-mono text-black dark:text-white">
                {privacyState.monitoringProfile || 'BEHAVIORAL'} MONITORING
              </strong>
            </div>

            {onProfileChange && (
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {(['STANDARD', 'BEHAVIORAL', 'ENHANCED'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => onProfileChange(p)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      privacyState.monitoringProfile === p
                        ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4 Architectural Pillar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Raw Video Storage */}
            <div className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-start gap-3">
              <div className="p-2 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white">
                <ServerOff className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  Raw Video Storage
                </div>
                <div className="font-bold text-neutral-900 dark:text-white mt-0.5">
                  Disabled (0ms RAM)
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                  Video frames discarded from volatile canvas memory in under 100ms.
                </p>
              </div>
            </div>

            {/* 2. Biometric Profiles */}
            <div className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-start gap-3">
              <div className="p-2 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  Facial Biometrics
                </div>
                <div className="font-bold text-neutral-900 dark:text-white mt-0.5">
                  Disabled (No Vectors)
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                  No facial recognition, embeddings, or demographic classifications.
                </p>
              </div>
            </div>

            {/* 3. Behavioral Telemetry */}
            <div className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-start gap-3">
              <div className="p-2 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  Observable Events
                </div>
                <div className="font-bold text-neutral-900 dark:text-white mt-0.5">
                  Structured Signals
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                  Physical cues (timestamps, focus, head pose proxy) retained for human review.
                </p>
              </div>
            </div>

            {/* 4. Auto-Purge Policy */}
            <div className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-start gap-3">
              <div className="p-2 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  Session Auto-Purge
                </div>
                <div className="font-bold text-neutral-900 dark:text-white mt-0.5">
                  30-Day Audit Purge
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                  Session telemetry automatically purged after university appeal period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Browser Capability Matrix Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Browser Capability & Sandbox Transparency Matrix"
        subtitle="Explicit disclosure of observable browser telemetry vs sandboxed OS boundaries"
        maxWidth="xl"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
            Close Capability Matrix
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            In accordance with Rule 5 (Browser Limitations), Behavior-X never claims to detect OS-level background applications or arbitrary screen-recording tools that browser security sandboxes legitimately isolate.
          </p>

          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-md">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 uppercase">
                <tr>
                  <th className="p-2.5">Capability / API</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Technical Implementation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {capabilities.map(cap => (
                  <tr key={cap.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-2.5 font-bold text-black dark:text-white">{cap.name}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] border ${
                        cap.status === 'SUPPORTED'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-800'
                          : cap.status === 'PARTIAL'
                          ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-400'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                      }`}>
                        {cap.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">{cap.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
};
