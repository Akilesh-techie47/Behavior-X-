import { useCallback, useEffect, useRef, useState } from 'react';
import { useAction, useAsync, useCountdown } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, PanelHeader } from '../../components/layout/Panel';
import { Button } from '../../components/primitives/Button';
import { StatusBadge, Tag, Text, ValueRow } from '../../components/primitives/Status';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { Banner } from '../../components/feedback/Banner';
import { formatDurationFine, formatRelative } from '../../domain/format';
import type { CompanionStatus, PairingPhase } from '../../domain/types';

/**
 * The companion device's own screen.
 *
 * This is the interface a candidate looks at while sitting an examination, so
 * it is the most constrained surface in the product. It shows the camera, the
 * battery, the connection, and what the candidate agreed to. It shows no
 * indicators, no counters of anything the candidate did not cause, and nothing
 * that could be read as feedback on performance.
 */
export function Companion() {
  const status = useAsync(() => services.devices.companion(), []);
  const disconnect = useAction(() => services.devices.disconnectCompanion());
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    pollRef.current = window.setInterval(() => {
      setNow(Date.now());
      status.reload();
    }, 10_000);
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data: CompanionStatus | null = status.data ?? null;

  if (status.status === 'loading' && !data) {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={6} label="Loading companion" />
      </div>
    );
  }

  if (status.error && !data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={status.error.kind} message={status.error.message} onRetry={status.reload} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[720px]">
      <PageHeader
        eyebrow="Companion"
        title="Your phone is the observation device"
        description="This device records its surroundings on a rolling buffer for the duration of the examination. You can see everything it records on this screen."
        actions={<SimulatedMark label="Simulated device" />}
      />

      {data.paired ? (
        <Panel>
          <PanelHeader
            title={data.deviceName ?? 'Companion device'}
            description={data.examTitle ? `Paired to ${data.examTitle}` : 'Paired to a session'}
            actions={
              <StatusBadge tone="active">
                {data.network === 'stable' ? 'Connected' : data.network === 'weak' ? 'Weak signal' : 'Offline'}
              </StatusBadge>
            }
          />
          <PanelBody className="space-y-5">
            <CameraPreview facing={data.cameraFacing} active={data.cameraActive} />

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
              <ValueRow label="Battery" value={`${data.batteryPercent}%`} tone={data.batteryPercent < 20 ? 'degraded' : undefined} />
              <ValueRow label="Power" value={data.charging ? 'Charging' : 'On battery'} />
              <ValueRow
                label="Connection"
                value={`${data.network} · ${data.rttMs} ms`}
                tone={data.network === 'offline' ? 'lost' : undefined}
              />
              <ValueRow label="Last sync" value={formatRelative(data.lastSyncAt, now)} />
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[12.5px] text-neutral-600">Record coverage</span>
                <span className="data text-[12.5px] text-neutral-900">{data.coverage}%</span>
              </div>
              <div className="meter mt-2 h-[4px]">
                <span className="bg-neutral-800" style={{ width: `${data.coverage}%` }} />
              </div>
              <p className="mt-2 text-[11.5px] text-neutral-500 leading-relaxed">{data.coverageNote}</p>
            </div>

            <div className="border-t border-neutral-100 pt-4 text-[11.5px] text-neutral-400">
              {data.framesDelivered.toLocaleString()} frames delivered ·{' '}
              {data.framesDropped.toLocaleString()} dropped
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => disconnect.run().then(() => status.reload())}
                disabled={disconnect.pending}
              >
                {disconnect.pending ? 'Disconnecting…' : 'Stop recording and unpair'}
              </Button>
              <span className="text-[11.5px] text-neutral-400">
                Unpairing is available at any time, including mid-examination.
              </span>
            </div>

            {disconnect.error && (
              <Banner
                tone="material"
                label="Not done"
                title="The device did not unpair"
                onDismiss={disconnect.clearError}
              >
                The device is still recording. Try again, or ask an invigilator to disconnect
                it from the session.
              </Banner>
            )}
          </PanelBody>
        </Panel>
      ) : (
        <Panel>
          <PanelHeader title="Not paired" description="This device is not recording anything." />
          <PanelBody>
            <Text className="max-w-[64ch]">
              Pairing happens from the browser you are sitting the examination in. If you
              paired this device earlier and it has since disconnected, reopen that page and
              the pairing will resume automatically.
            </Text>
          </PanelBody>
        </Panel>
      )}

      <Section
        title="What this device records"
        description="Stated plainly, because a candidate should be able to check the claim rather than trust it."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Panel>
            <PanelHeader title="Records" />
            <ul className="divide-y divide-neutral-100">
              {[
                'A rolling low-resolution view of this device’s surroundings',
                'The time and reason for every interruption to that view',
                'This device’s battery level and connection quality',
              ].map(item => (
                <li key={item} className="px-4 py-2.5 flex gap-2.5 text-[12.5px] text-neutral-700">
                  <span className="w-1.5 h-1.5 border border-neutral-700 rounded-[1px] shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHeader title="Does not record" />
            <ul className="divide-y divide-neutral-100">
              {[
                'Your screen, your camera roll, or your files',
                'Audio from this device’s microphone',
                'Your keystrokes, clipboard, or browsing history',
                'Anything after you unpair, or after the session ends',
              ].map(item => (
                <li key={item} className="px-4 py-2.5 flex gap-2.5 text-[12.5px] text-neutral-600">
                  <span className="w-1.5 h-1.5 border border-neutral-300 rounded-[1px] shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </Section>

      {data.paired && (
        <Section title="If something goes wrong" description="The failure modes worth knowing about before they happen.">
          <Panel>
            <PanelBody className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Battery low', body: 'Connect the charger. Recording continues while charging, and the gap is recorded if it stops.' },
                { label: 'Signal weak', body: 'Move closer to the router. A weak connection produces a coverage gap, not a mark against you.' },
                { label: 'App closed', body: 'Reopen it and pairing resumes. The gap is recorded with its duration.' },
              ].map(item => (
                <div key={item.label}>
                  <h3 className="text-[12.5px] font-semibold text-neutral-900">{item.label}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600">{item.body}</p>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </Section>
      )}

      <p className="text-[11.5px] text-neutral-400">
        Emergency contact on file: {data.emergencyContact}
      </p>
    </div>
  );
}

function CameraPreview({ facing, active }: { facing: 'rear' | 'front'; active: boolean }) {
  return (
    <div className="relative aspect-[16/9] border border-neutral-300 bg-neutral-950 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-[12px] text-neutral-500 tracking-[0.14em] uppercase">
            {active ? 'Rolling buffer' : 'Camera inactive'}
          </div>
          <div className="mt-1.5 data text-[11px] text-neutral-600">
            {facing === 'rear' ? 'Rear camera' : 'Front camera'} · low resolution
          </div>
        </div>
      </div>
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        {active && (
          <span className="inline-flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-700 px-2 py-1 text-[10px] tracking-[0.12em] uppercase text-neutral-300">
            Recording
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2 bg-neutral-950/80">
        <span className="data text-[10px] text-neutral-500">SIMULATED</span>
        <span className="data text-[10px] text-neutral-500">30 fps · rolling</span>
      </div>
    </div>
  );
}

/**
 * Pairing, shown on the browser side. The code is short, expires quickly, and
 * the page does not pretend to be secure beyond what it is: it says what the
 * code is for and who can use it.
 */
export function CompanionPairing() {
  const pairing = useAsync(async () => {
    const start = await services.devices.beginPairing();
    return start;
  }, []);

  const [phase, setPhase] = useState<PairingPhase>('awaiting_scan');
  const [deviceName, setDeviceName] = useState<string | null>(null);

  const poll = useCallback(async () => {
    const current = pairing.data;
    if (!current) return;
    const next = await services.devices.pollPairing(current.id);
    setPhase(next.phase);
    setDeviceName(next.deviceName ?? null);
  }, [pairing.data]);

  useEffect(() => {
    if (!pairing.data) return;
    if (phase === 'connected' || phase === 'expired' || phase === 'declined') return;
    const id = window.setInterval(() => void poll(), 2000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairing.data, phase]);

  const remaining = useCountdown(pairing.data?.expiresInSeconds ?? 0);

  if (pairing.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={4} label="Starting pairing" />
      </div>
    );
  }

  if (pairing.error && !pairing.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={pairing.error.kind} message={pairing.error.message} onRetry={pairing.reload} />
      </div>
    );
  }

  const current = pairing.data;
  if (!current) return null;

  return (
    <div className="p-4 lg:p-6 max-w-[640px]">
      <PageHeader
        eyebrow="Companion"
        title="Pair a phone"
        description="The phone becomes the observation device for this examination. It records its surroundings and nothing else."
        actions={<SimulatedMark label="Simulated pairing" />}
      />

      <Panel>
        <PanelBody className="text-center py-8">
          {phase === 'connected' ? (
            <>
              <p className="text-[14px] font-medium text-neutral-900">Paired</p>
              <p className="mt-2 text-[12.5px] text-neutral-600 max-w-[52ch] mx-auto leading-relaxed">
                {deviceName ?? 'The device'} is now recording for this session. The candidate
                can see the camera view, the battery level, and the connection status on the
                device at all times.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <Tag>Connected</Tag>
                <Tag>{current.code}</Tag>
              </div>
            </>
          ) : phase === 'expired' || phase === 'declined' ? (
            <>
              <p className="text-[14px] font-medium text-neutral-900">
                {phase === 'expired' ? 'The code expired' : 'The device declined'}
              </p>
              <p className="mt-2 text-[12.5px] text-neutral-600 max-w-[52ch] mx-auto leading-relaxed">
                {phase === 'expired'
                  ? 'Nothing was recorded and no data was sent. Start pairing again to get a new code.'
                  : 'The device did not accept the request. Nothing was recorded; try again if it was a mistake.'}
              </p>
              <div className="mt-5">
                <Button size="sm" variant="outline" onClick={pairing.reload}>
                  Start again
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">Enter this code on the phone</p>
              <p className="data mt-3 text-[34px] tracking-[0.28em] text-neutral-900 font-semibold">
                {current.code}
              </p>
              <p className="mt-3 text-[12.5px] text-neutral-500">
                Expires in <span className="data">{formatDurationFine(remaining)}</span>
              </p>
              <p className="mt-6 text-[11.5px] text-neutral-400 max-w-[48ch] mx-auto leading-relaxed">
                Anyone in the room can use this code. It proves only that someone has the
                phone, not that it is yours — the surrounding view is checked against the
                alignment report by an examiner.
              </p>
            </>
          )}
        </PanelBody>
      </Panel>

      {phase !== 'connected' && (
        <Banner tone="material" label="Pairing" title="The camera is not recording yet">
          Recording starts only after pairing completes, and the candidate can see the
          buffer on the phone before anything is sent.
        </Banner>
      )}
    </div>
  );
}
