import { CHANNEL_ORDER } from '../../domain/format';
import type { CoverageGap, DeviceState, EvidenceChannel, SessionRecord } from '../../domain/types';
import { Meter, StatusBadge, Tag } from '../primitives/Status';
import { Panel, PanelBody, PanelHeader } from '../layout/Panel';
import { SpecList, SpecRow } from '../layout/Page';
import { ScoreFigure } from '../primitives/Status';
import { SimulatedMark } from '../feedback/StateBlock';
import { CHANNEL_LABEL, formatDurationFine, formatOffset } from '../../domain/format';
import type { StatusTone } from '../primitives/Status';

/**
 * Coverage and device state.
 *
 * This panel is the reason the product is defensible. Coverage, quality, and
 * every gap are shown before any signal is read, because a reviewer looking at
 * a 97% coverage figure will read the record as complete, and the 3% is where
 * the interesting thing usually happened.
 */

const DEVICE_TONE: Record<DeviceState['status'], StatusTone> = {
  connected: 'nominal',
  ready: 'nominal',
  active: 'nominal',
  degraded: 'degraded',
  disconnected: 'lost',
  denied: 'blocked',
  unavailable: 'unknown',
  not_required: 'unknown',
};

export function CoveragePanel({ session }: { session: SessionRecord }) {
  const gaps = session.coverageGaps;

  return (
    <Panel>
      <PanelHeader
        title="Coverage and quality"
        description="What was actually available to observe, before anything is read as significant."
        actions={<SimulatedMark />}
      />
      <PanelBody>
        <div className="grid grid-cols-3 gap-5">
          <ScoreFigure value={session.observationCoverage} label="Coverage" sublabel="of session time" />
          <ScoreFigure value={session.observationQuality} label="Quality" sublabel="usability" />
          <ScoreFigure value={session.evidenceQuality} label="Evidence" sublabel="corroboration" />
        </div>

        {gaps.length === 0 ? (
          <p className="mt-5 pt-4 border-t border-neutral-100 text-[12.5px] text-neutral-500">
            No coverage gaps recorded for this session.
          </p>
        ) : (
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <div className="eyebrow mb-2.5">
              {gaps.length} coverage {gaps.length === 1 ? 'gap' : 'gaps'}
            </div>
            <ul className="space-y-2.5">
              {gaps.map(gap => (
                <CoverageGapRow key={gap.id} gap={gap} sessionTotal={session.totalSeconds} />
              ))}
            </ul>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

function CoverageGapRow({ gap, sessionTotal }: { gap: CoverageGap; sessionTotal: number }) {
  const lapsed = Math.max(0, gap.endSeconds - gap.startSeconds);
  const lost = sessionTotal > 0 ? Math.round((lapsed / sessionTotal) * 100) : 0;
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-1.5 border-l-2 border-neutral-300 pl-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[12.5px] font-medium text-neutral-900">{gap.reason}</span>
          <span className="data text-[11px] text-neutral-400">
            {CHANNEL_LABEL[gap.channel]} · {formatOffset(gap.startSeconds)}–{formatOffset(gap.endSeconds)} ·{' '}
            {formatDurationFine(lapsed)}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
          No observation was available from this channel for that period. Anything the
          candidate did during it is outside the record.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="eyebrow text-neutral-400">Unobserved</span>
        <span className="data text-[11.5px] text-neutral-700 w-9 text-right">{lost}%</span>
      </div>
    </li>
  );
}

export function DevicePanel({ devices }: { devices: DeviceState[] }) {
  return (
    <Panel>
      <PanelHeader title="Devices" description="Each observation source and its current state." />
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="bg-neutral-50">
            <tr>
              {['Source', 'State', 'Detail', 'Readout'].map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={`text-left px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-neutral-500 border-b border-neutral-300 ${
                    index === 3 ? 'text-right' : ''
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.kind} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2.5 align-top">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-900">{device.label}</span>
                    {!device.required && <Tag>Optional</Tag>}
                  </div>
                </td>
                <td className="px-4 py-2.5 align-top">
                  <StatusBadge tone={DEVICE_TONE[device.status]}>
                    {device.status.replace('_', ' ')}
                  </StatusBadge>
                </td>
                <td className="px-4 py-2.5 align-top text-neutral-600">{device.detail}</td>
                <td className="px-4 py-2.5 align-top text-right data text-[11.5px] text-neutral-500">
                  {device.readout ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** Per-channel coverage. Makes it obvious which source is carrying the record. */
export function ChannelCoverage({
  coverage,
  quality,
}: {
  coverage: Partial<Record<EvidenceChannel, number>>;
  quality: Partial<Record<EvidenceChannel, number>>;
}) {
  return (
    <Panel>
      <PanelHeader
        title="Channel coverage"
        description="Corroboration requires more than one channel. A single channel carries a single claim."
      />
      <PanelBody>
        <SpecList>
          {CHANNEL_ORDER.map(channel => {
            const cov = coverage[channel] ?? 0;
            const qual = quality[channel] ?? 0;
            return (
              <SpecRow key={channel} label={CHANNEL_LABEL[channel]}>
                <span className="inline-flex items-center gap-2.5 justify-end">
                  <Meter value={cov} label={`${CHANNEL_LABEL[channel]} coverage`} className="w-14" />
                  <span className="data text-[11.5px] w-9 text-right">{cov}%</span>
                  <span className="data text-[11.5px] text-neutral-400 w-9 text-right">{qual}%</span>
                </span>
              </SpecRow>
            );
          })}
        </SpecList>
        <p className="mt-3 text-[11px] text-neutral-400">
          Coverage, then quality. A channel can be present throughout and still be unusable.
        </p>
      </PanelBody>
    </Panel>
  );
}
