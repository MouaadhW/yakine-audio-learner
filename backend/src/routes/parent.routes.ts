import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const parentRouter = Router();

// All parent routes require auth + PARENT role
parentRouter.use(requireAuth, requireRole('PARENT'));

// GET /api/parents/students - list students linked to the authenticated parent
parentRouter.get('/students', async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const links = await prisma.parentStudentLink.findMany({
      where: { parentId },
      include: { student: { select: { id: true, name: true, email: true, xp: true, currentStreak: true } } },
    });

    return res.json({ students: links.map(l => ({ inviteCode: l.inviteCode, ...l.student })) });
  } catch (err) {
    next(err);
  }
});

// GET /api/parents/stats/:studentId - simplified metrics for a student
parentRouter.get('/stats/:studentId', async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const studentId = req.params.studentId;

    // Verify link exists
    const link = await prisma.parentStudentLink.findUnique({ where: { parentId_studentId: { parentId, studentId } } });
    if (!link) return res.status(404).json({ message: 'Student not linked to this parent' });

    // Fetch simplified metrics: total XP, current streak, quiz pass rate (percentage of quizzes with score >= 60)
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true, xp: true, currentStreak: true } });

    const totalQuizzes = await prisma.quizAttempt.count({ where: { userId: studentId } });
    const passedQuizzes = await prisma.quizAttempt.count({ where: { userId: studentId, score: { gte: 60 } } });
    const passRate = totalQuizzes === 0 ? null : Math.round((passedQuizzes / totalQuizzes) * 100);

    return res.json({ student, passRate });
  } catch (err) {
    next(err);
  }
});

export default parentRouter;
