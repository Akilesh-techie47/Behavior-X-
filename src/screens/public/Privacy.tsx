import { Section } from '../../components/layout/Page';
import { Link } from '../../router';
import { Button } from '../../components/primitives/Button';

/**
 * Data handling.
 *
 * Written in plain language on purpose. A candidate is asked to agree to
 * observation before it starts, and a page full of clause numbers at that
 * moment is not consent, it is a wall.
 */
export function Privacy() {
  return (
    <div className="mx-auto max-w-[860px] px-6 py-14">
      <Section
        title="Data handling"
        description="What is collected, what is not, who can see it, and for how long."
      >
        <div className="panel divide-y divide-neutral-100">
          {[
            {
              title: 'What is recorded',
              body: 'Signals from observation sources: what a detector reported, when, its confidence band, and the device and network conditions in force. Answer text and the time each answer was first entered. Reconnection and coverage-gap events.',
            },
            {
              title: 'What is never recorded',
              body: 'Anything outside the examination window. Your browsing history. Your keystrokes, individually — only that an answer changed and when. Your face as an image, in any view, after the review that required it is closed.',
            },
            {
              title: 'Who can see it',
              body: 'The invigilator sees live status: that you are present, that your devices are connected, and whether you have asked for help. The examiner sees the evidence record for your session when reviewing it. Nobody sees an assessment of your behaviour while you are working.',
            },
            {
              title: 'How long it is kept',
              body: 'The evidence record is kept for the period your institution requires for an appeal to remain possible, and is then deleted with the decision. Raw device feeds are not retained once a review is closed — the record that remains is signals, not footage.',
            },
            {
              title: 'What a decision contains',
              body: 'The decision, the person who made it, the time, and their written reasoning. It does not contain a score, because there is no score to record. If you ask what was decided about your examination and why, that is the whole of it.',
            },
          ].map(item => (
            <section key={item.title} className="p-5">
              <h3 className="text-[14px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 max-w-[68ch]">{item.body}</p>
            </section>
          ))}
        </div>
      </Section>

      <Section title="Your rights" className="mt-12">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Ask what was recorded', body: 'You may request the signal list for your session, including observations that were filtered out and the policy rule that filtered them.' },
            { title: 'Ask for the reasoning', body: 'If a review reached a decision about your session, you may request the reviewer’s written reasoning and the evidence it rested on.' },
            { title: 'Ask for correction', body: 'If the record contains an error — a device that dropped, an accommodation that was not applied — you may ask for it to be corrected, and the correction is appended rather than overwriting.' },
          ].map(item => (
            <div key={item.title} className="panel p-4">
              <h3 className="text-[13px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-neutral-600">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/student">
          <Button variant="primary">Return to your examination</Button>
        </Link>
        <Link to="/help">
          <Button variant="outline">Help centre</Button>
        </Link>
      </div>
    </div>
  );
}
