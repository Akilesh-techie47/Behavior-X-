import { useState } from 'react';
import { formatOffset } from '../../domain/format';
import type { EvidenceBundle, SuppressionCheck, SuppressedObservation } from '../../domain/types';
import { Panel, PanelBody, PanelHeader } from '../layout/Panel';
import { ChannelTag, Tag, VerdictTag } from '../primitives/Status';

/**
 * Filter: what was removed, and by what authority.
 *
 * A suppression rule is a human judgement that an observation has an approved
 * explanation, which makes it the most consequential thing the system does
 * quietly. So it is never quiet: the observation, each check that passed, the
 * baseline it was measured against, and the reason are all shown — and a
 * reviewer can disagree with any of them.
 */

const CHECK_RESULT: Record<SuppressionCheck['result'], { label: string; mark: string }> = {
  pass: { label: 'Applies', mark: '✓' },
  fail: { label: 'Does not apply', mark: '✕' },
  unknown: { label: 'Undetermined', mark: '?' },
};

export function SuppressedPanel({ suppressed }: { suppressed: SuppressedObservation[] }) {
  if (suppressed.length === 0) {
    return (
      <Panel>
        <PanelHeader
          title="Suppressed observations"
          description="Observations a policy clause explains away. They stay in the record."
        />
        <PanelBody>
          <p className="text-[12.5px] leading-relaxed text-neutral-500 max-w-[68ch]">
            Nothing was suppressed in this session. No policy clause was applied to remove
            an observation from consideration.
          </p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Suppressed observations"
        description="Observations a policy clause explains away. Suppression removes an observation from consideration; it never deletes it."
        actions={<Tag>{suppressed.length} recorded</Tag>}
      />
      <ul className="divide-y divide-neutral-100">
        {suppressed.map(observation => (
          <SuppressedRow key={observation.id} observation={observation} />
        ))}
      </ul>
    </Panel>
  );
}

function SuppressedRow({ observation }: { observation: SuppressedObservation }) {
  const [expanded, setExpanded] = useState(false);
  const applying = observation.checks.filter(c => c.result === 'pass');

  return (
    <li className="px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="data text-[11px] text-neutral-400 w-14 shrink-0">
          {formatOffset(observation.offsetSeconds)}
        </span>
        <ChannelTag channel={observation.channel} />
        <span className="text-[12.5px] font-medium text-neutral-900">{observation.label}</span>
        <VerdictTag>Not escalated</VerdictTag>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-600 max-w-[76ch]">
        {observation.detail}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="data text-[11px] text-neutral-500">{observation.baseline}</span>
        <span className="data text-[11px] text-neutral-400">{observation.wallClock}</span>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="text-[11.5px] font-medium text-neutral-600 hover:text-neutral-900 underline underline-offset-2"
        >
          {expanded ? 'Hide' : 'Show'} the {observation.checks.length} policy{' '}
          {observation.checks.length === 1 ? 'check' : 'checks'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 border-l-2 border-neutral-300 pl-3">
          <p className="eyebrow mb-2">Why it was not escalated</p>
          <p className="text-[12.5px] leading-relaxed text-neutral-700 max-w-[76ch] mb-3">
            {observation.reason}
          </p>
          <ul className="space-y-2">
            {observation.checks.map(check => (
              <li key={check.id} className="flex items-start gap-2.5">
                <span
                  className={`w-3.5 h-3.5 border rounded-[2px] grid place-items-center shrink-0 mt-px text-[9px] leading-none ${
                    check.result === 'pass'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-neutral-300 text-neutral-400'
                  }`}
                  aria-hidden="true"
                >
                  {CHECK_RESULT[check.result].mark}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[12px] text-neutral-900">{check.label}</span>
                    <span className="text-[11px] text-neutral-400">
                      {CHECK_RESULT[check.result].label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500 max-w-[72ch]">
                    {check.observation}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {applying.length > 0 && (
            <p className="mt-3 text-[11.5px] text-neutral-500">
              {applying.length} of {observation.checks.length} checks applied.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/** Escalated bundles: the observations that survived filtering. */
export function BundlePanel({
  bundles,
  selectedBundleId,
  onSelect,
}: {
  bundles: EvidenceBundle[];
  selectedBundleId: string | null;
  onSelect: (bundle: EvidenceBundle) => void;
}) {
  if (bundles.length === 0) {
    return (
      <Panel>
        <PanelHeader
          title="Escalated observations"
          description="Observations that survived filtering and were put forward for review."
        />
        <PanelBody>
          <p className="text-[12.5px] leading-relaxed text-neutral-500 max-w-[68ch]">
            Nothing was escalated. No observation in this session met the conditions for a
            policy-relevant finding.
          </p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Escalated observations"
        description="Each bundle is a correlated group of signals and the finding drawn from them."
        actions={<Tag>{bundles.length} bundles</Tag>}
      />
      <ul className="divide-y divide-neutral-100">
        {bundles.map(bundle => (
          <li key={bundle.id}>
            <button
              type="button"
              onClick={() => onSelect(bundle)}
              aria-current={selectedBundleId === bundle.id ? 'true' : undefined}
              className={`w-full text-left px-4 py-3.5 transition-colors ${
                selectedBundleId === bundle.id ? 'bg-neutral-50' : 'hover:bg-neutral-50/70'
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className="data text-[11px] text-neutral-400 w-16 shrink-0">
                  {formatOffset(bundle.windowStart)}
                </span>
                <span className="text-[12.5px] font-medium text-neutral-900">{bundle.title}</span>
                <VerdictTag emphasis={bundle.disposition === 'escalated' ? 'strong' : 'normal'}>
                  {bundle.disposition === 'observation_only'
                    ? 'Recorded only'
                    : bundle.disposition}
                </VerdictTag>
              </div>

              <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-600 max-w-[76ch]">
                {bundle.summary}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                {bundle.channels.map(channel => (
                  <ChannelTag key={channel} channel={channel} />
                ))}
                <span className="data text-[11px] text-neutral-400">
                  {bundle.independentChannels} independent {bundle.independentChannels === 1 ? 'channel' : 'channels'} ·{' '}
                  {bundle.signalIds.length} signals · evidence {bundle.evidenceQuality}%
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
