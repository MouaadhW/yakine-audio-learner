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

// POST /api/parents/invite - create a link between parent and existing student (by id or email)
parentRouter.post('/invite', async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { studentId, email } = req.body as { studentId?: string; email?: string };
    let student;
    if (studentId) {
      student = await prisma.user.findUnique({ where: { id: studentId } });
    } else if (email) {
      student = await prisma.user.findUnique({ where: { email } });
    } else {
      return res.status(400).json({ message: 'studentId or email required' });
    }
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Prevent duplicate link
    const existing = await prisma.parentStudentLink.findUnique({ where: { parentId_studentId: { parentId, studentId: student.id } } });
    if (existing) return res.status(200).json({ inviteCode: existing.inviteCode });

    const inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase();
    const link = await prisma.parentStudentLink.create({ data: { parentId, studentId: student.id, inviteCode } });
    return res.status(201).json({ inviteCode: link.inviteCode });
  } catch (err) {
    next(err);
  }
});

// POST /api/parents/unlink - remove a parent-student link
parentRouter.post('/unlink', async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { studentId } = req.body as { studentId: string };
    if (!studentId) return res.status(400).json({ message: 'studentId required' });
    await prisma.parentStudentLink.deleteMany({ where: { parentId, studentId } });
    return res.json({ message: 'Unlinked' });
  } catch (err) {
    next(err);
  }
});

export default parentRouter;
