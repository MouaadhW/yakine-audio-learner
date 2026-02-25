import {
  BACChapter,
  BACLesson,
  BACSubject,
  Category,
  Course,
  Page,
  Post,
} from './models';

const now = new Date().toISOString();

const SAMPLE_AUDIO =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const SAMPLE_SCRIPT_FR = `Dans ce cours, nous allons étudier les fonctions dérivées et leurs applications dans l'analyse mathématique du BAC.

La dérivée d'une fonction f en un point a est définie comme la limite du taux d'accroissement quand h tend vers 0.

f'(a) = lim(h→0) [f(a+h) - f(a)] / h

Cette notion est fondamentale pour l'étude des variations de fonctions, la recherche de maximums et minimums, et la résolution de problèmes d'optimisation.

Dans la suite du cours, nous verrons les règles de dérivation des fonctions usuelles : fonctions polynomiales, trigonométriques, exponentielles et logarithmiques.`;

const SAMPLE_SCRIPT_EN = `In this lesson, we will study derivative functions and their applications in BAC mathematical analysis.

The derivative of a function f at a point a is defined as the limit of the rate of change as h approaches 0.

f'(a) = lim(h→0) [f(a+h) - f(a)] / h

This concept is fundamental for studying function variations, finding maxima and minima, and solving optimization problems.

In the rest of the lesson, we will see the differentiation rules for common functions: polynomial, trigonometric, exponential and logarithmic functions.`;

export const bacLessons: BACLesson[] = [
  {
    id: 'lesson-1',
    titleEn: 'Introduction to Derivatives',
    titleFr: 'Introduction aux Dérivées',
    audioUrl: SAMPLE_AUDIO,
    scriptEn: SAMPLE_SCRIPT_EN,
    scriptFr: SAMPLE_SCRIPT_FR,
    duration: 720,
    teacherName: 'Prof. Ahmed Ben Ali',
    sortOrder: 1,
    chapterId: 'chapter-1',
    completed: false,
  },
  {
    id: 'lesson-2',
    titleEn: 'Differentiation Rules',
    titleFr: 'Règles de Dérivation',
    audioUrl: SAMPLE_AUDIO,
    scriptEn: 'Lesson 2 script in English...',
    scriptFr: 'Script de la leçon 2 en français...',
    duration: 840,
    teacherName: 'Prof. Ahmed Ben Ali',
    sortOrder: 2,
    chapterId: 'chapter-1',
    completed: false,
  },
  {
    id: 'lesson-3',
    titleEn: 'Vectors and Geometry',
    titleFr: 'Vecteurs et Géométrie',
    audioUrl: SAMPLE_AUDIO,
    scriptEn: 'Vectors lesson script...',
    scriptFr: 'Script vecteurs en français...',
    duration: 660,
    teacherName: 'Prof. Fatma Trabelsi',
    sortOrder: 1,
    chapterId: 'chapter-2',
    completed: false,
  },
];

export const bacChapters: BACChapter[] = [
  {
    id: 'chapter-1',
    nameEn: 'Analysis & Calculus',
    nameFr: 'Analyse & Calcul',
    sortOrder: 1,
    subjectId: 'subject-math',
    lessons: bacLessons.filter(l => l.chapterId === 'chapter-1'),
  },
  {
    id: 'chapter-2',
    nameEn: 'Geometry',
    nameFr: 'Géométrie',
    sortOrder: 2,
    subjectId: 'subject-math',
    lessons: bacLessons.filter(l => l.chapterId === 'chapter-2'),
  },
  {
    id: 'chapter-3',
    nameEn: 'Mechanics',
    nameFr: 'Mécanique',
    sortOrder: 1,
    subjectId: 'subject-physics',
    lessons: [],
  },
];

export const bacSubjects: BACSubject[] = [
  {
    id: 'subject-math',
    slugEn: 'mathematics',
    slugFr: 'mathematiques',
    nameEn: 'Mathematics',
    nameFr: 'Mathématiques',
    stream: 'scientific',
    icon: '📐',
    color: '#6C63FF',
    chapters: bacChapters.filter(c => c.subjectId === 'subject-math'),
  },
  {
    id: 'subject-physics',
    slugEn: 'physics',
    slugFr: 'physique',
    nameEn: 'Physics',
    nameFr: 'Physique',
    stream: 'scientific',
    icon: '⚛️',
    color: '#FF6B6B',
    chapters: bacChapters.filter(c => c.subjectId === 'subject-physics'),
  },
  {
    id: 'subject-arabic',
    slugEn: 'arabic',
    slugFr: 'arabe',
    nameEn: 'Arabic',
    nameFr: 'Arabe',
    stream: 'all',
    icon: '📖',
    color: '#4ECDC4',
    chapters: [],
  },
  {
    id: 'subject-philosophy',
    slugEn: 'philosophy',
    slugFr: 'philosophie',
    nameEn: 'Philosophy',
    nameFr: 'Philosophie',
    stream: 'all',
    icon: '🧠',
    color: '#45B7D1',
    chapters: [],
  },
  {
    id: 'subject-english',
    slugEn: 'english',
    slugFr: 'anglais',
    nameEn: 'English',
    nameFr: 'Anglais',
    stream: 'all',
    icon: '🇬🇧',
    color: '#96CEB4',
    chapters: [],
  },
  {
    id: 'subject-french',
    slugEn: 'french',
    slugFr: 'francais',
    nameEn: 'French',
    nameFr: 'Français',
    stream: 'all',
    icon: '🇫🇷',
    color: '#FFEAA7',
    chapters: [],
  },
];

export const sampleCategories: Category[] = bacSubjects.map((subject, index) => ({
  id: index + 1,
  slug: subject.slugEn,
  name: subject.nameEn,
}));

export const sampleCourses: Course[] = [
  {
    id: 1,
    title: 'BAC Mathematics Audio Revision',
    slug: 'bac-mathematics-audio-revision',
    featured: true,
    level: 'beginner',
    access: 'free',
    status: 'published',
    category: sampleCategories[0],
    meta: {
      rating: '4.9',
      ratingCount: '208',
      enrolledCount: '1240',
    },
  },
  {
    id: 2,
    title: 'BAC Physics Audio Revision',
    slug: 'bac-physics-audio-revision',
    featured: true,
    level: 'intermediate',
    access: 'free',
    status: 'published',
    category: sampleCategories[1],
    meta: {
      rating: '4.8',
      ratingCount: '167',
      enrolledCount: '980',
    },
  },
];

export const samplePosts: Post[] = [
  {
    id: 1,
    slug: 'bac-tips-2026',
    title: 'Top 10 Tips to Pass the BAC 2026',
    excerpt: 'Expert strategies from top teachers to maximize your BAC score.',
    status: 'published',
    visibility: 'public',
    featured: true,
    wordCount: 900,
    publishedAt: now,
    meta: { viewCount: '2450' },
  },
  {
    id: 2,
    slug: 'audio-learning-benefits',
    title: 'Why Audio Learning Works for BAC Revision',
    excerpt: 'Research shows audio learning improves retention by 40%.',
    status: 'published',
    visibility: 'public',
    featured: false,
    wordCount: 720,
    publishedAt: now,
    meta: { viewCount: '1700' },
  },
];

export const sampleCategoryPage: Page<Category> = {
  contents: sampleCategories,
  currentPage: 1,
  totalPage: 1,
  pageSize: sampleCategories.length,
  totalElements: sampleCategories.length,
};

export const sampleCoursePage: Page<Course> = {
  contents: sampleCourses,
  currentPage: 1,
  totalPage: 1,
  pageSize: sampleCourses.length,
  totalElements: sampleCourses.length,
};

export const samplePostPage: Page<Post> = {
  contents: samplePosts,
  currentPage: 1,
  totalPage: 1,
  pageSize: samplePosts.length,
  totalElements: samplePosts.length,
};
