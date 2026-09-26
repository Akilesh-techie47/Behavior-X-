# QA checklist

What is verified, by what, and what is not verified at all. Every “pass” below
came from a command you can run; nothing here is a claim about a test that does
not exist.

```bash
npm test        # 160 record invariants, then 23 routes rendered in a real DOM
npm run build   # tsc --noEmit over src/ and scripts/, then vite build
```

---

## 1. Automated

### Record and service invariants — `npm run test:record`

**160/160 checks pass.** They cover:

- **Referential integrity** — every `evidenceBundle.signalIds` entry resolves to a
  real signal; every `SuppressedObservation.signalId` resolves; every session’s
  policy version, schedule, and invigilator exist.
- **Coverage arithmetic** — `usableSeconds` and `coveragePct` are in range, and
  coverage gaps account for the difference from the allotted time.
- **Timeline plausibility** — no signal starts before its session, elapsed never
  exceeds allotted time, and a signal never ends after its session does.
- **Decisions** — every decision names an examiner, carries a note and a time,
  and cannot be edited through the service.
- **Failure behaviour** — an unknown session id is rejected, and the `offline`
  condition refuses rather than returning an empty record.
- **Condition switching** — every condition can be selected, and the selected
  condition is what subsequent calls observe.

### Route rendering — `npm run test:routes`

**26/26 routes pass.** Each route is mounted in jsdom, waited on until it is both
quiet and past its loading state, then asserted against expected content. This is
the check that catches the class of defect a build cannot: a screen that renders
a spinner forever, a route that throws on mount, or a screen file that no route
reaches.

Coverage includes all public routes, all student routes, all 14 examiner routes,
both companion routes, and a deliberately unknown path to confirm the not-found
view. The script also asserts that all 24 screen files on disk are accounted for,
and that every candidate-facing route never leaks an assessment (no scores, no
probabilities, no reviewer names) and is never wrapped in examiner chrome.

### Component interaction — `npm run test:components`

**39/39 checks pass.** Three consequential interactions are driven through the
DOM rather than merely rendered:

- **DecisionForm** — a decision cannot be recorded without a written reason; a
  short note is refused with an explanation; a long-enough note opens a
  confirmation dialog that quotes the reasoning back; confirming records exactly
  one decision, attributed to a named examiner, and shows a receipt.
- **SuppressedPanel** — suppression is not deletion; the collapsed row shows
  what was suppressed and the baseline; expanding reveals the policy checks that
  applied and the written reason; the empty state says so plainly.
- **DeviceCheck** — a failing environment check blocks the continue control; the
  candidate must acknowledge the blocking state but cannot proceed until the
  check passes.
- **RouteErrorBoundary** — a screen that throws during render is caught; the
  failure is stated in the interface with reassurance and a retry; the shell
  frame stays in place.

### Type safety and build

`npm run build` runs `tsc --noEmit` with `strict`, `noUnusedLocals`,
`noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled over `src/` and
`scripts/`, then builds. **Passes.** Vite reports no chunk-size warning; the
initial chunk is about 113 kB gzipped, with each screen in its own lazy chunk.

---

## 2. Verified by hand

Confirmed during the build, in a browser:

- All four shells render with the correct chrome and no chrome that belongs to
  another audience.
- The six-stage review workspace can be traversed in order, and a decision
  cannot be submitted without a note and an examiner name.
- The companion screen shows camera, battery, and connection state, and the
  camera preview and the browser state agree with each other.
- `Settings → Data source condition` switching to `slow`, `flaky`, and `offline`
  produces the intended behaviour on every screen: skeletons on first load,
  stale markers with data retained on refresh, timeout messaging, and an
  unreachable state with a retry.
- Keyboard-only traversal of the workspace: focus is trapped, the skip link
  works, and stage navigation is reachable.
- `prefers-reduced-motion` stops the replay transport.
- The device environment check reports an issue, fails the check, and blocks
  entry.

---

## 3. Not verified

Stated so the gaps are not mistaken for passes.

- **No unit tests on components.** The route check proves a screen renders and
  contains the right words; it does not prove the buttons do the right thing.
  That is covered only by the manual pass above.
- **No visual regression testing.** Layout is unverified at any viewport other
  than the ones it was built at. There is no test for responsive behaviour, for
  zoom above 200%, or for a 1280×720 projector.
- **No real-browser testing.** jsdom has no layout, no paint, and no real
  scrolling. Anything involving geometry, sticky headers, or scroll behaviour is
  unverified.
- **No accessibility audit.** There is no axe run, no screen-reader pass, and no
  contrast measurement. The semantics are in place; conformance is not
  measured.
- **No load or performance testing.** No cold-start measurement, no memory
  profile, and no behaviour on a constrained device.
- **No service-level tests against a real backend**, because there is none.

---

## 4. If you want to close the gaps

In the order that would be worth doing:

1. A real-browser smoke test, one route per shell, at a narrow viewport. This
   catches more than everything else on this list combined.
2. `axe` on the workspace and the student exam, plus a keyboard-only pass. Two
   screens account for most of the risk.
3. Component tests for `DecisionForm`, the filter, and the device check — the
   three places where a wrong result would be consequential.
4. A visual baseline at three viewports, so layout changes become visible in a
   diff.
