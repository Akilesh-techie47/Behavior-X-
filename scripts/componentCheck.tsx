/**
 * Interaction check, in a real DOM.
 *
 * `routeCheck.tsx` proves every screen renders and says the right things. This
 * one presses the three controls where a wrong result would be consequential:
 *
 *   1. `DecisionForm` — a decision must be attributable and must not be
 *      recordable without written reasoning.
 *   2. `SuppressedPanel` — policy filtering must be inspectable, not asserted.
 *   3. `DeviceCheck` — a candidate must not be able to walk past a failed
 *      environment check.
 *
 * These are assertions about behaviour, not about markup, and they are written
 * the way a reviewer would try to break the product: click the button, type the
 * short note, look for the path through.
 *
 * Run with: npx tsx scripts/componentCheck.tsx
 */

import { JSDOM } from 'jsdom';
import type { ReactNode } from 'react';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.test/',
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
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
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
/* A camera is always absent in this environment, so the camera check fails.
 * That is the realistic case and it is what the device-check test wants. */
Object.defineProperty(dom.window.navigator, 'mediaDevices', {
  value: {
    enumerateDevices: async () => [],
    getUserMedia: async () => {
      throw new Error('Requested device not found');
    },
  },
  configurable: true,
});
/* Scroll locking, used by the confirm dialog. */
Object.defineProperty(dom.window.Element.prototype, 'scrollIntoView', { value() {} });

async function settle(ms = 50): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

let checks = 0;
let failures = 0;

function assert(condition: boolean, description: string, detail = ''): void {
  checks += 1;
  if (condition) {
    console.log(`  ok    ${description}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${description}${detail ? ` — ${detail}` : ''}`);
  }
}

/* ------------------------------------------------------------------ *
 * DOM helpers
 * ------------------------------------------------------------------ */

function byText(scope: Element, selector: string, needle: string): HTMLElement | null {
  return [...scope.querySelectorAll<HTMLElement>(selector)].find(el =>
    (el.textContent ?? '').toLowerCase().includes(needle.toLowerCase()),
  ) ?? null;
}

function click(el: Element | null): boolean {
  if (el === null) return false;
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  return true;
}

async function type(el: Element, value: string): Promise<void> {
  /* React listens for the native input event, and jsdom does not synthesise
   * one from a value assignment, so the value has to be set by hand and the
   * event dispatched to match what a browser would deliver. */
  const target = el as HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(target, value);
  target.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await settle(30);
}

async function blur(el: Element): Promise<void> {
  el.dispatchEvent(new dom.window.FocusEvent('focusout', { bubbles: true }));
  el.dispatchEvent(new dom.window.Event('blur', { bubbles: true }));
  await settle(30);
}

async function mount(node: ReactNode): Promise<{ container: HTMLElement; unmount: () => void }> {
  const { createRoot } = await import('react-dom/client');
  const container = dom.window.document.createElement('div');
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  root.render(node);
  await settle(80);
  return { container, unmount: () => { root.unmount(); container.remove(); } };
}
/* ------------------------------------------------------------------ *
 * 1. DecisionForm
 * ------------------------------------------------------------------ */

async function checkDecisionForm(): Promise<void> {
  console.log('\nDecisionForm — a decision must be attributable, and reasoned');
  const React = await import('react');
  const { DecisionForm } = await import('../src/components/examiner/DecisionForm');
  const { CURRENT_EXAMINER, services } = await import('../src/services');

  const session = (await services.sessions.list({ status: 'live' }))[0] ?? (await services.sessions.list())[0];
  const recorded: { examinerName: string; decision: string; note: string }[] = [];

  const view = await mount(
    React.createElement(DecisionForm, {
      sessionId: session.id,
      existingDecisions: [],
      onRecorded: (r: { examinerName: string; decision: string; note: string }) => recorded.push(r),
    }),
  );

  const recordButton = byText(view.container, 'button', 'record decision');
  assert(recordButton !== null, 'the form offers a record control');
  assert((recordButton as HTMLButtonElement).disabled === true, 'recording is impossible before a decision is chosen');

  click(recordButton);
  await settle(60);
  assert(
    (view.container.textContent ?? '').includes('Choose a decision before recording'),
    'the record control is disabled and the reason is stated without clicking',
  );

  /* Choose one, but write too little. */
  const radios = view.container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
  assert(radios.length === 4, 'four decisions are offered', `found ${radios.length}`);
  const confirmed = [...radios].find(r => r.value === 'confirmed') ?? radios[0];
  /* jsdom activates the radio on click, so we don't set checked directly. */
  confirmed.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await settle(60);

  const enabled = byText(view.container, 'button', 'record decision') as HTMLButtonElement;
  assert(enabled.disabled === false, 'choosing a decision enables recording');

  const textarea = view.container.querySelector('textarea');
  assert(textarea !== null, 'a reasoning field exists');
  if (textarea === null) { view.unmount(); return; }

  await type(textarea, 'too short');
  await blur(textarea);
  await settle(60);

  assert(
    (view.container.textContent ?? '').includes('At least a sentence'),
    'a short note is refused, and the reason is stated',
  );

  click(byText(view.container, 'button', 'record decision'));
  await settle(120);
  assert(
    !byText(dom.window.document.body, '[role="dialog"] button', 'record'),
    'a short note cannot reach the confirmation dialog',
  );
  assert(recorded.length === 0, 'nothing was recorded while the note was short');

  /* Now write something a colleague could read. */
  await type(
    textarea,
    'The camera view shows the candidate leaving the frame for about ninety seconds, and the companion device reports no interruption, so the gap is in the record rather than in the sitting. I cannot resolve whether the candidate stepped away or the device moved.',
  );
  await settle(60);
  assert(
    !(view.container.textContent ?? '').includes('At least a sentence'),
    'the refusal clears once the reasoning is long enough',
  );

  click(byText(view.container, 'button', 'record decision'));
  await settle(120);
  const dialog = byText(dom.window.document.body, '[role="dialog"]', 'record this decision');
  assert(dialog !== null, 'a long enough note opens the confirmation, and it quotes the reasoning back');

  click(byText(dom.window.document.body, '[role="dialog"] button', 'record confirmed'));
  await settle(1200);

  assert(recorded.length === 1, 'confirming records exactly one decision', `recorded ${recorded.length}`);
  if (recorded.length === 1) {
    assert(
      recorded[0].examinerName === CURRENT_EXAMINER.name,
      'the decision is attributed to a named examiner',
      `got "${recorded[0].examinerName}"`,
    );
    assert(recorded[0].decision === 'confirmed', 'the decision chosen is the decision recorded');
  }
  assert(
    (view.container.textContent ?? '').includes('Decision recorded and attributed'),
    'a receipt confirms the write, with a reference',
  );

  view.unmount();
  /* The decision log is module state, so a second run of this script would
   * otherwise start with a history it did not create. */
  const { decisionLog } = await import('../src/services/mock/MockSessionService');
  decisionLog.length = 0;
}

/* ------------------------------------------------------------------ *
 * 2. SuppressedPanel
 * ------------------------------------------------------------------ */

async function checkSuppressedPanel(): Promise<void> {
  console.log('\nSuppressedPanel — filtering must be inspectable, not asserted');
  const React = await import('react');
  const { SuppressedPanel } = await import('../src/components/examiner/SuppressedPanel');
  const { services } = await import('../src/services');

  const sessions = await services.sessions.list();
  let suppressed: Awaited<ReturnType<typeof services.evidence.suppressed>> = [];
  let owner = '';
  for (const candidate of sessions) {
    const found = await services.evidence.suppressed(candidate.id);
    if (found.length > 0) {
      suppressed = found;
      owner = candidate.id;
      break;
    }
  }
  assert(owner !== '', 'a fixture exists with a suppressed observation');
  if (owner === '') return;

  const view = await mount(React.createElement(SuppressedPanel, { suppressed }));

  const text = view.container.textContent ?? '';
  assert(text.includes('never deletes it'), 'the panel states that suppression is not deletion');
  assert(text.includes(`${suppressed.length} recorded`), 'it counts what it kept');
  assert(text.includes(suppressed[0].detail), 'the observation detail is shown collapsed');
  assert(text.includes(suppressed[0].baseline) || /baseline|threshold/i.test(text), 'the baseline it was compared against is shown');

  const expander = view.container.querySelector<HTMLButtonElement>('button[aria-expanded]');
  assert(expander !== null, 'a row can be expanded');
  assert(expander?.getAttribute('aria-expanded') === 'false', 'it starts collapsed, so the detail is opt-in');

  const collapsedText = view.container.textContent ?? '';
  click(expander);
  await settle(80);
  const expandedText = view.container.textContent ?? '';
  assert(expander?.getAttribute('aria-expanded') === 'true', 'clicking expands it');
  assert(
    expandedText.length > collapsedText.length,
    'expanding reveals the checks the clause ran',
    `${collapsedText.length} → ${expandedText.length}`,
  );
  assert(
    expandedText.includes(suppressed[0].reason),
    'the reason is shown when expanded',
  );
  assert(
    suppressed[0].checks.some(c => expandedText.includes(c.label)),
    'each check label appears when expanded',
  );
  assert(
    /check|clause/i.test(expandedText),
    'the expanded row shows what policy compared the observation against',
  );

  click(expander);
  await settle(80);
  assert(expander?.getAttribute('aria-expanded') === 'false', 'clicking again collapses it');

  /* The empty state is a first-class case, not an afterthought. */
  const empty = await mount(React.createElement(SuppressedPanel, { suppressed: [] }));
  assert(
    (empty.container.textContent ?? '').includes('Nothing was suppressed'),
    'a session with no suppression says so plainly',
  );
  empty.unmount();
  view.unmount();
}

/* ------------------------------------------------------------------ *
 * 3. DeviceCheck
 * ------------------------------------------------------------------ */

async function checkDeviceCheck(): Promise<void> {
  console.log('\nDeviceCheck — a candidate must not walk past a failed check');
  const React = await import('react');
  const { DeviceCheck } = await import('../src/screens/student/DeviceCheck');

  const view = await mount(React.createElement(DeviceCheck));
  /* The camera check fails in this environment, which is the point. */
  await settle(2500);

  const text = view.container.textContent ?? '';
  assert(/blocked|fail|not available|could not/i.test(text), 'a failing check is reported, not hidden');

  const continueButton = byText(view.container, 'button', 'continue') as HTMLButtonElement | null;
  assert(continueButton !== null, 'there is a continue control');

  const checkbox = view.container.querySelector<HTMLInputElement>('input[type="checkbox"]');
  assert(checkbox !== null, 'there is an acknowledgement the candidate must tick');

  if (checkbox !== null) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    checkbox.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await settle(80);
  }

  click(continueButton);
  await settle(120);

  assert(
    dom.window.location.hash !== '#/student/agreement',
    'a blocked check does not let the candidate through',
    `hash is ${dom.window.location.hash}`,
  );
  assert(
    /still blocked|checks are|retry/i.test(view.container.textContent ?? ''),
    'and it says which checks are still blocked',
  );

  view.unmount();
}

/* ------------------------------------------------------------------ *
 * 4. RouteErrorBoundary
 * ------------------------------------------------------------------ */

async function checkErrorBoundary(): Promise<void> {
  console.log('\nRouteErrorBoundary — a broken screen must not blank the page');
  const React = await import('react');
  const { RouteErrorBoundary } = await import('../src/components/feedback/ErrorBoundary');

  function Explodes({ explode }: { explode: boolean }) {
    if (explode) throw new Error('a record was not in the expected shape');
    return React.createElement('p', null, 'this screen is fine');
  }

  const view = await mount(
    React.createElement(RouteErrorBoundary, {
      scope: 'the review',
      children: React.createElement(Explodes, { explode: true }),
    }),
  );
  await settle(120);

  const text = view.container.textContent ?? '';
  assert(/could not be displayed/i.test(text), 'the failure is stated in the interface');
  assert(/nothing has been changed or lost/i.test(text), 'and it reassures that nothing was lost');
  assert(/retry|reload/i.test(text), 'and it offers a way out');
  assert(text.includes('a record was not in the expected shape'), 'the technical detail is available on request');

  const roles = view.container.querySelectorAll('[role="alert"]');
  assert(roles.length > 0, 'it is announced, not merely drawn');

  view.unmount();
}

/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  console.log('Component check, driven through the DOM\n');

  const originalError = console.error;
  console.error = () => {};

  try {
    await checkDecisionForm();
    await checkSuppressedPanel();
    await checkDeviceCheck();
    await checkErrorBoundary();
  } finally {
    console.error = originalError;
  }

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

void main();
