import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  AlertTriangle,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge } from '../components/common/StatusBadge';
import { RiskIndicator } from '../components/common/RiskIndicator';
import { DEMO_SCENARIOS, DemoScenario, DemoStep } from '../engine/demo/demoScenarios';
import { RiskTimeline } from '../components/examiner/RiskTimeline';
import { AIExplanationCard } from '../components/examiner/AIExplanationCard';
import { PrivacyPanel } from '../components/examiner/PrivacyPanel';

export const DemoPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { session, setDemoMode, behaviorEngine } = useSession();

  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[1]); // Default to Looking Away
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x or 2x
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [executedStepIndices, setExecutedStepIndices] = useState<number[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Enable demo mode on mount
  useEffect(() => {
    setDemoMode(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setDemoMode]);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => {
          const nextSec = prev + 1;

          selectedScenario.steps.forEach((step, idx) => {
            if (step.delaySeconds === nextSec && !executedStepIndices.includes(idx)) {
              executeStep(step, idx);
            }
          });

          if (nextSec >= selectedScenario.totalDurationSeconds) {
            setIsPlaying(false);
          }
          return nextSec;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, selectedScenario, executedStepIndices]);

  const executeStep = (step: DemoStep, index: number) => {
    if (behaviorEngine) {
      behaviorEngine.triggerSyntheticEvent(
        step.type,
        step.description,
        step.evidence
      );
    }
    setExecutedStepIndices(prev => (prev.includes(index) ? prev : [...prev, index]));
    setActiveAnnotation(step.annotation);
  };

  const handleSelectScenario = (sc: DemoScenario) => {
    setIsPlaying(false);
    setSelectedScenario(sc);
    handleReset();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    setExecutedStepIndices([]);
    setActiveAnnotation(null);
    if (behaviorEngine) {
      behaviorEngine.getEventStore().clear();
    }
  };

  const handleNextStep = () => {
    const nextIdx = selectedScenario.steps.findIndex((_, idx) => !executedStepIndices.includes(idx));
    if (nextIdx !== -1) {
      const step = selectedScenario.steps[nextIdx];
      setElapsedSeconds(step.delaySeconds);
      executeStep(step, nextIdx);
    }
  };

  const handleLaunchJudgeDemo = () => {
    handleSelectScenario(DEMO_SCENARIOS[3]);
    setPlaybackSpeed(1);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-6 py-6">
      {/* 1. TOP DEMO BANNER */}
      <div className="p-5 rounded-2xl border border-indigo-300 dark:border-indigo-800 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-mono text-[11px] font-bold tracking-wider">
              DEMO MODE
            </span>
            <span className="text-indigo-200 text-xs font-medium">
              Simulated exam signals (No real webcam needed)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Interactive Test Simulation
          </h1>
          <p className="text-xs text-indigo-100 max-w-2xl leading-relaxed">
            See how Behavior-X spots student cues (like looking away or switching browser tabs) and updates the review score live—without saving any video or making unfair assumptions.
          </p>
        </div>

        {/* Quick Action */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="academic"
            size="md"
            onClick={handleLaunchJudgeDemo}
            icon={<Sparkles className="w-4 h-4 text-amber-300" />}
            className="shadow-md font-semibold text-xs"
          >
            Quick Demo Run (1-Click)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/examiner')}
            className="text-white border-slate-700 hover:bg-slate-800 text-xs"
          >
            Teacher Dashboard
          </Button>
        </div>
      </div>

      {/* 2. SYSTEM FLOW OVERVIEW IN PLAIN ENGLISH */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          How Behavior-X Works Step by Step
        </div>
        <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px] py-1">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
            1. Camera & Screen Sensors
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold whitespace-nowrap">
            2. Video Erased Instantly (0 sec)
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
            3. Spot Looking Away or Tab Switch
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold whitespace-nowrap">
            4. 30-Second Rolling Check
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-semibold whitespace-nowrap">
            5. Plain English AI Notes
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold whitespace-nowrap">
            6. Human Teacher Decides
          </div>
        </div>
      </div>

      {/* 3. SCENARIO SELECTOR */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {DEMO_SCENARIOS.map(sc => {
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/50 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-500 font-medium">Result:</span>
                  <RiskBadge level={sc.expectedFinalRisk} />
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                  {sc.name.split(':')[1] || sc.name}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </div>
              <div className="mt-2.5 text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">
                {sc.steps.length} Steps • {sc.totalDurationSeconds}s total
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. PLAYBACK CONTROLLER & STEP ANNOTATION */}
      <Card
        title={`Playing: ${selectedScenario.name}`}
        subtitle={selectedScenario.summary}
        badge={
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Progress:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {elapsedSeconds}s of {selectedScenario.totalDurationSeconds}s
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Button
                variant={isPlaying ? 'outline' : 'primary'}
                size="sm"
                onClick={handlePlayPause}
                icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {isPlaying ? 'Pause' : 'Play Scenario'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextStep}
                disabled={executedStepIndices.length >= selectedScenario.steps.length}
                icon={<StepForward className="w-4 h-4" />}
              >
                Next Step
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Speed:</span>
              <button
                onClick={() => setPlaybackSpeed(1)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  playbackSpeed === 1
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Normal (1x)
              </button>
              <button
                onClick={() => setPlaybackSpeed(2)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  playbackSpeed === 2
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Fast (2x)
              </button>
            </div>
          </div>

          {/* User Evaluation Highlight Banner */}
          {activeAnnotation ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block uppercase tracking-wider text-[10px] text-amber-800 dark:text-amber-300">
                  WHAT TO NOTICE HERE:
                </strong>
                <span className="text-slate-800 dark:text-slate-200">{activeAnnotation}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs">
              Click <strong>Play Scenario</strong> or <strong>Next Step</strong> to see events arrive and watch the score adjust naturally.
            </div>
          )}

          {/* Timeline Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>TIMELINE PROGRESS</span>
              <span>
                {executedStepIndices.length} OF {selectedScenario.steps.length} EVENTS EMITTED
              </span>
            </div>
            <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (elapsedSeconds / selectedScenario.totalDurationSeconds) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 5. LIVE OBSERVABLE RISK INDICATOR & ATTRIBUTION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-4">
          <Card title="Review Concern Level" subtitle="Based on past 30 seconds of activity">
            <div className="space-y-5">
              <RiskIndicator
                score={session.riskState.currentScore}
                level={session.riskState.level}
                size="lg"
              />
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
                <div>Recent Events: <strong>{session.riskState.eventCountInWindow}</strong></div>
                <div>Measurement Confidence: <strong>{Math.round((session.riskState.confidence || 0.85) * 100)}%</strong></div>
                <div>Last Checked: <strong>{new Date(session.riskState.lastCalculatedAt).toLocaleTimeString()}</strong></div>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Card title="Plain English Summary" subtitle="What the system noticed">
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  CURRENT OBSERVATION:
                </span>
                {session.riskState.humanReadableExplanation}
              </div>

              {session.riskState.contributingSignalSummary && (
                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] space-y-1">
                  <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                    SIGNALS THAT CONTRIBUTED TO THIS SCORE:
                  </span>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                    {session.riskState.contributingSignalSummary.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 6. AI EXPLANATION LAYER */}
      <AIExplanationCard session={session} />

      {/* 7. CHRONOLOGICAL RISK TIMELINE */}
      <Card title="Score History Over Time" subtitle="Shows when scores went up or returned to normal">
        <RiskTimeline timeline={session.riskState.timeline || []} />
      </Card>

      {/* 8. PRIVACY PROOF PANEL */}
      <PrivacyPanel />
    </div>
  );
};
