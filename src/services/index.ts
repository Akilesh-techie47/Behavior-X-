/**
 * Service registry — the single seam between the interface and its data.
 *
 * To move off the mock backend, replace the six classes below with real
 * implementations of the interfaces in `contracts.ts`. No component or screen
 * imports these modules directly; they import `services` from here.
 */

import type { Services } from './contracts';
import { MockExamService } from './mock/MockExamService';
import { MockSessionService } from './mock/MockSessionService';
import { MockDeviceService } from './mock/MockDeviceService';
import { MockEvidenceService } from './mock/MockEvidenceService';
import { MockAIService } from './mock/MockAIService';
import { MockAnalyticsService } from './mock/MockAnalyticsService';

export const services: Services = {
  exam: new MockExamService(),
  sessions: new MockSessionService(),
  devices: new MockDeviceService(),
  evidence: new MockEvidenceService(),
  ai: new MockAIService(),
  analytics: new MockAnalyticsService(),
};

export * from './contracts';
export { getServiceCondition, setServiceCondition } from './mock/transport';
export { MockDeviceService } from './mock/MockDeviceService';
export { decisionLog } from './mock/MockSessionService';
export { CANDIDATES, CURRENT_EXAMINER, EXAMINERS } from './fixtures/people';
export { EXAMS } from './fixtures/exams';
