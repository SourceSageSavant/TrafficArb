import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/authenticate.js';
import { prisma, redis } from '../index.js';
import { getCache, setCache } from '../lib/redis.js';
import { formatTon } from '@traffic-arb/shared';

export const leaderboardRouter = Router();

type Period = 'daily' | 'weekly' | 'monthly' | 'alltime';
type LeaderboardType = 'earnings' | 'tasks' | 'referrals';

/**
 * GET /api/leaderboard
 * Get leaderboard
 */
leaderboardRouter.get('/', optionalAuth, async (req, res, next) => {
    try {
        const period = (req.query.period as Period) || 'weekly';
        const type = (req.query.type as LeaderboardType) || 'earnings';
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        const cacheKey = `leaderboard:${period}:${type}`;

        // Try cache first
        const cached = await getCache<unknown[]>(redis, cacheKey);
        if (cached) {
            return res.json({
                success: true,
                data: {
                    items: cached.map((entry: any, index) => ({
                        ...entry,
                        isCurrentUser: req.userId ? entry.userId === req.userId : false,
                    })),
                    period,
                    type,
                },
            });
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'daily':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(0); // All time
        }

        let leaderboard: any[];

        if (type === 'earnings') {
            // Aggregate earnings from transactions
            const results = await prisma.transaction.groupBy({
                by: ['userId'],
                where: {
                    createdAt: { gte: startDate },
                    type: { in: ['TASK_REWARD', 'REFERRAL_BONUS'] },
                },
                _sum: { amountNano: true },
                orderBy: { _sum: { amountNano: 'desc' } },
                take: limit,
            });

            const userIds = results.map(r => r.userId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true, firstName: true, level: true },
            });

            const userMap = new Map(users.map(u => [u.id, u]));

            leaderboard = results.map((r, index) => {
                const user = userMap.get(r.userId);
                return {
                    rank: index + 1,
                    userId: r.userId,
                    username: user?.username || null,
                    firstName: user?.firstName || null,
                    level: user?.level || 1,
                    value: formatTon(r._sum.amountNano || 0n),
                };
            });
        } else if (type === 'tasks') {
            // Count completed tasks
            const results = await prisma.task.groupBy({
                by: ['userId'],
                where: {
                    approvedAt: { gte: startDate },
                    status: 'APPROVED',
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: limit,
            });

            const userIds = results.map(r => r.userId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true, firstName: true, level: true },
            });

            const userMap = new Map(users.map(u => [u.id, u]));

            leaderboard = results.map((r, index) => {
                const user = userMap.get(r.userId);
                return {
                    rank: index + 1,
                    userId: r.userId,
                    username: user?.username || null,
                    firstName: user?.firstName || null,
                    level: user?.level || 1,
                    value: r._count.id.toString(),
                };
            });
        } else {
            // Count referrals
            const results = await prisma.user.groupBy({
                by: ['referrerId'],
                where: {
                    referrerId: { not: null },
                    createdAt: { gte: startDate },
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: limit,
            });

            const referrerIds = results.map(r => r.referrerId).filter(Boolean) as string[];
            const users = await prisma.user.findMany({
                where: { id: { in: referrerIds } },
                select: { id: true, username: true, firstName: true, level: true },
            });

            const userMap = new Map(users.map(u => [u.id, u]));

            leaderboard = results.map((r, index) => {
                const user = r.referrerId ? userMap.get(r.referrerId) : null;
                return {
                    rank: index + 1,
                    userId: r.referrerId,
                    username: user?.username || null,
                    firstName: user?.firstName || null,
                    level: user?.level || 1,
                    value: r._count.id.toString(),
                };
            });
        }

        // Cache for 5 minutes
        await setCache(redis, cacheKey, leaderboard, 300);

        res.json({
            success: true,
            data: {
                items: leaderboard.map(entry => ({
                    ...entry,
                    isCurrentUser: req.userId ? entry.userId === req.userId : false,
                })),
                period,
                type,
            },
        });
    } catch (error) {
        next(error);
    }
});
