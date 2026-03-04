import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Middleware: verifies a TEACHER has a valid scope for the target chapter/subject.
 * ADMIN bypasses all checks.
 *
 * The middleware resolves the chapter's subject to find its educationLevel, grade,
 * universityYear, and stream, then checks the teacher has a matching TeacherScope row.
 *
 * Expects `req.body.chapterId` to be present (used in lesson creation).
 */
export async function requireTeacherScope(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Admins bypass scope checks
    if (req.auth.role === 'ADMIN') {
      return next();
    }

    if (req.auth.role !== 'TEACHER') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { chapterId } = req.body;

    if (!chapterId) {
      return res.status(400).json({ message: 'chapterId is required' });
    }

    // Resolve chapter → subject to find scope fields
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { subject: true },
    });

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    const subject = chapter.subject;

    const scope = await prisma.teacherScope.findFirst({
      where: {
        teacherId: req.auth.userId,
        educationLevel: subject.educationLevel,
        grade: subject.grade,
        universityYear: subject.universityYear,
        stream: subject.stream,
      },
    });

    if (!scope) {
      return res.status(403).json({
        message:
          'You do not have permission to post content to this section. Contact an admin to get access.',
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}
