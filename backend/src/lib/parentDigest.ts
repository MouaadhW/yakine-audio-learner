import { prisma } from './prisma';
import { env } from '../config/env';
import Resend from 'resend';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null as any;

async function buildDigestForParent(parentId: string) {
  // Fetch linked students
  const links = await prisma.parentStudentLink.findMany({ where: { parentId }, include: { student: { select: { id: true, name: true, email: true, xp: true, currentStreak: true } } } });
  const rows: string[] = [];
  for (const l of links) {
    const studentId = l.student.id;
    const totalQuizzes = await prisma.quizAttempt.count({ where: { userId: studentId } });
    const passedQuizzes = await prisma.quizAttempt.count({ where: { userId: studentId, score: { gte: 60 } } });
    const passRate = totalQuizzes === 0 ? 'N/A' : `${Math.round((passedQuizzes / totalQuizzes) * 100)}%`;
    rows.push(`${l.student.name} — XP: ${l.student.xp} — Streak: ${l.student.currentStreak} — Quiz pass rate: ${passRate}`);
  }
  return rows.join('\n');
}

export async function sendWeeklyDigests() {
  const parents = await prisma.parentStudentLink.findMany({ select: { parentId: true }, distinct: ['parentId'] });
  for (const p of parents) {
    const parent = await prisma.user.findUnique({ where: { id: p.parentId }, select: { id: true, email: true, name: true } });
    if (!parent || !parent.email) continue;
    const body = await buildDigestForParent(p.parentId);
    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: env.FROM_EMAIL,
          to: parent.email,
          subject: `Weekly progress for your students`,
          text: `Hello ${parent.name || ''},\n\nHere is the weekly summary for your linked students:\n\n${body}`,
        });
      } catch (e) {
        console.warn('Failed to send digest email', e);
      }
    } else {
      console.log(`[digest] To: ${parent.email}\n${body}`);
    }
  }
}

export function scheduleWeeklyDigests() {
  if (process.env.RUN_DIGESTS !== 'true') return;
  // Run immediately on startup and then every 7 days
  void sendWeeklyDigests();
  setInterval(() => {
    void sendWeeklyDigests();
  }, 7 * 24 * 60 * 60 * 1000);
}

export default { scheduleWeeklyDigests, sendWeeklyDigests };
