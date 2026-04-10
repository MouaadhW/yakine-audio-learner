import type { LawCurriculumRow } from './lawCurriculumTypes';
import { FDSEPS_UNIVERSITY } from './lawUniversityConstants';
import { STANDARD_LMD_LAW_CURRICULUM } from './standardLawLmdCurriculum';

export { FDSEPS_UNIVERSITY };
export type { LawCurriculumRow as FdsepsCurriculumRow };

/** @deprecated Use `LawCurriculumRow` from lawCurriculumTypes */
export const FDSEPS_CURRICULUM: LawCurriculumRow[] = STANDARD_LMD_LAW_CURRICULUM;
