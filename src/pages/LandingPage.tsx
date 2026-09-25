import React from 'react';
import {
  ShieldCheck,
  Eye,
  Cpu,
  ArrowRight,
  Activity,
  Users,
  Lock,
  Sparkles,
  CheckCircle2,
  Network,
  Keyboard,
  MousePointer,
  HelpCircle,
  Scale,
  Bot,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-10">
      {/* 1. HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[11px] font-mono font-bold tracking-wider text-black dark:text-white uppercase shadow-2xs">
          <span>BEHAVIOR-X V2</span>
          <span>•</span>
          <span>MULTIMODAL EXAMINATION INTEGRITY PLATFORM</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black dark:text-white tracking-tight leading-[1.08] font-sans">
          Don't watch the student. <br />
          <span className="underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-8">
            Understand the evidence.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Multimodal examination intelligence that transforms camera telemetry, browser events, keystrokes, and question response timing into explainable evidence for human review.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('/demo')}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Launch Live Demo
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('/examiner')}
            icon={<Layers className="w-4 h-4" />}
          >
            Examiner Command Center
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('/student')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Candidate Portal
          </Button>
        </div>
      </section>

      {/* 2. THE THREE CORE SCORES ARCHITECTURE */}
      <section className="max-w-5xl mx-auto">
        <div className="p-6 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white">
              The Three Core Measurements Architecture
            </span>
            <span className="text-xs font-mono text-neutral-400">
              Never Collapse Into A Single "Cheating Score"
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">
                1. Review Priority
              </span>
              <div className="text-3xl font-black text-black dark:text-white">
                74 <span className="text-xs text-neutral-400 font-normal">/ 100</span>
              </div>
              <span className="text-[11px] font-bold uppercase text-black dark:text-white block">
                HIGH REVIEW PRIORITY
              </span>
              <p className="text-neutral-500 text-[11px] font-sans leading-snug">
                How strongly the observed multi-signal pattern warrants human academic review.
              </p>
            </div>

            <div className="p-4 rounded border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">
                2. Evidence Quality
              </span>
              <div className="text-3xl font-black text-black dark:text-white">
                88 <span className="text-xs text-neutral-400 font-normal">/ 100</span>
              </div>
              <span className="text-[11px] font-bold uppercase text-black dark:text-white block">
                CORROBORATED EVIDENCE
              </span>
              <p className="text-neutral-500 text-[11px] font-sans leading-snug">
                Confidence and cross-sensor corroboration supporting the observation.
              </p>
            </div>

            <div className="p-4 rounded border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">
                3. Observation Quality
              </span>
              <div className="text-3xl font-black text-black dark:text-white">
                94 <span className="text-xs text-neutral-400 font-normal">/ 100</span>
              </div>
              <span className="text-[11px] font-bold uppercase text-black dark:text-white block">
                OPTIMAL SENSOR PIPELINE
              </span>
              <p className="text-neutral-500 text-[11px] font-sans leading-snug">
                Operating stability of camera, environmental lighting, and browser APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MULTIMODAL PIPELINE FLOW */}
      <section className="max-w-5xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
            End-to-End Multimodal Intelligence Pipeline
          </h3>
          <p className="text-sm font-semibold text-black dark:text-white">
            From Edge Telemetry to Explainable Evidence & Human Sovereign Review
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-[11px] text-center">
          <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center gap-1">
            <Eye className="w-4 h-4 text-black dark:text-white" />
            <strong className="text-black dark:text-white">1. Ingestion</strong>
            <span className="text-neutral-500 text-[10px]">Camera, Screen, Keys, Cursors</span>
          </div>

          <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center gap-1">
            <Cpu className="w-4 h-4 text-black dark:text-white" />
            <strong className="text-black dark:text-white">2. 0ms RAM</strong>
            <span className="text-neutral-500 text-[10px]">Zero Video Stored to Disk</span>
          </div>

          <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center gap-1">
            <Activity className="w-4 h-4 text-black dark:text-white" />
            <strong className="text-black dark:text-white">3. Baseline</strong>
            <span className="text-neutral-500 text-[10px]">Session Typing & Gaze Rhythm</span>
          </div>

          <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center gap-1">
            <Sparkles className="w-4 h-4 text-black dark:text-white" />
            <strong className="text-black dark:text-white">4. Fusion</strong>
            <span className="text-neutral-500 text-[10px]">Cross-Modal Synergy Engine</span>
          </div>

          <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center gap-1">
            <Network className="w-4 h-4 text-black dark:text-white" />
            <strong className="text-black dark:text-white">5. Evidence</strong>
            <span className="text-neutral-500 text-[10px]">Causal Graph & Counterfactuals</span>
          </div>

          <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center gap-1">
            <Bot className="w-4 h-4 text-black dark:text-white" />
            <strong className="text-black dark:text-white">6. Gemini AI</strong>
            <span className="text-neutral-500 text-[10px]">Objective Natural Synthesis</span>
          </div>

          <div className="p-3 rounded border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex flex-col justify-center items-center gap-1 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>7. Human</span>
            <span className="text-[10px] opacity-80 font-normal">Examiner Sovereign</span>
          </div>
        </div>
      </section>

      {/* 4. THREE CORE PILLARS IN MONOCHROME */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        <Card
          title="Zero Raw Video Retention (0ms)"
          subtitle="RAM-only optical geometry extraction"
          badge={<Lock className="w-4 h-4 text-black dark:text-white" />}
        >
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
            Frames are processed inside transient RAM for under 100 milliseconds and permanently destroyed. No video recordings, screenshots of rooms, or facial recognition biometric embeddings ever touch permanent storage.
          </p>
        </Card>

        <Card
          title="Deterministic Temporal Fusion"
          subtitle="Multi-signal correlation with decay"
          badge={<Activity className="w-4 h-4 text-black dark:text-white" />}
        >
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
            Individual brief glances are never flagged. Anomaly detection evaluates a continuous sliding 30-second window, personal typing/response baselines, and multi-sensor cross-category synergies before elevating review priorities.
          </p>
        </Card>

        <Card
          title="Non-Accusatory AI Synthesis"
          subtitle="Gemini 3.8 Flash layer + fallback"
          badge={<Scale className="w-4 h-4 text-black dark:text-white" />}
        >
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
            The system provides certified academic examiners with structured evidence summaries, causal graphs, and counterfactuals. It never accuses or infers student guilt. The certified human examiner remains the sole decision maker.
          </p>
        </Card>
      </section>
    </div>
  );
};
