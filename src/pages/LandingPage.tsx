import React from 'react';
import { ShieldCheck, Eye, Cpu, FileCheck, ArrowRight, Activity, Users, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-12 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/60 text-xs font-semibold text-indigo-900 dark:text-indigo-200 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>HACKEX '26 • ETHICAL & PRIVACY-FIRST EXAM SYSTEM</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Don't record the student. <br />
          <span className="text-indigo-600 dark:text-indigo-400">
            Understand the pattern.
          </span>
        </h1>

        <p className="text-base text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
          Behavior-X protects student privacy while keeping online tests fair. Instead of saving invasive videos of your room, it checks simple physical cues on your own computer—like looking away or switching browser tabs—and explains everything in plain English with <strong>zero saved video</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
          <Button
            variant="academic"
            size="lg"
            onClick={() => onNavigate('/demo')}
            icon={<Sparkles className="w-4 h-4 text-amber-300" />}
            className="shadow-md text-sm font-semibold"
          >
            Try Live Demo
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('/student')}
            icon={<ArrowRight className="w-4 h-4" />}
            className="text-sm font-medium"
          >
            Student Exam Portal
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('/examiner')}
            icon={<Activity className="w-4 h-4" />}
            className="text-sm font-medium"
          >
            Teacher & Proctor Dashboard
          </Button>
        </div>
      </section>

      {/* Core Architectural Pillars in Plain English */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card
          title="Never Stores Video"
          subtitle="Processed in seconds, deleted instantly"
          badge={<Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
        >
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            Your camera is only checked inside your browser to see head movement. Frames are instantly erased in memory. No videos, photos, or face scans are ever saved to a server or seen by anyone.
          </p>
        </Card>

        <Card
          title="No False Alarms"
          subtitle="A quick glance is not cheating"
          badge={<Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        >
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            Natural thinking involves looking down at notes or looking up while thinking. Behavior-X ignores quick glances and only flags sustained, repeated patterns across time.
          </p>
        </Card>

        <Card
          title="Clear Human Decisions"
          subtitle="Helpful explanations, not accusations"
          badge={<FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        >
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            The computer never decides whether someone cheated. It simply provides clear, friendly notes explaining what happened so human instructors can review with full fairness.
          </p>
        </Card>
      </section>
    </div>
  );
};
