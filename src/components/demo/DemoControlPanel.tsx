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
    <div className={`p-4 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-sans ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 border border-neutral-950 dark:border-white bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-neutral-950 dark:text-neutral-50 font-mono uppercase flex items-center gap-2">
              <span>DEMO & SYNTHETIC TELEMETRY INJECTOR</span>
              <span className="text-[10px] font-mono px-2 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                {isDemoMode ? 'SIMULATION ACTIVE' : 'PHYSICAL SENSORS'}
              </span>
            </h4>
            <p className="text-[11px] font-mono text-neutral-500">
              Trigger deterministic telemetry events to demonstrate multi-signal anomaly correlation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isDemoMode ? 'academic' : 'outline'}
            size="sm"
            onClick={() => setDemoMode(!isDemoMode)}
          >
            {isDemoMode ? 'Switch to Physical Hardware' : 'Enable Demo Simulation Mode'}
          </Button>
        </div>
      </div>

      {/* Simulation triggers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 font-mono">
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
          icon={<Eye className="w-3.5 h-3.5" />}
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
          icon={<Minimize2 className="w-3.5 h-3.5" />}
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
          icon={<Users className="w-3.5 h-3.5" />}
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
          icon={<UserX className="w-3.5 h-3.5" />}
        >
          <span>Face Absence</span>
        </Button>
      </div>

      {lastTriggered && (
        <div className="mt-2.5 px-3 py-1.5 border border-neutral-950 dark:border-white bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-[11px] font-mono flex items-center gap-1.5 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Synthetic event generated & correlated: {lastTriggered}</span>
        </div>
      )}
    </div>
  );
};
