import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/authenticate.js';
import { prisma } from '../index.js';
import { errors } from '../middleware/errorHandler.js';
import { formatTon, generateSessionId } from '../lib/shared.js';
import { logger } from '../lib/logger.js';

export const tasksRouter = Router();

/**
 * POST /api/tasks/:offerId/start
 * Start a new task
 */
tasksRouter.post('/:offerId/start', authenticate, async (req, res, next) => {
    try {
        const offerId = req.params.offerId as string;
        const user = req.user!;

        // Get offer
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
        });

        if (!offer || !offer.isActive) {
            throw errors.notFound('Offer');
        }

        // Check if user already has a pending task for this offer
        const existingTask = await prisma.task.findFirst({
            where: {
                userId: user.id,
                offerId,
                status: { in: ['STARTED', 'PENDING'] },
            },
        });

        if (existingTask) {
            throw errors.conflict('You already have a pending task for this offer');
        }

        // Generate session ID for tracking
        const sessionId = generateSessionId();

        // Create task
        const task = await prisma.task.create({
            data: {
                userId: user.id,
                offerId,
                sessionId,
                payoutNano: offer.payoutNano,
                status: 'STARTED',
            },
        });

        // Build tracking URL with our session ID
        // The tracking URL format depends on the CPA network
        const trackingUrl = offer.trackingUrl
            .replace('{aff_sub}', user.id)
            .replace('{aff_sub2}', sessionId)
            .replace('{click_id}', sessionId);

        logger.info({ taskId: task.id, userId: user.id, offerId }, 'Task started');

        res.json({
            success: true,
            data: {
                taskId: task.id,
                sessionId,
                trackingUrl,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/tasks
 * List user's tasks
 */
tasksRouter.get('/', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string | undefined;

        const where: Record<string, unknown> = { userId: user.id };
        if (status) {
            where.status = status;
        }

        const skip = (page - 1) * limit;

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: { offer: true },
                orderBy: { startedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.task.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                items: tasks.map(task => ({
                    id: task.id,
                    offerId: task.offerId,
                    offerName: task.offer.name,
                    status: task.status,
                    payout: formatTon(task.payoutNano),
                    startedAt: task.startedAt.toISOString(),
                    completedAt: task.completedAt?.toISOString() || null,
                })),
                total,
                page,
                pageSize: limit,
                hasMore: skip + tasks.length < total,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/tasks/:id
 * Get task details
 */
tasksRouter.get('/:id', authenticate, async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const user = req.user!;

        const task = await prisma.task.findFirst({
            where: { id, userId: user.id },
            include: { offer: true },
        });

        if (!task) {
            throw errors.notFound('Task');
        }

        const taskWithOffer = task as typeof task & { offer: { name: string } };

        res.json({
            success: true,
            data: {
                id: task.id,
                offerId: task.offerId,
                offerName: taskWithOffer.offer.name,
                status: task.status,
                payout: formatTon(task.payoutNano),
                startedAt: task.startedAt.toISOString(),
                completedAt: task.completedAt?.toISOString() || null,
                approvedAt: task.approvedAt?.toISOString() || null,
            },
        });
    } catch (error) {
        next(error);
    }
});
