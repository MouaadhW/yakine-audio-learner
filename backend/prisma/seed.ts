import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { FSJPST_LAW_CURRICULUM } from '../src/constants/fsjpstLawCurriculum';
import {
  FDSEPS_UNIVERSITY,
  FDSF_UNIVERSITY,
  FDSPT_UNIVERSITY,
  FSJPST_UNIVERSITY,
  LAW_UNIVERSITIES_SEED_ORDER,
} from '../src/constants/lawUniversityConstants';
import { STANDARD_LMD_LAW_CURRICULUM } from '../src/constants/standardLawLmdCurriculum';
import type { LawCurriculumRow } from '../src/constants/lawCurriculumTypes';

const prisma = new PrismaClient();

const placeholderAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const LAW_CURRICULUM_BY_UNIVERSITY: {
  prefix: string;
  university: string;
  rows: LawCurriculumRow[];
}[] = [
  { prefix: 'fdseps', university: FDSEPS_UNIVERSITY, rows: STANDARD_LMD_LAW_CURRICULUM },
  { prefix: 'fdsf', university: FDSF_UNIVERSITY, rows: STANDARD_LMD_LAW_CURRICULUM },
  { prefix: 'fdspt', university: FDSPT_UNIVERSITY, rows: STANDARD_LMD_LAW_CURRICULUM },
  { prefix: 'fsjpst', university: FSJPST_UNIVERSITY, rows: FSJPST_LAW_CURRICULUM },
];

/** Deletes only BAC high-school demo subjects and their chapters/lessons. Law faculty data is preserved. */
async function deleteBacCatalog() {
  const bacRows = await prisma.subject.findMany({
    where: { programType: 'BAC' },
    select: { id: true },
  });
  const ids = bacRows.map(r => r.id);
  if (ids.length === 0) {
    console.log('  No BAC subjects in database');
    return;
  }
  await prisma.lesson.deleteMany({
    where: { chapter: { subjectId: { in: ids } } },
  });
  await prisma.chapter.deleteMany({
    where: { subjectId: { in: ids } },
  });
  await prisma.subject.deleteMany({
    where: { id: { in: ids } },
  });
  console.log(`  Removed BAC catalogue (${ids.length} subjects and related chapters/lessons)`);
}

async function seedLawUniversities(teacherId: string) {
  const freeRows = [
    {
      id: 'law-free-legal-skills',
      nameEn: 'Legal study skills & research',
      nameFr: 'Méthodes de travail et recherche juridique',
      slugEn: 'legal-study-skills',
      slugFr: 'methodes-travail-juridique',
    },
    {
      id: 'law-free-tunisian-system-overview',
      nameEn: 'Overview of the Tunisian legal system',
      nameFr: "Aperçu de l'ordre juridique tunisien",
      slugEn: 'tunisian-legal-system-overview',
      slugFr: 'ordre-juridique-tunisien',
    },
  ];

  for (const s of freeRows) {
    await prisma.subject.upsert({
      where: { id: s.id },
      update: {
        nameEn: s.nameEn,
        nameFr: s.nameFr,
        slugEn: s.slugEn,
        slugFr: s.slugFr,
        programType: 'LAW',
        contentTier: 'FREE_GLOBAL',
        stream: 'LAW',
        educationLevel: 'UNIVERSITY',
      },
      create: {
        ...s,
        programType: 'LAW',
        contentTier: 'FREE_GLOBAL',
        stream: 'LAW',
        educationLevel: 'UNIVERSITY',
        icon: '⚖️',
        color: '#1a365d',
      },
    });
    const chId = `${s.id}-ch1`;
    await prisma.chapter.upsert({
      where: { id: chId },
      update: {},
      create: {
        id: chId,
        nameEn: 'Introduction',
        nameFr: 'Introduction',
        sortOrder: 0,
        subjectId: s.id,
      },
    });
    await prisma.lesson.upsert({
      where: { id: `${s.id}-lesson-1` },
      update: { audience: 'FREE' },
      create: {
        id: `${s.id}-lesson-1`,
        titleEn: 'Welcome',
        titleFr: 'Bienvenue',
        audioUrl: placeholderAudioUrl,
        scriptEn: 'Placeholder audio for free-tier law learners.',
        scriptFr: 'Audio placeholder pour les apprenants en droit (offre gratuite).',
        duration: 120,
        sortOrder: 0,
        chapterId: chId,
        teacherId,
        status: 'PUBLISHED',
        audience: 'FREE',
      },
    });
  }

  await prisma.subject.deleteMany({
    where: {
      programType: 'LAW',
      contentTier: 'PREMIUM_SCOPED',
      lawUniversity: { in: [...LAW_UNIVERSITIES_SEED_ORDER] },
    },
  });

  let totalLawSubjects = 0;
  for (const pack of LAW_CURRICULUM_BY_UNIVERSITY) {
    for (const row of pack.rows) {
      const id = `${pack.prefix}-${row.key}`;
      await prisma.subject.upsert({
        where: { id },
        update: {
          nameEn: row.nameEn,
          nameFr: row.nameFr,
          lawUniversity: pack.university,
          lawAcademicLevel: row.level,
          lawMajor: row.lawMajor,
          semester: row.semester,
        },
        create: {
          id,
          nameEn: row.nameEn,
          nameFr: row.nameFr,
          slugEn: row.key,
          slugFr: row.key,
          stream: 'LAW',
          educationLevel: 'UNIVERSITY',
          programType: 'LAW',
          contentTier: 'PREMIUM_SCOPED',
          lawUniversity: pack.university,
          lawAcademicLevel: row.level,
          lawMajor: row.lawMajor,
          semester: row.semester,
          icon: '⚖️',
          color: '#2c5282',
        },
      });
      await prisma.chapter.upsert({
        where: { id: `${id}-overview` },
        update: {},
        create: {
          id: `${id}-overview`,
          nameEn: 'Course overview',
          nameFr: "Vue d'ensemble",
          sortOrder: 0,
          subjectId: id,
        },
      });
      totalLawSubjects += 1;
    }
  }

  console.log(
    `  Law: ${freeRows.length} free-global subjects, ${totalLawSubjects} premium-scoped law subjects across ${LAW_CURRICULUM_BY_UNIVERSITY.length} faculties`,
  );
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create or find teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@yakine.com' },
    update: {
      name: 'Prof. Yakine',
      password: teacherPassword,
      role: 'TEACHER',
      subscriptionTier: 'PREMIUM',
      language: 'fr',
      lawRegion: 'SOUSSE',
      lawUniversity: FDSEPS_UNIVERSITY,
      lawMajor: 'DROIT_PRIVE',
      lawAcademicLevel: 'L3',
    },
    create: {
      email: 'teacher@yakine.com',
      name: 'Prof. Yakine',
      password: teacherPassword,
      role: 'TEACHER',
      subscriptionTier: 'PREMIUM',
      language: 'fr',
      lawRegion: 'SOUSSE',
      lawUniversity: FDSEPS_UNIVERSITY,
      lawMajor: 'DROIT_PRIVE',
      lawAcademicLevel: 'L3',
    },
  });
  console.log(`  Teacher: ${teacher.name} (${teacher.id})`);

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yakine.com' },
    update: {
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
      subscriptionTier: 'PREMIUM',
      language: 'fr',
    },
    create: {
      email: 'admin@yakine.com',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
      subscriptionTier: 'PREMIUM',
      language: 'fr'
    }
  });
  console.log(`  Admin: ${admin.name} (${admin.id})`);

  await deleteBacCatalog();
  await seedLawUniversities(teacher.id);

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Test accounts:');
  console.log('  Student:  student@yakine.com / student123 (not created - use signup)');
  console.log('  Teacher:  teacher@yakine.com / teacher123');
  console.log('  Admin:    admin@yakine.com / admin123');
}

main()
  .catch(e => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
