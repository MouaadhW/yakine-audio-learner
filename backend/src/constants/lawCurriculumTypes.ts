import type { LawAcademicLevel, LawMajor } from '@prisma/client';

export type LawCurriculumRow = {
  key: string;
  nameEn: string;
  nameFr: string;
  level: LawAcademicLevel;
  semester: number;
  lawMajor: LawMajor | null;
};
