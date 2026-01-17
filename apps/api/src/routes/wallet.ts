import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { prisma } from '../index.js';
import { errors } from '../middleware/errorHandler.js';
import { formatTon, isValidTonAddress } from '../lib/shared.js';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';

export const walletRouter = Router();

/**
 * GET /api/wallet/balance
 * Get user's wallet balance
 */
walletRouter.get('/balance', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;

        const pendingWithdrawals = await prisma.withdrawal.aggregate({
            where: { userId: user.id, status: 'PENDING' },
            _sum: { amountNano: true },
        });

        res.json({
            success: true,
            data: {
                balance: formatTon(user.balanceNano),
                balanceNano: user.balanceNano.toString(),
                pendingWithdrawals: formatTon(pendingWithdrawals._sum.amountNano || 0n),
                totalEarned: formatTon(user.totalEarnedNano),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wallet/transactions
 * Get user's transaction history
 */
walletRouter.get('/transactions', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.transaction.count({ where: { userId: user.id } }),
        ]);

        res.json({
            success: true,
            data: {
                items: transactions.map(tx => ({
                    id: tx.id,
                    type: tx.type,
                    amount: formatTon(tx.amountNano),
                    description: tx.description,
                    createdAt: tx.createdAt.toISOString(),
                })),
                total,
                page,
                pageSize: limit,
                hasMore: skip + transactions.length < total,
            },
        });
    } catch (error) {
        next(error);
    }
});

const withdrawSchema = z.object({
    amountNano: z.string().transform(BigInt),
    walletAddress: z.string().refine(isValidTonAddress, 'Invalid TON wallet address'),
});

/**
 * POST /api/wallet/withdraw
 * Request a withdrawal
 */
walletRouter.post('/withdraw', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;
        const body = withdrawSchema.parse(req.body);

        if (!env.ENABLE_WITHDRAWALS) {
            throw errors.badRequest('Withdrawals are currently disabled');
        }

        if (body.amountNano < env.MIN_WITHDRAWAL_NANO) {
            throw errors.badRequest(`Minimum withdrawal is ${formatTon(env.MIN_WITHDRAWAL_NANO)} TON`);
        }

        if (body.amountNano > user.balanceNano) {
            throw errors.badRequest('Insufficient balance');
        }

        // Check for pending withdrawals
        const pendingCount = await prisma.withdrawal.count({
            where: { userId: user.id, status: 'PENDING' },
        });

        if (pendingCount >= 3) {
            throw errors.badRequest('You have too many pending withdrawals');
        }

        // Create withdrawal and update balance in transaction
        const [withdrawal] = await prisma.$transaction([
            prisma.withdrawal.create({
                data: {
                    userId: user.id,
                    amountNano: body.amountNano,
                    walletAddress: body.walletAddress,
                    status: 'PENDING',
                },
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    balanceNano: { decrement: body.amountNano },
                },
            }),
            prisma.transaction.create({
                data: {
                    userId: user.id,
                    type: 'WITHDRAWAL',
                    amountNano: -body.amountNano,
                    balanceAfterNano: user.balanceNano - body.amountNano,
                    description: `Withdrawal to ${body.walletAddress.slice(0, 8)}...`,
                },
            }),
        ]);

        logger.info({ withdrawalId: withdrawal.id, userId: user.id, amount: body.amountNano.toString() }, 'Withdrawal requested');

        res.json({
            success: true,
            data: {
                id: withdrawal.id,
                amount: formatTon(withdrawal.amountNano),
                walletAddress: withdrawal.walletAddress,
                status: withdrawal.status,
                createdAt: withdrawal.createdAt.toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wallet/withdrawals
 * Get user's withdrawal history
 */
walletRouter.get('/withdrawals', authenticate, async (req, res, next) => {
    try {
        const user = req.user!;

        const withdrawals = await prisma.withdrawal.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json({
            success: true,
            data: withdrawals.map(w => ({
                id: w.id,
                amount: formatTon(w.amountNano),
                walletAddress: w.walletAddress,
                status: w.status,
                txHash: w.txHash,
                createdAt: w.createdAt.toISOString(),
                processedAt: w.processedAt?.toISOString() || null,
            })),
        });
    } catch (error) {
        next(error);
    }
});
