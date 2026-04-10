import {
  ContentTier,
  EducationLevel,
  LawAcademicLevel,
  LawMajor,
  Prisma,
  PrismaClient,
  ProgramType,
  Role,
  Stream,
  SubscriptionTier,
} from '@prisma/client';

export type SubjectAccessUser = {
  role: Role;
  subscriptionTier: SubscriptionTier;
  lawUniversity: string | null;
  lawMajor: LawMajor | null;
  lawAcademicLevel: LawAcademicLevel | null;
  educationLevel: import('@prisma/client').EducationLevel | null;
  grade: number | null;
  universityYear: number | null;
  stream: import('@prisma/client').Stream | null;
};

const semestersForLawLevel = (level: LawAcademicLevel): number[] => {
  switch (level) {
    case 'L1':
      return [1, 2];
    case 'L2':
      return [3, 4];
    case 'L3':
      return [5, 6];
    default:
      return [];
  }
};

export function buildSubjectWhereForUser(user: SubjectAccessUser | null): Prisma.SubjectWhereInput {
  if (!user) {
    return {
      OR: [
        { programType: ProgramType.BAC, contentTier: ContentTier.FREE_GLOBAL },
        { programType: ProgramType.LAW, contentTier: ContentTier.FREE_GLOBAL },
      ],
    };
  }

  if (user.role === 'ADMIN') {
    return {};
  }

  if (user.role === 'TEACHER') {
    return { programType: ProgramType.LAW };
  }

  if (user.role !== 'STUDENT') {
    return {};
  }

  if (user.lawUniversity) {
    return buildLawStudentSubjectWhere(user);
  }

  return buildBacStudentSubjectWhere(user);
}

function buildBacStudentSubjectWhere(user: SubjectAccessUser): Prisma.SubjectWhereInput {
  const tierFilter: Prisma.SubjectWhereInput =
    user.subscriptionTier === SubscriptionTier.FREE
      ? { contentTier: ContentTier.FREE_GLOBAL }
      : {
          OR: [
            { contentTier: ContentTier.FREE_GLOBAL },
            { contentTier: ContentTier.PREMIUM_SCOPED },
          ],
        };

  const parts: Prisma.SubjectWhereInput[] = [
    {
      programType: ProgramType.BAC,
    },
    tierFilter,
  ];

  if (user.educationLevel) {
    parts.push({ educationLevel: user.educationLevel });
  }
  if (user.grade != null) {
    parts.push({ grade: user.grade });
  }
  if (user.universityYear != null) {
    parts.push({ universityYear: user.universityYear });
  }
  if (user.stream) {
    parts.push({ stream: user.stream });
  }

  return { AND: parts };
}

function buildLawStudentSubjectWhere(user: SubjectAccessUser): Prisma.SubjectWhereInput {
  const freeLaw: Prisma.SubjectWhereInput = {
    programType: ProgramType.LAW,
    contentTier: ContentTier.FREE_GLOBAL,
  };

  // Free tier: global law demos + full L1 tronc commun at the student’s university (semesters 1–2).
  // L2/L3 scoped modules still require PREMIUM (see canUserAccessSubject).
  if (user.subscriptionTier === SubscriptionTier.FREE) {
    const ors: Prisma.SubjectWhereInput[] = [freeLaw];
    if (user.lawAcademicLevel === 'L1' && user.lawUniversity) {
      ors.push({
        programType: ProgramType.LAW,
        contentTier: ContentTier.PREMIUM_SCOPED,
        lawUniversity: user.lawUniversity,
        lawAcademicLevel: 'L1',
        semester: { in: [1, 2] },
        lawMajor: null,
      });
    }
    return { OR: ors };
  }

  if (!user.lawAcademicLevel) {
    return freeLaw;
  }

  // L2/L3 tracks split by private vs public law; L1 is a common core (subjects use lawMajor: null).
  if (user.lawAcademicLevel !== 'L1' && !user.lawMajor) {
    return freeLaw;
  }

  const allowedSemesters = semestersForLawLevel(user.lawAcademicLevel);

  const majorMatch: Prisma.SubjectWhereInput[] = [];
  if (user.lawAcademicLevel === 'L1') {
    majorMatch.push({ lawMajor: null });
  } else {
    majorMatch.push({ lawMajor: null }, { lawMajor: user.lawMajor });
  }

  const premiumScoped: Prisma.SubjectWhereInput = {
    programType: ProgramType.LAW,
    contentTier: ContentTier.PREMIUM_SCOPED,
    lawUniversity: user.lawUniversity,
    lawAcademicLevel: user.lawAcademicLevel,
    semester: { in: allowedSemesters },
    OR: majorMatch,
  };

  return {
    OR: [freeLaw, premiumScoped],
  };
}

export async function getSubjectIdsForUser(
  prisma: PrismaClient,
  user: SubjectAccessUser | null,
): Promise<string[]> {
  const rows = await prisma.subject.findMany({
    where: buildSubjectWhereForUser(user),
    select: { id: true },
  });
  return rows.map(r => r.id);
}

export async function getSubjectIdsForTeacher(
  prisma: PrismaClient,
  teacherId: string,
): Promise<string[]> {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { lawUniversity: true },
  });
  const scopes = await prisma.teacherScope.findMany({
    where: { teacherId },
  });
  const lawClause: Prisma.SubjectWhereInput =
    teacher?.lawUniversity != null
      ? {
          programType: ProgramType.LAW,
          lawUniversity: teacher.lawUniversity,
        }
      : { programType: ProgramType.LAW };
  const where: Prisma.SubjectWhereInput =
    scopes.length > 0
      ? {
          OR: [
            ...scopes.map(
              (s): Prisma.SubjectWhereInput => ({
                programType: ProgramType.BAC,
                educationLevel: s.educationLevel,
                ...(s.grade != null && { grade: s.grade }),
                ...(s.universityYear != null && { universityYear: s.universityYear }),
                stream: s.stream,
              }),
            ),
            lawClause,
          ],
        }
      : lawClause;
  const rows = await prisma.subject.findMany({ where, select: { id: true } });
  return rows.map(r => r.id);
}

export async function resolveAllowedSubjectIds(
  prisma: PrismaClient,
  auth: { userId: string; role: Role } | undefined,
): Promise<string[]> {
  if (!auth) {
    return getSubjectIdsForUser(prisma, null);
  }
  if (auth.role === 'ADMIN') {
    const rows = await prisma.subject.findMany({ select: { id: true } });
    return rows.map(r => r.id);
  }
  if (auth.role === 'STUDENT') {
    const u = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        role: true,
        subscriptionTier: true,
        lawUniversity: true,
        lawMajor: true,
        lawAcademicLevel: true,
        educationLevel: true,
        grade: true,
        universityYear: true,
        stream: true,
      },
    });
    if (!u) {
      return [];
    }
    return getSubjectIdsForUser(prisma, u as SubjectAccessUser);
  }
  if (auth.role === 'TEACHER') {
    return getSubjectIdsForTeacher(prisma, auth.userId);
  }
  return [];
}

export type SubjectAccessCheck = {
  programType: ProgramType;
  contentTier: ContentTier;
  lawUniversity: string | null;
  lawAcademicLevel: LawAcademicLevel | null;
  lawMajor: LawMajor | null;
  semester: number | null;
  educationLevel: EducationLevel | null;
  grade: number | null;
  universityYear: number | null;
  stream: Stream | null;
};

export async function canRequestAccessSubject(
  prisma: PrismaClient,
  auth: { userId: string; role: Role } | undefined,
  subject: SubjectAccessCheck,
): Promise<boolean> {
  if (!auth) {
    return canUserAccessSubject(null, subject);
  }
  if (auth.role === 'ADMIN') {
    return true;
  }
  const u = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      role: true,
      subscriptionTier: true,
      lawUniversity: true,
      lawMajor: true,
      lawAcademicLevel: true,
      educationLevel: true,
      grade: true,
      universityYear: true,
      stream: true,
    },
  });
  if (auth.role === 'STUDENT') {
    if (!u) {
      return false;
    }
    return canUserAccessSubject(u as SubjectAccessUser, subject);
  }
  if (auth.role === 'TEACHER') {
    if (!u) {
      return false;
    }
    if (subject.programType === ProgramType.LAW) {
      if (
        u.lawUniversity &&
        subject.lawUniversity &&
        subject.lawUniversity !== u.lawUniversity
      ) {
        return false;
      }
      return true;
    }
    if (subject.programType !== ProgramType.BAC) {
      return false;
    }
    if (subject.educationLevel == null || subject.stream == null) {
      return false;
    }
    const scope = await prisma.teacherScope.findFirst({
      where: {
        teacherId: auth.userId,
        educationLevel: subject.educationLevel,
        grade: subject.grade,
        universityYear: subject.universityYear,
        stream: subject.stream,
      },
    });
    return !!scope;
  }
  return false;
}

export function canUserAccessSubject(
  user: SubjectAccessUser | null,
  subject: {
    programType: ProgramType;
    contentTier: ContentTier;
    lawUniversity: string | null;
    lawAcademicLevel: LawAcademicLevel | null;
    lawMajor: LawMajor | null;
    semester: number | null;
    educationLevel: import('@prisma/client').EducationLevel | null;
    grade: number | null;
    universityYear: number | null;
    stream: import('@prisma/client').Stream | null;
  },
): boolean {
  if (!user) {
    return (
      subject.contentTier === ContentTier.FREE_GLOBAL &&
      (subject.programType === ProgramType.BAC || subject.programType === ProgramType.LAW)
    );
  }

  if (user.role === 'ADMIN') {
    return true;
  }

  if (user.role === 'TEACHER') {
    if (subject.programType !== ProgramType.LAW) {
      return false;
    }
    if (
      user.lawUniversity &&
      subject.lawUniversity &&
      subject.lawUniversity !== user.lawUniversity
    ) {
      return false;
    }
    return true;
  }

  if (user.role === 'STUDENT' && user.lawUniversity) {
    if (subject.programType !== ProgramType.LAW) {
      return false;
    }
    if (subject.contentTier === ContentTier.FREE_GLOBAL) {
      return true;
    }
    if (subject.contentTier !== ContentTier.PREMIUM_SCOPED) {
      return false;
    }
    if (subject.lawUniversity !== user.lawUniversity) {
      return false;
    }

    // L1 tronc commun (semesters 1–2, no major): included for FREE and PREMIUM at same university.
    if (
      user.lawAcademicLevel === 'L1' &&
      subject.lawAcademicLevel === 'L1' &&
      subject.lawMajor == null &&
      subject.semester != null &&
      [1, 2].includes(subject.semester)
    ) {
      return true;
    }

    if (user.subscriptionTier !== SubscriptionTier.PREMIUM) {
      return false;
    }
    if (subject.lawAcademicLevel !== user.lawAcademicLevel) {
      return false;
    }
    if (subject.semester == null || user.lawAcademicLevel == null) {
      return false;
    }
    const allowed = semestersForLawLevel(user.lawAcademicLevel);
    if (!allowed.includes(subject.semester)) {
      return false;
    }
    if (user.lawAcademicLevel === 'L1') {
      return subject.lawMajor == null;
    }
    if (subject.lawMajor == null) {
      return true;
    }
    return subject.lawMajor === user.lawMajor;
  }

  if (user.role === 'STUDENT' && !user.lawUniversity) {
    if (subject.programType !== ProgramType.BAC) {
      return false;
    }
    if (
      user.subscriptionTier === SubscriptionTier.FREE &&
      subject.contentTier === ContentTier.PREMIUM_SCOPED
    ) {
      return false;
    }
    if (user.educationLevel && subject.educationLevel !== user.educationLevel) {
      return false;
    }
    if (user.grade != null && subject.grade != null && subject.grade !== user.grade) {
      return false;
    }
    if (
      user.universityYear != null &&
      subject.universityYear != null &&
      subject.universityYear !== user.universityYear
    ) {
      return false;
    }
    if (user.stream && subject.stream !== user.stream) {
      return false;
    }
    return true;
  }

  return false;
}
