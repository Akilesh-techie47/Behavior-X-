import type { Candidate, Examiner } from '../../domain/types';

/**
 * Candidate and staff records.
 *
 * Names, registration numbers and institutions are invented but internally
 * consistent: every candidate in a cohort shares a faculty and a registration
 * format, because that is what a real institution's roster looks like.
 */

const FACULTY = 'Faculty of Computing & Data Sciences';
const INSTITUTION = 'Northgate Institute of Technology';

function candidate(
  index: number,
  name: string,
  cohort: string,
  emailLocal: string,
  accommodationNotes?: string,
): Candidate {
  return {
    id: `cand-${String(index).padStart(3, '0')}`,
    name,
    registrationId: `NG/CS/${cohort}/${String(4100 + index * 7)}`,
    email: `${emailLocal}@northgate.edu`,
    institution: INSTITUTION,
    faculty: FACULTY,
    cohort,
    accommodationNotes,
  };
}

export const CANDIDATES: Candidate[] = [
  candidate(1, 'Elena Rostova', 'S26', 'e.rostova'),
  candidate(2, 'Marcus Vance', 'S26', 'm.vance'),
  candidate(3, 'Aisha Chen', 'S26', 'a.chen'),
  candidate(4, 'Devendra Iyer', 'S26', 'd.iyer'),
  candidate(5, 'Noor Haddad', 'S26', 'n.haddad'),
  candidate(6, 'Tobias Lindqvist', 'S26', 't.lindqvist'),
  candidate(7, 'Priya Raghunathan', 'S26', 'p.raghunathan'),
  candidate(8, 'Samuel Okafor', 'S26', 's.okafor'),
  candidate(9, 'Hana Kobayashi', 'S26', 'h.kobayashi'),
  candidate(10, 'Lorenzo Bianchi', 'S26', 'l.bianchi'),
  candidate(11, 'Zainab Farouk', 'S26', 'z.farouk'),
  candidate(12, 'Callum Doherty', 'S26', 'c.doherty'),
  candidate(13, 'Wei Zhang', 'S26', 'w.zhang'),
  candidate(14, 'Amara Nwosu', 'S26', 'a.nwosu', 'Extra time: 25% additional duration'),
  candidate(15, 'Jonas Meier', 'S26', 'j.meier'),
  candidate(16, 'Fatima El-Sayed', 'S26', 'f.elsayed'),
];

export const CANDIDATE_BY_ID = new Map(CANDIDATES.map(c => [c.id, c]));

export const EXAMINERS: Examiner[] = [
  {
    id: 'EX-4471',
    name: 'R. Whitlock',
    role: 'Senior Invigilator',
    certification: 'Certified Proctor, Level III',
  },
  {
    id: 'EX-4488',
    name: 'D. Achterberg',
    role: 'Examination Officer',
    certification: 'Certified Proctor, Level II',
  },
  {
    id: 'EX-4502',
    name: 'S. Boateng',
    role: 'Review Panel Chair',
    certification: 'Certified Proctor, Level III',
  },
];

export const EXAMINER_BY_ID = new Map(EXAMINERS.map(e => [e.id, e]));

/** The signed-in examiner for the console in this build. */
export const CURRENT_EXAMINER: Examiner = EXAMINERS[0];
