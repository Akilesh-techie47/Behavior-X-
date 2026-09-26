import { useEffect, useMemo, useState } from 'react';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { PageHeader, Section } from '../../components/layout/Page';
import { Panel, PanelBody, PanelHeader, StatStrip, Toolbar, ToolbarGroup } from '../../components/layout/Panel';
import { Select } from '../../components/primitives/Form';
import { StatusBadge } from '../../components/primitives/Status';
import { ErrorBlock, LoadingBlock, SimulatedMark } from '../../components/feedback/StateBlock';
import { formatDateTime, formatDuration } from '../../domain/format';
import type { AnalyticsModel, DistributionBucket, SystemAnalytics } from '../../domain/types';

/**
 * Analytics.
 *
 * Aggregate-level only, and the distinction is deliberate: "eight sessions had
 * a coverage gap on the second channel" is a fact about the platform, while
 * "eight candidates were suspicious" is a fact about people that this data does
 * not contain. Nothing on this page can be traced to an individual.
 */
export function Analytics() {
  const exams = useAsync(() => services.exam.listExams(), []);
  const [examId, setExamId] = useState<string>('');

  useEffect(() => {
    if (!examId && exams.data && exams.data.length > 0) setExamId(exams.data[0].id);
  }, [exams.data, examId]);

  const model = useAsync(
    () => (examId ? services.analytics.exam(examId) : Promise.resolve(null as AnalyticsModel | null)),
    [examId],
  );

  const data = model.data ?? null;
  const exam = exams.data?.find(e => e.id === examId);

  const system = useMemo(() => data?.system ?? [], [data]);
  const questions = useMemo(
    () => [...(data?.questions ?? [])].sort((a, b) => b.medianResponseSeconds - a.medianResponseSeconds),
    [data],
  );

  if (exams.status === 'loading' || (examId && model.status === 'loading')) {
    return (
      <div className="p-4 lg:p-6">
        <LoadingBlock rows={10} label="Loading analytics" />
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

  if (model.error && !model.data) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorBlock kind={model.error.kind} message={model.error.message} onRetry={model.reload} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Insight"
        title="Analytics"
        description="How the platform is behaving across a sitting. Aggregate figures about sessions and system health; no figure here is about a person."
        actions={<SimulatedMark label="Synthetic data" />}
      />

      <Panel>
        <Toolbar>
          <ToolbarGroup label="Examination">
            <Select
              value={examId}
              onChange={e => setExamId(e.target.value)}
              aria-label="Select examination"
              className="w-[260px]"
            >
              {(exams.data ?? []).map(item => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.title}
                </option>
              ))}
            </Select>
          </ToolbarGroup>
          {data && (
            <span className="ml-auto data text-[11.5px] text-neutral-400">
              Generated {formatDateTime(data.generatedAt)}
            </span>
          )}
        </Toolbar>

        {data && (
          <StatStrip
            items={[
              {
                label: 'Sessions analysed',
                value: data.sessionsAnalysed,
                sublabel: 'All submissions in the sitting',
              },
              {
                label: 'Mean duration',
                value: formatDuration(data.meanSessionSeconds),
                sublabel: 'Across the sitting',
              },
              {
                label: 'Completion',
                value: `${Math.round(data.completionRate)}%`,
                sublabel: 'Reached submission',
              },
              {
                label: 'Findings raised',
                value: data.bundlesRaised,
                sublabel: `${data.bundlesSuppressed} removed by policy`,
              },
            ]}
          />
        )}
      </Panel>

      {data && (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel>
              <PanelHeader
                title="Observation volume"
                description="What the record actually contains. A high count is not a finding."
              />
              <PanelBody>
                <BucketList buckets={data.observationDistribution} />
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader
                title="Disposition of correlated findings"
                description="What happened to the groups of observations that were correlated."
              />
              <PanelBody>
                <BucketList buckets={data.dispositionSplit} tone />
                <p className="mt-4 text-[12px] leading-relaxed text-neutral-500 max-w-[70ch]">
                  Most correlated groups are removed by an approved policy clause, and most of
                  the remainder are dismissed on review. A platform where the confirmed column
                  is large is a platform whose detectors are too loose, not one whose candidates
                  are worse.
                </p>
              </PanelBody>
            </Panel>
          </div>

          <Section
            title="Why findings were escalated"
            description="The stated reason, with the share of escalations it accounts for."
          >
            <Panel>
              <PanelBody>
                <ul className="space-y-2.5">
                  {data.topEscalationReasons.map(reason => (
                    <li key={reason.label}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[12.5px] text-neutral-700">{reason.label}</span>
                        <span className="data text-[11.5px] text-neutral-500">
                          {reason.count} · {Math.round(reason.share * 100)}%
                        </span>
                      </div>
                      <div className="meter mt-1.5 h-[3px]">
                        <span className="bg-neutral-700" style={{ width: `${Math.round(reason.share * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          </Section>

          <Section
            title="Question behaviour"
            description="Where candidates spent their time. Slow is not suspicious; it usually means the question was hard."
          >
            <Panel>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left">
                      <th className="px-4 py-2.5 eyebrow font-medium">Q</th>
                      <th className="px-4 py-2.5 eyebrow font-medium">Section</th>
                      <th className="px-4 py-2.5 eyebrow font-medium text-right">Median time</th>
                      <th className="px-4 py-2.5 eyebrow font-medium text-right">Answer changes</th>
                      <th className="px-4 py-2.5 eyebrow font-medium text-right">Revisits</th>
                      <th className="px-4 py-2.5 eyebrow font-medium text-right">Left blank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {questions.map(q => (
                      <tr key={q.questionNumber}>
                        <td className="px-4 py-2.5 data text-neutral-900">{q.questionNumber}</td>
                        <td className="px-4 py-2.5 text-neutral-600">{q.section}</td>
                        <td className="px-4 py-2.5 text-right data text-neutral-700">
                          {formatDuration(q.medianResponseSeconds)}
                        </td>
                        <td className="px-4 py-2.5 text-right data text-neutral-600">
                          {Math.round(q.answerChangeRate * 100)}%
                        </td>
                        <td className="px-4 py-2.5 text-right data text-neutral-600">
                          {Math.round(q.revisitRate * 100)}%
                        </td>
                        <td className="px-4 py-2.5 text-right data text-neutral-600">
                          {Math.round(q.unansweredRate * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </Section>

          <Section
            title="System health"
            description="Readings from the platform itself. These are the numbers worth watching when a detector seems noisier than usual."
          >
            <Panel>
              <ul className="divide-y divide-neutral-100">
                {system.map(row => (
                  <SystemRow key={row.metric} row={row} />
                ))}
              </ul>
            </Panel>
          </Section>
        </>
      )}

      {exam && (
        <p className="text-[11.5px] text-neutral-400 max-w-[78ch] leading-relaxed">
          Figures cover {exam.title} ({exam.sections.length} sections, {exam.durationMinutes} minutes).
          {exam.title.toLowerCase().includes('msa') &&
            ' This sitting observes conduct, not capability: the question analytics are published because a candidate may ask what was timed, and the answer should not depend on who they are.'}
        </p>
      )}
    </div>
  );
}

function SystemRow({ row }: { row: SystemAnalytics }) {
  const tone = row.reading === 'nominal' ? 'nominal' : row.reading === 'watch' ? 'degraded' : 'lost';
  return (
    <li className="px-4 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
      <span className="text-[12.5px] text-neutral-800 w-[190px] shrink-0">{row.metric}</span>
      <span className="data text-[12px] text-neutral-900 w-[110px]">
        {row.value}
        {row.unit ? <span className="text-neutral-400"> {row.unit}</span> : null}
      </span>
      {row.target && (
        <span className="data text-[11.5px] text-neutral-400 w-[110px]">
          target {row.target}
          {row.unit ? ` ${row.unit}` : ''}
        </span>
      )}
      <StatusBadge tone={tone}>{row.reading}</StatusBadge>
      <span className="text-[11.5px] text-neutral-500 flex-1 min-w-[200px]">{row.note}</span>
    </li>
  );
}

function BucketList({ buckets, tone = false }: { buckets: DistributionBucket[]; tone?: boolean }) {
  const total = buckets.reduce((sum, b) => sum + b.count, 0) || 1;
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <ul className="space-y-2.5">
      {buckets.map(bucket => (
        <li key={bucket.label}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[12.5px] text-neutral-700">{bucket.label}</span>
            <span className="data text-[11.5px] text-neutral-500">
              {bucket.count} · {Math.round((bucket.count / total) * 100)}%
            </span>
          </div>
          <div className="meter mt-1.5 h-[3px]">
            <span
              className={tone ? 'bg-neutral-500' : 'bg-neutral-800'}
              style={{ width: `${(bucket.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
