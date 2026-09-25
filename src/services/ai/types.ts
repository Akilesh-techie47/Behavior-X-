export interface SanitizedBehaviorEventPayload {
  type: string;
  durationSeconds?: number;
  timestampSeconds: number;
  category: string;
}

export interface ExplanationRequestPayload {
  sessionDurationMinutes: number;
  riskScore: number;
  riskLevel: string;
  events: SanitizedBehaviorEventPayload[];
  primaryContributingFactor?: string;
}

export interface ExplanationResponse {
  sessionSummary: string;
  contributingSignalsExplanation: string;
  timelineSummary: string;
  strongestObservablePatterns: string[];
  suggestedReviewPoints: string[];
  uncertaintyDisclaimer: string;
  source: 'gemini' | 'deterministic_fallback';
  modelUsed?: string;
  generatedAt: number;
}
