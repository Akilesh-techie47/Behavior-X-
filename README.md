# BEHAVIOR-X

**Don’t judge the student. Understand the evidence.**

An examination integrity platform that records what happened during a sitting,
correlates the observations, filters them against written policy, and leaves the
decision to a named examiner. There is no score, no rank, and no probability of
misconduct anywhere in the product — not because they were hidden, but because
they were never built.

This repository is a working front end with mock services behind real contracts.
Every record in it is generated. Nothing here observes a real person.

---

## Why it is built this way

Proctoring software that produces a number about a candidate invites the reader
to argue with the number. If a system says *73%*, the argument is about whether
73 is high, and the evidence is already secondary. So this product does the
opposite and is organised around making the evidence primary and the judgement
attributable:

- The **record** is the artefact. Signals, gaps, and the reasons they were
  suppressed are all inspectable, and every one of them is reachable from a
  session.
- **Policy does the filtering, not a threshold.** A detector cannot remove an
  observation; only a clause written by a person can, and the clause, the check
  that matched, and the baseline it was compared against are all shown.
- **A decision belongs to somebody.** Every decision carries a name, a time, and
  a written reason, and it appears in the audit log.
- **Absences are shown as absences.** A missing camera is a coverage gap with a
  duration. It is never a mark against the candidate.
- **The candidate can see the machine.** The companion device shows its camera
  view, battery, and connection continuously, and the browser states plainly what
  is and is not recorded.

The examiner workflow the interface is built around:

```
OBSERVE → CONTEXTUALIZE → CORRELATE → FILTER → EXPLAIN → REVIEW
```

`src/components/examiner/Workspace.tsx` is that workflow, one stage at a time,
and the record is available in every one of them.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command             | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Dev server with HMR on port 3000                                |
| `npm run build`     | Typecheck, then build to `dist/`                                 |
| `npm run preview`   | Serve the built output on port 4173                              |
| `npm run typecheck` | `tsc --noEmit` over `src/` and `scripts/`                        |
| `npm test`          | Record invariants, then every route rendered in a real DOM      |
| `npm run test:record` | Referential integrity of the fixtures and the services        |
| `npm run test:routes` | Mount all 23 routes in jsdom and assert their content         |

There is no `.env` requirement, no API key, and no backend. The mock services
apply a real latency profile and can be made slow, flaky, or offline from
**Settings → Data source condition**, so the loading, stale, timeout, and
offline states of every screen are reachable on demand.

---

## The four interfaces

| Path                        | Audience   | What it is for                                                    |
| --------------------------- | ---------- | ----------------------------------------------------------------- |
| `/`, `/method`, `/privacy`  | Public     | What the system does, what it records, and what it refuses to do    |
| `/signin`                   | Both       | Role selection; a demonstration build has no real accounts        |
| `/student/*`                | Candidate  | Entry, environment check, agreement, the exam, submission           |
| `/student/withdraw`         | Candidate  | Withdrawal, available at any time, including mid-examination       |
| `/examinations`             | Examiner   | Operations console: coverage, quality, channel health              |
| `/queue`                    | Examiner   | Review queue, ordered by evidence rather than by arrival           |
| `/live`                     | Examiner   | Live sessions and their coverage, explicitly not a conduct view    |
| `/examinations/:id`         | Examiner   | The six-stage review workspace                                    |
| `/evidence`                 | Examiner   | Every observation across the sitting, as a calibration corpus      |
| `/policy`                   | Examiner   | Every clause, in full, with provenance                             |
| `/schedule`                 | Examiner   | The programme and the readiness steps around each sitting           |
| `/reports`                  | Examiner   | Per-examination summaries                                         |
| `/analytics`                | Examiner   | Aggregate figures about the platform, never about a person         |
| `/devices`                  | Examiner   | Observation sources and the gaps they caused                      |
| `/audit`                    | Examiner   | Who read a record and who decided                                 |
| `/settings`                 | Examiner   | Display preferences; no detector thresholds, deliberately         |
| `/pair`                     | Examiner   | Companion pairing, in a device frame                              |
| `/companion`                | Candidate  | The companion device’s own screen                                 |

---

## Architecture in one page

```
src/
  domain/        types and formatters — the vocabulary, with no UI in it
  services/      contracts, mock implementations, and fixtures
    contracts.ts   the seam: every method async, every method able to fail
    mock/          the implementations, behind a real latency/failure profile
    fixtures/      the generated corpus
  hooks/         useAsync (one loading/error/refreshing machine), and the rest
  router/        hash router, ~110 lines, no dependency
  components/    primitives → layout → feedback, then examiner components
  shells/        the four frames, one per audience
  screens/       one folder per audience
  App.tsx        the route table, split by shell
```

Three decisions carry most of the weight:

**The service seam is the only way in.** No screen imports a fixture. Swapping
the mock services for real ones is a change to `src/services/index.ts` and
nothing else, which is what makes the boundary worth having.

**`useAsync` is the only async primitive.** It distinguishes *unreachable* from
*timed out* from *failed*, because those three need different interface
responses: keep the last known data and mark it stale, offer a retry, or explain
what failed. One hook means no screen invents its own idea of “loading”.

**Shells are chosen by path, not by flag.** It is not possible to render the
examiner’s chrome around the candidate’s interface, which is the failure this
product is most likely to have if the wiring is done lazily.

See `ARCHITECTURE.md` for the longer version.

---

## Accessibility and behaviour

- Every control is label-associated; errors use `aria-invalid` and
  `aria-describedby` rather than colour alone.
- `prefers-reduced-motion` is respected by the replay transport and honoured as a
  stored preference.
- The review workspace is a focus-trapped surface with a skip link and
  keyboard-reachable stage navigation.
- Tables are real tables with captions and sortable headers; numeric columns are
  right-aligned and monospaced so figures can be compared down a column.
- The palette is monochrome by design. Nothing in the interface uses colour as
  the only signal: every state that has a tone also has a word.

---

## What this build is not

It is not a proctoring system, and it is not a claim that behaviour can be read
reliably from a web camera. It is an argument, made in working code, that the
honest version of this product looks like this.

The known gaps are listed in `KNOWN_LIMITATIONS.md`. The short version: the
services are mock, the evidence is synthetic, there is no real authentication,
no persistence, and the detectors are fixtures rather than models. What *is*
real is the interface, the policy mechanism, the attribution of decisions, and
the audit trail.
