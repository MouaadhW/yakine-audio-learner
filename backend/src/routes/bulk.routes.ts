import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const bulkRouter = Router();

bulkRouter.use(requireAuth, requireRole('ADMIN'));

// GET /api/admin/bulk/export — export subjects, chapters, lessons as JSON
bulkRouter.get('/export', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        chapters: {
          include: {
            lessons: {
              select: {
                id: true,
                titleEn: true,
                titleFr: true,
                audioUrl: true,
                scriptEn: true,
                scriptFr: true,
                duration: true,
                sortOrder: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const exported = subjects.map((s: any) => ({
      id: s.id,
      nameEn: s.nameEn,
      nameFr: s.nameFr,
      slugEn: s.slugEn,
      slugFr: s.slugFr,
      stream: s.stream,
      icon: s.icon,
      color: s.color,
      chapters: s.chapters.map((ch: any) => ({
        id: ch.id,
        nameEn: ch.nameEn,
        nameFr: ch.nameFr,
        sortOrder: ch.sortOrder,
        lessons: ch.lessons,
      })),
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="yakine-export-${Date.now()}.json"`,
    );
    return res.json({ version: 1, exportedAt: new Date().toISOString(), subjects: exported });
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/bulk/import — import subjects, chapters, lessons from JSON
const lessonImportSchema = z.object({
  titleEn: z.string(),
  titleFr: z.string(),
  audioUrl: z.string().url(),
  scriptEn: z.string(),
  scriptFr: z.string(),
  duration: z.number(),
  sortOrder: z.number().optional(),
  audience: z.enum(['FREE', 'PREMIUM']).optional(),
});

const importSchema = z.object({
  version: z.number(),
  subjects: z.array(
    z.object({
      nameEn: z.string(),
      nameFr: z.string(),
      slugEn: z.string().optional(),
      slugFr: z.string().optional(),
      stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL']),
      icon: z.string().optional(),
      color: z.string().optional(),
      chapters: z
        .array(
          z.object({
            nameEn: z.string(),
            nameFr: z.string(),
            sortOrder: z.number().optional(),
            lessons: z.array(lessonImportSchema).max(100).optional(),
          }),
        )
        .max(50)
        .optional(),
    }),
  ).max(50),
});

bulkRouter.post('/import', async (req, res, next) => {
  try {
    const input = importSchema.parse(req.body);
    const stats = { subjects: 0, chapters: 0, lessons: 0 };
    const teacherId = req.auth!.userId;

    await prisma.$transaction(async (tx) => {
      for (const subjectData of input.subjects) {
        const subject = await tx.subject.create({
          data: {
            nameEn: subjectData.nameEn,
            nameFr: subjectData.nameFr,
            slugEn: subjectData.slugEn || '',
            slugFr: subjectData.slugFr || '',
            stream: subjectData.stream,
            icon: subjectData.icon || '📚',
            color: subjectData.color || '#6C63FF',
          },
        });
        stats.subjects++;

        if (subjectData.chapters) {
          for (const chapterData of subjectData.chapters) {
            const chapter = await tx.chapter.create({
              data: {
                nameEn: chapterData.nameEn,
                nameFr: chapterData.nameFr,
                sortOrder: chapterData.sortOrder || 0,
                subjectId: subject.id,
              },
            });
            stats.chapters++;

            if (chapterData.lessons) {
              for (const lessonData of chapterData.lessons) {
                await tx.lesson.create({
                  data: {
                    titleEn: lessonData.titleEn,
                    titleFr: lessonData.titleFr,
                    audioUrl: lessonData.audioUrl,
                    scriptEn: lessonData.scriptEn,
                    scriptFr: lessonData.scriptFr,
                    duration: lessonData.duration,
                    sortOrder: lessonData.sortOrder || 0,
                    chapterId: chapter.id,
                    teacherId,
                    status: 'PUBLISHED',
                    audience: lessonData.audience ?? 'FREE',
                  },
                });
                stats.lessons++;
              }
            }
          }
        }
      }
    }, { timeout: 30_000 });

    return res.status(201).json({
      message: 'Import complete',
      imported: stats,
    });
  } catch (error) {
    return next(error);
  }
});
