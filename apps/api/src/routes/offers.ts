import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { prisma, redis } from '../index.js';
import { getCache, setCache } from '../lib/redis.js';
import { formatTon } from '@traffic-arb/shared';
import type { OfferCategory, OfferDifficulty } from '@traffic-arb/database';

export const offersRouter = Router();

const listOffersSchema = z.object({
    category: z.string().optional(),
    difficulty: z.string().optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
});

/**
 * GET /api/offers
 * List available offers
 */
offersRouter.get('/', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;
        const query = listOffersSchema.parse(req.query);

        // Build filter
        const where: Record<string, unknown> = {
            isActive: true,
            // Filter by user's country if known
            ...(user.countryCode && {
                countries: { has: user.countryCode },
            }),
        };

        if (query.category) {
            where.category = query.category as OfferCategory;
        }
        if (query.difficulty) {
            where.difficulty = query.difficulty as OfferDifficulty;
        }

        const skip = (query.page - 1) * query.limit;

        const [offers, total] = await Promise.all([
            prisma.offer.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { payoutNano: 'desc' },
                ],
                skip,
                take: query.limit,
            }),
            prisma.offer.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                items: offers.map(offer => ({
                    id: offer.id,
                    name: offer.name,
                    description: offer.description,
                    imageUrl: offer.imageUrl,
                    payout: formatTon(offer.payoutNano),
                    payoutUsd: `$${(offer.payoutCents / 100).toFixed(2)}`,
                    category: offer.category,
                    difficulty: offer.difficulty,
                    estimatedMinutes: offer.estimatedMinutes,
                    provider: offer.provider,
                })),
                total,
                page: query.page,
                pageSize: query.limit,
                hasMore: skip + offers.length < total,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/offers/:id
 * Get offer details
 */
offersRouter.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const offer = await prisma.offer.findUnique({
            where: { id },
        });

        if (!offer || !offer.isActive) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Offer not found' },
            });
        }

        res.json({
            success: true,
            data: {
                id: offer.id,
                name: offer.name,
                description: offer.description,
                instructions: offer.instructions,
                imageUrl: offer.imageUrl,
                payout: formatTon(offer.payoutNano),
                payoutUsd: `$${(offer.payoutCents / 100).toFixed(2)}`,
                category: offer.category,
                difficulty: offer.difficulty,
                estimatedMinutes: offer.estimatedMinutes,
                conversionRate: offer.conversionRate,
                provider: offer.provider,
            },
        });
    } catch (error) {
        next(error);
    }
});
