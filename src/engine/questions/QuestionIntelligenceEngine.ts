import { BehaviorEvent, Question, QuestionAttempt } from '../../types';
import { EventDebouncer } from '../EventDebouncer';

export interface QuestionIntegrityItem {
  questionId: string;
  number: number;
  prompt: string;
  score: number; // 0-100 anomaly score
  level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW';
  flags: string[];
  responseTimeSec: number;
  expectedTimeSec: number;
  difficulty: 'easy' | 'medium' | 'hard';
  answerChanges: number;
  isAnswered: boolean;
}

export class QuestionIntelligenceEngine {
  private sessionId: string;
  private debouncer: EventDebouncer;
  private attempts: Map<string, QuestionAttempt> = new Map();
  private currentActiveQuestionId: string | null = null;
  private currentOpenedTimestamp: number = Date.now();
  private questionSwitchHistory: { questionId: string; timestamp: number }[] = [];
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;

  constructor(sessionId: string, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public setCallback(cb: (event: BehaviorEvent) => void): void {
    this.onEventCallback = cb;
  }

  /**
   * Initializes question bank attempts
   */
  public initializeQuestions(questions: Question[]): void {
    questions.forEach((q, idx) => {
      const difficulty = q.difficulty || (idx % 3 === 0 ? 'hard' : idx % 2 === 0 ? 'medium' : 'easy');
      const expectedDurationSeconds =
        q.expectedResponseTimeSeconds ||
        (difficulty === 'hard' ? 75 : difficulty === 'medium' ? 45 : 25);

      if (!this.attempts.has(q.id)) {
        this.attempts.set(q.id, {
          questionId: q.id,
          questionNumber: q.number,
          openedAt: Date.now(),
          firstInteractionAt: null,
          submittedAt: null,
          responseDurationMs: 0,
          answerChanges: 0,
          difficulty,
          expectedDurationSeconds,
          selectedOptionId: null,
          isFlagged: false,
          anomalyScore: 0,
          signals: [],
          isRapidAnswer: false,
        });
      }
    });
  }

  /**
   * Called when student navigates to a question
   */
  public handleQuestionOpened(question: Question): void {
    const now = Date.now();

    // Close out timing on previously active question
    if (this.currentActiveQuestionId) {
      const prevAttempt = this.attempts.get(this.currentActiveQuestionId);
      if (prevAttempt) {
        prevAttempt.responseDurationMs += now - this.currentOpenedTimestamp;
      }
    }

    this.currentActiveQuestionId = question.id;
    this.currentOpenedTimestamp = now;

    this.questionSwitchHistory.push({ questionId: question.id, timestamp: now });
    // Keep recent 20 switches
    if (this.questionSwitchHistory.length > 20) this.questionSwitchHistory.shift();

    // Check for rapid question switching (> 4 switches in under 12 seconds)
    const recentSwitches = this.questionSwitchHistory.filter(s => now - s.timestamp <= 12000);
    if (recentSwitches.length >= 5 && this.debouncer.canEmit('QUESTION_REPEATED_SWITCH', now)) {
      this.debouncer.recordEmitted('QUESTION_REPEATED_SWITCH', now);
      this.emit({
        id: `evt-qswitch-${now}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId: this.sessionId,
        timestamp: now,
        type: 'QUESTION_REPEATED_SWITCH',
        category: 'question',
        severity: 'low',
        confidence: 0.95,
        duration: 12000,
        durationSeconds: 12,
        source: 'question_engine',
        description: `Rapid question switching observed (${recentSwitches.length} question hops in 12s).`,
        evidence: {
          additionalContext: 'Rapid question traversal pattern recorded.',
        },
        questionNumberAtTrigger: question.number,
      });
    }

    // Ensure attempt exists
    if (!this.attempts.has(question.id)) {
      const difficulty = question.difficulty || 'medium';
      this.attempts.set(question.id, {
        questionId: question.id,
        questionNumber: question.number,
        openedAt: now,
        firstInteractionAt: null,
        submittedAt: null,
        responseDurationMs: 0,
        answerChanges: 0,
        difficulty,
        expectedDurationSeconds: difficulty === 'hard' ? 75 : 40,
        selectedOptionId: null,
        isFlagged: false,
        anomalyScore: 0,
        signals: [],
        isRapidAnswer: false,
      });
    }
  }

  /**
   * Called when student selects or changes an answer
   */
  public handleAnswerSelected(question: Question, optionId: string): void {
    const now = Date.now();
    const attempt = this.attempts.get(question.id);
    if (!attempt) return;

    if (!attempt.firstInteractionAt) {
      attempt.firstInteractionAt = now;
    }

    const previousOption = attempt.selectedOptionId;
    if (previousOption && previousOption !== optionId) {
      attempt.answerChanges++;
    }
    attempt.selectedOptionId = optionId;

    // Calculate response duration up to this answer
    const currentQuestionElapsedSec = Math.max(1, (now - this.currentOpenedTimestamp) / 1000);

    // Rapid Answer Detection:
    // If a hard or medium question is answered in under 3.5 seconds
    const isHardOrComplex = attempt.difficulty === 'hard' || (question.codeSnippet && question.codeSnippet.length > 50);
    if (isHardOrComplex && currentQuestionElapsedSec < 4.0) {
      attempt.isRapidAnswer = true;
      attempt.anomalyScore = Math.min(100, attempt.anomalyScore + 45);
      attempt.signals.push(`Rapid answer to complex calculation (${currentQuestionElapsedSec.toFixed(1)}s)`);

      if (this.debouncer.canEmit('QUESTION_RAPID_ANSWER', now)) {
        this.debouncer.recordEmitted('QUESTION_RAPID_ANSWER', now);
        this.emit({
          id: `evt-qrapid-${now}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId: this.sessionId,
          timestamp: now,
          type: 'QUESTION_RAPID_ANSWER',
          category: 'question',
          severity: 'medium',
          confidence: 0.89,
          duration: Math.round(currentQuestionElapsedSec * 1000),
          durationSeconds: Math.round(currentQuestionElapsedSec),
          source: 'question_engine',
          description: `Rapid answer submitted for ${attempt.difficulty.toUpperCase()} problem (${currentQuestionElapsedSec.toFixed(1)}s vs expected ${attempt.expectedDurationSeconds}s).`,
          evidence: {
            questionResponseSec: parseFloat(currentQuestionElapsedSec.toFixed(1)),
            expectedResponseSec: attempt.expectedDurationSeconds,
            additionalContext: `Selected answer in ${currentQuestionElapsedSec.toFixed(1)}s on Question ${question.number}`,
          },
          questionNumberAtTrigger: question.number,
        });
      }
    }
  }

  /**
   * Attaches an external event to the currently active question attempt
   */
  public correlateEventToActiveQuestion(event: BehaviorEvent): void {
    if (!this.currentActiveQuestionId) return;
    const attempt = this.attempts.get(this.currentActiveQuestionId);
    if (!attempt) return;

    if (['WINDOW_BLUR', 'TAB_VISIBILITY_CHANGE', 'CLIPBOARD_PASTE'].includes(event.type)) {
      attempt.anomalyScore = Math.min(100, attempt.anomalyScore + 30);
      attempt.signals.push(`${event.type.replace(/_/g, ' ')} during question`);
    } else if (['MULTIPLE_PERSONS', 'MULTIPLE_FACES'].includes(event.type)) {
      attempt.anomalyScore = Math.min(100, attempt.anomalyScore + 40);
      attempt.signals.push('Secondary person signal');
    } else if (['ATTENTION_DEVIATION', 'LOOKING_AWAY', 'OFF_SCREEN_GAZE'].includes(event.type)) {
      attempt.anomalyScore = Math.min(100, attempt.anomalyScore + 15);
      attempt.signals.push('Attention deviation');
    }
  }

  /**
   * Generates question integrity heatmap items
   */
  public getIntegrityHeatmap(questions: Question[]): QuestionIntegrityItem[] {
    return questions.map(q => {
      const attempt = this.attempts.get(q.id);
      const score = attempt ? attempt.anomalyScore : 0;
      let level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'REVIEW' = 'NORMAL';
      if (score >= 70) level = 'REVIEW';
      else if (score >= 50) level = 'HIGH';
      else if (score >= 30) level = 'MEDIUM';
      else if (score >= 15) level = 'LOW';

      const responseTimeSec = attempt ? Math.round(attempt.responseDurationMs / 1000) : 0;
      const expectedTimeSec = attempt ? attempt.expectedDurationSeconds : 35;
      const difficulty = attempt ? attempt.difficulty : (q.difficulty || 'medium');

      return {
        questionId: q.id,
        number: q.number,
        prompt: q.prompt,
        score,
        level,
        flags: attempt ? attempt.signals : [],
        responseTimeSec,
        expectedTimeSec,
        difficulty,
        answerChanges: attempt ? attempt.answerChanges : 0,
        isAnswered: !!attempt?.selectedOptionId,
      };
    });
  }

  public getAttempts(): Record<string, QuestionAttempt> {
    const result: Record<string, QuestionAttempt> = {};
    this.attempts.forEach((val, key) => {
      result[key] = { ...val };
    });
    return result;
  }

  private emit(event: BehaviorEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
