import { Router } from 'express';
import { z } from 'zod';
import { adminAuth, requireRole, verifyAdminCredentials, generateAdminToken, createAdminUser } from '../middleware/adminAuth.js';
import { prisma } from '../index.js';
import { errors } from '../middleware/errorHandler.js';
import { logger } from '../lib/logger.js';

export const adminRouter = Router();

// =============================================================================
// AUTH ROUTES (No auth required)
// =============================================================================

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

/**
 * POST /api/admin/login
 * Admin login
 */
adminRouter.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const admin = await verifyAdminCredentials(email, password);

        if (!admin) {
            throw errors.unauthorized('Invalid email or password');
        }

        const token = generateAdminToken(admin);

        res.json({
            success: true,
            data: {
                token,
                user: admin,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/setup
 * Create initial admin user (only works if no admins exist)
 */
adminRouter.post('/setup', async (req, res, next) => {
    try {
        const existingAdmin = await prisma.adminUser.findFirst();
        if (existingAdmin) {
            throw errors.badRequest('Admin already exists. Use login instead.');
        }

        const { email, password, name } = loginSchema.extend({ name: z.string() }).parse(req.body);
        const admin = await createAdminUser(email, password, name);

        logger.info({ adminId: admin.id }, 'Initial admin user created');

        res.json({
            success: true,
            data: { message: 'Admin user created. Please login.' },
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// PROTECTED ROUTES (Auth required)
// =============================================================================

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
adminRouter.get('/stats', adminAuth, async (req, res, next) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersToday,
            activeOffers,
            pendingWithdrawals,
            pendingWithdrawalAmount,
            completedTasksToday,
            totalRevenue,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: today } } }),
            prisma.offer.count({ where: { isActive: true } }),
            prisma.withdrawal.count({ where: { status: 'PENDING' } }),
            prisma.withdrawal.aggregate({
                where: { status: 'PENDING' },
                _sum: { amountNano: true },
            }),
            prisma.task.count({
                where: { status: 'APPROVED', approvedAt: { gte: today } },
            }),
            prisma.transaction.aggregate({
                where: { type: 'TASK_REWARD' },
                _sum: { amountNano: true },
            }),
        ]);

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    newToday: newUsersToday,
                },
                offers: {
                    active: activeOffers,
                },
                withdrawals: {
                    pending: pendingWithdrawals,
                    pendingAmountNano: (pendingWithdrawalAmount._sum.amountNano || 0n).toString(),
                },
                tasks: {
                    completedToday: completedTasksToday,
                },
                revenue: {
                    totalNano: (totalRevenue._sum.amountNano || 0n).toString(),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// OFFER MANAGEMENT
// =============================================================================

const createOfferSchema = z.object({
    name: z.string().min(3).max(500),
    description: z.string().optional(),
    instructions: z.string().optional(),
    imageUrl: z.string().url().optional(),
    trackingUrl: z.string().url(),
    payoutCents: z.number().int().min(1),
    payoutNano: z.string().transform(BigInt),
    category: z.enum(['APP_INSTALL', 'SURVEY', 'SIGNUP', 'VIDEO', 'GAME', 'SOCIAL', 'OTHER']).default('OTHER'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    estimatedMinutes: z.number().int().optional(),
    countries: z.array(z.string()).default([]),
    devices: z.array(z.string()).default([]),
    requirements: z.object({
        premiumOnly: z.boolean().optional(),
        minAccountAgeDays: z.number().int().optional(),
    }).optional(),
    priority: z.number().int().default(0),
});

/**
 * GET /api/admin/offers
 * List all offers (including inactive)
 */
adminRouter.get('/offers', adminAuth, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [offers, total] = await Promise.all([
            prisma.offer.findMany({
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: limit,
            }),
            prisma.offer.count(),
        ]);

        res.json({
            success: true,
            data: {
                items: offers.map(o => ({
                    ...o,
                    payoutNano: o.payoutNano.toString(),
                })),
                total,
                page,
                pageSize: limit,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/offers
 * Create a new custom offer
 */
adminRouter.post('/offers', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const data = createOfferSchema.parse(req.body);

        // Generate a unique external ID for custom offers
        const externalId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const offer = await prisma.offer.create({
            data: {
                externalId,
                provider: 'CUSTOM',
                name: data.name,
                description: data.description,
                instructions: data.instructions,
                imageUrl: data.imageUrl,
                trackingUrl: data.trackingUrl,
                payoutCents: data.payoutCents,
                payoutNano: data.payoutNano,
                category: data.category,
                difficulty: data.difficulty,
                estimatedMinutes: data.estimatedMinutes,
                countries: data.countries,
                devices: data.devices,
                requirements: data.requirements,
                priority: data.priority,
                isActive: true,
            },
        });

        logger.info({ offerId: offer.id, adminId: req.adminUser!.id }, 'Custom offer created');

        res.json({
            success: true,
            data: {
                ...offer,
                payoutNano: offer.payoutNano.toString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/offers/:id
 * Update an offer
 */
adminRouter.put('/offers/:id', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const data = createOfferSchema.partial().parse(req.body);

        const offer = await prisma.offer.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.instructions !== undefined && { instructions: data.instructions }),
                ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
                ...(data.trackingUrl && { trackingUrl: data.trackingUrl }),
                ...(data.payoutCents && { payoutCents: data.payoutCents }),
                ...(data.payoutNano && { payoutNano: data.payoutNano }),
                ...(data.category && { category: data.category }),
                ...(data.difficulty && { difficulty: data.difficulty }),
                ...(data.estimatedMinutes !== undefined && { estimatedMinutes: data.estimatedMinutes }),
                ...(data.countries && { countries: data.countries }),
                ...(data.devices && { devices: data.devices }),
                ...(data.requirements !== undefined && { requirements: data.requirements }),
                ...(data.priority !== undefined && { priority: data.priority }),
            },
        });

        res.json({
            success: true,
            data: {
                ...offer,
                payoutNano: offer.payoutNano.toString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/admin/offers/:id/toggle
 * Toggle offer active status
 */
adminRouter.patch('/offers/:id/toggle', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const offer = await prisma.offer.findUnique({ where: { id } });
        if (!offer) {
            throw errors.notFound('Offer not found');
        }

        const updated = await prisma.offer.update({
            where: { id },
            data: { isActive: !offer.isActive },
        });

        res.json({
            success: true,
            data: { isActive: updated.isActive },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/admin/offers/:id
 * Delete an offer (only custom offers)
 */
adminRouter.delete('/offers/:id', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const offer = await prisma.offer.findUnique({ where: { id } });

        if (!offer) {
            throw errors.notFound('Offer not found');
        }

        if (offer.provider !== 'CUSTOM') {
            throw errors.badRequest('Only custom offers can be deleted');
        }

        await prisma.offer.delete({ where: { id } });

        res.json({
            success: true,
            data: { message: 'Offer deleted' },
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// WITHDRAWAL MANAGEMENT
// =============================================================================

/**
 * GET /api/admin/withdrawals
 * List withdrawals with filtering
 */
adminRouter.get('/withdrawals', adminAuth, async (req, res, next) => {
    try {
        const status = req.query.status as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const where = status ? { status: status as any } : {};

        const [withdrawals, total] = await Promise.all([
            prisma.withdrawal.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, username: true, telegramId: true, riskScore: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.withdrawal.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                items: withdrawals.map(w => ({
                    ...w,
                    amountNano: w.amountNano.toString(),
                    user: {
                        ...w.user,
                        telegramId: w.user.telegramId.toString(),
                    },
                })),
                total,
                page,
                pageSize: limit,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/withdrawals/:id/approve
 * Approve and process a withdrawal
 */
adminRouter.post('/withdrawals/:id/approve', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const { txHash, adminNotes } = req.body as { txHash?: string; adminNotes?: string };

        const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
        if (!withdrawal) {
            throw errors.notFound('Withdrawal not found');
        }

        if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
            throw errors.badRequest(`Cannot approve withdrawal with status ${withdrawal.status}`);
        }

        // Update withdrawal to completed
        const updated = await prisma.withdrawal.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                txHash: txHash || null,
                adminNotes,
                processedBy: req.adminUser!.id,
                processedAt: new Date(),
            },
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                actorType: 'admin',
                actorId: req.adminUser!.id,
                action: 'WITHDRAWAL_APPROVED',
                entityType: 'withdrawal',
                entityId: id,
                details: { txHash, adminNotes },
            },
        });

        logger.info({ withdrawalId: id, adminId: req.adminUser!.id }, 'Withdrawal approved');

        res.json({
            success: true,
            data: {
                ...updated,
                amountNano: updated.amountNano.toString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/withdrawals/:id/reject
 * Reject a withdrawal and refund user balance
 */
adminRouter.post('/withdrawals/:id/reject', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const { reason } = req.body as { reason?: string };

        const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
        if (!withdrawal) {
            throw errors.notFound('Withdrawal not found');
        }

        if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
            throw errors.badRequest(`Cannot reject withdrawal with status ${withdrawal.status}`);
        }

        // Refund balance and update withdrawal in transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: withdrawal.userId },
                data: { balanceNano: { increment: withdrawal.amountNano } },
            }),
            prisma.withdrawal.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    adminNotes: reason,
                    processedBy: req.adminUser!.id,
                    processedAt: new Date(),
                },
            }),
            prisma.transaction.create({
                data: {
                    userId: withdrawal.userId,
                    type: 'ADJUSTMENT',
                    amountNano: withdrawal.amountNano,
                    balanceAfterNano: 0n, // Will be updated
                    description: `Withdrawal rejected: ${reason || 'No reason provided'}`,
                    referenceId: id,
                    referenceType: 'withdrawal',
                },
            }),
            prisma.auditLog.create({
                data: {
                    actorType: 'admin',
                    actorId: req.adminUser!.id,
                    action: 'WITHDRAWAL_REJECTED',
                    entityType: 'withdrawal',
                    entityId: id,
                    details: { reason },
                },
            }),
        ]);

        logger.info({ withdrawalId: id, adminId: req.adminUser!.id, reason }, 'Withdrawal rejected');

        res.json({
            success: true,
            data: { message: 'Withdrawal rejected and balance refunded' },
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * GET /api/admin/users
 * List users with filtering
 */
adminRouter.get('/users', adminAuth, async (req, res, next) => {
    try {
        const search = req.query.search as string | undefined;
        const status = req.query.status as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    level: true,
                    balanceNano: true,
                    totalEarnedNano: true,
                    riskScore: true,
                    status: true,
                    createdAt: true,
                    _count: { select: { tasks: true, referrals: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                items: users.map(u => ({
                    ...u,
                    telegramId: u.telegramId.toString(),
                    balanceNano: u.balanceNano.toString(),
                    totalEarnedNano: u.totalEarnedNano.toString(),
                })),
                total,
                page,
                pageSize: limit,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/admin/users/:id/status
 * Update user status (ban/suspend/activate)
 */
adminRouter.patch('/users/:id/status', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const { status, reason } = req.body as { status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'; reason?: string };

        const user = await prisma.user.update({
            where: { id },
            data: { status },
        });

        await prisma.auditLog.create({
            data: {
                actorType: 'admin',
                actorId: req.adminUser!.id,
                action: `USER_STATUS_CHANGED_TO_${status}`,
                entityType: 'user',
                entityId: id,
                details: { reason },
            },
        });

        res.json({
            success: true,
            data: { status: user.status },
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// FRAUD ALERTS
// =============================================================================

/**
 * GET /api/admin/fraud-alerts
 * List fraud alerts
 */
adminRouter.get('/fraud-alerts', adminAuth, async (req, res, next) => {
    try {
        const status = req.query.status as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [alerts, total, openCount, investigatingCount] = await Promise.all([
            prisma.fraudAlert.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.fraudAlert.count({ where }),
            prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
            prisma.fraudAlert.count({ where: { status: 'INVESTIGATING' } }),
        ]);

        // Get user info for each alert
        const userIds = [...new Set(alerts.map(a => a.userId))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, telegramId: true },
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        res.json({
            success: true,
            data: {
                items: alerts.map(a => ({
                    ...a,
                    user: userMap.get(a.userId) || { id: a.userId, username: null, telegramId: '0' },
                })),
                total,
                openCount,
                investigatingCount,
                page,
                pageSize: limit,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/admin/fraud-alerts/:id
 * Update fraud alert status
 */
adminRouter.patch('/fraud-alerts/:id', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const { status, resolutionNotes } = req.body as { status: string; resolutionNotes?: string };

        const alert = await prisma.fraudAlert.update({
            where: { id },
            data: {
                status,
                resolutionNotes,
                resolvedBy: status === 'RESOLVED' ? req.adminUser!.id : undefined,
                resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
            },
        });

        res.json({
            success: true,
            data: alert,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/fraud-alerts/:id/block-user
 * Block the user associated with a fraud alert
 */
adminRouter.post('/fraud-alerts/:id/block-user', adminAuth, requireRole('admin'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const alert = await prisma.fraudAlert.findUnique({ where: { id } });

        if (!alert) {
            throw errors.notFound('Fraud alert not found');
        }

        // Ban the user and resolve the alert
        await prisma.$transaction([
            prisma.user.update({
                where: { id: alert.userId },
                data: { status: 'BANNED' },
            }),
            prisma.fraudAlert.update({
                where: { id },
                data: {
                    status: 'RESOLVED',
                    resolutionNotes: 'User blocked by admin',
                    resolvedBy: req.adminUser!.id,
                    resolvedAt: new Date(),
                },
            }),
            prisma.auditLog.create({
                data: {
                    actorType: 'admin',
                    actorId: req.adminUser!.id,
                    action: 'USER_BANNED_FROM_FRAUD_ALERT',
                    entityType: 'user',
                    entityId: alert.userId,
                    details: { fraudAlertId: id },
                },
            }),
        ]);

        logger.info({ alertId: id, userId: alert.userId, adminId: req.adminUser!.id }, 'User blocked from fraud alert');

        res.json({
            success: true,
            data: { message: 'User blocked and alert resolved' },
        });
    } catch (error) {
        next(error);
    }
});

