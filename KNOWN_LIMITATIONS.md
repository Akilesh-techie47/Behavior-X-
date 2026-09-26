# Known limitations

Stated plainly, because a product about transparency that hides its own gaps is
not worth much. Ordered by how much they would matter in a real deployment.

---

## The build itself

- **Every service is a mock.** `src/services/mock/` implements the contracts in
  `src/services/contracts.ts`. The latency and failure profiles are real; the
  data is not.
- **Nothing persists.** A decision recorded in the review workspace lives in the
  mock service for the life of the page. There is no database, no write-ahead
  log, and no way to recover a refresh.
- **There is no authentication.** `/signin` selects a role from a list and
  `CURRENT_EXAMINER` is a fixture. There are no sessions, no tokens, and no
  authorisation checks beyond what the interface implies.
- **Routing is hash-based.** `#/examinations/S-1025` rather than
  `/examinations/S-1025`. It survives a static host and a file path, which is how
  this build is reviewed, and it is the wrong choice behind a real server where
  clean paths matter for logs and for server-side routing.

## The evidence

- **The detectors are templates, not models.** `services/fixtures/sessions.ts`
  lays signals down per storyline with seeded jitter. The confidence values are
  authored, not computed, and nothing in this build demonstrates that a detector
  can or cannot read behaviour from a camera — that is an empirical question
  this codebase takes no position on.
- **The corpus is small and tidy.** Three examinations, twenty sessions, a
  handful of findings, and a confirmed count that is deliberately small. Real
  data is messier: duplicated candidates, abandoned sessions, device changes
  mid-exam, clock drift, and detectors that disagree with each other.
- **The correlation stage is asserted, not implemented.** Bundles in the fixtures
  are authored. The interface shows what a correlation stage would produce and
  what an examiner would do with it; it does not implement the stage.
- **There is no re-derivation.** If a policy clause changes, nothing re-filters
  existing sessions. A real system must keep the clause version that was in force
  when each session was sat, and this build has no such field.

## The interface

- **No error boundaries in the route tree.** A thrown render empties the screen
  rather than showing a recoverable message. `npm run test:routes` catches this
  for the routes it knows about, which is all of them, but only at first render
  and only with the fixtures loaded.
- **The command palette in the examiner shell is a shell.** It opens and lists
  destinations; the search is not fuzzy and the commands are navigation only.
- **Live sessions poll every thirty seconds.** No websocket, no server push, and
  no incremental updates. The elapsed times and “last signal” ages are computed
  from a settled snapshot.
- **Bundle splitting is per screen, not per data set.** The analytics and report
  models travel with their screens rather than being fetched on demand.
- **The device check cannot really check a device.** It reports what the
  environment and the mock services tell it. There is no frame-rate measurement,
  no OS-level process inspection, and no detection of a second machine — because
  building those is a different and much larger product decision, and pretending
  to do it here would be the exact failure this project is about.

## The claims

- **“No score anywhere” is enforced by types, not by review.** The domain model
  has no risk field, which makes adding one a deliberate act rather than an
  oversight. It does not stop someone adding a derived figure in a component.
- **The privacy charter describes intent, not a verified control.** Nothing here
  has been through an assessment, and no statement in this repository should be
  read as a compliance claim.
- **The interface states limits, but the limits are claims.** “This device does
  not record audio” is enforced only by a mock service that never records
  anything. In a real deployment each of those sentences needs a technical
  control behind it and an audit that proves the control held.

## What would have to be true

For any of this to run as an examination system rather than a demonstration:

1. Real services behind the existing contracts, with the transport’s error
   vocabulary preserved so the interface states the right thing.
2. A data store that records what was observed, when, by which process, and
   under which policy version — append-only, with the retention clock enforced
   server-side.
3. Institutional identity, role-based authorisation, and a second-reader rule
   for anything consequential.
4. Independently evaluated detectors, with published false-positive rates, and a
   policy that decides what may be shown to an examiner at all.
5. A candidate-facing privacy notice that has been through legal review, and
   candidate consent that is a real decision rather than a checkbox.
