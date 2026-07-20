import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { invalidateQuizCache } from './quiz.routes';

export const adminQuizRouter = Router();

// All routes require auth + ADMIN or TEACHER role
adminQuizRouter.use(requireAuth, requireRole('ADMIN', 'TEACHER'));

// ── Zod schemas ───────────────────────────────────────────────────────────────

const optionSchema = z.object({
  id: z.string().optional(),           // present when updating existing option
  labelFr: z.string().min(1),
  labelEn: z.string().optional(),
  labelAr: z.string().optional(),
  isCorrect: z.boolean(),
  explanationFr: z.string().optional(),
  explanationEn: z.string().optional(),
  explanationAr: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const questionSchema = z.object({
  id: z.string().optional(),           // present when updating existing question
  questionFr: z.string().min(1),
  questionEn: z.string().optional(),
  questionAr: z.string().optional(),
  type: z.enum(['SINGLE', 'MULTIPLE']).default('SINGLE'),
  sortOrder: z.number().int().default(0),
  options: z.array(optionSchema).min(2).max(6),
});

const createQuizSchema = z.object({
  lessonId: z.string().min(1),
  questions: z.array(questionSchema).min(1).max(10),
});

const updateQuizSchema = z.object({
  questions: z.array(questionSchema).min(1).max(10),
});

// ── Helper: resolve teacher ownership for a quiz ──────────────────────────────

async function canManageQuiz(
  quizId: string,
  auth: { userId: string; role: string },
): Promise<boolean> {
  if (auth.role === 'ADMIN') return true;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { lesson: { select: { teacherId: true } } },
  });
  return quiz?.lesson.teacherId === auth.userId;
}

// ── POST /api/admin/quiz ──────────────────────────────────────────────────────
// Create a full quiz with questions + options for a lesson.

adminQuizRouter.post('/', async (req, res, next) => {
  try {
    const input = createQuizSchema.parse(req.body);

    // Teachers can only create quizzes for their own lessons
    if (req.auth!.role === 'TEACHER') {
      const lesson = await prisma.lesson.findUnique({
        where: { id: input.lessonId },
        select: { teacherId: true },
      });
      if (lesson?.teacherId !== req.auth!.userId) {
        return res.status(403).json({ message: 'You can only add quizzes to your own lessons' });
      }
    }

    const existing = await prisma.quiz.findUnique({ where: { lessonId: input.lessonId } });
    if (existing) {
      return res.status(409).json({ message: 'A quiz already exists for this lesson. Use PUT to update it.' });
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: input.lessonId,
        questions: {
          create: input.questions.map(q => ({
            questionFr: q.questionFr,
            questionEn: q.questionEn,
            questionAr: q.questionAr,
            type: q.type,
            sortOrder: q.sortOrder,
            options: {
              create: q.options.map(o => ({
                labelFr: o.labelFr,
                labelEn: o.labelEn,
                labelAr: o.labelAr,
                isCorrect: o.isCorrect,
                explanationFr: o.explanationFr,
                explanationEn: o.explanationEn,
                explanationAr: o.explanationAr,
                sortOrder: o.sortOrder,
              })),
            },
          })),
        },
      },
      include: {
        questions: { include: { options: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    invalidateQuizCache(quiz.lessonId);

    return res.status(201).json(quiz);
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/admin/quiz/lesson/:lessonId ──────────────────────────────────────
// Get full quiz for a lesson (with correct answers — admin/teacher only).

adminQuizRouter.get('/lesson/:lessonId', async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: req.params.lessonId },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!quiz) return res.status(404).json({ message: 'No quiz for this lesson' });
    return res.json(quiz);
  } catch (err) {
    return next(err);
  }
});

// ── PUT /api/admin/quiz/:quizId ───────────────────────────────────────────────
// Full replace of all questions + options (simplest approach for the editor).

adminQuizRouter.put('/:quizId', async (req, res, next) => {
  try {
    const { quizId } = req.params;
    if (!(await canManageQuiz(quizId, req.auth!))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const input = updateQuizSchema.parse(req.body);

    // Delete existing questions (cascades to options)
    await prisma.quizQuestion.deleteMany({ where: { quizId } });

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: {
          create: input.questions.map(q => ({
            questionFr: q.questionFr,
            questionEn: q.questionEn,
            questionAr: q.questionAr,
            type: q.type,
            sortOrder: q.sortOrder,
            options: {
              create: q.options.map(o => ({
                labelFr: o.labelFr,
                labelEn: o.labelEn,
                labelAr: o.labelAr,
                isCorrect: o.isCorrect,
                explanationFr: o.explanationFr,
                explanationEn: o.explanationEn,
                explanationAr: o.explanationAr,
                sortOrder: o.sortOrder,
              })),
            },
          })),
        },
      },
      include: {
        questions: { include: { options: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    invalidateQuizCache(quiz.lessonId);

    return res.json(quiz);
  } catch (err) {
    return next(err);
  }
});

// ── DELETE /api/admin/quiz/:quizId ────────────────────────────────────────────

adminQuizRouter.delete('/:quizId', async (req, res, next) => {
  try {
    const { quizId } = req.params;
    if (!(await canManageQuiz(quizId, req.auth!))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { lessonId: true } });
    
    await prisma.quiz.delete({ where: { id: quizId } });
    
    if (quiz) {
      invalidateQuizCache(quiz.lessonId);
    }
    
    return res.json({ message: 'Quiz deleted' });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/admin/quiz/attempts/:lessonId ────────────────────────────────────
// All attempts for a lesson (admin only — for analytics).

adminQuizRouter.get('/attempts/:lessonId', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { lessonId: req.params.lessonId },
      orderBy: { completedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return res.json(attempts);
  } catch (err) {
    return next(err);
  }
});
