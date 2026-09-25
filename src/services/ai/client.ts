import { ExplanationRequestPayload, ExplanationResponse } from './types';
import { generateDeterministicExplanation } from './fallbackGenerator';

export async function fetchExplanation(payload: ExplanationRequestPayload): Promise<ExplanationResponse> {
  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    // If backend route is not mounted in dev mode or network error, execute robust deterministic generator
    return generateDeterministicExplanation(payload);
  }
}
