import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { processGamificationAction } from '../lib/gamification';
import rateLimit from 'express-rate-limit';

export const quizRouter = Router();

// ── In-memory Cache for Quizzes ──────────────────────────────────────────────
export const quizCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateQuizCache(lessonId: string) {
  quizCache.delete(lessonId);
}

const SPACED_REP_THRESHOLD = 0.6;      // score < 60% triggers resurface
const RESURFACE_DELAY_DAYS  = 3;       // resurface after 3 days

// ── Helper: pick the right language label ────────────────────────────────────

function pickLabel<T extends { labelFr: string; labelEn?: string | null; labelAr?: string | null }>(
  obj: T,
  lang: string,
): string {
  if (lang === 'ar' && obj.labelAr) return obj.labelAr;
  if (lang === 'en' && obj.labelEn) return obj.labelEn;
  return obj.labelFr;
}

function pickQuestion<T extends { questionFr: string; questionEn?: string | null; questionAr?: string | null }>(
  obj: T,
  lang: string,
): string {
  if (lang === 'ar' && obj.questionAr) return obj.questionAr;
  if (lang === 'en' && obj.questionEn) return obj.questionEn;
  return obj.questionFr;
}

function pickExplanation<T extends { explanationFr?: string | null; explanationEn?: string | null; explanationAr?: string | null }>(
  obj: T,
  lang: string,
): string | null {
  if (lang === 'ar' && obj.explanationAr) return obj.explanationAr;
  if (lang === 'en' && obj.explanationEn) return obj.explanationEn;
  return obj.explanationFr ?? null;
}

// ── GET /api/quiz/lesson/:lessonId ───────────────────────────────────────────
// Returns the quiz for a lesson (questions + options, correct answers HIDDEN).

quizRouter.get('/lesson/:lessonId', requireAuth, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const lang = (req.query.lang as string | undefined)?.toLowerCase() ?? 'fr';

    // Check cache first
    const cacheKey = `${lessonId}_${lang}`;
    const cached = quizCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!quiz) return res.status(404).json({ message: 'No quiz found for this lesson' });

    // Strip correct-answer flags before sending to student
    const sanitised = {
      id: quiz.id,
      lessonId: quiz.lessonId,
      questions: quiz.questions.map(q => ({
        id: q.id,
        question: pickQuestion(q, lang),
        type: q.type,
        sortOrder: q.sortOrder,
        options: q.options.map(o => ({
          id: o.id,
          label: pickLabel(o, lang),
          sortOrder: o.sortOrder,
          // isCorrect intentionally omitted
        })),
      })),
    };

    // Save to cache
    quizCache.set(cacheKey, { data: sanitised, timestamp: Date.now() });

    return res.json(sanitised);
  } catch (err) {
    return next(err);
  }
});

// ── POST /api/quiz/lesson/:lessonId/attempt ──────────────────────────────────
// Submit answers, get score + per-question feedback.

const attemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOptionIds: z.array(z.string()).min(1),
    }),
  ).min(1),
  lang: z.string().optional().default('fr'),
});

// Rate limiter: Max 5 attempts per minute per IP
const attemptLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Too many attempts. Please wait a minute before trying again.' },
});

quizRouter.post('/lesson/:lessonId/attempt', attemptLimiter, requireAuth, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const input = attemptSchema.parse(req.body);
    const userId = req.auth!.userId;
    const lang = input.lang.toLowerCase();

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) return res.status(404).json({ message: 'No quiz found for this lesson' });

    // Grade each question
    let correctCount = 0;
    const feedback = quiz.questions.map(question => {
      const submitted = input.answers.find(a => a.questionId === question.id);
      const selectedIds = submitted?.selectedOptionIds ?? [];
      const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id);

      const isCorrect =
        correctIds.length === selectedIds.length &&
        correctIds.every(id => selectedIds.includes(id));

      if (isCorrect) correctCount++;

      // Find the first wrong selected option that has an explanation
      const wrongOption = question.options.find(
        o => selectedIds.includes(o.id) && !o.isCorrect,
      );

      return {
        questionId: question.id,
        question: pickQuestion(question, lang),
        isCorrect,
        correctOptionIds: correctIds,
        selectedOptionIds: selectedIds,
        explanation: isCorrect ? null : pickExplanation(wrongOption ?? question.options[0], lang),
        options: question.options.map(o => ({
          id: o.id,
          label: pickLabel(o, lang),
          isCorrect: o.isCorrect,
        })),
      };
    });

    const score = quiz.questions.length > 0 ? correctCount / quiz.questions.length : 0;

    // Persist the attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        lessonId,
        score,
        answers: input.answers,
      },
    });

    // Update spaced-repetition flag on Progress
    const shouldResurface = score < SPACED_REP_THRESHOLD;
    const resurfaceAt = shouldResurface
      ? new Date(Date.now() + RESURFACE_DELAY_DAYS * 24 * 60 * 60 * 1000)
      : null;

    await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { resurface: shouldResurface, resurfaceAt },
      create: {
        userId,
        lessonId,
        position: 0,
        completed: true,
        resurface: shouldResurface,
        resurfaceAt,
      },
    });

    let gamification = null;
    const passed = score >= SPACED_REP_THRESHOLD;
    if (passed) {
      gamification = await processGamificationAction(userId, 20);
    }

    return res.status(201).json({
      attemptId: attempt.id,
      score,
      scorePercent: Math.round(score * 100),
      correctCount,
      totalCount: quiz.questions.length,
      passed,
      resurface: shouldResurface,
      resurfaceAt,
      feedback,
      gamification,
    });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/quiz/attempts/me ────────────────────────────────────────────────
// My attempt history, latest attempt per lesson.

quizRouter.get('/attempts/me', requireAuth, async (req, res, next) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        lessonId: true,
        score: true,
        completedAt: true,
        lesson: { select: { titleFr: true, titleEn: true } },
      },
    });
    return res.json(attempts);
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/quiz/resurface ──────────────────────────────────────────────────
// Lessons flagged for spaced-repetition review, due today or past due.

quizRouter.get('/resurface', requireAuth, async (req, res, next) => {
  try {
    const now = new Date();
    const progress = await prisma.progress.findMany({
      where: {
        userId: req.auth!.userId,
        resurface: true,
        resurfaceAt: { lte: now },
      },
      include: {
        lesson: {
          include: {
            chapter: { include: { subject: true } },
            teacher: { select: { name: true } },
          },
        },
      },
      orderBy: { resurfaceAt: 'asc' },
    });

    const result = progress.map(p => ({
      lessonId: p.lessonId,
      resurfaceAt: p.resurfaceAt,
      lesson: {
        id: p.lesson.id,
        titleFr: p.lesson.titleFr,
        titleEn: p.lesson.titleEn,
        duration: p.lesson.duration,
        audioUrl: p.lesson.audioUrl,
        teacherName: p.lesson.teacher?.name ?? 'Unknown',
        chapterId: p.lesson.chapterId,
        chapter: p.lesson.chapter
          ? {
              id: p.lesson.chapter.id,
              nameFr: p.lesson.chapter.nameFr,
              subject: p.lesson.chapter.subject
                ? { id: p.lesson.chapter.subject.id, nameFr: p.lesson.chapter.subject.nameFr }
                : null,
            }
          : null,
      },
    }));

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});
