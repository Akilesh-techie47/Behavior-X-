import React from 'react';
import {
  ShieldCheck,
  Eye,
  Cpu,
  ArrowRight,
  Activity,
  Lock,
  Sparkles,
  Network,
  Bot,
  Layers,
} from 'lucide-react';
import { Button } from '../components/common/Button';

const MEASUREMENTS = [
  {
    label: 'Review priority',
    value: 74,
    status: 'High review priority',
    description:
      'How strongly the observed multi-signal pattern warrants human academic review.',
  },
  {
    label: 'Evidence quality',
    value: 88,
    status: 'Corroborated evidence',
    description:
      'Confidence and cross-sensor corroboration supporting the observation.',
  },
  {
    label: 'Observation quality',
    value: 94,
    status: 'Optimal sensor pipeline',
    description:
      'Operating stability of camera, environmental lighting, and browser APIs.',
  },
];

const PIPELINE_STEPS = [
  {
    icon: <Eye className="w-4 h-4" />,
    title: 'Ingestion',
    description: 'Camera, screen, keys, cursors',
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    title: '0ms RAM',
    description: 'Zero video stored to disk',
  },
  {
    icon: <Activity className="w-4 h-4" />,
    title: 'Baseline',
    description: 'Session typing & gaze rhythm',
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    title: 'Fusion',
    description: 'Cross-modal synergy engine',
  },
  {
    icon: <Network className="w-4 h-4" />,
    title: 'Evidence',
    description: 'Causal graph & counterfactuals',
  },
  {
    icon: <Bot className="w-4 h-4" />,
    title: 'Gemini AI',
    description: 'Objective natural synthesis',
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    title: 'Human',
    description: 'Examiner sovereign',
    final: true,
  },
];

const PILLARS = [
  {
    icon: <Lock className="w-4 h-4" />,
    title: 'Zero raw video retention (0ms)',
    subtitle: 'RAM-only optical geometry extraction',
    body: 'Frames are processed inside transient RAM for under 100 milliseconds and permanently destroyed. No video recordings, screenshots of rooms, or facial recognition biometric embeddings ever touch permanent storage.',
  },
  {
    icon: <Activity className="w-4 h-4" />,
    title: 'Deterministic temporal fusion',
    subtitle: 'Multi-signal correlation with decay',
    body: 'Individual brief glances are never flagged. Anomaly detection evaluates a continuous sliding 30-second window, personal typing/response baselines, and multi-sensor cross-category synergies before elevating review priorities.',
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    title: 'Non-accusatory AI synthesis',
    subtitle: 'Gemini 3.8 Flash layer + fallback',
    body: 'The system provides certified academic examiners with structured evidence summaries, causal graphs, and counterfactuals. It never accuses or infers student guilt. The certified human examiner remains the sole decision maker.',
  },
];

export const LandingPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="py-10 sm:py-14 space-y-16 sm:space-y-20">
      {/* 1. Hero */}
      <section className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-700" />
          <span className="text-[11px] font-medium uppercase tracking-[0.09em] text-slate-600">
            Multimodal examination integrity platform
          </span>
        </div>

        <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.025em] leading-[1.14] text-slate-900">
          Don't watch the student.
          <br />
          <span className="text-brand-700">Understand the evidence.</span>
        </h1>

        <p className="text-[15px] sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Multimodal examination intelligence that transforms camera telemetry, browser events,
          keystrokes, and question response timing into explainable evidence for human review.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('/demo')}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Launch live demo
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('/examiner')}
            icon={<Layers className="w-4 h-4" />}
          >
            Examiner command center
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onNavigate('/student')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Candidate portal
          </Button>
        </div>
      </section>

      {/* 2. Core measurements — one strip, not three floating cards */}
      <section className="max-w-5xl mx-auto">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-200">
            <span className="eyebrow text-slate-700">The three core measurements</span>
            <span className="text-[12px] text-slate-500">
              Never collapse into a single "cheating score"
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
            {MEASUREMENTS.map(m => (
              <div key={m.label} className="px-5 py-5 sm:px-6">
                <span className="eyebrow">{m.label}</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="data text-[30px] font-semibold leading-none text-slate-900">
                    {m.value}
                  </span>
                  <span className="data text-[12px] text-slate-400">/ 100</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-700" />
                  <span className="text-[12.5px] font-medium text-slate-800">{m.status}</span>
                </div>
                <p className="text-[12.5px] text-slate-500 leading-relaxed mt-2">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Pipeline */}
      <section className="max-w-5xl mx-auto space-y-5">
        <div className="text-center space-y-2">
          <p className="eyebrow">Signal pipeline</p>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-slate-900">
            From edge telemetry to explainable evidence
          </h2>
          <p className="text-[13.5px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            A deterministic chain of custody from raw sensor signal to human reviewer determination.
          </p>
        </div>

        <ol className="panel px-5 sm:px-6 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
          {PIPELINE_STEPS.map((step, idx) => (
            <li key={step.title} className="flex items-start gap-3 py-3.5">
              <span className="data text-[12px] text-slate-300 pt-0.5 w-5 shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div
                  className={`flex items-center gap-2 text-[13.5px] font-medium ${
                    step.final ? 'text-brand-700' : 'text-slate-900'
                  }`}
                >
                  <span className={step.final ? 'text-brand-600' : 'text-slate-400'}>
                    {step.icon}
                  </span>
                  <span>{step.title}</span>
                </div>
                <p className="text-[12.5px] text-slate-500 leading-snug mt-1">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Design principles */}
      <section className="max-w-5xl mx-auto">
        <p className="eyebrow text-center mb-5">Design principles</p>
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-slate-200">
            {PILLARS.map(pillar => (
              <div key={pillar.title} className="px-5 sm:px-6 py-6">
                <span className="inline-grid place-items-center w-8 h-8 rounded-md bg-slate-100 text-slate-600 mb-3.5">
                  {pillar.icon}
                </span>
                <h3 className="text-[15px] font-semibold text-slate-900 tracking-[-0.01em]">
                  {pillar.title}
                </h3>
                <p className="text-[12.5px] text-slate-500 mt-1">{pillar.subtitle}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed mt-3">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
