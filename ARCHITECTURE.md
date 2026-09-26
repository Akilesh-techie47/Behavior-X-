# Architecture

This is the map of the code and the reasoning behind the parts that are not
obvious. It describes what exists, not what was planned.

---

## 1. The shape of the thing

```
                      ┌──────────────────────────────┐
                      │          screens/            │   one folder per audience
                      │  public · student · examiner │
                      └──────────────┬───────────────┘
                                     │
                      ┌──────────────┴───────────────┐
                      │     components/ + shells/    │   presentational only
                      └──────────────┬───────────────┘
                                     │
                      ┌──────────────┴───────────────┐
                      │           hooks/             │   useAsync and friends
                      └──────────────┬───────────────┘
                                     │
                      ┌──────────────┴───────────────┐
                      │       services/ (index)      │   the only way in
                      └──────────────┬───────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
    ┌─────────┴─────────┐                     ┌─────────────┴────────────┐
    │ services/mock/*   │                     │ services/fixtures/*      │
    │ latency, failure, │                     │ generated sessions,      │
    │ domain assembly   │                     │ exams, people, analytics │
    └───────────────────┘                     └──────────────────────────┘
```

The rule the whole codebase rests on: **nothing in `components/` or `screens/`
imports from `services/fixtures/`.** Everything goes through the registry in
`services/index.ts`. That is what makes the mock boundary replaceable, and it is
why a screen cannot accidentally depend on the shape of a fixture.

### Layer responsibilities

| Layer                     | May import                                | Must not                              |
| ------------------------- | ----------------------------------------- | ------------------------------------- |
| `domain/`                 | nothing                                   | React, services                       |
| `services/`              | `domain/`                                 | React                                  |
| `hooks/`                 | React, `domain/`, `services/contracts`     | fixtures, components                  |
| `components/`            | React, `domain/`, other components         | services, fixtures                    |
| `shells/`                | React, router, components                 | services                              |
| `screens/`               | everything below it                       | fixtures                              |
| `App.tsx`                | shells, screens, router                   | —                                      |

---

## 2. The domain model

`src/domain/types.ts` is the vocabulary, and it is deliberately opinionated:

- **`EvidenceSignal`** — one observation. It carries the channel, the category,
  the detector confidence *and* a strength band, the measured values, and the
  source that produced it. It is a fact about a recording, not a conclusion.
- **`EvidenceBundle`** — a set of signals that the correlation stage judged to be
  one event. A bundle has a `disposition` (`escalated`, `suppressed`,
  `observation_only`) and a list of `signalIds` that must resolve. There is no
  score on a bundle.
- **`SuppressedObservation`** — an observation that policy removed, kept in the
  record with its `signalId`, the clause checks that ran, and the baseline it was
  compared against. Suppression is a *finding*, not a deletion.
- **`CoverageGap`** — an interval during which a source was not recording, with a
  reason. Gaps appear in session totals, in the devices page, and in every
  conclusion drawn from that session.
- **`ReviewDecisionRecord`** — a decision with `examinerId`, `examinerName`, a
  note, and a time. The name is not optional; that is the point of it.

The absence of a risk, anomaly, or confidence-of-misconduct field is the
load-bearing decision. Adding one later would be a change of product, not a
refactor, and the type is where that is most visible.

`src/domain/format.ts` holds every formatter, so that “2m 18s” and “08:12” are
produced in one place. It also holds `CHANNEL_LABEL` and the channel ordering, so
no screen invents a channel abbreviation.

---

## 3. The service seam

`services/contracts.ts` defines six services: `exam`, `sessions`, `devices`,
`evidence`, `ai`, `analytics`. Three properties are enforced by convention and
checked by `scripts/verifyRecord.ts`:

1. **Every method is asynchronous and can fail.** There are no synchronous
   getters and no methods that return a default when the service is down.
2. **Failure is typed.** `ServiceUnavailableError` and `ServiceTimeoutError` are
   distinct because the interface has to respond to them differently.
3. **Unknown ids are rejected.** `sessions.get('no-such-session')` throws rather
   than returning an empty record, so a broken link cannot look like an empty
   session.

`services/mock/transport.ts` wraps every call in a latency and failure profile
selectable at runtime:

| Condition | Latency        | Failure rate | What it is for                    |
| --------- | -------------- | ------------ | --------------------------------- |
| `nominal` | 120–320 ms     | 0            | Normal use                        |
| `slow`    | 1.8–2.6 s      | 0.25 timeout | Progress states and retry         |
| `flaky`   | 200–900 ms     | 0.30         | Stale data that stays on screen   |
| `offline` | 300–700 ms     | 1.0          | Unreachable-service handling      |

This exists so the awkward states can be *reviewed* rather than discovered during
a live sitting. Settings → Data source condition switches between them.

### Fixtures

`services/fixtures/sessions.ts` is a seeded generator: each session spec produces
a storyline (`routine`, `review_candidate`, `second_review`, `suppressed_gaze`,
`coverage_gap`, `upheld`, `camera_occluded`), and the signals for that storyline
are laid down on a timeline with jitter from a seeded RNG, so a given session id
always produces the same record.

Two invariants are enforced inside `push()` rather than left to each storyline:
offsets are clamped inside the session, and suppressed observations must name a
real signal. Both are checked by `npm run test:record`.

---

## 4. Data fetching

`hooks/useAsync.ts` is the single async primitive. Its state is:

```ts
{ status: 'idle' | 'loading' | 'success' | 'error', data, error, refreshing }
```

where `error` is `{ kind: 'unavailable' | 'timeout' | 'other', message }`. The
distinction is the whole point:

- **unavailable** — keep the data on screen, mark it stale, offer a retry;
- **timeout** — say the request exceeded its budget, offer a retry;
- **other** — usually a not-found; say what was not found.

`refreshing` exists so a background reload over existing data is not
indistinguishable from a first load. A screen that blanks while refreshing makes
an examiner think they have lost their place.

`useAction` is the mutation counterpart, with `pending`, `error`, and
`clearError`. It is what `DecisionForm` uses to record a decision and show the
save receipt.

The other hooks are small and exist because two or more screens needed the same
behaviour: `useCountdown`, `useTick`, `useMediaQuery`, `usePrefersReducedMotion`,
`useFocusTrap`, `useStoredState`.

---

## 5. Routing

`src/router/index.tsx` is a hash router in about 110 lines: `useRoute`,
`navigate`, `Link`, `match`, `useQueryParam`. Hash rather than history because
the build is reviewed from a static host and from a file path, and because a
session deep link like `#/examinations/S-1025` has to survive being pasted into a
review panel.

`Link` renders a real anchor with a real `href`, so middle-click, “open in new
tab”, and “copy link address” all behave.

`App.tsx` picks the shell by path prefix and then picks the screen. The shell is
not a prop, so no screen can be rendered in the wrong frame.

Screens are loaded with `React.lazy` per screen, which is why the initial chunk
is ~113 kB gzipped and the examiner’s console is not in it. A candidate on a poor
connection should not download an analytics model.

---

## 6. The four shells

`shells/PublicShell.tsx`
Marketing and policy pages. Navigation and footer, nothing else.

`shells/StudentShell.tsx`
The candidate’s frame: no navigation, no analytics, nothing to explore. Two
permanent fixtures — the examination title and the time remaining — and two
permanent escapes: support and withdrawal. A candidate must never be trapped in
an interface.

`shells/ExaminerShell.tsx`
Navigation grouped Operations / Evidence / Programme / Administration, the
signed-in examiner, and a command palette. Takes `examiner` and `sessions` as
props so it stays presentational and can be rendered with fixed data; `App.tsx`
supplies them.

`shells/MobileShell.tsx`
The companion device’s frame, with an optional handset outline for when the
companion screen is being reviewed on a desktop.

---

## 7. The review workspace

`src/screens/examiner/Workspace.tsx` is the product. One session, six stages:

| Stage           | What the examiner does                                             |
| --------------- | ------------------------------------------------------------------ |
| Observe         | Scrubs the session; every source and gap is visible                |
| Contextualize  | Places the selected signal in its question, window, and baseline   |
| Correlate       | Reads what the correlation stage grouped, and what it excluded     |
| Filter          | Reads each suppressed observation, its clause checks, its baseline |
| Explain         | Asks for a briefing; it is offered, never pushed                   |
| Review          | Records a decision with a name, a kind, and a written reason      |

The evidence components under `components/examiner/` are each one panel of this:
`CoveragePanel`, `SignalTable`, `CorrelationTimeline`, `EvidenceGraphView`,
`SuppressedPanel`, `BriefingPanel`, `DecisionForm`, `ReplayControls`,
`CandidateContext`.

The replay transport is a simulated transport, labelled as such, and it steps
frame by frame. It is not video and it does not pretend to be.

---

## 8. Verification

Two scripts, both run by `npm test`:

**`scripts/verifyRecord.ts`** — 160 checks against the services and fixtures:
every bundle resolves to real signals, every suppressed observation names one,
coverage arithmetic is in range, elapsed never exceeds the allotted time, unknown
ids are rejected, every decision is attributed and written, and the offline
condition refuses rather than inventing data.

**`scripts/routeCheck.tsx`** — mounts all 23 routes in jsdom, waits for each to
settle past its loading state, and asserts the content is there. It fails a
route that renders a spinner forever, which a build cannot catch, and it fails if
a screen file exists that no route reaches.

`npm run build` runs `tsc --noEmit` first, with `strict`, `noUnusedLocals`,
`noUnusedParameters`, and `noFallthroughCasesInSwitch` on, over `src/` and
`scripts/`.

---

## 9. Deliberate omissions

- No authentication. Sign-in selects a role from a list; the identity is a
  fixture.
- No persistence. A recorded decision lives in the mock service for the life of
  the page.
- No real detectors. Signals are generated from storyline templates.
- No i18n. All copy is English, and the copy is load-bearing here — the interface
  explains what it is not doing, which does not survive machine translation
  without rewriting.
