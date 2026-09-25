import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, Eye, Minimize2, Users, UserX, Activity, CheckCircle2 } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { Button } from '../common/Button';
import { EventType } from '../../types';

export const DemoControlPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { behaviorEngine, session, isDemoMode, setDemoMode } = useSession();
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const handleSimulate = (type: EventType, description: string) => {
    if (!behaviorEngine) return;
    const evt = behaviorEngine.triggerSyntheticEvent(type, description);
    setLastTriggered(`${type} (${new Date(evt.timestamp).toLocaleTimeString()})`);
    setTimeout(() => setLastTriggered(null), 3000);
  };

  return (
    <div className={`p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/80 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>HACKATHON DEMO & SIMULATION CONTROLS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                {isDemoMode ? 'DEMO MODE ACTIVE' : 'LIVE SENSORS'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trigger controlled synthetic behavioral events to demonstrate multi-signal anomaly correlation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isDemoMode ? 'academic' : 'outline'}
            size="sm"
            onClick={() => setDemoMode(!isDemoMode)}
          >
            {isDemoMode ? 'Switch to Real Sensor Mode' : 'Enable Demo Simulation Mode'}
          </Button>
        </div>
      </div>

      {/* Simulation triggers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
        <Button
          variant="outline"
          size="sm"
          className="text-xs justify-start h-auto py-2"
          onClick={() =>
            handleSimulate(
              'LOOKING_AWAY',
              'Candidate attention deviated towards secondary peripheral workspace for 2.8s.'
            )
          }
          icon={<Eye className="w-3.5 h-3.5 text-indigo-500" />}
        >
          <span>Looking Away</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs justify-start h-auto py-2"
          onClick={() =>
            handleSimulate(
              'WINDOW_BLUR',
              'Exam browser window lost active operating system focus (window blur).'
            )
          }
          icon={<Minimize2 className="w-3.5 h-3.5 text-blue-500" />}
        >
          <span>Tab / Window Blur</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs justify-start h-auto py-2"
          onClick={() =>
            handleSimulate(
              'MULTIPLE_FACES',
              'Secondary person silhouette registered transiently in camera perimeter.'
            )
          }
          icon={<Users className="w-3.5 h-3.5 text-amber-500" />}
        >
          <span>Multiple Faces</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs justify-start h-auto py-2"
          onClick={() =>
            handleSimulate(
              'FACE_NOT_DETECTED',
              'Candidate absent from camera viewport for 4.5 seconds.'
            )
          }
          icon={<UserX className="w-3.5 h-3.5 text-rose-500" />}
        >
          <span>Face Absence</span>
        </Button>
      </div>

      {lastTriggered && (
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Synthetic event generated & correlated: {lastTriggered}</span>
        </div>
      )}
    </div>
  );
};
