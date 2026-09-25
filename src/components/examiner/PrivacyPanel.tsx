import React, { useState } from 'react';
import { ServerOff, EyeOff, Cpu, Trash2, Info } from 'lucide-react';
import { PrivacyState, MonitoringProfile } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
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

const PILLARS = [
  {
    icon: <ServerOff className="w-4 h-4" />,
    label: 'Raw video storage',
    value: 'Disabled (0ms RAM)',
    note: 'Video frames discarded from volatile canvas memory in under 100ms.',
  },
  {
    icon: <EyeOff className="w-4 h-4" />,
    label: 'Facial biometrics',
    value: 'Disabled (no vectors)',
    note: 'No facial recognition, embeddings, or demographic classifications.',
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    label: 'Observable events',
    value: 'Structured signals',
    note: 'Physical cues (timestamps, focus, head pose proxy) retained for human review.',
  },
  {
    icon: <Trash2 className="w-4 h-4" />,
    label: 'Session auto-purge',
    value: '30-day audit purge',
    note: 'Session telemetry automatically purged after the university appeal period.',
  },
];

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({
  privacyState = defaultPrivacyState,
  className = '',
  onProfileChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const capabilities = browserIntegrityService.evaluateBrowserCapabilities();

  const statusTone = (status: string) => {
    if (status === 'SUPPORTED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'PARTIAL') return 'bg-amber-50 text-amber-900 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200 border-dashed';
  };

  return (
    <>
      <Card
        title="Privacy architecture & monitoring profile"
        subtitle="Transient RAM constraints with verified zero raw video retention"
        badge={<StatusBadge status="Edge enforced · 0ms" variant="nominal" size="sm" />}
        className={className}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<Info className="w-3.5 h-3.5" />}
          >
            Capability matrix
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Monitoring profile selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <span className="eyebrow">Active institutional monitoring profile</span>
              <div className="mt-1 text-[14px] font-semibold text-slate-900">
                {privacyState.monitoringProfile || 'BEHAVIORAL'} monitoring
              </div>
            </div>

            {onProfileChange && (
              <div className="flex items-center gap-1.5">
                {(['STANDARD', 'BEHAVIORAL', 'ENHANCED'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => onProfileChange(p)}
                    aria-pressed={privacyState.monitoringProfile === p}
                    className={`h-7 px-2.5 rounded-md text-[11.5px] font-medium transition-colors ${
                      privacyState.monitoringProfile === p
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Architectural pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PILLARS.map(pillar => (
              <div
                key={pillar.label}
                className="panel-inset bg-white px-3.5 py-3.5 flex items-start gap-2.5"
              >
                <span className="inline-grid place-items-center w-7 h-7 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  {pillar.icon}
                </span>
                <div className="min-w-0">
                  <span className="eyebrow">{pillar.label}</span>
                  <div className="text-[12.5px] font-semibold text-slate-900 mt-0.5">
                    {pillar.value}
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-snug mt-1">{pillar.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Browser capability matrix modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Browser capability transparency matrix"
        subtitle="Observable browser telemetry versus sandboxed OS boundaries"
        maxWidth="xl"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
            Close matrix
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-slate-600 leading-relaxed">
            In accordance with Rule 5 (Browser Limitations), Behavior-X never claims to detect
            OS-level background applications or arbitrary screen-recording tools that browser
            security sandboxes legitimately isolate.
          </p>

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="data-table w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2.5 pr-3">Capability / API</th>
                  <th className="pb-2.5 px-3">Status</th>
                  <th className="pb-2.5 pl-3">Implementation notes</th>
                </tr>
              </thead>
              <tbody>
                {capabilities.map(cap => (
                  <tr key={cap.id}>
                    <td className="py-2.5 pr-3 text-[12.5px] font-medium text-slate-900 whitespace-nowrap">
                      {cap.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-[4px] border text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap ${statusTone(
                          cap.status
                        )}`}
                      >
                        {cap.status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-[12px] text-slate-600 leading-relaxed">
                      {cap.notes}
                    </td>
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
