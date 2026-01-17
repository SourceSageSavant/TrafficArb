import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { prisma } from '../index.js';
import { logger } from '../lib/logger.js';

export const achievementsRouter = Router();

// Achievement requirement types and their check functions
type RequirementType = 'tasks_completed' | 'referrals' | 'streak' | 'total_earned' | 'level';

interface AchievementRequirement {
    type: RequirementType;
    value: number;
}

/**
 * GET /api/achievements
 * Get all available achievements with user's unlock status
 */
achievementsRouter.get('/', authenticate, async (req, res, next) => {
    try {
        const userId = req.user!.id;

        // Get all achievements
        const achievements = await prisma.achievement.findMany({
            orderBy: { xpReward: 'asc' },
        });

        // Get user's unlocked achievements
        const unlockedIds = await prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true, unlockedAt: true },
        });

        const unlockedMap = new Map(unlockedIds.map(u => [u.achievementId, u.unlockedAt]));

        // Get user stats for progress calculation
        const [taskCount, referralCount, user, streak] = await Promise.all([
            prisma.task.count({ where: { userId, status: 'APPROVED' } }),
            prisma.user.count({ where: { referrerId: userId } }),
            prisma.user.findUnique({ where: { id: userId }, select: { level: true, totalEarnedNano: true } }),
            prisma.dailyStreak.findUnique({ where: { userId }, select: { currentStreak: true } }),
        ]);

        const stats = {
            tasks_completed: taskCount,
            referrals: referralCount,
            streak: streak?.currentStreak || 0,
            total_earned: Number(user?.totalEarnedNano || 0n) / 1e9,
            level: user?.level || 1,
        };

        const achievementsWithStatus = achievements.map(a => {
            const requirement = a.requirement as unknown as AchievementRequirement;
            const currentValue = stats[requirement.type] || 0;
            const isUnlocked = unlockedMap.has(a.id);

            return {
                id: a.id,
                code: a.code,
                name: a.name,
                description: a.description,
                iconUrl: a.iconUrl,
                xpReward: a.xpReward,
                requirement: requirement,
                progress: Math.min(currentValue / requirement.value, 1),
                currentValue,
                isUnlocked,
                unlockedAt: unlockedMap.get(a.id) || null,
            };
        });

        res.json({
            success: true,
            data: {
                achievements: achievementsWithStatus,
                stats: {
                    total: achievements.length,
                    unlocked: unlockedIds.length,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/achievements/check
 * Check and unlock any achievements the user has earned
 */
achievementsRouter.post('/check', authenticate, async (req, res, next) => {
    try {
        const userId = req.user!.id;

        // Get user stats
        const [taskCount, referralCount, user, streak] = await Promise.all([
            prisma.task.count({ where: { userId, status: 'APPROVED' } }),
            prisma.user.count({ where: { referrerId: userId } }),
            prisma.user.findUnique({ where: { id: userId }, select: { level: true, totalEarnedNano: true, xp: true } }),
            prisma.dailyStreak.findUnique({ where: { userId }, select: { currentStreak: true } }),
        ]);

        const stats: Record<RequirementType, number> = {
            tasks_completed: taskCount,
            referrals: referralCount,
            streak: streak?.currentStreak || 0,
            total_earned: Number(user?.totalEarnedNano || 0n) / 1e9,
            level: user?.level || 1,
        };

        // Get all achievements user hasn't unlocked yet
        const unlockedIds = await prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true },
        });
        const unlockedSet = new Set(unlockedIds.map(u => u.achievementId));

        const allAchievements = await prisma.achievement.findMany();
        const eligible = allAchievements.filter(a => {
            if (unlockedSet.has(a.id)) return false;
            const req = a.requirement as unknown as AchievementRequirement;
            return stats[req.type] >= req.value;
        });

        // Unlock eligible achievements
        const newlyUnlocked = [];
        let totalXp = 0;

        for (const achievement of eligible) {
            await prisma.userAchievement.create({
                data: {
                    userId,
                    achievementId: achievement.id,
                },
            });
            newlyUnlocked.push({
                id: achievement.id,
                name: achievement.name,
                xpReward: achievement.xpReward,
            });
            totalXp += achievement.xpReward;
        }

        // Award XP if any achievements unlocked
        if (totalXp > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: { xp: { increment: totalXp } },
            });
            logger.info({ userId, newlyUnlocked, totalXp }, 'User unlocked achievements');
        }

        res.json({
            success: true,
            data: {
                newlyUnlocked,
                totalXpAwarded: totalXp,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/achievements/leaderboard
 * Get top users by achievement count
 */
achievementsRouter.get('/leaderboard', async (req, res, next) => {
    try {
        const topUsers = await prisma.userAchievement.groupBy({
            by: ['userId'],
            _count: { achievementId: true },
            orderBy: { _count: { achievementId: 'desc' } },
            take: 20,
        });

        // Get user details
        const userIds = topUsers.map(u => u.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, firstName: true, level: true },
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const leaderboard = topUsers.map((entry, index) => ({
            rank: index + 1,
            user: userMap.get(entry.userId),
            achievementCount: entry._count.achievementId,
        }));

        res.json({
            success: true,
            data: { leaderboard },
        });
    } catch (error) {
        next(error);
    }
});
