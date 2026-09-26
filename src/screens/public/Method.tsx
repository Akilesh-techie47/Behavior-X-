import { Link } from '../../router';
import { Pipeline } from '../../components/brand/Wordmark';
import { Section } from '../../components/layout/Page';
import { Button } from '../../components/primitives/Button';
import { useAsync } from '../../hooks';
import { services } from '../../services';
import { SimulatedMark } from '../../components/feedback/StateBlock';

/** The method, stated fully enough to be disagreed with. */
export function Method() {
  const policy = useAsync(() => services.exam.getExam('EX-4417'), []);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <Section
        title="Method"
        description="How an observation becomes a record a person can decide on, and where the system stops."
      >
        <div className="panel p-6">
          <p className="text-[15px] leading-relaxed text-neutral-800 max-w-[70ch]">
            The premise of this product is that most examination misconduct is not
            detectable by watching a candidate, and that the appearance of misconduct is
            usually explicable. A system that cannot represent that honestly will either
            accuse the diligent or exonerate the careless, and it will do so at scale.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-neutral-600 max-w-[70ch]">
            So the system is built to be wrong in the visible direction. It states its
            coverage, admits its gaps, shows the observations it discarded and why, and
            stops before the decision. A reviewer who disagrees with the evidence can
            always see the evidence; a reviewer who disagrees with a score cannot.
          </p>
        </div>
      </Section>

      <Section title="The six stages" className="mt-12">
        <div className="panel">
          <Pipeline
            steps={['Observe', 'Contextualize', 'Correlate', 'Filter', 'Explain', 'Review']}
            orientation="vertical"
            className="p-5"
          />
        </div>
      </Section>

      <Section
        title="What a signal is"
        description="A signal is one detector reporting one observation at one moment. It carries a category, a channel, a confidence, and a source condition. It is not an event, and it is not an accusation."
        className="mt-12"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="panel p-5">
            <h3 className="text-[13.5px] font-semibold">Carries</h3>
            <ul className="mt-3 space-y-2 text-[12.5px] text-neutral-600">
              <li>· Category — observation, browser, interaction, integrity, or system</li>
              <li>· Channel — the specific evidence source it came from</li>
              <li>· Confidence — how sure the detector is, shown as a band, never a probability</li>
              <li>· Timestamp and position in the session</li>
              <li>· The source conditions in force when it was produced</li>
            </ul>
          </div>
          <div className="panel p-5">
            <h3 className="text-[13.5px] font-semibold">Does not carry</h3>
            <ul className="mt-3 space-y-2 text-[12.5px] text-neutral-600">
              <li>· A judgement about intent</li>
              <li>· A probability that misconduct occurred</li>
              <li>· A weight that aggregates into a score</li>
              <li>· Any persistence outside the session it belongs to</li>
            </ul>
          </div>
        </div>
      </Section>

      {policy.data && (
        <Section
          title="Policy clauses in the demonstration dataset"
          description="Every suppression rule the filters stage applies is drawn from a clause a human wrote. The clause is stored with the observation it removed, so a reviewer can audit the filter itself."
          className="mt-12"
          actions={<SimulatedMark label="Simulated policy set" />}
        >
          <div className="panel overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead className="bg-neutral-50">
              <tr>
                {['Clause', 'Reference', 'Rule', 'Applies to'].map(header => (
                    <th
                      key={header}
                      scope="col"
                      className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-neutral-500 border-b border-neutral-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policy.data.policy.map(clause => (
                  <tr key={clause.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2.5 data text-[11.5px] text-neutral-500 align-top">
                      {clause.id}
                    </td>
                    <td className="px-4 py-2.5 data text-[11.5px] text-neutral-600 align-top whitespace-nowrap">
                      {clause.reference}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-800 align-top max-w-[42ch]">
                      {clause.text}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600 align-top">
                      {clause.appliesTo.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/examinations">
          <Button variant="primary">See it applied</Button>
        </Link>
        <Link to="/privacy">
          <Button variant="outline">Data handling</Button>
        </Link>
      </div>
    </div>
  );
}
