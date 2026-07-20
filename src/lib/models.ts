export type UserRole = 'user' | 'contributor' | 'author' | 'admin' | 'owner';
export type PostStatus = 'draft' | 'published';
export type PostVisibility = 'public' | 'member' | 'paid_member';
export type CourseStatus = 'draft' | 'published';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseAccess = 'free' | 'premium';
export type LessonType = 'text' | 'video' | 'quiz' | 'audio';
export type QuizType = 'multiple_choice' | 'single_choice' | 'short_answer';

export type BACStream =
  | 'scientific'
  | 'literary'
  | 'economic'
  | 'technical'
  | 'all';

export interface BACSubject {
  id: string;
  slugEn: string;
  slugFr: string;
  nameEn: string;
  nameFr: string;
  stream: BACStream;
  icon?: string;
  color?: string;
  chapterCount?: number;
  chapters?: BACChapter[];
  programType?: 'BAC' | 'LAW';
  contentTier?: 'FREE_GLOBAL' | 'PREMIUM_SCOPED';
  lawUniversity?: string | null;
  /** 1 = semester one (S1), 2 = semester two (S2); law subjects may use 1–6. */
  semester?: number | null;
}

export interface BACChapter {
  id: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
  subjectId: string;
  subject?: BACSubject;
  lessons?: BACLesson[];
}

export interface BACLesson {
  id: string;
  titleEn: string;
  titleFr: string;
  audioUrl: string;
  audioUrlEn?: string;
  audioUrlFr?: string;
  audioUrlAr?: string;
  scriptEn: string;
  scriptFr: string;
  scriptAr?: string;
  transcriptEn?: string;
  transcriptFr?: string;
  transcriptAr?: string;
  duration: number;
  teacherName: string;
  teacherAvatar?: string;
  teacherId?: string;
  sortOrder: number;
  chapterId: string;
  chapter?: BACChapter;
  completed?: boolean;
  downloadedPath?: string;
  downloadStatus?: 'not_downloaded' | 'downloading' | 'downloaded' | 'failed';
  downloadProgress?: number;
  /** FREE = all eligible students; PREMIUM = requires paid subscription */
  audience?: 'FREE' | 'PREMIUM';
  /** Server: true when the current user cannot play this lesson (e.g. PREMIUM lesson, FREE student). */
  locked?: boolean;
  defaultAudioLanguage?: 'EN' | 'FR' | 'AR';
  audioSourceType?: 'LEGACY' | 'MANUAL_UPLOAD' | 'MANUAL_RECORDING' | 'AI_TTS';
  isTeacherComposer?: boolean;
  composerAutoPublish?: boolean;
  generationRequestedAt?: string;
  generatedAt?: string;
  hasQuiz?: boolean; // Client-side logic might need to know if a quiz exists
  resurface?: boolean;
  resurfaceAt?: string | null;
}

export interface AudioPlayerState {
  currentLesson: BACLesson | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: number;
  isReady: boolean;
}

export interface ProgressEntry {
  id: string;
  userId: string;
  lessonId: string;
  position: number;
  completed: boolean;
  resurface?: boolean;
  resurfaceAt?: string | null;
  lesson: BACLesson;
  createdAt?: string;
  updatedAt?: string;
}

export type QuizQuestionType = 'SINGLE' | 'MULTIPLE';

export interface QuizOption {
  id: string;
  questionId?: string;
  label: string; // The backend returns just `label` (resolved by language)
  labelFr?: string; // Admin uses these
  labelEn?: string;
  labelAr?: string;
  isCorrect?: boolean;
  explanation?: string | null; // Student feedback
  explanationFr?: string; // Admin uses these
  explanationEn?: string;
  explanationAr?: string;
  sortOrder: number;
}

export interface QuizQuestion {
  id: string;
  quizId?: string;
  question: string; // resolved by language
  questionFr?: string;
  questionEn?: string;
  questionAr?: string;
  type: QuizQuestionType;
  sortOrder: number;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  score: number;
  answers: any;
  completedAt: string;
  lesson?: Partial<BACLesson>;
}

export interface QuizAttemptFeedback {
  questionId: string;
  question: string;
  isCorrect: boolean;
  correctOptionIds: string[];
  selectedOptionIds: string[];
  explanation: string | null;
  options: { id: string; label: string; isCorrect: boolean }[];
}

// ─────────────────────────────────────────────────────────
// Gamification module
// ─────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  nameFr: string;
  description: string;
  icon: string;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
  badge?: Badge;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  currentStreak: number;
  rank: number;
}

export interface QuizAttemptResult {
  attemptId: string;
  score: number;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  resurface: boolean;
  resurfaceAt: string | null;
  feedback: QuizAttemptFeedback[];
}

export interface Page<T = any> {
  contents: T[];
  currentPage: number;
  totalPage: number;
  pageSize: number;
  totalElements: number;
}

export interface SearchParams {
  [key: string]: string | number | undefined;
}

export interface Audit {
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  nickname: string;
  username: string;
  role: UserRole;
  email?: string;
  image?: string;
  headline?: string;
  subscriptionTier: string;
  language: string;
  banned: boolean;
  educationLevel?: string;
  grade?: number;
  universityYear?: number;
  stream?: string;
  
  // Gamification
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakAt?: string;
  expiredAt: number;
}

export interface UserMeta {
  enrollmentCount: number;
  bookmarkCount: number;
}

export interface Tag {
  id: number;
  slug: string;
  name: string;
  postCount?: string;
  audit?: Audit;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  courseCount?: string;
  audit?: Audit;
}

export interface Post {
  id: number;
  cover?: string;
  title?: string;
  slug: string;
  excerpt?: string;
  lexical?: string;
  html?: string;
  status: PostStatus;
  visibility: PostVisibility;
  featured: boolean;
  wordCount: number;
  authors?: User[];
  tags?: Tag[];
  publishedAt?: string;
  meta?: PostMeta;
  audit?: Audit;
}

export interface PostMeta {
  viewCount: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  cover?: string;
  excerpt?: string;
  featured: boolean;
  description?: string;
  level: CourseLevel;
  access: CourseAccess;
  status: CourseStatus;
  publishedAt?: string;
  category?: Category;
  authors?: User[];
  chapters?: Chapter[];
  meta?: CourseMeta;
  audit?: Audit;
}

export interface CourseMeta {
  rating: string;
  ratingCount: string;
  enrolledCount: string;
}

export interface CourseReview {
  rating: number;
  message?: string;
  user: User;
  audit: Audit;
}

export interface Chapter {
  id: number;
  title: string;
  slug: string;
  sortOrder: number;
  course?: Course;
  lessons?: Lesson[];
  audit?: Audit;
}

export interface Lesson {
  id: number;
  title: string;
  slug: string;
  trial: boolean;
  type: LessonType;
  lexical?: string;
  html?: string;
  sortOrder: number;
  wordCount: number;
  chapter?: Chapter;
  quizzes?: Quiz[];
  completed?: boolean;
  audit?: Audit;
}

export interface Quiz {
  id: number;
  question: string;
  type: QuizType;
  feedback?: string;
  sortOrder: number;
  answers: QuizAnswer[];
  audit?: Audit;
}

export interface QuizAnswer {
  id: number;
  answer: string;
  correct: boolean;
  sortOrder: number;
  deleted?: boolean;
  audit?: Audit;
}
