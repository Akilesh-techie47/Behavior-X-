/**
 * Mock transport.
 *
 * Every service call passes through `transport`, which applies the latency and
 * failure profile selected in Settings. The point is not to fake slowness; it
 * is to make the loading, empty, error and offline states of every screen
 * reachable on demand, so they can be reviewed like any other part of the
 * product instead of being discovered in a live examination.
 */

import { ServiceTimeoutError, ServiceUnavailableError, type ServiceCondition } from '../contracts';

let condition: ServiceCondition = 'nominal';
let requestCounter = 0;

export function setServiceCondition(next: ServiceCondition): void {
  condition = next;
}

export function getServiceCondition(): ServiceCondition {
  return condition;
}

interface LatencyProfile {
  min: number;
  max: number;
  failureRate: number;
  timeoutRate: number;
}

const PROFILES: Record<ServiceCondition, LatencyProfile> = {
  nominal: { min: 120, max: 320, failureRate: 0, timeoutRate: 0 },
  slow: { min: 1800, max: 2600, failureRate: 0, timeoutRate: 0.25 },
  flaky: { min: 200, max: 900, failureRate: 0.3, timeoutRate: 0.05 },
  offline: { min: 300, max: 700, failureRate: 1, timeoutRate: 0 },
};

const LATENCY_BUDGET_MS = 2600;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitter(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Deterministic-ish coin so a flaky profile is annoying but not a coin-flip storm. */
function roll(): number {
  requestCounter += 1;
  const n = Math.sin(requestCounter * 9301 + 49297) * 233280;
  return n - Math.floor(n);
}

export async function transport<T>(produce: () => T | Promise<T>): Promise<T> {
  const profile = PROFILES[condition];

  await delay(jitter(profile.min, profile.max));

  if (condition === 'offline') {
    throw new ServiceUnavailableError(
      'No route to the examination data service. The console is running on its last known snapshot.',
    );
  }

  if (roll() < profile.failureRate) {
    throw new ServiceUnavailableError('The examination data service returned an error.');
  }

  if (roll() < profile.timeoutRate) {
    throw new ServiceTimeoutError();
  }

  return produce();
}

export { LATENCY_BUDGET_MS };
