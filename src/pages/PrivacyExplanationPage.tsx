import React from 'react';
import { ShieldCheck, EyeOff, Lock, ServerOff, ArrowRight, Layers } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BrowserIntegrityService } from '../engine/security/BrowserIntegrityService';

export const PrivacyExplanationPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const browserCapabilities = BrowserIntegrityService.getCapabilities();

  const guarantees = [
    {
      icon: <ServerOff className="w-4 h-4" />,
      title: 'Zero video storage',
      subtitle: 'Ephemeral RAM buffer (0ms)',
      body: 'Conventional proctoring tools upload and store hours of candidate home footage. Behavior-X processes optical frames strictly inside volatile browser memory, purging each frame immediately upon computing geometric orientation vectors.',
    },
    {
      icon: <EyeOff className="w-4 h-4" />,
      title: 'No biometric identity',
      subtitle: 'Non-invasive sensory telemetry',
      body: 'We do not store biometric facial templates, query identity registries, or infer sensitive demographic characteristics such as race, ethnicity, medical conditions, or emotional states.',
    },
    {
      icon: <Lock className="w-4 h-4" />,
      title: 'Explainable evidence',
      subtitle: 'Human examiner primacy',
      body: 'The platform emits an inspectable review priority index, never an accusation of guilt. Only authorized human examiners evaluate evidence graphs with full counterfactual traceability.',
    },
  ];

  const profiles = [
    {
      label: 'Profile 01',
      name: 'Standard',
      body: 'Browser visibility, window focus events, response timing, and question navigation. Optical sensor inactive.',
      active: false,
    },
    {
      label: 'Profile 02 · Default',
      name: 'Behavioral',
      body: 'Standard + on-device optical orientation, face presence, keystroke dynamics, and mouse velocity tracking.',
      active: true,
    },
    {
      label: 'Profile 03',
      name: 'Enhanced',
      body: 'Behavioral + AI-era interaction pattern detection, clipboard analysis, and temporal sequence cross-correlation.',
      active: false,
    },
  ];

  const statusTone = (status: string) => {
    if (status === 'SUPPORTED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'PARTIAL' || status === 'SIMULATION ONLY')
      return 'bg-amber-50 text-amber-900 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200 border-dashed';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-10 space-y-8">
      {/* 1. Page header */}
      <div className="space-y-3 pb-6 border-b border-slate-200">
        <p className="eyebrow inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Behavioral integrity architecture · 0ms video persistence
        </p>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.025em] text-slate-900 max-w-2xl">
          Ethical, transparent, and explainable architecture
        </h1>
        <p className="text-[14px] text-slate-600 max-w-2xl leading-relaxed">
          How Behavior-X transforms raw behavioral telemetry into structured causal evidence without
          invasive surveillance, biometric harvesting, or automated punishment.
        </p>
      </div>

      {/* 2. Core guarantees */}
      <div className="panel overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <span className="eyebrow text-slate-700">Core architectural guarantees</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-slate-200">
          {guarantees.map(g => (
            <div key={g.title} className="px-5 sm:px-6 py-5">
              <span className="inline-grid place-items-center w-8 h-8 rounded-md bg-slate-100 text-slate-600 mb-3.5">
                {g.icon}
              </span>
              <h2 className="text-[15px] font-semibold text-slate-900 tracking-[-0.01em]">
                {g.title}
              </h2>
              <p className="text-[12.5px] text-slate-500 mt-1">{g.subtitle}</p>
              <p className="text-[13px] text-slate-600 leading-relaxed mt-3">{g.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Browser capability matrix */}
      <Card
        title="Deterministic browser capability matrix"
        subtitle="Verifiable web APIs versus OS-level limitations"
        badge={
          <span className="hidden sm:inline text-[12px] text-slate-500 whitespace-nowrap">
            Live probe
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table w-full text-left">
            <thead>
              <tr>
                <th className="pb-2.5 pr-4">Capability</th>
                <th className="pb-2.5 px-4">Browser status</th>
                <th className="pb-2.5 pl-4">Implementation notes</th>
              </tr>
            </thead>
            <tbody>
              {browserCapabilities.map((cap, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 pr-4 text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    {cap.name}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-[4px] border text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap ${statusTone(
                        cap.status
                      )}`}
                    >
                      {cap.status}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-[12.5px] text-slate-600 leading-relaxed">
                    {cap.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Monitoring profiles */}
      <Card
        title="Institution monitoring profiles"
        subtitle="Granular telemetry controls configured by academic administrators"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {profiles.map(p => (
            <div
              key={p.name}
              className={`rounded-md border px-4 py-4 ${
                p.active
                  ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-600/15'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow">{p.label}</span>
                {p.active && (
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-brand-700">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[15px] font-semibold text-slate-900 mt-1.5">{p.name}</div>
              <p className="text-[12.5px] text-slate-600 leading-relaxed mt-2">{p.body}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Call to action */}
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border-slate-900 text-white">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">Experience behavioral examination intelligence</h2>
          <p className="text-[13px] text-slate-400 mt-1">
            Observe how raw telemetry transforms into inspectable evidence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="academic"
            size="md"
            onClick={() => onNavigate('/demo')}
            icon={<Layers className="w-4 h-4" />}
          >
            Launch demo lab
          </Button>
          <Button
            variant="onDark"
            size="md"
            onClick={() => onNavigate('/examiner')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Examiner console
          </Button>
        </div>
      </div>
    </div>
  );
};
