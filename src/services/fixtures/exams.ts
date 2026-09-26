import type { ExamDefinition, ExamSection, PolicyClause, Question } from '../../domain/types';

/**
 * Examination definitions.
 *
 * Three exams so the console has a believable portfolio: one live, one closed
 * and under review, one archived. The questions are real technical questions —
 * an assessment platform whose own content is filler undermines every other
 * screen in the product.
 */

const PROGRAMMING_POLICY: PolicyClause[] = [
  {
    id: 'pol-4.1',
    reference: 'Examination Regulation 4.1 — Permitted resources',
    text: 'Candidates may consult the language reference documentation supplied in the second browser tab of the examination workspace. No other network resource may be accessed at any point during the sitting.',
    appliesTo: ['browser'],
  },
  {
    id: 'pol-4.3',
    reference: 'Examination Regulation 4.3 — Candidate work',
    text: 'All submitted responses must be the candidate\'s own work. Pasting content from any source other than the supplied reference documentation is a breach of this regulation.',
    appliesTo: ['interaction', 'integrity'],
  },
  {
    id: 'pol-4.6',
    reference: 'Examination Regulation 4.6 — External assistance',
    text: 'Physical or verbal assistance from any person, including during a permitted break in observation coverage, constitutes external assistance.',
    appliesTo: ['observation'],
  },
  {
    id: 'pol-7.2',
    reference: 'Examination Regulation 7.2 — Second-person presence',
    text: 'A second person may enter the candidate\'s recorded field of view briefly without penalty. Sustained presence, or presence combined with any interaction signal, is reportable.',
    appliesTo: ['observation'],
  },
  {
    id: 'pol-9.1',
    reference: 'Examination Regulation 9.1 — Observation coverage',
    text: 'Where observation coverage falls below 80% for a continuous period exceeding 120 seconds, the affected interval must be excluded from any adverse inference.',
    appliesTo: ['observation', 'system'],
  },
  {
    id: 'pol-11.4',
    reference: 'Examination Regulation 11.4 — Review standard',
    text: 'A review candidate may only be upheld where evidence originates from at least two independent subsystems, and the recorded interval has complete observation coverage.',
    appliesTo: ['interaction', 'integrity', 'observation'],
  },
];

const DSA_POLICY: PolicyClause[] = [
  {
    id: 'pol-dsa-2.2',
    reference: 'Examination Regulation 2.2 — Workspace',
    text: 'Candidates may use any local notes created before the sitting began. Notes created during the sitting must be derived from the question set only.',
    appliesTo: ['interaction', 'integrity'],
  },
  {
    id: 'pol-dsa-5.1',
    reference: 'Examination Regulation 5.1 — Observation',
    text: 'Brief downward gaze consistent with reading handwritten notes is a normal working pattern and is not, on its own, a reportable observation.',
    appliesTo: ['observation'],
  },
  {
    id: 'pol-dsa-8.3',
    reference: 'Examination Regulation 8.3 — Review standard',
    text: 'Escalation requires corroboration from a second independent channel and a recorded policy reference.',
    appliesTo: ['interaction', 'integrity', 'observation'],
  },
];

const SEC_POLICY: PolicyClause[] = [
  {
    id: 'pol-sec-1.4',
    reference: 'Examination Regulation 1.4 — Closed environment',
    text: 'The examination workspace runs without network access. Browser tabs outside the workspace are not permitted.',
    appliesTo: ['browser', 'system'],
  },
  {
    id: 'pol-sec-6.2',
    reference: 'Examination Regulation 6.2 — Review standard',
    text: 'A session may only be upheld on the basis of recorded evidence, never on observation quality alone.',
    appliesTo: ['observation'],
  },
];

/* ------------------------------------------------------------------ *
 * EX-4417 — Advanced Programming Assessment
 * ------------------------------------------------------------------ */

const ADVANCED_PROGRAMMING_QUESTIONS: Question[] = [
  {
    id: 'ap-01',
    number: 1,
    section: 'A. Language semantics',
    kind: 'mcq',
    prompt:
      'In a language with strict evaluation order for function arguments, which of the following is guaranteed by the specification rather than by convention?',
    points: 4,
    expectedSeconds: 90,
    options: [
      { id: 'ap-01-a', text: 'Arguments are evaluated left to right' },
      { id: 'ap-01-b', text: 'Arguments are evaluated in an unspecified but fixed order' },
      { id: 'ap-01-c', text: 'Arguments are evaluated right to left for tail positions' },
      { id: 'ap-01-d', text: 'Arguments are evaluated in parallel where the runtime permits' },
    ],
    guidance: 'One answer only. Consider what the specification must state for the program to be deterministic.',
  },
  {
    id: 'ap-02',
    number: 2,
    section: 'A. Language semantics',
    kind: 'written',
    prompt:
      'Explain the difference between a deep copy and a shallow copy for a nested object graph, and state one situation in which a shallow copy produces a defect that a deep copy does not.',
    points: 6,
    expectedSeconds: 180,
    guidance: 'Two or three sentences. Address the reference graph, not just the top-level value.',
  },
  {
    id: 'ap-03',
    number: 3,
    section: 'A. Language semantics',
    kind: 'code',
    prompt:
      'Implement a function that returns the length of the longest run of consecutive equal characters in a string. An empty string returns 0.',
    points: 8,
    expectedSeconds: 240,
    starterCode: `function longestRun(input: string): number {
  // your implementation
}
`,
    guidance: 'A single pass is sufficient. Add a brief note on complexity below the function.',
  },
  {
    id: 'ap-04',
    number: 4,
    section: 'A. Language semantics',
    kind: 'mcq',
    prompt:
      'Which property of an immutable value is most likely to allow a runtime to cache and share instances safely?',
    points: 3,
    expectedSeconds: 60,
    options: [
      { id: 'ap-04-a', text: 'It is allocated on the stack' },
      { id: 'ap-04-b', text: 'Its identity is derived from its contents' },
      { id: 'ap-04-c', text: 'It contains no primitive fields' },
      { id: 'ap-04-d', text: 'It is declared final' },
    ],
  },
  {
    id: 'ap-05',
    number: 5,
    section: 'A. Language semantics',
    kind: 'numeric',
    prompt:
      'A function is called with 100 arguments. At most 6 of them are evaluated concurrently. Each evaluation takes 50 ms. What is the minimum wall-clock time, in milliseconds, to evaluate all arguments?',
    points: 3,
    expectedSeconds: 90,
    guidance: 'Give the number only. Assume no evaluation depends on another.',
  },
  {
    id: 'ap-06',
    number: 6,
    section: 'B. Data structures',
    kind: 'mcq',
    prompt:
      'A lookup table receives 10 million insertions and 40 million reads with uniformly distributed keys. Which structure gives the best amortised total cost?',
    points: 4,
    expectedSeconds: 90,
    options: [
      { id: 'ap-06-a', text: 'A balanced binary search tree' },
      { id: 'ap-06-b', text: 'An open-addressed hash table' },
      { id: 'ap-06-c', text: 'An unsorted array with linear search' },
      { id: 'ap-06-d', text: 'A singly linked list with a tail pointer' },
    ],
  },
  {
    id: 'ap-07',
    number: 7,
    section: 'B. Data structures',
    kind: 'code',
    prompt:
      'Implement a function `mergeIntervals(intervals)` that merges overlapping closed intervals and returns the minimal set of non-overlapping intervals in ascending order of start.',
    points: 12,
    expectedSeconds: 420,
    starterCode: `type Interval = { start: number; end: number };

function mergeIntervals(intervals: Interval[]): Interval[] {
  // your implementation
}
`,
    guidance:
      'The input is not guaranteed to be sorted. State the ordering you rely on and the complexity.',
  },
  {
    id: 'ap-08',
    number: 8,
    section: 'B. Data structures',
    kind: 'written',
    prompt:
      'A cache uses least-recently-used eviction and is filled entirely by a sequential scan of a large array. Give one concrete reason the hit rate can be worse than with random replacement, naming the specific access pattern responsible.',
    points: 5,
    expectedSeconds: 150,
  },
  {
    id: 'ap-09',
    number: 9,
    section: 'B. Data structures',
    kind: 'numeric',
    prompt:
      'A hash table with 8,192 buckets and a load factor of 0.75 currently holds how many entries? Give the number only.',
    points: 2,
    expectedSeconds: 45,
  },
  {
    id: 'ap-10',
    number: 10,
    section: 'C. Concurrency and systems',
    kind: 'mcq',
    prompt:
      'Two threads increment the same counter 100,000 times each. The counter is 32-bit and signed. Which outcome is possible without any synchronisation primitive?',
    points: 4,
    expectedSeconds: 90,
    options: [
      { id: 'ap-10-a', text: 'The final value is always 200,000' },
      { id: 'ap-10-b', text: 'The final value is lower than 200,000 due to lost updates' },
      { id: 'ap-10-c', text: 'The final value is higher than 200,000' },
      { id: 'ap-10-d', text: 'The program cannot complete' },
    ],
  },
  {
    id: 'ap-11',
    number: 11,
    section: 'C. Concurrency and systems',
    kind: 'code',
    prompt:
      'Implement a bounded work queue with a fixed capacity that blocks producers when full and blocks consumers when empty, and can be shut down without deadlocking threads that are already waiting.',
    points: 14,
    expectedSeconds: 600,
    starterCode: `class BoundedQueue<T> {
  constructor(private readonly capacity: number) {}

  async push(item: T): Promise<void> {
    // your implementation
  }

  async pop(): Promise<T | null> {
    // null is returned once the queue is shut down and drained
  }

  async shutdown(): Promise<void> {
    // your implementation
  }
}
`,
    guidance:
      'Shutdown must be safe to call while producers and consumers are suspended. Explain how you avoid the lost-wakeup race.',
  },
  {
    id: 'ap-12',
    number: 12,
    section: 'C. Concurrency and systems',
    kind: 'written',
    prompt:
      'A service has a p99 latency of 40 ms but a mean of 4 ms. Give one architecture-level change that would reduce the p99 without materially changing the mean, and explain why the mean is a poor guide here.',
    points: 5,
    expectedSeconds: 150,
  },
  {
    id: 'ap-13',
    number: 13,
    section: 'C. Concurrency and systems',
    kind: 'mcq',
    prompt:
      'A process forks, and in the parent every file descriptor is closed before a write to a pipe. What does the reader observe, and why is it not a memory leak?',
    points: 4,
    expectedSeconds: 90,
    options: [
      { id: 'ap-13-a', text: 'The reader blocks forever; the pipe has not been freed' },
      {
        id: 'ap-13-b',
        text: 'The reader observes end-of-stream because no descriptor refers to the write end',
      },
      {
        id: 'ap-13-c',
        text: 'The reader observes end-of-stream after 30 seconds regardless of descriptors',
      },
      { id: 'ap-13-d', text: 'The write fails with EPIPE only after the buffer is full' },
    ],
  },
  {
    id: 'ap-14',
    number: 14,
    section: 'C. Concurrency and systems',
    kind: 'numeric',
    prompt:
      'A retry policy allows 3 attempts with exponential backoff and a base delay of 200 ms. What is the total worst-case delay before the final attempt, in milliseconds? Give the number only.',
    points: 3,
    expectedSeconds: 60,
  },
  {
    id: 'ap-15',
    number: 15,
    section: 'D. Applied response',
    kind: 'code',
    prompt:
      'A production endpoint has a 30% error rate that appears only when a downstream dependency is slow. Implement a circuit breaker that opens after 5 consecutive failures, allows a single probe after 20 seconds, and closes again on probe success.',
    points: 14,
    expectedSeconds: 660,
    starterCode: `type State = 'closed' | 'open' | 'half_open';

class CircuitBreaker {
  private state: State = 'closed';

  async call<T>(fn: () => Promise<T>): Promise<T> {
    // your implementation
  }
}
`,
    guidance:
      'The breaker must be safe under concurrent callers: only one probe may be in flight. State your invariant.',
  },
  {
    id: 'ap-16',
    number: 16,
    section: 'D. Applied response',
    kind: 'written',
    prompt:
      'A candidate is observed looking at a second screen for 22 seconds, then returns to the workspace and types continuously for 90 seconds without further deviation. Write the two-sentence assessment you would record, including what you would need to see before escalating.',
    points: 6,
    expectedSeconds: 180,
    guidance: 'Do not state a conclusion about intent. State what was observed and what is outstanding.',
  },
  {
    id: 'ap-17',
    number: 17,
    section: 'D. Applied response',
    kind: 'mcq',
    prompt:
      'A reviewer sees a 94% confident clipboard paste of 480 characters. What is the most important next question before treating it as evidence?',
    points: 4,
    expectedSeconds: 90,
    options: [
      { id: 'ap-17-a', text: 'How many characters were typed after the paste' },
      {
        id: 'ap-17-b',
        text: 'What was the source of the pasted content, and was that source permitted',
      },
      { id: 'ap-17-c', text: 'Whether the paste was performed with the mouse or the keyboard' },
      { id: 'ap-17-d', text: 'How large the candidate\'s previous responses have been' },
    ],
  },
  {
    id: 'ap-18',
    number: 18,
    section: 'D. Applied response',
    kind: 'numeric',
    prompt:
      'An examination has 120 candidates. 9 sessions are escalated for review and 6 of those are upheld. What percentage of escalated sessions are upheld? Give the number only, to one decimal place.',
    points: 3,
    expectedSeconds: 60,
  },
  {
    id: 'ap-19',
    number: 19,
    section: 'D. Applied response',
    kind: 'code',
    prompt:
      'Implement `parseDuration("1h 30m")` returning seconds, or `null` for malformed input. Support h, m and s units in any order with arbitrary spacing.',
    points: 10,
    expectedSeconds: 480,
    starterCode: `function parseDuration(input: string): number | null {
  // your implementation
}
`,
    guidance: 'Reject trailing characters. State which inputs you treat as zero.',
  },
  {
    id: 'ap-20',
    number: 20,
    section: 'D. Applied response',
    kind: 'written',
    prompt:
      'Your institution is rolling out observation-based examination integrity. Name one way the system could disadvantage a candidate, and describe the safeguard you would require before enabling it.',
    points: 6,
    expectedSeconds: 240,
    guidance: 'One concrete disadvantage and one concrete safeguard. Avoid generalities.',
  },
];

const ADVANCED_SECTIONS: ExamSection[] = [
  { id: 'ap-sec-a', title: 'A. Language semantics', questionNumbers: [1, 2, 3, 4, 5] },
  { id: 'ap-sec-b', title: 'B. Data structures', questionNumbers: [6, 7, 8, 9] },
  { id: 'ap-sec-c', title: 'C. Concurrency and systems', questionNumbers: [10, 11, 12, 13, 14] },
  { id: 'ap-sec-d', title: 'D. Applied response', questionNumbers: [15, 16, 17, 18, 19, 20] },
];

const DSA_QUESTIONS: Question[] = [
  {
    id: 'ds-01',
    number: 1,
    section: 'A. Complexity',
    kind: 'mcq',
    prompt: 'What is the tight bound for building a binary heap from an unsorted array of n elements?',
    points: 4,
    expectedSeconds: 60,
    options: [
      { id: 'ds-01-a', text: 'O(n log n)' },
      { id: 'ds-01-b', text: 'O(n)' },
      { id: 'ds-01-c', text: 'O(n log log n)' },
      { id: 'ds-01-d', text: 'O(log n)' },
    ],
  },
  {
    id: 'ds-02',
    number: 2,
    section: 'A. Complexity',
    kind: 'written',
    prompt: 'Why is quicksort worst-case O(n²) even with random pivots on adversarial input?',
    points: 5,
    expectedSeconds: 150,
  },
  {
    id: 'ds-03',
    number: 3,
    section: 'B. Trees',
    kind: 'code',
    prompt: 'Implement an iterative in-order traversal of a binary search tree without recursion.',
    points: 10,
    expectedSeconds: 420,
    starterCode: `type Node = { value: number; left: Node | null; right: Node | null };

function inOrder(root: Node | null): number[] {
  // your implementation
}
`,
  },
  {
    id: 'ds-04',
    number: 4,
    section: 'B. Trees',
    kind: 'mcq',
    prompt: 'Which rotation is applied when a node with left child becomes right-heavy?',
    points: 3,
    expectedSeconds: 45,
    options: [
      { id: 'ds-04-a', text: 'Left rotation' },
      { id: 'ds-04-b', text: 'Right rotation' },
      { id: 'ds-04-c', text: 'Left-right rotation' },
      { id: 'ds-04-d', text: 'No rotation is applied' },
    ],
  },
  {
    id: 'ds-05',
    number: 5,
    section: 'C. Graphs',
    kind: 'code',
    prompt: 'Implement topological sort returning an empty array when the graph contains a cycle.',
    points: 12,
    expectedSeconds: 540,
    starterCode: `function topologicalSort(adjacency: number[][], nodes: number): number[] {
  // your implementation
}
`,
  },
  {
    id: 'ds-06',
    number: 6,
    section: 'C. Graphs',
    kind: 'numeric',
    prompt: 'How many distinct edges exist in a complete undirected graph on 9 vertices? Give the number only.',
    points: 2,
    expectedSeconds: 45,
  },
  {
    id: 'ds-07',
    number: 7,
    section: 'D. Hashing',
    kind: 'written',
    prompt: 'Explain why a hash table degrades to O(n) under adversarial key selection, and give one mitigation.',
    points: 5,
    expectedSeconds: 150,
  },
  {
    id: 'ds-08',
    number: 8,
    section: 'D. Hashing',
    kind: 'mcq',
    prompt: 'Which collision strategy stores colliding entries in a small array per bucket?',
    points: 3,
    expectedSeconds: 45,
    options: [
      { id: 'ds-08-a', text: 'Separate chaining' },
      { id: 'ds-08-b', text: 'Linear probing' },
      { id: 'ds-08-c', text: 'Double hashing' },
      { id: 'ds-08-d', text: 'Cuckoo relocation' },
    ],
  },
];

const SEC_QUESTIONS: Question[] = [
  {
    id: 'sec-01',
    number: 1,
    section: 'A. Transport security',
    kind: 'mcq',
    prompt: 'Which TLS 1.3 key exchange provides forward secrecy when the server private key is later compromised?',
    points: 4,
    expectedSeconds: 60,
    options: [
      { id: 'sec-01-a', text: 'Static RSA key transport' },
      { id: 'sec-01-b', text: 'Ephemeral Diffie-Hellman' },
      { id: 'sec-01-c', text: 'Pre-shared symmetric keys' },
      { id: 'sec-01-d', text: 'Certificate pinning' },
    ],
  },
  {
    id: 'sec-02',
    number: 2,
    section: 'A. Transport security',
    kind: 'written',
    prompt: 'State what the Strict-Transport-Security header defends against and one attack it does not prevent.',
    points: 5,
    expectedSeconds: 120,
  },
  {
    id: 'sec-03',
    number: 3,
    section: 'B. Application security',
    kind: 'code',
    prompt: 'Implement constant-time comparison of two byte arrays, returning false on length mismatch without early exit.',
    points: 10,
    expectedSeconds: 480,
    starterCode: `function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  // your implementation
}
`,
  },
  {
    id: 'sec-04',
    number: 4,
    section: 'B. Application security',
    kind: 'mcq',
    prompt: 'Which condition makes a session cookie unsuitable for an authenticated session without further measures?',
    points: 4,
    expectedSeconds: 60,
    options: [
      { id: 'sec-04-a', text: 'It is scoped to a path' },
      { id: 'sec-04-b', text: 'It is readable by client-side script' },
      { id: 'sec-04-c', text: 'It is regenerated on privilege change' },
      { id: 'sec-04-d', text: 'It has a short expiry' },
    ],
  },
  {
    id: 'sec-05',
    number: 5,
    section: 'C. Assessment integrity',
    kind: 'written',
    prompt: 'Give one reason a single-channel signal is unsafe as the sole basis for an integrity finding against a candidate.',
    points: 6,
    expectedSeconds: 150,
  },
  {
    id: 'sec-06',
    number: 6,
    section: 'C. Assessment integrity',
    kind: 'numeric',
    prompt: 'If 40 of 1,600 recorded signals are escalated and 6 escalations are upheld, what percentage of escalations are upheld? Give the number only, to one decimal place.',
    points: 3,
    expectedSeconds: 60,
  },
];

export const EXAMS: ExamDefinition[] = [
  {
    id: 'EX-4417',
    code: 'CS4417-S26',
    title: 'Advanced Programming Assessment',
    course: 'Advanced Programming',
    faculty: 'Faculty of Computing & Data Sciences',
    term: 'Autumn term 2026',
    status: 'live',
    durationMinutes: 60,
    questionCount: 20,
    totalPoints: 120,
    scheduledWindow: {
      opensAt: '2026-09-26T13:00:00',
      closesAt: '2026-09-26T17:00:00',
    },
    candidateCount: 16,
    completedCount: 3,
    flaggedCount: 1,
    sections: ADVANCED_SECTIONS,
    policy: PROGRAMMING_POLICY,
    questions: ADVANCED_PROGRAMMING_QUESTIONS,
    requiresSecondaryDevice: true,
    simulated: true,
  },
  {
    id: 'EX-4402',
    code: 'CS4402-S26',
    title: 'Data Structures and Algorithms',
    course: 'Data Structures & Algorithms',
    faculty: 'Faculty of Computing & Data Sciences',
    term: 'Autumn term 2026',
    status: 'closed',
    durationMinutes: 45,
    questionCount: 8,
    totalPoints: 44,
    scheduledWindow: {
      opensAt: '2026-09-24T09:00:00',
      closesAt: '2026-09-24T12:00:00',
    },
    candidateCount: 128,
    completedCount: 128,
    flaggedCount: 11,
    sections: [
      { id: 'ds-sec-a', title: 'A. Complexity', questionNumbers: [1, 2] },
      { id: 'ds-sec-b', title: 'B. Trees', questionNumbers: [3, 4] },
      { id: 'ds-sec-c', title: 'C. Graphs', questionNumbers: [5, 6] },
      { id: 'ds-sec-d', title: 'D. Hashing', questionNumbers: [7, 8] },
    ],
    policy: DSA_POLICY,
    questions: DSA_QUESTIONS,
    requiresSecondaryDevice: false,
    simulated: true,
  },
  {
    id: 'EX-4310',
    code: 'SEC4310-S25',
    title: 'Secure Systems Fundamentals',
    course: 'Secure Systems',
    faculty: 'Faculty of Computing & Data Sciences',
    term: 'Spring term 2026',
    status: 'archived',
    durationMinutes: 30,
    questionCount: 6,
    totalPoints: 32,
    scheduledWindow: {
      opensAt: '2026-05-14T09:00:00',
      closesAt: '2026-05-14T17:00:00',
    },
    candidateCount: 96,
    completedCount: 95,
    flaggedCount: 4,
    sections: [
      { id: 'sec-sec-a', title: 'A. Transport security', questionNumbers: [1, 2] },
      { id: 'sec-sec-b', title: 'B. Application security', questionNumbers: [3, 4] },
      { id: 'sec-sec-c', title: 'C. Assessment integrity', questionNumbers: [5, 6] },
    ],
    policy: SEC_POLICY,
    questions: SEC_QUESTIONS,
    requiresSecondaryDevice: true,
    simulated: true,
  },
];

export const EXAM_BY_ID = new Map(EXAMS.map(e => [e.id, e]));
export const EXAM_BY_CODE = new Map(EXAMS.map(e => [e.code, e]));

export const POLICY_BY_ID = new Map(
  [...PROGRAMMING_POLICY, ...DSA_POLICY, ...SEC_POLICY].map(p => [p.id, p]),
);
