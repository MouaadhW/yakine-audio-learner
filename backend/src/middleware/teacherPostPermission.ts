import { Request, Response, NextFunction } from 'express';
import { ProgramType } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Ensures TEACHER may create content on the target chapter:
 * - BAC: existing TeacherScope row (grade/stream/year).
 * - LAW: same `lawUniversity` as the subject; if the teacher has any
 *   `TeacherLawSubject` rows, the subject must be explicitly assigned.
 */
export async function requireTeacherPostPermission(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.auth.role === 'ADMIN') {
      return next();
    }

    if (req.auth.role !== 'TEACHER') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const chapterId = req.body.chapterId as string | undefined;
    if (!chapterId) {
      return res.status(400).json({ message: 'chapterId is required' });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { subject: true },
    });

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    const subject = chapter.subject;

    if (subject.programType === ProgramType.LAW) {
      const teacher = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { lawUniversity: true },
      });
      if (!teacher?.lawUniversity) {
        return res.status(403).json({
          message:
            'Your teacher account must have a law faculty set. Ask an admin to update your profile or assign you to a university.',
        });
      }
      if (subject.lawUniversity !== teacher.lawUniversity) {
        return res.status(403).json({
          message: 'You can only publish lessons for your own law faculty.',
        });
      }
      const assigned = await prisma.teacherLawSubject.count({
        where: { teacherId: req.auth.userId },
      });
      if (assigned > 0) {
        const ok = await prisma.teacherLawSubject.findFirst({
          where: { teacherId: req.auth.userId, subjectId: subject.id },
        });
        if (!ok) {
          return res.status(403).json({
            message:
              'You are not assigned to teach this subject. Ask an admin to add it under your law subjects.',
          });
        }
      }
      return next();
    }

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
