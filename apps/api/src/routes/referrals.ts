import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { prisma } from '../index.js';
import { formatTon } from '../lib/shared.js';
import { env } from '../lib/env.js';

export const referralsRouter = Router();

/**
 * GET /api/referrals
 * Get referral stats and list
 */
referralsRouter.get('/', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;

        // Get all direct referrals (tier 1)
        const tier1Referrals = await prisma.user.findMany({
            where: { referrerId: user.id },
            select: {
                id: true,
                username: true,
                firstName: true,
                level: true,
                createdAt: true,
            },
        });

        const tier1Ids = tier1Referrals.map(r => r.id);

        // Get tier 2 referrals (referrals of tier 1)
        const tier2Referrals = tier1Ids.length > 0
            ? await prisma.user.findMany({
                where: { referrerId: { in: tier1Ids } },
                select: { id: true },
            })
            : [];

        const tier2Ids = tier2Referrals.map(r => r.id);

        // Get tier 3 referrals
        const tier3Referrals = tier2Ids.length > 0
            ? await prisma.user.findMany({
                where: { referrerId: { in: tier2Ids } },
                select: { id: true },
            })
            : [];

        // Get earnings by tier
        const [tier1Earnings, tier2Earnings, tier3Earnings] = await Promise.all([
            prisma.referralEarning.aggregate({
                where: { referrerId: user.id, level: 1 },
                _sum: { amountNano: true },
            }),
            prisma.referralEarning.aggregate({
                where: { referrerId: user.id, level: 2 },
                _sum: { amountNano: true },
            }),
            prisma.referralEarning.aggregate({
                where: { referrerId: user.id, level: 3 },
                _sum: { amountNano: true },
            }),
        ]);

        const totalEarnings =
            (tier1Earnings._sum.amountNano || 0n) +
            (tier2Earnings._sum.amountNano || 0n) +
            (tier3Earnings._sum.amountNano || 0n);

        // Get detailed earnings for display
        const recentEarnings = await prisma.referralEarning.findMany({
            where: { referrerId: user.id },
            include: { referred: { select: { username: true, firstName: true, level: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json({
            success: true,
            data: {
                referralCode: `ref_${user.telegramId}`,
                referralLink: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=ref_${user.telegramId}`,
                totalReferrals: tier1Referrals.length + tier2Referrals.length + tier3Referrals.length,
                activeReferrals: tier1Referrals.length,
                totalEarnings: formatTon(totalEarnings),
                tier1Count: tier1Referrals.length,
                tier2Count: tier2Referrals.length,
                tier3Count: tier3Referrals.length,
                tiers: {
                    tier1: {
                        count: tier1Referrals.length,
                        earnings: formatTon(tier1Earnings._sum.amountNano || 0n),
                        rate: '10%',
                    },
                    tier2: {
                        count: tier2Referrals.length,
                        earnings: formatTon(tier2Earnings._sum.amountNano || 0n),
                        rate: '3%',
                    },
                    tier3: {
                        count: tier3Referrals.length,
                        earnings: formatTon(tier3Earnings._sum.amountNano || 0n),
                        rate: '1%',
                    },
                },
                referrals: tier1Referrals.map(r => ({
                    id: r.id,
                    username: r.username,
                    firstName: r.firstName,
                    level: r.level,
                    tier: 1,
                    joinedAt: r.createdAt.toISOString(),
                })),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/referrals/link
 * Get referral link
 */
referralsRouter.get('/link', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;

        res.json({
            success: true,
            data: {
                code: `ref_${user.telegramId}`,
                link: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=ref_${user.telegramId}`,
            },
        });
    } catch (error) {
        next(error);
    }
});
