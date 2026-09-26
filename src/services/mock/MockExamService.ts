import type {
  Candidate,
  ExamDefinition,
  Question,
  SubmissionReceipt,
} from '../../domain/types';
import type { ExamService, SubmissionInput } from '../contracts';
import { EXAMS, EXAM_BY_ID } from '../fixtures/exams';
import { CANDIDATES } from '../fixtures/people';
import { transport } from './transport';

const DEFAULT_CANDIDATE_ID = 'cand-001';

export class MockExamService implements ExamService {
  async listExams(): Promise<ExamDefinition[]> {
    return transport(() => EXAMS);
  }

  async getExam(examId: string): Promise<ExamDefinition> {
    return transport(() => {
      const exam = EXAM_BY_ID.get(examId);
      if (!exam) throw new Error(`Unknown examination: ${examId}`);
      return exam;
    });
  }

  async getCandidate(): Promise<Candidate> {
    return transport(() => {
      const candidate = CANDIDATES.find(c => c.id === DEFAULT_CANDIDATE_ID) ?? CANDIDATES[0];
      return candidate;
    });
  }

  async submit(input: SubmissionInput): Promise<SubmissionReceipt> {
    return transport(() => {
      const exam = EXAM_BY_ID.get(input.examId);
      if (!exam) throw new Error(`Unknown examination: ${input.examId}`);

      const answered = Object.entries(input.answers).filter(
        ([questionId, value]) => value.trim().length > 0 && questionId,
      ).length;

      return {
        submissionId: `SUB-${exam.code}-${String(Date.now()).slice(-6)}`,
        examCode: exam.code,
        submittedAt: new Date().toISOString(),
        questionsAnswered: answered,
        questionsTotal: exam.questionCount,
        flaggedCount: input.flagged.length,
        handling:
          'Responses have been sealed. Video was never recorded or stored, so the only material that will be reviewed is the event record and the responses themselves.',
        reviewWindow:
          'Where a review candidate is raised, you will be notified within 14 days. You may request sight of the recorded reasons at any point.',
        simulated: true,
      };
    });
  }
}

/** Shared helper for the student exam store. */
export function questionByNumber(exam: ExamDefinition, number: number): Question {
  return exam.questions.find(q => q.number === number) ?? exam.questions[0];
}
