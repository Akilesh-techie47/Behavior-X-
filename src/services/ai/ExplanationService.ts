import { GoogleGenAI } from '@google/genai';
import { ExplanationRequestPayload, ExplanationResponse } from './types';
import { generateDeterministicExplanation } from './fallbackGenerator';

export class ExplanationService {
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName = 'gemini-3.8-flash';

  constructor() {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  /**
   * Sanitizes events to strictly prevent prompt injection and remove any PII
   */
  public sanitizePayload(payload: ExplanationRequestPayload): ExplanationRequestPayload {
    const allowedTypes = new Set([
      'FACE_PRESENT',
      'FACE_NOT_DETECTED',
      'MULTIPLE_FACES',
      'HEAD_TURN_LEFT',
      'HEAD_TURN_RIGHT',
      'LOOKING_AWAY',
      'PROLONGED_OFF_SCREEN_GAZE',
      'WINDOW_BLUR',
      'TAB_VISIBILITY_CHANGE',
      'FULLSCREEN_EXIT',
      'CAMERA_DISCONNECTED',
      'RAPID_REPEATED_DEVIATION',
      'ATTENTION_DEVIATION',
      'OFF_SCREEN_GAZE',
      'FACE_ABSENCE',
      'MULTIPLE_PERSONS',
      'TAB_SWITCH',
    ]);

    const sanitizedEvents = (payload.events || [])
      .slice(0, 50) // Limit event flood
      .map(e => ({
        type: allowedTypes.has(e.type) ? e.type : 'OBSERVABLE_SIGNAL',
        category: typeof e.category === 'string' ? e.category.slice(0, 20) : 'general',
        durationSeconds: typeof e.durationSeconds === 'number' && !isNaN(e.durationSeconds) ? Math.min(300, Math.max(0, e.durationSeconds)) : 1,
        timestampSeconds: typeof e.timestampSeconds === 'number' && !isNaN(e.timestampSeconds) ? Math.max(0, e.timestampSeconds) : 0,
      }));

    return {
      sessionDurationMinutes: Math.max(1, Math.min(360, payload.sessionDurationMinutes || 45)),
      riskScore: Math.max(0, Math.min(100, payload.riskScore || 0)),
      riskLevel: ['NORMAL', 'LOW', 'MEDIUM', 'HIGH', 'REVIEW'].includes(payload.riskLevel) ? payload.riskLevel : 'NORMAL',
      events: sanitizedEvents,
    };
  }

  /**
   * Generates comprehensive explainable assessment analysis
   */
  public async generateExplanation(
    rawPayload: ExplanationRequestPayload,
    timeoutMs: number = 8000
  ): Promise<ExplanationResponse> {
    const sanitized = this.sanitizePayload(rawPayload);

    // Fallback if no client or no API key available
    if (!this.aiClient) {
      return generateDeterministicExplanation(sanitized);
    }

    try {
      // Setup timeout controller
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out')), timeoutMs)
      );

      const generationPromise = this.callGeminiModel(sanitized);
      const response = await Promise.race([generationPromise, timeoutPromise]);
      return response;
    } catch (err) {
      console.warn('Gemini explanation generation failed, falling back to deterministic engine:', err);
      return generateDeterministicExplanation(sanitized);
    }
  }

  private async callGeminiModel(payload: ExplanationRequestPayload): Promise<ExplanationResponse> {
    if (!this.aiClient) throw new Error('Client not initialized');

    const systemInstruction = `You are the Explainable AI Assist layer for Behavior-X, a privacy-preserving academic proctoring platform.
CRITICAL ETHICAL MANDATES:
1. NEVER say or imply that the candidate was "cheating" or "guilty".
2. NEVER infer internal mental states, honesty, intent, or protected characteristics.
3. Your purpose is strictly observational: explain what mathematical signals were recorded, their temporal relationships, and why they warrant examiner review.
4. Always explicitly communicate uncertainty and remind the user that the human academic examiner makes all final determinations.
5. Return ONLY a valid JSON object matching the requested schema.`;

    const promptText = `Analyze the following sanitized behavioral telemetry:
${JSON.stringify(payload, null, 2)}

Provide a structured, non-accusatory explanation in valid JSON format with the following keys:
{
  "sessionSummary": "concise objective summary of candidate telemetry",
  "contributingSignalsExplanation": "clear explanation of which signals contributed to the risk score",
  "timelineSummary": "chronological flow of events",
  "strongestObservablePatterns": ["pattern 1", "pattern 2"],
  "suggestedReviewPoints": ["review point 1", "review point 2"],
  "uncertaintyDisclaimer": "reminder that signals are review priorities, not guilt"
}`;

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    // Validate required fields
    if (!parsed.sessionSummary || !Array.isArray(parsed.strongestObservablePatterns)) {
      throw new Error('Malformed AI response schema');
    }

    return {
      sessionSummary: parsed.sessionSummary,
      contributingSignalsExplanation: parsed.contributingSignalsExplanation || 'Signals reviewed within temporal windows.',
      timelineSummary: parsed.timelineSummary || 'Timeline logged.',
      strongestObservablePatterns: parsed.strongestObservablePatterns || [],
      suggestedReviewPoints: parsed.suggestedReviewPoints || [],
      uncertaintyDisclaimer: parsed.uncertaintyDisclaimer || 'Behavior-X signals represent review priorities, not proof of guilt.',
      source: 'gemini',
      modelUsed: this.modelName,
      generatedAt: Date.now(),
    };
  }
}

export const explanationService = new ExplanationService();
