import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { DEMO_SCENARIOS, DemoScenario, DemoStep } from '../engine/demo/demoScenarios';
import { RiskTimeline } from '../components/examiner/RiskTimeline';
import { AIExplanationCard } from '../components/examiner/AIExplanationCard';
import { PrivacyPanel } from '../components/examiner/PrivacyPanel';
import { EvidenceGraphViewer } from '../components/examiner/EvidenceGraphViewer';
import { ProgressBar } from '../components/common/ProgressBar';

export const DemoPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { session, setDemoMode, behaviorEngine, evidenceGraph } = useSession();

  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[4]); // Default to Complex AI-Era
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
    handleSelectScenario(DEMO_SCENARIOS[4]);
    setPlaybackSpeed(1);
    setIsPlaying(true);
  };

  const reviewPriority = session.riskState.reviewPriorityScore ?? session.riskState.currentScore;
  const evidenceQuality = session.riskState.evidenceQualityScore ?? 92;
  const observationQuality = session.riskState.observationQualityScore ?? 95;

  const pipelineSteps = [
    'Multimodal sensors',
    'Ephemeral buffer (0ms)',
    'Baseline calibration',
    'Temporal fusion',
    'Causal evidence graph',
    'Human examiner decision',
  ];

  const coreMetrics = [
    {
      index: 'Telemetry metric 01',
      name: 'Integrity review priority',
      value: reviewPriority,
      note: `Events in 30s window: ${session.riskState.eventCountInWindow}`,
      badge: (
        <RiskBadge level={session.riskState.reviewPriorityLevel || session.riskState.level} />
      ),
    },
    {
      index: 'Telemetry metric 02',
      name: 'Evidence quality',
      value: evidenceQuality,
      note: 'Multi-signal triangulation verified',
      badge: <StatusBadge status="High confidence" variant="nominal" size="sm" />,
    },
    {
      index: 'Telemetry metric 03',
      name: 'Observation quality',
      value: observationQuality,
      note: 'Browser APIs nominal · 0ms video storage',
      badge: <StatusBadge status="Optimal" variant="nominal" size="sm" />,
    },
  ];

  const playbackProgress = Math.min(
    100,
    (elapsedSeconds / selectedScenario.totalDurationSeconds) * 100
  );

  return (
    <div className="space-y-6 py-6">
      {/* 1. Master banner */}
      <div className="rounded-lg bg-slate-900 border border-slate-900 text-white px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-[3px] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-900">
              Demo simulation
            </span>
            <span className="text-[12.5px] text-slate-400">
              Deterministic offline engine · webcam and external API optional
            </span>
          </div>
          <h1 className="text-[21px] sm:text-[24px] font-semibold tracking-[-0.02em]">
            Deterministic multimodal evaluation lab
          </h1>
          <p className="text-[13px] text-slate-300 max-w-2xl leading-relaxed">
            Examine how Behavior-X correlates observable cues (gaze vectors, browser focus,
            keystroke interval deviation, and answer speed) to construct causal evidence graphs in
            real time. Zero video saved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="academic"
            size="md"
            onClick={handleLaunchJudgeDemo}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Launch judge demo
          </Button>
          <Button
            variant="onDark"
            size="md"
            onClick={() => onNavigate('/examiner')}
            icon={<Layers className="w-4 h-4" />}
          >
            Examiner console
          </Button>
        </div>
      </div>

      {/* 2. Pipeline rail */}
      <div className="panel px-5 py-3.5">
        <span className="eyebrow">Behavior-X telemetry pipeline</span>
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto text-[12px] pb-0.5">
          {pipelineSteps.map((step, idx) => {
            const isTerminal = idx === pipelineSteps.length - 1;
            return (
              <React.Fragment key={step}>
                <span
                  className={`px-2.5 py-1 rounded-[4px] border whitespace-nowrap ${
                    isTerminal
                      ? 'border-slate-900 bg-slate-900 text-white font-medium'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="data text-slate-400 mr-1.5">{idx + 1}</span>
                  {step}
                </span>
                {idx < pipelineSteps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Scenario selector */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="eyebrow">Select a scenario</span>
          <span className="text-[12px] text-slate-500">
            {DEMO_SCENARIOS.length} deterministic traces
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {DEMO_SCENARIOS.map(sc => {
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                aria-pressed={isSelected}
                className={`text-left rounded-md border p-3.5 flex flex-col justify-between gap-2.5 transition-colors ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="data text-[11px] text-slate-400">
                      {String(sc.steps.length).padStart(2, '0')} steps
                    </span>
                    <RiskBadge level={sc.expectedFinalRisk} />
                  </div>
                  <h2 className="text-[13px] font-semibold text-slate-900 leading-snug">
                    {sc.name.split(':')[0]}
                  </h2>
                  <p className="text-[12px] text-slate-500 leading-snug line-clamp-2">
                    {sc.name.split(':')[1] || sc.name}
                  </p>
                </div>
                <div className="data text-[11px] text-slate-400">
                  {sc.totalDurationSeconds}s total
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Playback controller */}
      <Card
        title={`Active simulation: ${selectedScenario.name}`}
        subtitle={selectedScenario.summary}
        badge={
          <span className="data text-[12.5px] font-semibold text-slate-900 whitespace-nowrap">
            {elapsedSeconds}s / {selectedScenario.totalDurationSeconds}s
          </span>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isPlaying ? 'outline' : 'primary'}
                size="sm"
                onClick={handlePlayPause}
                icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              >
                {isPlaying ? 'Pause' : 'Play scenario'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextStep}
                disabled={executedStepIndices.length >= selectedScenario.steps.length}
                icon={<StepForward className="w-3.5 h-3.5" />}
              >
                Next step
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-slate-500 mr-1">Execution speed</span>
              {[
                { value: 1, label: '1.0× realtime' },
                { value: 2, label: '2.0× accelerated' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPlaybackSpeed(opt.value)}
                  aria-pressed={playbackSpeed === opt.value}
                  className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
                    playbackSpeed === opt.value
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {activeAnnotation ? (
            <div className="flex items-start gap-2.5 rounded-md border border-brand-200 bg-brand-50/50 px-4 py-3">
              <Sparkles className="w-4 h-4 text-brand-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="eyebrow text-brand-800">Engineering behavior observation</span>
                <p className="text-[13px] text-slate-700 leading-relaxed mt-1.5">
                  {activeAnnotation}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[12.5px] text-slate-500">
              Select <strong className="font-medium text-slate-700">Play scenario</strong> or{' '}
              <strong className="font-medium text-slate-700">Next step</strong> to dispatch
              synthetic telemetry events and inspect real-time causal graph construction.
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11.5px] text-slate-500">
              <span>Simulation timeline</span>
              <span className="data">
                {executedStepIndices.length} of {selectedScenario.steps.length} events emitted
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-700 transition-[width] duration-300 ease-out"
                style={{ width: `${playbackProgress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Core metrics */}
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-slate-200">
          {coreMetrics.map(metric => (
            <div key={metric.index} className="px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow">{metric.index}</span>
                {metric.badge}
              </div>
              <h2 className="text-[13.5px] font-medium text-slate-700 mt-2.5">{metric.name}</h2>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="data text-[30px] font-semibold leading-none text-slate-900">
                  {metric.value}
                </span>
                <span className="data text-[12px] text-slate-400">/ 100</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={metric.value} max={100} />
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed mt-2.5">{metric.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Live evidence graph */}
      <EvidenceGraphViewer graphData={evidenceGraph} />

      {/* 7. AI explanation layer */}
      <AIExplanationCard session={session} />

      {/* 8. Chronological score timeline */}
      <Card
        title="Temporal score evolution"
        subtitle="Live review priority as synthetic events arrive"
      >
        <RiskTimeline timeline={session.riskState.timeline || []} />
      </Card>

      {/* 9. Privacy proof & browser capabilities */}
      <PrivacyPanel />
    </div>
  );
};
