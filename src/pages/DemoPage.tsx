import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sparkles,
  Shield,
  Layers,
  Clock,
  Eye,
  AlertTriangle,
  Monitor,
  ChevronRight,
  GitBranch,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { RiskIndicator } from '../components/common/RiskIndicator';
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

  return (
    <div className="space-y-6 py-6 font-sans">
      {/* 1. Monochromatic Master Banner */}
      <div className="p-6 border border-neutral-300 dark:border-neutral-700 bg-neutral-950 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border border-white bg-white text-black font-mono text-[10px] font-bold tracking-widest uppercase">
              DEMO SIMULATION
            </span>
            <span className="text-neutral-400 text-xs font-mono">
              Deterministic offline engine (Webcam & external API optional)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
            Deterministic Multimodal Evaluation Lab
          </h1>
          <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
            Examine how Behavior-X correlates observable cues (gaze vectors, browser focus, keystroke interval deviation, and answer speed) to construct causal evidence graphs in real time. Zero video saved.
          </p>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="academic"
            size="md"
            onClick={handleLaunchJudgeDemo}
            icon={<Sparkles className="w-4 h-4 text-white" />}
          >
            Launch Judge Demo (Complex AI-Era)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/examiner')}
            className="text-white border-neutral-700 hover:bg-neutral-900"
          >
            Examiner Console
          </Button>
        </div>
      </div>

      {/* 2. Architectural Pipeline Banner */}
      <div className="p-4 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
          Behavior-X Telemetry Pipeline
        </div>
        <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px] py-1 font-mono">
          <div className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            1. Multimodal Sensors
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <div className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-850 text-neutral-950 dark:text-neutral-50 font-bold whitespace-nowrap">
            2. Ephemeral In-Memory Buffer (0ms)
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <div className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            3. Personal Baseline Calibration
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <div className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            4. Temporal Correlation & Fusion
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <div className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            5. Causal Evidence Graph
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <div className="px-3 py-1.5 border border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 font-bold whitespace-nowrap">
            6. Human Examiner Decision
          </div>
        </div>
      </div>

      {/* 3. Scenario Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {DEMO_SCENARIOS.map(sc => {
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`p-4 border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 shadow-sm'
                  : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                  <span className={isSelected ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-500'}>
                    Result:
                  </span>
                  <RiskBadge level={sc.expectedFinalRisk} />
                </div>
                <h4 className="font-bold text-xs font-mono uppercase leading-snug">
                  {sc.name.split(':')[0]}
                </h4>
                <div className="text-[11px] font-medium mt-0.5 line-clamp-1">
                  {sc.name.split(':')[1] || sc.name}
                </div>
                <p className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${isSelected ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {sc.description}
                </p>
              </div>
              <div className={`mt-3 text-[10px] font-mono ${isSelected ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-500'}`}>
                {sc.steps.length} Steps • {sc.totalDurationSeconds}s total
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Playback Controller & Step Annotation */}
      <Card
        title={`Active Simulation: ${selectedScenario.name}`}
        subtitle={selectedScenario.summary}
        badge={
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-500">Progress:</span>
            <span className="font-bold text-neutral-950 dark:text-neutral-50">
              {elapsedSeconds}s / {selectedScenario.totalDurationSeconds}s
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <Button
                variant={isPlaying ? 'outline' : 'primary'}
                size="sm"
                onClick={handlePlayPause}
                icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {isPlaying ? 'Pause Simulation' : 'Play Scenario'}
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

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-neutral-500">Execution Speed:</span>
              <button
                onClick={() => setPlaybackSpeed(1)}
                className={`px-3 py-1 border text-xs transition-colors ${
                  playbackSpeed === 1
                    ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 font-bold'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                1.0x Realtime
              </button>
              <button
                onClick={() => setPlaybackSpeed(2)}
                className={`px-3 py-1 border text-xs transition-colors ${
                  playbackSpeed === 2
                    ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 font-bold'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                2.0x Accelerated
              </button>
            </div>
          </div>

          {/* Active Annotation Callout */}
          {activeAnnotation ? (
            <div className="p-4 border border-neutral-950 dark:border-neutral-200 bg-neutral-50 dark:bg-neutral-900 text-xs flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-mono font-bold block uppercase tracking-wider text-[10px] text-neutral-900 dark:text-neutral-100">
                  ENGINEERING BEHAVIOR OBSERVATION:
                </strong>
                <span className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-mono">
                  {activeAnnotation}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-mono text-xs">
              Click <strong>Play Scenario</strong> or <strong>Next Step</strong> to dispatch synthetic telemetry events and inspect real-time causal graph construction.
            </div>
          )}

          {/* Timeline Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>SIMULATION TIMELINE</span>
              <span>
                {executedStepIndices.length} OF {selectedScenario.steps.length} EVENTS EMITTED
              </span>
            </div>
            <div className="relative h-2 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-neutral-950 dark:bg-neutral-100 transition-all duration-300"
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

      {/* 5. The Three Core Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core Metric 1: Review Priority */}
        <div className="p-5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Telemetry Metric 01</span>
            <RiskBadge level={session.riskState.reviewPriorityLevel || session.riskState.level} />
          </div>
          <div className="text-xs uppercase font-mono font-medium text-neutral-600 dark:text-neutral-400">
            Integrity Review Priority
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-mono font-bold text-neutral-950 dark:text-neutral-50">{reviewPriority}</span>
            <span className="text-xs font-mono text-neutral-400">/ 100</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={reviewPriority} max={100} />
          </div>
          <div className="mt-2 text-[10px] font-mono text-neutral-500">
            Events in 30s Window: {session.riskState.eventCountInWindow}
          </div>
        </div>

        {/* Core Metric 2: Evidence Quality */}
        <div className="p-5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Telemetry Metric 02</span>
            <StatusBadge status="HIGH CONFIDENCE" variant="nominal" size="sm" />
          </div>
          <div className="text-xs uppercase font-mono font-medium text-neutral-600 dark:text-neutral-400">
            Evidence Quality Score
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-mono font-bold text-neutral-950 dark:text-neutral-50">{evidenceQuality}</span>
            <span className="text-xs font-mono text-neutral-400">/ 100</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={evidenceQuality} max={100} />
          </div>
          <div className="mt-2 text-[10px] font-mono text-neutral-500">
            Multi-signal triangulation verified
          </div>
        </div>

        {/* Core Metric 3: Observation Quality */}
        <div className="p-5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Telemetry Metric 03</span>
            <StatusBadge status="OPTIMAL" variant="nominal" size="sm" />
          </div>
          <div className="text-xs uppercase font-mono font-medium text-neutral-600 dark:text-neutral-400">
            Observation Quality
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-mono font-bold text-neutral-950 dark:text-neutral-50">{observationQuality}</span>
            <span className="text-xs font-mono text-neutral-400">/ 100</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={observationQuality} max={100} />
          </div>
          <div className="mt-2 text-[10px] font-mono text-neutral-500">
            Browser APIs nominal • 0ms video storage
          </div>
        </div>
      </div>

      {/* 6. Live Evidence Graph Construction */}
      <EvidenceGraphViewer graphData={evidenceGraph} />

      {/* 7. AI Explanation Layer */}
      <AIExplanationCard session={session} />

      {/* 8. Chronological Score Timeline */}
      <Card
        title="Temporal Score Evolution"
        subtitle="Live tracking of review priority score as synthetic events arrive"
      >
        <RiskTimeline timeline={session.riskState.timeline || []} />
      </Card>

      {/* 9. Privacy Proof & Browser Capabilities */}
      <PrivacyPanel />
    </div>
  );
};
