/**
 * Route smoke test, in a real DOM.
 *
 * Each route is mounted, allowed to settle, and then asked two questions:
 * does it render without throwing, and does it show the content it is
 * supposed to show? A screen that renders a spinner forever is a failure here
 * even though nothing threw, which is the failure a static build cannot see.
 *
 * This is what a reviewer would meet on clicking a link, so it is what the
 * check asserts: the examiner's own words and figures, on screen, from the
 * fixtures.
 *
 * Run with: npx tsx scripts/routeCheck.tsx
 */

import { JSDOM } from 'jsdom';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://example.test/#/',
  pretendToBeVisual: true,
});

const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (fn: FrameRequestCallback) => dom.window.setTimeout(() => fn(Date.now()), 16);
g.cancelAnimationFrame = (id: number) => dom.window.clearTimeout(id);
g.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});
// jsdom leaves `window.matchMedia` off in some versions; the reduced-motion
// hook reads it during the first render, so it has to exist.
if (typeof (dom.window as unknown as { matchMedia?: unknown }).matchMedia !== 'function') {
  Object.defineProperty(dom.window, 'matchMedia', {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }),
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(dom.window.HTMLElement.prototype, 'focus', { value() {} });
// The app never asks for a real media stream, but a getter that throws would
// make every device check fail for the wrong reason.
Object.defineProperty(dom.window.navigator, 'mediaDevices', {
  value: {
    enumerateDevices: async () => [],
    getUserMedia: async () => {
      throw new Error('unavailable in this environment');
    },
  },
  configurable: true,
});

/** Lets queued microtasks and one timer tick run, so promises settle. */
async function settle(ms = 60): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits for the lazy chunk to arrive rather than guessing how long that takes:
 * the first dynamic import of a screen is compiled on demand and is far slower
 * than the rest. Returns false if the fallback is still on screen at the limit.
 */
async function waitForContent(container: Element, timeoutMs = 8000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const text = (container.textContent ?? '').toLowerCase();
    if (text.length > 0 && !text.includes('loading this view')) return true;
    await settle(40);
  }
  return false;
}

/**
 * Waits for the screen to stop changing *and* to have stopped asking for data.
 *
 * Three separate signals, because each one alone has been caught out:
 *
 *  - Text stability. A loading state is stable too, so this is necessary and not
 *    sufficient — it caught `/analytics`, which chains two requests and was
 *    declared settled while still fetching.
 *  - `role="status"`. Every skeleton in `components/feedback/StateBlock.tsx`
 *    carries it, so this is a semantic signal rather than a guessed word, and it
 *    catches a panel that loads into a silent grey box.
 *  - A quiet *window*, not a quiet *poll*. Two sequential calls can take 640 ms
 *    at the slow end of the nominal profile, which is longer than any handful of
 *    identical polls. `/pair` was being read at 365 characters with the pairing
 *    code still missing for exactly this reason.
 */
const LOADING_MARKERS = /loading (this view|review queue|live sessions|analytics|reports|evidence library|policy library|schedule|devices|audit|settings|record|console|rows|row|pairing)/;

const QUIET_MS = 450;
const POLL_MS = 50;

async function waitForQuiet(container: Element, timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let previous = '';
  let quietSince = 0;

  while (Date.now() < deadline) {
    await settle(POLL_MS);
    const current = container.textContent ?? '';
    const busy = container.querySelector('[role="status"]') !== null;
    const quiet = current.length > 0 && current === previous && !busy && !LOADING_MARKERS.test(current.toLowerCase());

    if (quiet) {
      if (quietSince === 0) quietSince = Date.now();
      if (Date.now() - quietSince >= QUIET_MS) return;
    } else {
      quietSince = 0;
    }
    previous = current;
  }
}

/**
 * What must never reach the candidate interface, and why it is checked this way.
 *
 * A plain word ban does not work here, and the first version of this check
 * proved it: `/student` contains "is scored, ranked, or shown to you" and
 * `/student/submitted` contains "confirm that your session was not escalated".
 * Both are the promises this product is making, and a substring ban flags them
 * as leaks. Banning a word punishes the interface for telling the truth.
 *
 * So the check is split in two:
 *
 *  - `CANDIDATE_BANNED` are the nouns that have no legitimate candidate-facing
 *    use at all. Nothing in the candidate's interface may name an anomaly, a
 *    reviewer, a verdict, a briefing, or a suppression.
 *  - `ASSESSMENT_VALUE` catches the thing that would actually be a breach: a
 *    number attached to a judgement. A percentage is fine for a battery level,
 *    so the ban is on proximity — "confidence 82%" and "82% confidence" both
 *    fail, and neither trips over an unrelated number.
 *
 * The promises are then asserted as present, so deleting the reassurance is a
 * test failure rather than a silent improvement.
 */
const CANDIDATE_BANNED = ['anomal', 'misconduct', 'reviewer', 'verdict', 'briefing', 'suppress'];

const ASSESSMENT_VALUE =
  /(?:risk|confidence|score|scoring|probabilit\w*|likelihood|odds|chance)\w*\s*[:=]?\s*\d+(?:\.\d+)?\s?%|\d+(?:\.\d+)?\s?%\s*(?:risk|confidence|score|probabilit\w*|likelihood|odds|chance)/i;

/** Chrome that belongs to the examiner and must never wrap a candidate page. */
const EXAMINER_CHROME = ['senior invigilator', 'review queue', 'evidence library', 'search sessions'];

interface RouteCase {
  path: string;
  /** Lower-cased substrings that must all be present once settled. */
  expect: string[];
  /** Lower-cased substrings that must be absent. */
  forbid?: string[];
  /** Run the candidate-leak and examiner-chrome assertions on this route. */
  candidate?: boolean;
  /** Run the examiner-frame assertion on this route. */
  examiner?: boolean;
  /** A reassurance the candidate is entitled to, which must stay on the page. */
  promise?: string;
}

const CASES: RouteCase[] = [
  { path: '/', expect: ['evidence'] },
  { path: '/method', expect: ['observe', 'correlate'] },
  { path: '/privacy', expect: ['record'] },
  { path: '/help', expect: ['invigilator'] },
  { path: '/signin', expect: ['sign in'] },

  /* /privacy is not leak-checked: it is the page that explains what a review
   * is and that a candidate may request the reasoning, so it necessarily names
   * the reviewer. The check would fail on the promise, as it did elsewhere. */
  { path: '/student', expect: ['examination'], candidate: true, promise: 'ranked, or shown to you' },
  { path: '/student/check', expect: ['check'], candidate: true },
  { path: '/student/agreement', expect: ['agreement'], candidate: true },
  { path: '/student/exam', expect: ['question 1 of 20', 'next question'], candidate: true },
  { path: '/student/submitted', expect: ['receipt', 'submitted'], candidate: true, promise: 'not escalated' },
  { path: '/student/withdraw', expect: ['withdrawn'], candidate: true },
  { path: '/examinations', expect: ['console', 'coverage'], examiner: true },
  { path: '/queue', expect: ['queue', 'coverage'], examiner: true },
  { path: '/live', expect: ['live'], examiner: true },
  { path: '/examinations/S-1025', expect: ['observe', 'coverage'], examiner: true },
  { path: '/evidence', expect: ['evidence'], examiner: true },
  { path: '/policy', expect: ['clause', 'policy'], examiner: true },
  { path: '/schedule', expect: ['schedule'], examiner: true },
  { path: '/reports', expect: ['report'], examiner: true },
  { path: '/analytics', expect: ['analytic'], examiner: true },
  { path: '/devices', expect: ['device'], examiner: true },
  { path: '/audit', expect: ['audit'], examiner: true },
  { path: '/settings', expect: ['setting'], examiner: true },
  { path: '/pair', expect: ['pair'], examiner: true },
  { path: '/companion', expect: ['companion', 'record'], candidate: true },
  { path: '/nowhere', expect: ['not'] },
];

function screenFiles(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) found.push(...screenFiles(full));
    else if (entry.endsWith('.tsx')) found.push(full);
  }
  return found;
}

let failures = 0;

async function main(): Promise<void> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('../src/App');

  /* `--dump=/path` prints one route's settled text and exits. Assertions are
   * guesses about wording until you have read the wording. */
  const dump = process.argv.find(a => a.startsWith('--dump='))?.slice('--dump='.length);

  if (!dump) console.log('Route check, mounted in a DOM\n');

  for (const testCase of CASES) {
    if (dump !== undefined && testCase.path !== dump) continue;

    dom.window.location.hash = `#${testCase.path}`;

    /* A fresh container and a fresh root per route: re-rendering into a root
     * that React still owns throws a DOM error that has nothing to do with the
     * screen under test. */
    const container = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(container);
    const root = createRoot(container);

    let thrown: string | null = null;
    let arrived = false;
    try {
      root.render(React.createElement(App));
      arrived = await waitForContent(container);
      await waitForQuiet(container);
    } catch (error) {
      thrown = error instanceof Error ? error.message : String(error);
    }

    const raw = container.textContent ?? '';
    const text = raw.toLowerCase();
    root.unmount();
    container.remove();

    if (dump !== undefined) {
      console.log(`--- ${testCase.path} (${raw.length} chars) ---`);
      console.log(raw);
      continue;
    }

    if (thrown !== null) {
      failures += 1;
      console.log(`  FAIL  ${testCase.path} — threw: ${thrown}`);
      continue;
    }

    if (!arrived) {
      failures += 1;
      console.log(`  FAIL  ${testCase.path} — the screen never arrived within the time limit`);
      continue;
    }

    const missing = testCase.expect.filter(needle => !text.includes(needle.toLowerCase()));
    if (missing.length > 0) {
      failures += 1;
      console.log(
        `  FAIL  ${testCase.path} — missing ${missing.map(m => `“${m}”`).join(', ')} · rendered ${text.length} chars · “${text.slice(0, 200)}”`,
      );
      continue;
    }

    if (/loading this view|loading review queue|loading live sessions|loading analytics/.test(text)) {
      failures += 1;
      console.log(`  FAIL  ${testCase.path} — still showing a loading state after settling`);
      continue;
    }

    /* The product's central claim, asserted rather than assumed. */
    if (testCase.candidate) {
      const named = [...CANDIDATE_BANNED, ...(testCase.forbid ?? [])].filter(word => text.includes(word));
      if (named.length > 0) {
        failures += 1;
        console.log(
          `  FAIL  ${testCase.path} — candidate interface names ${named.map(w => `“${w}”`).join(', ')}`,
        );
        continue;
      }

      const valued = ASSESSMENT_VALUE.exec(raw);
      if (valued) {
        failures += 1;
        console.log(`  FAIL  ${testCase.path} — candidate interface shows an assessment: “${valued[0]}”`);
        continue;
      }

      const wrapped = EXAMINER_CHROME.filter(word => text.includes(word));
      if (wrapped.length > 0) {
        failures += 1;
        console.log(
          `  FAIL  ${testCase.path} — examiner chrome wrapped a candidate page: ${wrapped.map(w => `“${w}”`).join(', ')}`,
        );
        continue;
      }

      if (testCase.promise !== undefined && !text.includes(testCase.promise)) {
        failures += 1;
        console.log(`  FAIL  ${testCase.path} — the candidate is missing “${testCase.promise}”`);
        continue;
      }
    }

    if (testCase.examiner) {
      const missingChrome = EXAMINER_CHROME.filter(word => !text.includes(word));
      if (missingChrome.length > 0) {
        failures += 1;
        console.log(
          `  FAIL  ${testCase.path} — no examiner frame: missing ${missingChrome.map(w => `“${w}”`).join(', ')}`,
        );
        continue;
      }
    }

    console.log(`  ok    ${testCase.path} — ${text.length} chars`);
  }

  if (dump !== undefined) return;

  console.log(`\n${CASES.length - failures}/${CASES.length} routes ok`);
  console.log(`${screenFiles('src/screens').length} screen files on disk`);
  if (failures > 0) process.exitCode = 1;
}

void main();
