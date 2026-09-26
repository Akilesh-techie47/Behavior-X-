# Privacy charter

What this product says about candidate data, and how each claim is meant to be
enforced. This is a specification of intent for a demonstration build, not a
compliance document, and nothing here has been through an assessment.

---

## 1. The principle

**A candidate should be able to find out what is recorded about them, read it,
and have a person accountable for what was done with it.**

Every rule below follows from that. Where a rule and convenience conflict,
convenience loses.

## 2. What is recorded

| Recorded                          | Not recorded                          |
| --------------------------------- | ------------------------------------- |
| A low-resolution rolling view of the companion device’s surroundings | Screen contents, keystrokes, clipboard, browsing history |
| The time, duration, and reason for every interruption to that view | Microphone audio, camera roll, files, location |
| Which sources were connected, and their health | Page content, form fields, typed text |
| The time, source, and confidence of each detector observation | A risk score, a rank, a probability |
| Coverage gaps, with their durations | Anything about a candidate the candidate did not cause |

The rule underneath the table: **the record describes the system, not the
person.** “The phone camera stopped for 4 minutes because the app was
backgrounded” is a fact. “The candidate was absent” is an interpretation, and
interpretations belong to a person who has read the facts.

## 3. Minimisation

- The companion camera is **low resolution and rolling**. There is no
  high-fidelity capture, and nothing is retained beyond the session window.
- No content channel exists in the domain model. Adding one would be a change of
  product, and the type is where that shows.
- Every artefact carries `simulated: true` in this build, and every artefact in
  a real deployment would carry its source, its time, and the policy version
  applied to it.

## 4. Consent

- The agreement is a separate step the candidate reads, not a line in a terms
  of service. It states what is recorded, what is not, how long it is kept, and
  who can read it.
- It is a precondition for pairing, not a consequence of it. Nothing records
  before the agreement is accepted.
- **Withdrawal is available at any time**, including mid-examination, and is one
  control in the candidate’s frame rather than a request to an invigilator.

## 5. Transparency to the candidate

- The companion device shows its **camera view, battery, and connection status**
  continuously. The candidate can see the machine while it is running.
- The browser states, in the interface, what is and is not recorded — not in a
  policy document the candidate has to find.
- Coverage gaps caused by the candidate’s own environment are shown to the
  examiner as gaps, with their durations, and are never counted against the
  candidate.

## 6. Purpose limitation

- Observations exist to answer a question about examination conduct. They are
  not used to rank candidates, to compare cohorts, to train a model, or for any
  purpose outside the documented process.
- **Analytics are aggregate by construction.** `/analytics` reports on sessions
  and system health; no figure on it can be traced to an individual.
- Reports contain reviewer decisions with a named reviewer. They contain no
  per-candidate figure and no content.

## 7. Human decision-making

- No observation becomes a finding on a detector’s say-so. Correlation groups
  observations; **only a written policy clause may remove one**, and the clause,
  the check that matched, and the baseline are all shown in the record.
- Every decision carries a name, a kind, and a written reason, and cannot be
  edited afterwards. A decision made in error is corrected by a further recorded
  decision, not by an edit.
- Model output, where it exists, is offered at the explain stage as a briefing
  with its standing stated. It is never a conclusion, and it is never shown to
  a candidate.

## 8. Access, audit, and retention

- Every read of a candidate’s record leaves an entry in the audit log, and every
  entry is derived from the record itself rather than stored beside it, so the
  two cannot disagree.
- The audit log contains the fact of a review, not its content: the rationale
  belongs to the session where a second reader will meet it in context.
- Retention is set per examination, enforced server-side, and displayed in the
  interface. In a real deployment a candidate could ask when their record will be
  destroyed and get an answer from the system rather than from a person.
- Export requires a stated reason, which is recorded.

## 9. What this build does not prove

Every sentence above describes intent expressed in a demonstration with mock
services. In particular:

- “Not recorded” is enforced here by a mock service that records nothing.
- No control in this repository has been independently verified.
- Nothing here constitutes legal advice, and a real deployment would need a
  candidate-facing notice that has been through review by someone qualified to
  write it.
