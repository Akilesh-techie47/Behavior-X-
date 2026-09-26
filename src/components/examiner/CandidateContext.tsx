import { AlertCircle } from 'lucide-react';
import type { SessionRecord } from '../../domain/types';
import { Panel, PanelBody, PanelHeader } from '../layout/Panel';
import { SpecList, SpecRow } from '../layout/Page';
import { Tag } from '../primitives/Status';
import { formatWallMinute } from '../../domain/format';

/**
 * Contextualize: who this is.
 *
 * Placed above the signals deliberately. The most common reason an observation
 * looks like misconduct is that the record does not contain the one fact that
 * would explain it — an accommodation, a flaky network at this institution, a
 * cohort that always works this way. So the candidate's context is read before
 * their signals, not after.
 */
export function CandidateContext({ record }: { record: SessionRecord }) {
  const candidate = record.candidate;
  const hasAccommodation = Boolean(candidate.accommodationNotes);

  return (
    <Panel>
      <PanelHeader
        title="Candidate and context"
        description="The facts that change how an observation should be read. Read these before the signals, not after."
      />
      <PanelBody>
        <SpecList>
          <SpecRow label="Candidate">{candidate.name}</SpecRow>
          <SpecRow label="Registration">
            <span className="data">{candidate.registrationId}</span>
          </SpecRow>
          <SpecRow label="Institution">{candidate.institution}</SpecRow>
          <SpecRow label="Faculty">{candidate.faculty}</SpecRow>
          <SpecRow label="Cohort">
            <span className="data">{candidate.cohort}</span>
          </SpecRow>
          <SpecRow label="Examination">
            {record.examTitle}
            <span className="data text-[11px] text-neutral-400 ml-1.5">{record.examCode}</span>
          </SpecRow>
          <SpecRow label="Seat">
            <span className="data">{record.candidate.registrationId}</span>
          </SpecRow>
          <SpecRow label="Session opened">
            <span className="data">{formatWallMinute(record.startedAt)}</span>
          </SpecRow>
        </SpecList>

        {hasAccommodation && (
          <div className="mt-4 border-l-2 border-neutral-900 pl-3.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-neutral-500" aria-hidden="true" />
              <span className="eyebrow text-neutral-900">Accommodation on record</span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-700 max-w-[72ch]">
              {candidate.accommodationNotes}
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-500 max-w-[72ch]">
              An approved accommodation is not an anomaly. If an observation in this session
              resembles a behaviour this accommodation explains, the correct reading is that
              the accommodation applies — check the policy clauses before escalating.
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-2">
          <span className="eyebrow">Prior sessions</span>
          <Tag>No prior record for this cohort</Tag>
          <span className="text-[11.5px] text-neutral-400">
            A candidate's history is not evidence of the current session, and is not shown
            alongside it for that reason.
          </span>
        </div>
      </PanelBody>
    </Panel>
  );
}
