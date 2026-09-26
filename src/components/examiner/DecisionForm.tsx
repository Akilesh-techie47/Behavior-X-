import { useState } from 'react';
import { Lock } from 'lucide-react';
import type { DecisionKind, ReviewDecisionRecord } from '../../domain/types';
import { Panel, PanelBody, PanelHeader, PanelFooter } from '../layout/Panel';
import { Button } from '../primitives/Button';
import { Field, RadioRow, TextArea } from '../primitives/Form';
import { Banner } from '../feedback/Banner';
import { SaveReceipt } from '../feedback/SaveReceipt';
import { ConfirmDialog } from '../feedback/Dialog';
import { VerdictTag } from '../primitives/Status';
import { useAction } from '../../hooks';
import { CURRENT_EXAMINER, services } from '../../services';
import { formatDateTime, formatRelative } from '../../domain/format';

/**
 * Review: the decision.
 *
 * The system stops here. The form is deliberately harder to complete than a
 * dashboard is to read: a decision cannot be recorded without a written
 * reason, because "I don't know" is a legitimate answer that a text box
 * accommodates and a dropdown does not.
 *
 * Decisions are append-only. There is no "edit" and no "undo" — recording a
 * further decision is the only way forward, which is what makes the history
 * worth trusting.
 */

const DECISIONS: { value: DecisionKind; label: string; description: string }[] = [
  {
    value: 'confirmed',
    label: 'Confirmed — the observation stands as a finding',
    description:
      'You judge the recorded observation to be a genuine concern on the evidence available. Write what you concluded and why.',
  },
  {
    value: 'dismissed',
    label: 'Dismissed — the observation is explained',
    description:
      'You judge the observation to have an explanation the record supports. This does not imply the candidate did nothing wrong; it means nothing is established.',
  },
  {
    value: 'uncertain',
    label: 'Uncertain — not resolvable on this record',
    description:
      'The evidence does not settle the question either way. This is a legitimate outcome and is recorded as one.',
  },
  {
    value: 'escalated',
    label: 'Escalate — refer to a senior examiner or misconduct process',
    description:
      'Refer outside this review. Use sparingly; referral is not a finding, and it starts a process with its own standards.',
  },
];

export function DecisionForm({
  sessionId,
  bundleId,
  existingDecisions,
  onRecorded,
  compact,
}: {
  sessionId: string;
  bundleId?: string;
  existingDecisions: ReviewDecisionRecord[];
  onRecorded: (record: ReviewDecisionRecord) => void;
  compact?: boolean;
}) {
  const [decision, setDecision] = useState<DecisionKind | null>(null);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [receipt, setReceipt] = useState<ReviewDecisionRecord | null>(null);
  const [touched, setTouched] = useState(false);

  const record = useAction(async () => {
    if (!decision) return null;
    return services.sessions.recordDecision({
      sessionId,
      bundleId,
      decision,
      note: note.trim(),
      examiner: CURRENT_EXAMINER,
    });
  });

  const noteTooShort = note.trim().length < 20;
  const canSubmit = decision !== null && !noteTooShort;

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    setConfirming(false);
    record.run().then(result => {
      if (result) {
        setReceipt(result);
        onRecorded(result);
      }
    });
  };

  return (
    <>
      <Panel>
        <PanelHeader
          title="Your decision"
          description="Recorded against your name and kept permanently. Nothing here can be edited afterwards — a further decision is added alongside this one."
          actions={existingDecisions.length > 0 ? <VerdictTag>{existingDecisions.length} recorded</VerdictTag> : undefined}
        />

        <PanelBody className={compact ? 'space-y-4' : 'space-y-5'}>
          {receipt && (
            <SaveReceipt
              message="Decision recorded and attributed."
              reference={receipt.id}
              onDismiss={() => setReceipt(null)}
            />
          )}

          {existingDecisions.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Decision history</div>
              <ul className="space-y-2">
                {existingDecisions.map(recorded => (
                  <li
                    key={recorded.id}
                    className="border-l-2 border-neutral-300 pl-3 py-1 flex flex-wrap items-baseline gap-x-2.5"
                  >
                    <VerdictTag
                      emphasis={recorded.decision === 'escalated' ? 'strong' : 'normal'}
                    >
                      {recorded.decision}
                    </VerdictTag>
                    <span className="text-[12px] text-neutral-600">
                      {recorded.examinerName}
                    </span>
                    <span
                      className="data text-[11px] text-neutral-400"
                      title={formatDateTime(recorded.recordedAt)}
                    >
                      {formatRelative(recorded.recordedAt)}
                    </span>
                    {!recorded.settled && <span className="eyebrow">Saving…</span>}
                    <p className="w-full text-[12px] leading-relaxed text-neutral-700 mt-1">
                      {recorded.note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <fieldset>
            <legend className="eyebrow mb-2.5">Decision</legend>
            <div className="space-y-2">
              {DECISIONS.map(option => (
                <RadioRow
                  key={option.value}
                  name={`decision-${bundleId ?? 'session'}`}
                  value={option.value}
                  checked={decision === option.value}
                  onChange={value => setDecision(value as DecisionKind)}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </div>
            {decision === null && (
              /* Not gated on `touched`: the record control is disabled until a
               * decision is chosen, and a disabled control cannot be pressed to
               * ask why. Gating this on a click made the sentence unreachable. */
              <p className="mt-2 text-[12px] text-neutral-600">
                Choose a decision before recording.
              </p>
            )}
          </fieldset>

          <Field
            label="Reasoning"
            required
            error={
              touched && noteTooShort
                ? 'Write the reasoning. At least a sentence — this is the part that is read later, by someone who was not here.'
                : null
            }
            hint="What the record shows, what it does not, and what would have changed your conclusion. Written for a colleague reading this in six months."
          >
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={() => setTouched(true)}
                className="min-h-[110px]"
                placeholder="The camera recorded…"
              />
            )}
          </Field>

          <Banner tone="context" label="Before you record">
            Recording a decision does not end the review. You can record another later, and
            both remain in the history. If you escalate, the session is referred and the
            record is preserved in full.
          </Banner>
        </PanelBody>

        <PanelFooter>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              onClick={() => {
                setTouched(true);
                if (canSubmit) setConfirming(true);
              }}
              loading={record.pending}
              disabled={!decision}
            >
              Record decision
            </Button>
            <span className="flex items-center gap-1.5 text-[11.5px] text-neutral-400">
              <Lock className="w-3 h-3" aria-hidden="true" />
              Attributed to you · append-only
            </span>
          </div>
        </PanelFooter>
      </Panel>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={submit}
        title="Record this decision?"
        confirmLabel={`Record ${decision ?? ''}`}
        pending={record.pending}
        description="It will be attributed to you and kept permanently. It cannot be edited or removed afterwards."
      >
        <div className="border border-neutral-200 rounded-[3px] p-3 bg-neutral-50">
          <div className="eyebrow mb-1.5">Decision</div>
          <p className="text-[12.5px] text-neutral-900">
            {DECISIONS.find(d => d.value === decision)?.label}
          </p>
          <div className="eyebrow mt-3 mb-1.5">Reasoning</div>
          <p className="text-[12.5px] leading-relaxed text-neutral-700">{note.trim()}</p>
        </div>
        {record.error && (
          <p className="mt-3 text-[12.5px] text-neutral-900" role="alert">
            {record.error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
