import { prisma } from './prisma';

export async function processGamificationAction(userId: string, xpToAward: number) {
  // We use an interactive transaction to safely read and update the user's streak and XP
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { xp: true, currentStreak: true, longestStreak: true, lastStreakAt: true },
    });

    if (!user) return null;

    const now = new Date();
    let { currentStreak, longestStreak, lastStreakAt } = user;

    // Determine streak increment logic
    let streakIncremented = false;

    if (!lastStreakAt) {
      // First ever action
      currentStreak = 1;
      longestStreak = 1;
      lastStreakAt = now;
      streakIncremented = true;
    } else {
      const msPerDay = 24 * 60 * 60 * 1000;
      // Normalise dates to start of day in UTC
      const lastStreakDate = new Date(Date.UTC(lastStreakAt.getFullYear(), lastStreakAt.getMonth(), lastStreakAt.getDate()));
      const nowDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      
      const diffDays = Math.floor((nowDate.getTime() - lastStreakDate.getTime()) / msPerDay);

      if (diffDays === 1) {
        // Next calendar day = streak maintained
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        lastStreakAt = now;
        streakIncremented = true;
      } else if (diffDays > 1) {
        // Streak broken
        currentStreak = 1;
        lastStreakAt = now;
        streakIncremented = true;
      }
      // If diffDays === 0, action is on the same day, so streak is not modified, but XP is still awarded.
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpToAward },
        ...(streakIncremented && {
          currentStreak,
          longestStreak,
          lastStreakAt,
        }),
      },
    });

    return {
      xpAwarded: xpToAward,
      newTotalXp: updatedUser.xp,
      currentStreak: updatedUser.currentStreak,
      streakIncremented,
    };
  });
}
