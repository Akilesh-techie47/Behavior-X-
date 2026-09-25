import { ExplanationRequestPayload, ExplanationResponse } from './types';

/**
 * Deterministic template-based fallback generator.
 * Provides clear, friendly, plain-English summaries without jargon.
 */
export function generateDeterministicExplanation(payload: ExplanationRequestPayload): ExplanationResponse {
  const { riskScore, riskLevel, events, sessionDurationMinutes } = payload;
  const eventCount = events.length;

  // Signal counts
  const lookingAwayCount = events.filter(e => e.type.includes('LOOKING') || e.type.includes('GAZE') || e.type.includes('HEAD_TURN')).length;
  const presenceCount = events.filter(e => e.type.includes('FACE_NOT') || e.type.includes('ABSENCE') || e.type.includes('MULTIPLE')).length;
  const windowCount = events.filter(e => e.type.includes('BLUR') || e.type.includes('VISIBILITY') || e.type.includes('FULLSCREEN')).length;
  const multipleFacesCount = events.filter(e => e.type.includes('MULTIPLE')).length;

  let sessionSummary = '';
  if (eventCount === 0) {
    sessionSummary = `During this ${sessionDurationMinutes}-minute test, the student showed steady, normal focus. No unusual movements or interruptions occurred.`;
  } else if (riskScore < 35) {
    sessionSummary = `During this ${sessionDurationMinutes}-minute test, only a few brief glances occurred (${eventCount} total). These are normal for students working through difficult questions.`;
  } else if (riskScore < 65) {
    sessionSummary = `During this ${sessionDurationMinutes}-minute test, several moments were noted (${eventCount} total). These were mainly looking away from the screen or switching browser windows, which a teacher can quickly review.`;
  } else {
    sessionSummary = `During this ${sessionDurationMinutes}-minute test, several noticeable moments happened close together (${eventCount} total). We recommend the teacher check the timeline notes below.`;
  }

  // Contributing signals explanation
  const signalParts: string[] = [];
  if (lookingAwayCount > 0) {
    signalParts.push(`${lookingAwayCount} time${lookingAwayCount > 1 ? 's' : ''} looking away from screen`);
  }
  if (windowCount > 0) {
    signalParts.push(`${windowCount} time${windowCount > 1 ? 's' : ''} switching tabs or minimizing the test`);
  }
  if (presenceCount > 0) {
    signalParts.push(`${presenceCount} camera view change${presenceCount > 1 ? 's' : ''}`);
  }
  if (multipleFacesCount === 0) {
    signalParts.push('only 1 student was ever seen');
  } else {
    signalParts.push(`another person was seen in view ${multipleFacesCount} time${multipleFacesCount > 1 ? 's' : ''}`);
  }

  const contributingSignalsExplanation = signalParts.length > 0
    ? `Main moments noted: ${signalParts.join(', ')}. These added up to a review score of ${riskScore}%.`
    : 'No unusual activity recorded. Everything looked normal.';

  // Timeline summary
  let timelineSummary = '';
  if (eventCount === 0) {
    timelineSummary = 'No unusual activity occurred during the exam.';
  } else {
    const firstTimestamp = Math.min(...events.map(e => e.timestampSeconds));
    const lastTimestamp = Math.max(...events.map(e => e.timestampSeconds));
    timelineSummary = `Noted moments took place between minute ${Math.floor(firstTimestamp / 60)} and minute ${Math.floor(lastTimestamp / 60)} of the test.`;
  }

  // Strongest observable patterns
  const patterns: string[] = [];
  if (multipleFacesCount > 0) {
    patterns.push('A second person was briefly visible in the camera frame.');
  }
  if (lookingAwayCount >= 3) {
    patterns.push('Student looked away from the computer screen several times.');
  }
  if (windowCount > 0) {
    patterns.push('The exam window was minimized or another application was opened.');
  }
  if (patterns.length === 0) {
    patterns.push('Student maintained continuous, natural focus on the test questions.');
  }

  // Suggested review points
  const reviewPoints: string[] = [];
  if (windowCount > 0) {
    reviewPoints.push('Check if hard questions happened around the exact time the window was minimized.');
  }
  if (lookingAwayCount > 0) {
    reviewPoints.push('Check if the student was allowed to use desk scratch paper or textbook notes.');
  }
  if (multipleFacesCount > 0) {
    reviewPoints.push('Verify if a family member or classmate walked past the student at that moment.');
  }
  if (reviewPoints.length === 0) {
    reviewPoints.push('Everything looks clear. No teacher action is needed.');
  }

  return {
    sessionSummary,
    contributingSignalsExplanation,
    timelineSummary,
    strongestObservablePatterns: patterns,
    suggestedReviewPoints: reviewPoints,
    uncertaintyDisclaimer: 'Behavior-X only spots physical cues to help teachers save time. It never decides whether someone cheated. Human teachers always make the final call.',
    source: 'deterministic_fallback',
    generatedAt: Date.now(),
  };
}
