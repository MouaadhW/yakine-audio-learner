import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';
import { requireTeacherPostPermission } from '../middleware/teacherPostPermission';
import { canRequestAccessSubject, canUserAccessSubject, resolveAllowedSubjectIds } from '../lib/subjectAccess';
import {
  canViewerAccessLessonAudience,
  isLessonLockedForViewer,
  lessonListAudienceWhereInput,
  loadLessonListViewer,
  redactLockedLessonContent,
  LessonListViewer,
} from '../lib/lessonAccess';
import { batchSignAudioUrls } from '../lib/storageUpload';
import { env } from '../config/env';

const createLessonSchema = z.object({
  titleEn: z.string().min(2),
  titleFr: z.string().min(2),
  audioUrl: z.string().url().optional().default(''),
  scriptEn: z.string().optional().default(''),
  scriptFr: z.string().optional().default(''),
  duration: z.number().int().positive().optional().default(0),
  sortOrder: z.number().int().optional(),
  chapterId: z.string().min(1),
  audience: z.enum(['FREE', 'PREMIUM']).optional().default('FREE'),
});

const querySchema = z.object({
  chapterId: z.string().optional(),
  subjectId: z.string().optional(),
  stream: z.enum(['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL', 'LAW']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  orderBy: z.string().optional(),
});

const updateLessonSchema = z.object({
  titleEn: z.string().min(2).optional(),
  titleFr: z.string().min(2).optional(),
  audioUrl: z.string().optional(),
  scriptEn: z.string().optional(),
  scriptFr: z.string().optional(),
  duration: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']).optional(),
  audience: z.enum(['FREE', 'PREMIUM']).optional(),
});

export const lessonRouter = Router();

lessonRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '15');

    const isAdmin = req.auth?.role === 'ADMIN';

    // For admins: skip the expensive subject-ID list fetch and avoid a massive IN clause.
    // For everyone else: fetch allowed IDs and the viewer subscription snapshot in parallel.
    const [allowedIds, listViewer] = await Promise.all([
      isAdmin ? Promise.resolve(null) : resolveAllowedSubjectIds(prisma, req.auth),
      loadLessonListViewer(prisma, req.auth),
    ]);

    if (!isAdmin && allowedIds !== null && allowedIds.length === 0) {
      return res.json({ contents: [], currentPage: page, totalPage: 1, pageSize: limit, totalElements: 0 });
    }

    if (!isAdmin && allowedIds !== null && query.subjectId && !allowedIds.includes(query.subjectId)) {
      return res.json({ contents: [], currentPage: page, totalPage: 1, pageSize: limit, totalElements: 0 });
    }

    const subjectIdFilter: Record<string, unknown> = isAdmin
      ? (query.subjectId ? { equals: query.subjectId } : {})
      : { [query.subjectId ? 'equals' : 'in']: query.subjectId ?? allowedIds! };

    const chapterWhere: Record<string, unknown> = {
      ...(Object.keys(subjectIdFilter).length > 0 && { subjectId: subjectIdFilter }),
    };
    if (query.chapterId) {
      chapterWhere.id = query.chapterId;
    }

    const subjectNested: Record<string, unknown> = {};
    if (query.stream) {
      subjectNested.stream = query.stream;
    }

    const audienceFilter = lessonListAudienceWhereInput(req.auth);

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      ...audienceFilter,
      chapter: {
        ...chapterWhere,
        ...(Object.keys(subjectNested).length > 0 && { subject: subjectNested }),
      },
    };

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          chapter: {
            include: { subject: true }
          },
          teacher: {
            select: { id: true, name: true }
          }
        },
        orderBy: query.orderBy === 'enrollment'
          ? { createdAt: 'desc' }
          : query.orderBy === 'publishedAt'
            ? { createdAt: 'desc' }
            : { sortOrder: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.lesson.count({ where }),
    ]);

    const contents = lessons.map((l: any) => {
      const locked = isLessonLockedForViewer(listViewer, l.audience);
      const scriptEn: string = l.scriptEn ?? '';
      // Strip audio URLs, scripts, and transcripts for locked lessons.
      // Signed URLs are added below only for accessible (unlocked) lessons.
      const base = redactLockedLessonContent(l, locked);
      return {
        ...base,
        locked,
        teacherName: l.teacher?.name || 'Unknown Teacher',
        title: l.titleEn,
        slug: l.id,
        featured: false,
        level: 'beginner' as const,
        access: locked ? 'premium' as const : 'free' as const,
        status: 'published' as const,
        // Don't leak script text in the excerpt for locked lessons.
        excerpt: locked ? '' : scriptEn.substring(0, 120) + (scriptEn.length > 120 ? '...' : ''),
        wordCount: locked ? 0 : (scriptEn ? scriptEn.split(/\s+/).length : 0),
        visibility: 'public' as const,
        publishedAt: l.createdAt.toISOString(),
        meta: {
          rating: '4.8',
          ratingCount: '0',
          enrolledCount: '0',
          viewCount: '0',
        },
      };
    });

    // Generate signed URLs for accessible lessons in a single batch call
    const accessible = contents.filter(l => !l.locked && l.audioUrl);
    if (accessible.length > 0) {
      const signed = await batchSignAudioUrls(
        accessible.map(l => l.audioUrl),
        env.AUDIO_SIGNED_URL_TTL_S,
      );
      accessible.forEach((l, i) => { l.audioUrl = signed[i] ?? ''; });
    }

    return res.json({
      contents,
      currentPage: page,
      totalPage: Math.ceil(total / limit) || 1,
      pageSize: limit,
      totalElements: total,
    });
  } catch (error) {
    return next(error);
  }
});

lessonRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    // Fetch lesson and the requesting user's profile in parallel (single round-trip each)
    const [lesson, viewer] = await Promise.all([
      prisma.lesson.findUnique({
        where: { id: req.params.id },
        include: {
          chapter: { include: { subject: true } },
          teacher: { select: { id: true, name: true } },
        },
      }),
      req.auth
        ? prisma.user.findUnique({
            where: { id: req.auth.userId },
            select: {
              role: true,
              subscriptionTier: true,
              lawUniversity: true,
              lawMajor: true,
              lawAcademicLevel: true,
              educationLevel: true,
              grade: true,
              universityYear: true,
              stream: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Admins bypass all access checks
    if (req.auth?.role !== 'ADMIN') {
      const subjectUser = viewer ? { ...viewer, role: req.auth!.role } : null;
      if (!canUserAccessSubject(subjectUser, lesson.chapter.subject)) {
        return res.status(403).json({ message: 'You do not have access to this lesson' });
      }

      const listViewer: LessonListViewer = viewer
        ? { role: viewer.role, subscriptionTier: viewer.subscriptionTier }
        : null;
      if (isLessonLockedForViewer(listViewer, lesson.audience)) {
        return res.status(403).json({ message: 'This lesson requires a premium subscription' });
      }
    }

    // Sign all audio fields in one batch call before returning
    const [signedUrl, signedEn, signedFr, signedAr] = await batchSignAudioUrls(
      [lesson.audioUrl, lesson.audioUrlEn, lesson.audioUrlFr, lesson.audioUrlAr],
      env.AUDIO_SIGNED_URL_TTL_S,
    );

    return res.json({
      ...lesson,
      audioUrl: signedUrl ?? lesson.audioUrl,
      audioUrlEn: signedEn,
      audioUrlFr: signedFr,
      audioUrlAr: signedAr,
      teacherName: lesson.teacher?.name || 'Unknown Teacher',
      title: lesson.titleEn,
      slug: lesson.id,
    });
  } catch (error) {
    return next(error);
  }
});

lessonRouter.post('/', requireAuth, requireRole('TEACHER', 'ADMIN'), requireTeacherPostPermission, async (req, res, next) => {
  try {
    const input = createLessonSchema.parse(req.body);

    const lesson = await prisma.lesson.create({
      data: {
        ...input,
        teacherId: req.auth!.userId,
        // Teachers submit for review; admins publish directly
        status: req.auth!.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING_REVIEW',
      }
    });

    return res.status(201).json(lesson);
  } catch (error) {
    return next(error);
  }
});

lessonRouter.put('/:id', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = updateLessonSchema.parse(req.body);

    // Teachers can only edit their own lessons
    if (req.auth!.role === 'TEACHER') {
      const existing = await prisma.lesson.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.teacherId !== req.auth!.userId) {
        return res.status(403).json({ message: 'You can only edit your own lessons' });
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: input,
    });

    return res.json(lesson);
  } catch (error) {
    return next(error);
  }
});

lessonRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Lesson deleted' });
  } catch (error) {
    return next(error);
  }
});
