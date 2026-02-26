import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create or find teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@yakine.com' },
    update: {},
    create: {
      email: 'teacher@yakine.com',
      name: 'Prof. Yakine',
      password: teacherPassword,
      role: 'TEACHER',
      language: 'fr'
    }
  });
  console.log(`  Teacher: ${teacher.name} (${teacher.id})`);

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yakine.com' },
    update: {},
    create: {
      email: 'admin@yakine.com',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
      language: 'fr'
    }
  });
  console.log(`  Admin: ${admin.name} (${admin.id})`);

  // Create subjects
  const subjectData = [
    { id: 'math-sci', nameEn: 'Mathematics', nameFr: 'Mathématiques', slugEn: 'mathematics', slugFr: 'mathematiques', stream: 'SCIENTIFIC' as const, icon: '📐', color: '#6C63FF' },
    { id: 'physics-sci', nameEn: 'Physics', nameFr: 'Physique', slugEn: 'physics', slugFr: 'physique', stream: 'SCIENTIFIC' as const, icon: '⚛️', color: '#FF6B6B' },
    { id: 'arabic-lit', nameEn: 'Arabic Literature', nameFr: 'Littérature Arabe', slugEn: 'arabic-literature', slugFr: 'litterature-arabe', stream: 'LITERARY' as const, icon: '📖', color: '#4ECDC4' },
    { id: 'philosophy', nameEn: 'Philosophy', nameFr: 'Philosophie', slugEn: 'philosophy', slugFr: 'philosophie', stream: 'LITERARY' as const, icon: '🧠', color: '#45B7D1' },
    { id: 'history-geo', nameEn: 'History & Geography', nameFr: 'Histoire et Géographie', slugEn: 'history-geography', slugFr: 'histoire-geographie', stream: 'LITERARY' as const, icon: '🌍', color: '#96CEB4' },
    { id: 'english', nameEn: 'English', nameFr: 'Anglais', slugEn: 'english', slugFr: 'anglais', stream: 'SCIENTIFIC' as const, icon: '🇬🇧', color: '#FFEAA7' },
  ];

  const subjects = await Promise.all(
    subjectData.map(s =>
      prisma.subject.upsert({
        where: { id: s.id },
        update: { slugEn: s.slugEn, slugFr: s.slugFr, icon: s.icon, color: s.color },
        create: s,
      })
    )
  );
  console.log(`  Created ${subjects.length} subjects`);

  // Create chapters for Mathematics
  const mathChapters = await Promise.all([
    prisma.chapter.upsert({
      where: { id: 'math-ch1' },
      update: { sortOrder: 1 },
      create: { id: 'math-ch1', nameEn: 'Sequences and Series', nameFr: 'Suites numériques', sortOrder: 1, subjectId: 'math-sci' }
    }),
    prisma.chapter.upsert({
      where: { id: 'math-ch2' },
      update: { sortOrder: 2 },
      create: { id: 'math-ch2', nameEn: 'Limits and Continuity', nameFr: 'Limites et continuité', sortOrder: 2, subjectId: 'math-sci' }
    }),
    prisma.chapter.upsert({
      where: { id: 'math-ch3' },
      update: { sortOrder: 3 },
      create: { id: 'math-ch3', nameEn: 'Derivatives', nameFr: 'Dérivation', sortOrder: 3, subjectId: 'math-sci' }
    })
  ]);
  console.log(`  Created ${mathChapters.length} chapters for Mathematics`);

  // Create chapters for Physics
  const physicsChapters = await Promise.all([
    prisma.chapter.upsert({
      where: { id: 'phys-ch1' },
      update: { sortOrder: 1 },
      create: { id: 'phys-ch1', nameEn: 'Mechanics', nameFr: 'Mécanique', sortOrder: 1, subjectId: 'physics-sci' }
    }),
    prisma.chapter.upsert({
      where: { id: 'phys-ch2' },
      update: { sortOrder: 2 },
      create: { id: 'phys-ch2', nameEn: 'Electromagnetism', nameFr: 'Électromagnétisme', sortOrder: 2, subjectId: 'physics-sci' }
    })
  ]);
  console.log(`  Created ${physicsChapters.length} chapters for Physics`);

  // Create sample lessons (using placeholder audio URL)
  const placeholderAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  const lessons = await Promise.all([
    prisma.lesson.upsert({
      where: { id: 'lesson-math-1' },
      update: { sortOrder: 1 },
      create: {
        id: 'lesson-math-1',
        titleEn: 'Introduction to Arithmetic Sequences',
        titleFr: 'Introduction aux suites arithmétiques',
        audioUrl: placeholderAudioUrl,
        scriptEn: 'An arithmetic sequence is a sequence of numbers where the difference between consecutive terms is constant. This constant difference is called the common difference, denoted by d. For example, the sequence 2, 5, 8, 11, 14 is an arithmetic sequence with d = 3. The general term formula is: a_n = a_1 + (n-1)d, where a_1 is the first term and n is the position.',
        scriptFr: 'Une suite arithmétique est une suite de nombres où la différence entre les termes consécutifs est constante. Cette différence constante est appelée la raison, notée r. Par exemple, la suite 2, 5, 8, 11, 14 est une suite arithmétique de raison r = 3. La formule du terme général est : u_n = u_0 + n×r, où u_0 est le premier terme et n est le rang.',
        duration: 480,
        sortOrder: 1,
        chapterId: 'math-ch1',
        teacherId: teacher.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-math-2' },
      update: { sortOrder: 2 },
      create: {
        id: 'lesson-math-2',
        titleEn: 'Geometric Sequences',
        titleFr: 'Suites géométriques',
        audioUrl: placeholderAudioUrl,
        scriptEn: 'A geometric sequence is a sequence where each term after the first is found by multiplying the previous term by a fixed, non-zero number called the common ratio. If the first term is a and the ratio is r, then the sequence is: a, ar, ar², ar³, ... The general term is a_n = a × r^(n-1).',
        scriptFr: 'Une suite géométrique est une suite où chaque terme après le premier est obtenu en multipliant le terme précédent par un nombre fixe non nul appelé la raison. Si le premier terme est u_0 et la raison est q, alors la suite est : u_0, u_0×q, u_0×q², u_0×q³, ... Le terme général est u_n = u_0 × q^n.',
        duration: 420,
        sortOrder: 2,
        chapterId: 'math-ch1',
        teacherId: teacher.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-math-3' },
      update: { sortOrder: 1 },
      create: {
        id: 'lesson-math-3',
        titleEn: 'Understanding Limits',
        titleFr: 'Comprendre les limites',
        audioUrl: placeholderAudioUrl,
        scriptEn: 'In mathematics, a limit is the value that a function approaches as the input approaches some value. We write lim(x→a) f(x) = L to mean that f(x) approaches L as x approaches a. Limits are fundamental to calculus and analysis.',
        scriptFr: 'En mathématiques, une limite est la valeur vers laquelle une fonction tend lorsque la variable s\'approche d\'une certaine valeur. On écrit lim(x→a) f(x) = L pour signifier que f(x) tend vers L quand x tend vers a. Les limites sont fondamentales en calcul et analyse.',
        duration: 540,
        sortOrder: 1,
        chapterId: 'math-ch2',
        teacherId: teacher.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-phys-1' },
      update: { sortOrder: 1 },
      create: {
        id: 'lesson-phys-1',
        titleEn: 'Newton\'s Laws of Motion',
        titleFr: 'Les lois de Newton',
        audioUrl: placeholderAudioUrl,
        scriptEn: 'Newton\'s First Law states that an object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an external force. The Second Law states that F = ma, force equals mass times acceleration. The Third Law states that for every action there is an equal and opposite reaction.',
        scriptFr: 'La première loi de Newton stipule qu\'un objet au repos reste au repos, et un objet en mouvement reste en mouvement avec la même vitesse et la même direction, sauf si une force extérieure agit sur lui. La deuxième loi stipule que F = ma, la force est égale à la masse multipliée par l\'accélération. La troisième loi stipule que pour chaque action, il y a une réaction égale et opposée.',
        duration: 600,
        sortOrder: 1,
        chapterId: 'phys-ch1',
        teacherId: teacher.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-phys-2' },
      update: { sortOrder: 1 },
      create: {
        id: 'lesson-phys-2',
        titleEn: 'Electric Fields and Forces',
        titleFr: 'Champs et forces électriques',
        audioUrl: placeholderAudioUrl,
        scriptEn: 'An electric field is a region of space around an electrically charged particle within which a force would be exerted on other charged particles. Coulomb\'s law describes the force between two point charges: F = k × q1 × q2 / r², where k is Coulomb\'s constant, q1 and q2 are the charges, and r is the distance between them.',
        scriptFr: 'Un champ électrique est une région de l\'espace autour d\'une particule chargée électriquement dans laquelle une force serait exercée sur d\'autres particules chargées. La loi de Coulomb décrit la force entre deux charges ponctuelles : F = k × q1 × q2 / r², où k est la constante de Coulomb, q1 et q2 sont les charges, et r est la distance entre elles.',
        duration: 550,
        sortOrder: 1,
        chapterId: 'phys-ch2',
        teacherId: teacher.id
      }
    })
  ]);
  console.log(`  Created ${lessons.length} lessons`);

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
