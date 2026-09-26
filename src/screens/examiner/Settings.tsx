import { useState } from 'react';
import { useAsync, useStoredState } from '../../hooks';
import { CURRENT_EXAMINER, services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, PanelHeader, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Button } from '../../components/primitives/Button';
import { Select, Toggle } from '../../components/primitives/Form';
import { StatusBadge, Tag, Text, ValueRow } from '../../components/primitives/Status';
import { ErrorBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { Banner } from '../../components/feedback/Banner';
import { formatDateTime, titleCase } from '../../domain/format';
import type { SourceCondition } from '../../domain/types';

/**
 * Settings.
 *
 * Every control here is either a display preference or an account fact. There
 * is no detector threshold, no sensitivity dial, and no "what to look for"
 * field, because those are decisions about how candidates are treated and they
 * belong in a policy clause that a committee can read and change.
 */
export function Settings() {
  const exams = useAsync(() => services.exam.listExams(), []);
  const companion = useAsync(() => services.devices.companion(), []);

  const [density, setDensity] = useStoredState<'comfortable' | 'compact'>('bx.density', 'comfortable');
  const [reduceMotion, setReduceMotion] = useStoredState('bx.reduceMotion', false);
  const [showSuppressed, setShowSuppressed] = useStoredState('bx.showSuppressed', true);
  const [replaySpeed, setReplaySpeed] = useStoredState('bx.replaySpeed', 1);
  const [condition, setCondition] = useState<SourceCondition>('nominal');
  const [saved, setSaved] = useState(false);


  if (exams.error && !exams.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={exams.error.kind} message={exams.error.message} onRetry={exams.reload} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[880px]">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Display preferences and your account. Nothing here changes what is recorded, and nothing here changes how a candidate is treated."
        actions={<SimulatedMark label="Local preferences" />}
      />

      <Section
        title="Account"
        description="Who is acting on the record. This is what appears beside a decision."
      >
        <Panel>
          <PanelBody>
            <div className="divide-y divide-neutral-100">
              <ValueRow label="Name" value={CURRENT_EXAMINER.name} />
              <ValueRow label="Identifier" value={CURRENT_EXAMINER.id} />
              <ValueRow label="Role" value={titleCase(CURRENT_EXAMINER.role)} />
              <ValueRow label="Certification" value={CURRENT_EXAMINER.certification} />
              <ValueRow
                label="Decision rights"
                value="May record decisions, with a name"
              />
              <ValueRow label="May export" value="Yes, with a logged reason" />
            </div>
            <p className="mt-4 text-[11.5px] text-neutral-400">
              In a deployment this identity comes from the institution’s single sign-on and
              cannot be edited here. The reason for any export is asked for at the time of
              the export and stored in the audit log.
            </p>
          </PanelBody>
        </Panel>
      </Section>

      <Section
        title="Display"
        description="Preferences for this browser only. They are not part of the record and are not visible to anyone else."
      >
        <Panel>
          <PanelBody className="space-y-4">
            <Toolbar>
              <ToolbarGroup label="Table density">
                <Select
                  value={density}
                  onChange={e => setDensity(e.target.value as typeof density)}
                  aria-label="Table density"
                  className="w-[180px]"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </Select>
              </ToolbarGroup>
            </Toolbar>

            <div className="divide-y divide-neutral-100">
              <div className="py-3 flex items-start justify-between gap-6">
                <div>
                  <div className="text-[12.5px] text-neutral-800">Reduce motion</div>
                  <p className="mt-1 text-[11.5px] text-neutral-500 max-w-[62ch] leading-relaxed">
                    Stops the replay transport from animating between frames. Also follows
                    your operating system setting on first run.
                  </p>
                </div>
                <Toggle
                  checked={reduceMotion}
                  onChange={setReduceMotion}
                  label="Reduce motion in replay"
                />
              </div>

              <div className="py-3 flex items-start justify-between gap-6">
                <div>
                  <div className="text-[12.5px] text-neutral-800">Show suppressed observations</div>
                  <p className="mt-1 text-[11.5px] text-neutral-500 max-w-[62ch] leading-relaxed">
                    Suppressed observations are always present in the record. This control only
                    decides whether the filter stage starts expanded.
                  </p>
                </div>
                <Toggle
                  checked={showSuppressed}
                  onChange={setShowSuppressed}
                  label="Show suppressed observations by default"
                />
              </div>

              <div className="py-3 flex items-start justify-between gap-6">
                <div>
                  <div className="text-[12.5px] text-neutral-800">Replay speed</div>
                  <p className="mt-1 text-[11.5px] text-neutral-500 max-w-[62ch] leading-relaxed">
                    The default rate for the simulated transport. Any frame can still be
                    stepped through individually.
                  </p>
                </div>
                <Select
                  value={String(replaySpeed)}
                  onChange={e => setReplaySpeed(Number(e.target.value))}
                  aria-label="Default replay speed"
                  className="w-[120px] shrink-0"
                >
                  <option value="0.5">0.5×</option>
                  <option value="1">1×</option>
                  <option value="2">2×</option>
                  <option value="4">4×</option>
                </Select>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </Section>

      <Section
        title="Data source condition"
        description="A demonstration control. It changes how the mock services answer, so the loading, stale, and offline paths can be exercised without breaking anything."
      >
        <Panel>
          <PanelBody>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="condition" className="eyebrow block mb-1.5">
                  Condition
                </label>
                <Select
                  id="condition"
                  value={condition}
                  onChange={e => setCondition(e.target.value as SourceCondition)}
                  className="w-[220px]"
                >
                  <option value="nominal">Nominal</option>
                  <option value="slow">Slow responses</option>
                  <option value="flaky">Intermittent failures</option>
                  <option value="offline">Offline</option>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1.5">
                <StatusBadge
                  tone={
                    condition === 'nominal'
                      ? 'nominal'
                      : condition === 'offline'
                        ? 'lost'
                        : condition === 'slow'
                          ? 'degraded'
                          : 'degraded'
                  }
                >
                  {condition}
                </StatusBadge>
                <Tag>simulated: true</Tag>
              </div>
              <div className="ml-auto flex gap-2 pb-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSaved(true);
                    window.setTimeout(() => setSaved(false), 2500);
                  }}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCondition('nominal')}
                >
                  Reset
                </Button>
              </div>
            </div>

            {saved && (
              <div className="mt-4">
                <Banner
                  tone="context"
                  label="Applied"
                  title="The mock services will answer under this condition"
                  onDismiss={() => setSaved(false)}
                >
                  Reload a data-backed screen to see the behaviour. Screens that already have
                  data keep it and mark themselves stale rather than blanking out.
                </Banner>
              </div>
            )}

            <div className="mt-5 border-t border-neutral-100 pt-4">
              <Text size="sm" className="text-neutral-500">
                {DESCRIBE_CONDITION[condition]}
              </Text>
            </div>
          </PanelBody>
        </Panel>
      </Section>

      <Section
        title="Not configurable"
        description="Listed so their absence is not mistaken for an oversight."
      >
        <Panel>
          <PanelHeader title="Fixed by policy, not by preference" />
          <PanelBody>
            <ul className="space-y-2.5">
              {[
                'What is recorded: the surrounding view, the time of each gap, and this device’s health.',
                'How long a record is kept, and who may read it.',
                'Which clauses may remove an observation, and who wrote them.',
                'Whether a model output may be shown to an examiner at all.',
              ].map(item => (
                <li key={item} className="flex gap-2.5 text-[12.5px] text-neutral-700">
                  <span className="data text-[10px] text-neutral-400 mt-1">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </Section>

      <Section title="Build" description="What this instance is.">
        <Panel>
          <PanelBody>
            <div className="divide-y divide-neutral-100">
              <ValueRow label="Version" value="demonstration build" />
              <ValueRow label="Data" value="Generated. No real examination, person, or institution." />
              <ValueRow label="Services" value="Mock implementations behind the same contracts" />
              <ValueRow label="Router" value="Hash router, no dependency" />
              <ValueRow label="Compiled" value={formatDateTime(new Date().toISOString())} />
            </div>
            {companion.data && (
              <p className="mt-4 text-[11.5px] text-neutral-400">
                Companion device {companion.data.paired ? 'is paired on this machine' : 'is not paired'}
                {companion.data.coverage !== undefined
                  ? ` · coverage ${companion.data.coverage}%`
                  : ''}
                .
              </p>
            )}
          </PanelBody>
        </Panel>
      </Section>
    </div>
  );
}

const DESCRIBE_CONDITION: Record<SourceCondition, string> = {
  nominal: 'Requests answer at normal speed. Loading states appear briefly, as they would in use.',
  slow: 'Requests answer well past the response budget. Screens show a progress state, then a timeout with a retry, and never a blank panel.',
  flaky: 'Some requests fail. Data already on screen stays on screen and is marked stale, because a working list is more useful than a spinner.',
  offline: 'Every request fails as unreachable. Each screen states that it cannot reach the service and says what it is showing from cache, if anything.',
};
