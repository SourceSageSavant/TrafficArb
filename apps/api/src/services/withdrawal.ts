import { prisma } from '../index.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { errors } from '../middleware/errorHandler.js';

export const WithdrawalLimitService = {
    /**
     * Check if a withdrawal is safe to process
     */
    async validateWithdrawal(userId: string, amountNano: bigint) {
        // 1. Check minimum withdrawal
        if (amountNano < env.MIN_WITHDRAWAL_NANO) {
            throw errors.badRequest(`Minimum withdrawal is ${(Number(env.MIN_WITHDRAWAL_NANO) / 1e9).toFixed(2)} TON`);
        }

        // 2. Check 24-hour limit (e.g., 10 TON)
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const LIMIT_24H_NANO = BigInt(10 * 1e9); // 10 TON limit

        const recentWithdrawals = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'WITHDRAWAL',
                createdAt: {
                    gte: new Date(Date.now() - ONE_DAY_MS),
                },
            },
        });

        const totalRecent = recentWithdrawals.reduce(
            (sum, tx) => sum + (tx.amountNano > 0 ? tx.amountNano : -tx.amountNano),
            0n
        );

        if (totalRecent + amountNano > LIMIT_24H_NANO) {
            logger.warn({ userId, amount: amountNano, totalRecent }, 'Withdrawal limit exceeded');
            throw errors.badRequest('Daily withdrawal limit (10 TON) exceeded. Please try again tomorrow.');
        }

        return true;
    },

    /**
     * Flag suspicious activity (Velocity Check)
     */
    async isSuspicious(userId: string): Promise<boolean> {
        // Implement simple velocity check: if user earned > 50 TON in 1 hour
        const ONE_HOUR_MS = 60 * 60 * 1000;
        const THRESHOLD_NANO = BigInt(50 * 1e9);

        const recentEarnings = await prisma.transaction.findMany({
            where: {
                userId,
                type: { in: ['TASK_REWARD', 'REFERRAL_BONUS'] },
                createdAt: {
                    gte: new Date(Date.now() - ONE_HOUR_MS),
                },
            },
        });

        const earned = recentEarnings.reduce((sum, tx) => sum + tx.amountNano, 0n);

        if (earned > THRESHOLD_NANO) {
            logger.warn({ userId, earned }, 'Suspicious velocity detected');
            return true;
        }

        return false;
    }
};
