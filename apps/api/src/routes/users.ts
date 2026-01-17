import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { prisma } from '../index.js';
import { formatTon, getLevelProgress, getXpForNextLevel } from '@traffic-arb/shared';

export const usersRouter = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
usersRouter.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;

        // Get streak info
        const streak = await prisma.dailyStreak.findUnique({
            where: { userId: user.id },
        });

        // Get stats
        const [tasksCompleted, referralCount, referralEarnings] = await Promise.all([
            prisma.task.count({
                where: { userId: user.id, status: 'APPROVED' },
            }),
            prisma.user.count({
                where: { referrerId: user.id },
            }),
            prisma.referralEarning.aggregate({
                where: { referrerId: user.id },
                _sum: { amountNano: true },
            }),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const claimedToday = streak?.lastClaimDate
            ? new Date(streak.lastClaimDate).getTime() >= today.getTime()
            : false;

        res.json({
            success: true,
            data: {
                id: user.id,
                telegramId: user.telegramId.toString(),
                username: user.username,
                firstName: user.firstName,
                level: user.level,
                xp: user.xp,
                xpProgress: getLevelProgress(user.xp, user.level),
                xpToNextLevel: getXpForNextLevel(user.level),
                balance: formatTon(user.balanceNano),
                balanceNano: user.balanceNano.toString(),
                totalEarned: formatTon(user.totalEarnedNano),
                status: user.status,
                createdAt: user.createdAt.toISOString(),
                streak: {
                    current: streak?.currentStreak || 0,
                    longest: streak?.longestStreak || 0,
                    claimedToday,
                },
                stats: {
                    tasksCompleted,
                    referralCount,
                    referralEarnings: formatTon(referralEarnings._sum.amountNano || 0n),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/me/stats
 * Get detailed user statistics
 */
// ... existing code ...
usersRouter.get('/me/stats', authenticate, async (req, res, next) => {
    // ... existing stats logic ...
    try {
        const user = req.user!;
        const [
            totalTasks,
            approvedTasks,
            pendingTasks,
            rejectedTasks,
            totalWithdrawals,
            pendingWithdrawals,
        ] = await Promise.all([
            prisma.task.count({ where: { userId: user.id } }),
            prisma.task.count({ where: { userId: user.id, status: 'APPROVED' } }),
            prisma.task.count({ where: { userId: user.id, status: 'PENDING' } }),
            prisma.task.count({ where: { userId: user.id, status: 'REJECTED' } }),
            prisma.withdrawal.count({ where: { userId: user.id, status: 'COMPLETED' } }),
            prisma.withdrawal.aggregate({
                where: { userId: user.id, status: 'PENDING' },
                _sum: { amountNano: true },
            }),
        ]);

        res.json({
            success: true,
            data: {
                tasks: {
                    total: totalTasks,
                    approved: approvedTasks,
                    pending: pendingTasks,
                    rejected: rejectedTasks,
                    successRate: totalTasks > 0
                        ? Math.round((approvedTasks / totalTasks) * 100)
                        : 0,
                },
                withdrawals: {
                    completed: totalWithdrawals,
                    pendingAmount: formatTon(pendingWithdrawals._sum.amountNano || 0n),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users/me/daily-claim
 * Claim daily bonus
 */
usersRouter.post('/me/daily-claim', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;

        // 1. Get or create streak record
        let streak = await prisma.dailyStreak.findUnique({
            where: { userId: user.id },
        });

        if (!streak) {
            streak = await prisma.dailyStreak.create({
                data: {
                    userId: user.id,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastClaimDate: new Date(0), // Epoch
                },
            });
        }

        const now = new Date();
        const lastClaim = new Date(streak.lastClaimDate || 0);

        // Normalize to midnight to check dates
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const lastClaimDay = new Date(lastClaim);
        lastClaimDay.setHours(0, 0, 0, 0);

        // 2. Check if already claimed today
        if (lastClaimDay.getTime() === today.getTime()) {
            // Already claimed
            return res.status(400).json({
                success: false,
                error: { code: 'ALREADY_CLAIMED', message: 'Daily bonus already claimed today' }
            });
        }

        // 3. Calculate Streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let newStreak = streak.currentStreak;

        if (lastClaimDay.getTime() === yesterday.getTime()) {
            // Consecutive day
            newStreak += 1;
        } else {
            // Streak broken
            newStreak = 1;
        }

        // 4. Calculate Reward (Base 0.01 TON + 0.005 * Streak, max 0.1 TON)
        const baseReward = 0.01;
        const growth = 0.005;
        const maxReward = 0.1;

        let rewardTon = baseReward + (newStreak - 1) * growth;
        if (rewardTon > maxReward) rewardTon = maxReward;

        const rewardNano = BigInt(Math.round(rewardTon * 1e9));

        // 5. Transaction
        await prisma.$transaction(async (tx) => {
            // Update Streak
            await tx.dailyStreak.update({
                where: { userId: user.id },
                data: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(streak!.longestStreak, newStreak),
                    lastClaimDate: now,
                },
            });

            // Update Balance
            await tx.user.update({
                where: { id: user.id },
                data: {
                    balanceNano: { increment: rewardNano },
                    totalEarnedNano: { increment: rewardNano },
                },
            });

            // Create Transaction Record
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    type: 'DAILY_BONUS',
                    amountNano: rewardNano,
                    description: `Day ${newStreak} Streak Bonus`,
                    balanceAfterNano: user.balanceNano + rewardNano,
                    // status: 'COMPLETED', // Transaction model doesn't have status
                },
            });
        });

        res.json({
            success: true,
            data: {
                streak: newStreak,
                reward: rewardTon.toFixed(4),
                message: `You claimed ${rewardTon.toFixed(4)} TON!`,
            },
        });

    } catch (error) {
        next(error);
    }
});
