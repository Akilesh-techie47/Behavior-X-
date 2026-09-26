import type { AnalyticsModel, ReportModel } from '../../domain/types';
import type { AnalyticsService } from '../contracts';
import { getSessions } from '../fixtures/sessions';
import { buildAnalyticsModel, buildReportModel } from '../fixtures/analytics';
import { transport } from './transport';

export class MockAnalyticsService implements AnalyticsService {
  async exam(examId: string): Promise<AnalyticsModel> {
    return transport(() => {
      const model = buildAnalyticsModel(examId, getSessions());
      if (!model) throw new Error(`Unknown examination: ${examId}`);
      return model;
    });
  }

  async reports(): Promise<ReportModel> {
    return transport(() => buildReportModel(getSessions()));
  }
}
