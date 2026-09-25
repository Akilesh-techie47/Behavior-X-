import React from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, ServerOff, Database, Cpu, CheckCircle2, Sliders, AlertCircle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BrowserIntegrityService } from '../engine/security/BrowserIntegrityService';

export const PrivacyExplanationPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const browserCapabilities = BrowserIntegrityService.getCapabilities();

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 font-sans">
      {/* Page Title */}
      <div className="border-b border-neutral-300 dark:border-neutral-700 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-850 text-[10px] font-mono uppercase text-neutral-900 dark:text-neutral-100 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>BEHAVIORAL INTEGRITY ARCHITECTURE • 0MS VIDEO PERSISTENCE</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 font-mono uppercase">
          Ethical, Transparent & Explainable Architecture
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
          How Behavior-X transforms raw behavioral telemetry into structured causal evidence without invasive surveillance, biometric harvesting, or automated punishment.
        </p>
      </div>

      {/* Core Architectural Guarantees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card
          title="Zero Video Storage"
          subtitle="Ephemeral RAM buffer (0ms)"
          badge={<ServerOff className="w-4 h-4 text-neutral-950 dark:text-neutral-50" />}
        >
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
            Conventional proctoring tools upload and store hours of candidate home footage. Behavior-X processes optical frames strictly inside volatile browser memory, purging each frame immediately upon computing geometric orientation vectors.
          </p>
        </Card>

        <Card
          title="No Biometric Identity"
          subtitle="Non-invasive sensory telemetry"
          badge={<EyeOff className="w-4 h-4 text-neutral-950 dark:text-neutral-50" />}
        >
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
            We do not store biometric facial templates, query identity registries, or infer sensitive demographic characteristics such as race, ethnicity, medical conditions, or emotional states.
          </p>
        </Card>

        <Card
          title="Explainable Evidence"
          subtitle="Human examiner primacy"
          badge={<Lock className="w-4 h-4 text-neutral-950 dark:text-neutral-50" />}
        >
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
            The platform emits an inspectable review priority index, never an accusation of guilt. Only authorized human examiners evaluate evidence graphs with full counterfactual traceability.
          </p>
        </Card>
      </div>

      {/* Honest Browser Capability Matrix */}
      <Card
        title="Deterministic Browser Capability Matrix"
        subtitle="Transparent boundary between verifiable web APIs and OS-level limitations"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-neutral-300 dark:border-neutral-700 text-left text-neutral-500 uppercase text-[10px]">
                <th className="py-2.5 pr-4">Capability</th>
                <th className="py-2.5 px-4">Browser Status</th>
                <th className="py-2.5 pl-4">Implementation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {browserCapabilities.map((cap, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="py-2.5 pr-4 font-bold text-neutral-950 dark:text-neutral-50">{cap.name}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 border text-[10px] uppercase font-bold ${
                        cap.status === 'SUPPORTED'
                          ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-black'
                          : cap.status === 'PARTIAL' || cap.status === 'SIMULATION ONLY'
                          ? 'border-neutral-500 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                          : 'border-dashed border-neutral-400 text-neutral-500 bg-transparent'
                      }`}
                    >
                      {cap.status}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-neutral-600 dark:text-neutral-400">{cap.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Configurable Monitoring Profiles */}
      <Card
        title="Institution Monitoring Profiles"
        subtitle="Granular telemetry controls configured by academic administrators"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase">Profile 01</span>
            <div className="text-sm font-bold text-neutral-950 dark:text-neutral-50 uppercase">STANDARD</div>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
              Browser visibility, window focus events, response timing, and question navigation. Optical sensor inactive.
            </p>
          </div>

          <div className="p-4 border border-neutral-950 dark:border-neutral-50 bg-neutral-100 dark:bg-neutral-900 space-y-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase">Profile 02 (Default)</span>
            <div className="text-sm font-bold text-neutral-950 dark:text-neutral-50 uppercase">BEHAVIORAL</div>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
              Standard + On-device optical orientation, face presence, keystroke dynamics, and mouse velocity tracking.
            </p>
          </div>

          <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase">Profile 03</span>
            <div className="text-sm font-bold text-neutral-950 dark:text-neutral-50 uppercase">ENHANCED</div>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
              Behavioral + AI-era interaction pattern detection, clipboard analysis, and temporal sequence cross-correlation.
            </p>
          </div>
        </div>
      </Card>

      {/* Call to Action */}
      <div className="flex flex-wrap items-center justify-between p-5 border border-neutral-950 dark:border-neutral-50 bg-neutral-950 text-white gap-4">
        <div>
          <h4 className="text-sm font-bold font-mono uppercase text-white">Experience Behavioral Examination Intelligence</h4>
          <p className="text-xs text-neutral-400 font-mono">Observe how telemetry transforms into explainable evidence.</p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="academic"
            size="md"
            onClick={() => onNavigate('/demo')}
          >
            Launch Demo Lab
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigate('/examiner')}
            className="text-white border-neutral-700 hover:bg-neutral-900"
          >
            Examiner Console
          </Button>
        </div>
      </div>
    </div>
  );
};
