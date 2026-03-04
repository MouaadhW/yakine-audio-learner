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
export function requireTeacherScope(req: Request, res: Response, next: NextFunction) {
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
  prisma.chapter
    .findUnique({
      where: { id: chapterId },
      include: { subject: true },
    })
    .then(chapter => {
      if (!chapter) {
        return res.status(404).json({ message: 'Chapter not found' });
      }

      const subject = chapter.subject;

      return prisma.teacherScope
        .findFirst({
          where: {
            teacherId: req.auth!.userId,
            educationLevel: subject.educationLevel,
            grade: subject.grade,
            universityYear: subject.universityYear,
            stream: subject.stream,
          },
        })
        .then(scope => {
          if (!scope) {
            return res.status(403).json({
              message:
                'You do not have permission to post content to this section. Contact an admin to get access.',
            });
          }

          return next();
        });
    })
    .catch(err => next(err));
}
