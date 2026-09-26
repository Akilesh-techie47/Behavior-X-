import { ArrowRight, Check } from 'lucide-react';
import { Link } from '../../router';
import { Pipeline } from '../../components/brand/Wordmark';
import { Button } from '../../components/primitives/Button';
import { Section } from '../../components/layout/Page';

const METHOD = ['Observe', 'Contextualize', 'Correlate', 'Filter', 'Explain', 'Review'] as const;

/**
 * The landing page.
 *
 * It has one job: make the product's position legible before anyone signs in.
 * That means the methodology is the hero, not a screenshot, and the one claim
 * on the page is stated as a constraint the product keeps rather than a promise
 * it makes.
 */
export function Landing() {
  return (
    <div>
      <Hero />
      <MethodSection />
      <InterfacesSection />
      <PrinciplesSection />
      <ClosingSection />
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b border-neutral-200">
      <div className="mx-auto max-w-[1180px] px-6 pt-20 pb-16 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-x-16 gap-y-14">
        <div>
          <div className="eyebrow mb-5">Examination observation and evidence</div>
          <h1 className="text-[44px] sm:text-[52px] leading-[1.04] font-semibold tracking-[-0.03em] max-w-[16ch]">
            Don't judge the student.
            <br />
            Understand the evidence.
          </h1>
          <p className="mt-6 text-[16px] leading-relaxed text-neutral-600 max-w-[58ch]">
            BEHAVIOR-X records what was observed during an examination, places each
            observation in the context that produced it, and shows a human the
            evidence needed to reach a decision. It does not produce a verdict, and
            it is not built to.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signin">
              <Button variant="primary" size="lg" iconAfter={<ArrowRight className="w-4 h-4" />}>
                Open examiner console
              </Button>
            </Link>
            <Link to="/student">
              <Button variant="outline" size="lg">
                I have an exam code
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-[12.5px] text-neutral-500">
            Demonstration build. Every record, name and observation is synthetic.
          </p>
        </div>

        <aside className="lg:pt-2">
          <div className="panel p-5">
            <div className="eyebrow mb-4">What the system will not do</div>
            <ul className="space-y-3">
              {[
                'Assign a candidate a risk score, or a probability of misconduct.',
                'Show a candidate any assessment of their behaviour.',
                'Decide a case, or recommend one.',
                'Retain a raw feed longer than the review it supports.',
              ].map(item => (
                <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-neutral-700">
                  <span className="w-3.5 h-3.5 border border-neutral-900 rounded-[2px] grid place-items-center shrink-0 mt-px">
                    <span className="verbatim text-[9px] leading-none">✕</span>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-neutral-200">
              <div className="eyebrow mb-2.5">Instead, it will</div>
              <ul className="space-y-2">
                {[
                  'Record each observation with its source and timestamp.',
                  'Show the coverage, and admit where there is none.',
                  'Separate what was seen from what it might mean.',
                  'Leave the decision, and the reasoning, with a person.',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-neutral-600">
                    <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-px" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MethodSection() {
  return (
    <Section
      title="The method is the product"
      description="Six stages, in order, every time. The order is a constraint, not a preference: a conclusion reached before coverage and quality are known is a conclusion reached on the wrong evidence."
      className="mx-auto max-w-[1180px] px-6 py-16"
    >
      <div className="panel">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          {[
            {
              step: 'Observe',
              body: 'Every source reports what it saw, with a timestamp and a confidence. Nothing is interpreted at this stage.',
              detail: 'Signals are not events. A signal is one detector reporting one observation.',
            },
            {
              step: 'Contextualize',
              body: 'The candidate, the exam, the accommodation, the network, the device, the question. Most unusual behaviour is ordinary behaviour in the right context.',
              detail: 'Coverage and quality are established before anything is read as significant.',
            },
            {
              step: 'Correlate',
              body: 'Independent channels are placed on one timeline, so a single ambiguous signal is tested against what else was happening at the same moment.',
              detail: 'A signal that only one channel supports stays a signal.',
            },
            {
              step: 'Filter',
              body: 'Policy suppression rules remove observations that have an approved explanation, with the rule and its source recorded.',
              detail: 'Suppressed observations stay visible and auditable. They are not deleted.',
            },
            {
              step: 'Explain',
              body: 'A candidate reviewer sees a narrative of what happened, what it means, and what would change the reading — never a score.',
              detail: 'Where a detector is uncertain, the briefing says so and shows its reasoning inputs.',
            },
            {
              step: 'Review',
              body: "A person decides, records why, and that record is the authoritative outcome. The system's role ends here.",
              detail: 'Decisions are append-only, attributable, and exportable.',
            },
          ].map((item, index) => (
            <div key={item.step} className="p-5">
              <div className="flex items-center gap-2.5">
                <span className="data text-[11px] text-neutral-400">0{index + 1}</span>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{item.step}</h3>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-neutral-600">{item.body}</p>
              <p className="mt-2.5 pt-2.5 border-t border-neutral-100 text-[11.5px] leading-relaxed text-neutral-400">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="eyebrow">Workflow</span>
        <Pipeline steps={METHOD} />
      </div>
    </Section>
  );
}

function InterfacesSection() {
  const interfaces = [
    {
      to: '/student',
      label: 'Candidate examination interface',
      body: 'A quiet, single-purpose screen. Question, time remaining, and a way to ask for help. No score, no indicators, no record of the candidate’s own behaviour — a candidate who can see themselves being watched stops thinking about the work.',
    },
    {
      to: '/examinations',
      label: 'Examiner console',
      body: 'A dense, keyboard-navigable workstation for live operations and review. Built to be read in columns, compared across sessions, and operated by someone who has done this for fifteen years.',
    },
    {
      to: '/mobile',
      label: 'Companion device',
      body: 'The phone is a sensor, and its screen says so. Pairing, alignment, and an honest statement of what it is currently observing. No dashboard, because a sensor with opinions is a sensor you cannot trust.',
    },
  ];

  return (
    <section className="border-y border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-[1180px] px-6 py-16">
        <Section
          title="Three interfaces, one record"
          description="They look different because the people using them need different things. They read the same underlying evidence, and none of them can alter it."
        >
          <div className="grid md:grid-cols-3 gap-4">
            {interfaces.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="panel p-5 hover:border-neutral-400 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold">{item.label}</h3>
                  <ArrowRight
                    className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-900 transition-colors"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-neutral-600">{item.body}</p>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  const principles = [
    {
      title: 'Coverage before confidence',
      body: 'A percentage of what was actually observed, stated plainly. Where a camera was blocked for four minutes, the record says so instead of quietly scoring the remaining evidence as though it were complete.',
    },
    {
      title: 'Suppression is recorded, not hidden',
      body: 'When a policy rule explains an observation away, the rule, its source, and the observation it removed stay in the record. A reviewer can always ask what was filtered and why.',
    },
    {
      title: 'A candidate is never a number',
      body: 'No risk score, no confidence percentage presented as a likelihood of misconduct, and nothing at all in the candidate interface. The assessment belongs to a person who can be asked to justify it.',
    },
    {
      title: 'Provenance is visible',
      body: 'Generated records, replayed timelines and simulated devices are marked as such, permanently, in the interface — not in a footnote, and not only in the documentation.',
    },
  ];

  return (
    <Section
      title="Four commitments"
      className="mx-auto max-w-[1180px] px-6 py-16"
      bodyClassName="grid md:grid-cols-2 gap-x-10 gap-y-8"
    >
      {principles.map((item, index) => (
        <div key={item.title} className="flex gap-4">
          <span className="data text-[11px] text-neutral-300 pt-0.5 shrink-0">0{index + 1}</span>
          <div>
            <h3 className="text-[14px] font-semibold">{item.title}</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 max-w-[56ch]">{item.body}</p>
          </div>
        </div>
      ))}
    </Section>
  );
}

function ClosingSection() {
  return (
    <section className="border-t border-neutral-200">
      <div className="mx-auto max-w-[1180px] px-6 py-16 flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-[52ch]">
          <div className="eyebrow mb-4">Demonstration</div>
          <h2 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.02em]">
            Seven sessions, one review, four suppressed observations.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
            The console is populated with a consistent synthetic dataset: live sessions,
            a review queue, coverage gaps, a suppressed observation that was correctly
            not escalated, and an upheld decision. Nothing is decorative.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/examinations">
            <Button variant="primary" size="lg">
              Open the console
            </Button>
          </Link>
          <Link to="/method">
            <Button variant="outline" size="lg">
              Read the method
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
