import { useMemo, useState } from 'react';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { TextInput } from '../../components/primitives/Form';
import { Tag } from '../../components/primitives/Status';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { formatDateTime, titleCase } from '../../domain/format';
import type { PolicyClause } from '../../domain/types';

/**
 * The policy library.
 *
 * The clauses are the system's only authority for removing an observation, so
 * they are published in full, in plain language, with who wrote them and when.
 * A clause nobody can read is a rule nobody can appeal.
 */
export function PolicyLibrary() {
  const exams = useAsync(() => services.exam.listExams(), []);
  const [search, setSearch] = useState('');

  const clauses = useMemo(() => {
    const all: (PolicyClause & { examTitle: string })[] = [];
    for (const exam of exams.data ?? []) {
      for (const clause of exam.policy) {
        all.push({ ...clause, examTitle: exam.title });
      }
    }
    const needle = search.trim().toLowerCase();
    return all
      .filter(
        clause =>
          !needle ||
          `${clause.text} ${clause.reference} ${clause.appliesTo.join(' ')}`.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.reference.localeCompare(b.reference));
  }, [exams.data, search]);

  if (exams.status === 'loading') {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={8} label="Loading policy library" />
      </div>
    );
  }

  if (exams.error && !exams.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={exams.error.kind} message={exams.error.message} onRetry={exams.reload} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Policy"
        title="Policy library"
        description="Every clause the filters stage may apply. A clause is the only thing that can remove an observation from consideration, and each one is a human judgement written down."
        actions={<SimulatedMark label="Simulated policy set" />}
      />

      <Panel>
        <Toolbar>
          <ToolbarGroup label="Find">
            <TextInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clauses…"
              aria-label="Search policy clauses"
              className="w-[260px] h-8 text-[12.5px]"
            />
          </ToolbarGroup>
          <span className="ml-auto data text-[11.5px] text-neutral-400">
            {clauses.length} clauses across {exams.data?.length ?? 0} examinations
          </span>
        </Toolbar>

        <ul className="divide-y divide-neutral-100">
          {clauses.map(clause => (
            <li key={`${clause.examTitle}-${clause.id}`} className="px-4 py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <span className="data text-[11.5px] text-neutral-500">{clause.reference}</span>
                <span className="text-[11.5px] text-neutral-400">{clause.examTitle}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-800 max-w-[82ch]">
                {clause.text}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="eyebrow mr-1">Applies to</span>
                {clause.appliesTo.map(category => (
                  <Tag key={category}>{titleCase(category)}</Tag>
                ))}
              </div>
            </li>
          ))}
        </ul>

        {clauses.length === 0 && (
          <p className="px-4 py-10 text-center text-[12.5px] text-neutral-500">
            No clause matches “{search}”.
          </p>
        )}
      </Panel>

      <Section
        title="How a clause is applied"
        description="The mechanism, because a reviewer needs to know whether a suppression was correct, not merely that one happened."
      >
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              step: 'A signal is recorded',
              body: 'A detector produces an observation. At this point nothing has been judged and nothing has been filtered.',
            },
            {
              step: 'Clauses are tested against it',
              body: 'Each clause in force for that examination is checked. A clause that matches marks the observation as explained, and records the clause, its reference, and the check that matched.',
            },
            {
              step: 'The record keeps both',
              body: 'A suppressed observation stays visible in the session with its reason. A reviewer can disagree with the match, and can record a decision that it mattered anyway.',
            },
          ].map((item, index) => (
            <Panel key={item.step}>
              <PanelBody>
                <div className="flex items-center gap-2.5">
                  <span className="data text-[11px] text-neutral-400">0{index + 1}</span>
                  <h3 className="text-[13.5px] font-semibold">{item.step}</h3>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600">{item.body}</p>
              </PanelBody>
            </Panel>
          ))}
        </div>
      </Section>

      {exams.data && (
        <Section title="Provenance" description="Where this policy set came from.">
          <Panel>
            <PanelBody>
              <p className="text-[12.5px] leading-relaxed text-neutral-600 max-w-[78ch]">
                This is a synthetic policy set written for the demonstration build. It is not
                any real institution's regulations, and no clause here has any standing
                outside it. In a deployment the library would be versioned, every clause
                would carry an approving authority, and a session would be evaluated against
                the version in force on the day it was sat — not the current one.
              </p>
              <p className="mt-3 data text-[11.5px] text-neutral-400">
                Compiled {formatDateTime(new Date().toISOString())} ·{' '}
                {exams.data.length} examinations · {clauses.length} clauses
              </p>
            </PanelBody>
          </Panel>
        </Section>
      )}
    </div>
  );
}
