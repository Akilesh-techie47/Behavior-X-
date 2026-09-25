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
    <div className={`rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-grid place-items-center w-7 h-7 rounded-md bg-slate-900 text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-slate-900 flex flex-wrap items-center gap-2">
              <span>Demo &amp; synthetic telemetry injector</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-[2px] text-[10.5px] font-medium uppercase tracking-[0.06em] text-slate-500">
                {isDemoMode ? 'Simulation active' : 'Physical sensors'}
              </span>
            </h4>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Trigger deterministic telemetry events to demonstrate multi-signal anomaly correlation.
            </p>
          </div>
        </div>

        <Button
          variant={isDemoMode ? 'academic' : 'outline'}
          size="sm"
          onClick={() => setDemoMode(!isDemoMode)}
        >
          {isDemoMode ? 'Switch to physical hardware' : 'Enable demo simulation'}
        </Button>
      </div>

      {/* Simulation triggers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-5">
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
        <div className="mx-5 mb-5 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-[12.5px] font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Synthetic event generated &amp; correlated: {lastTriggered}</span>
        </div>
      )}
    </div>
  );
};
