import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Section } from '../../components/layout/Page';
import { TextInput } from '../../components/primitives/Form';
import { Link } from '../../router';

const TOPICS = [
  {
    group: 'Candidates',
    items: [
      {
        q: 'I did not get an exam code',
        a: 'Codes are issued by your institution and are specific to one sitting. If yours has not arrived, contact your faculty office rather than starting a new session — a new code creates a second record.',
      },
      {
        q: 'My camera is blocked',
        a: 'The device check will tell you which permission is missing. Re-enable it in your browser’s site settings, then press Retry on that row. Your timer keeps running while you do this, and the gap is recorded against you as a coverage gap, not as a mark against you.',
      },
      {
        q: 'Do I need my phone as well as my laptop?',
        a: 'Only if your exam requires a secondary device. The device check tells you whether yours does. A companion phone widens the field of view, which is why it is required for some exams and not others.',
      },
      {
        q: 'Can the invigilator see my screen?',
        a: 'No. Observation covers the camera and microphone on your devices. Screen content is never transmitted, and there is no remote-control or keystroke-logging function in the product.',
      },
      {
        q: 'I lost connection during the exam',
        a: 'Your answers are saved on your device as you type. Reconnect and reopen the same link; you will return to the question you left. The elapsed time continues to count, and the disconnection is recorded with its duration.',
      },
      {
        q: 'Will I be told if something was observed?',
        a: 'You will be told if a review reached a decision, and you may request the reasoning. You are not shown live assessments of your behaviour, because that would affect how you work.',
      },
    ],
  },
  {
    group: 'Examiners',
    items: [
      {
        q: 'What is the difference between coverage and quality?',
        a: 'Coverage is the proportion of the examination for which observation was actually available. Quality is how usable that observation was — a dark, low-frame-rate camera can be connected and still be poor. A session can have high coverage and low quality, or the reverse.',
      },
      {
        q: 'Why was an observation suppressed?',
        a: 'A policy clause explains it away — a documented accommodation, a known network fault, an approved application. The observation, the clause, and the reference are all retained and visible in the session. Suppression removes it from consideration; it does not erase it.',
      },
      {
        q: 'What does a detector confidence mean?',
        a: 'How sure that detector is about its own observation, given what it could see. It is not a probability that misconduct occurred, and it is not comparable between channels. A 94% gaze signal and a 94% tab-switch signal are not the same claim.',
      },
      {
        q: 'Can I change a recorded decision?',
        a: 'Decisions are append-only. You can record a further decision with its own reasoning, and the history remains. Overwriting a decision would break the audit trail that makes the record worth having.',
      },
      {
        q: 'What does it mean when a session is not in the review queue?',
        a: 'Either no policy-relevant observation was correlated, or every observation was explained by a clause. Both are normal outcomes. The session is still in the record and can be opened at any time.',
      },
    ],
  },
  {
    group: 'Data and access',
    items: [
      {
        q: 'Is this a real system?',
        a: 'No. This is a demonstration build. Every candidate, examiner, examination, signal and decision is synthetic, generated to be internally consistent so the interface can be evaluated honestly. Records are labelled as simulated throughout.',
      },
      {
        q: 'Where is the data stored?',
        a: 'In the demonstration build, entirely in your browser. There is no server, no account, and nothing leaves this device. Refreshing loses nothing, because there is nothing real to lose.',
      },
      {
        q: 'How do I report a problem with the product?',
        a: 'In a real deployment this would go to your institution’s administrator. In the demonstration build there is no support channel, because there is nothing running to support.',
      },
    ],
  },
];

export function Help() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const visible = TOPICS.map(topic => ({
    ...topic,
    items: topic.items.filter(
      item =>
        !needle || item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle),
    ),
  })).filter(topic => topic.items.length > 0);

  return (
    <div className="mx-auto max-w-[860px] px-6 py-14">
      <Section title="Help centre" description="Answers to what people actually ask, in the words they ask it.">
        <TextInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search the help centre…"
          aria-label="Search help"
          className="max-w-[420px]"
        />
      </Section>

      <div className="mt-8 space-y-8">
        {visible.length === 0 && (
          <p className="text-[13px] text-neutral-500">
            Nothing matches “{query}”. Try a shorter term.
          </p>
        )}

        {visible.map(topic => (
          <section key={topic.group}>
            <h2 className="eyebrow mb-3">{topic.group}</h2>
            <div className="panel divide-y divide-neutral-100">
              {topic.items.map(item => {
                const isOpen = open === item.q;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : item.q)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-[13px] font-medium text-neutral-900">{item.q}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 -mt-1">
                        <p className="text-[12.5px] leading-relaxed text-neutral-600 max-w-[72ch]">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Link to="/signin">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-[12.5px] font-medium text-neutral-700 hover:text-neutral-900"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            Examiner console
          </button>
        </Link>
      </div>
    </div>
  );
}
