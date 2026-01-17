import { Router } from 'express';
import { createHmac } from 'crypto';
import { prisma } from '../index.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { REFERRAL_RATES, XP_PER_TASK } from '../lib/shared.js';

export const postbackRouter = Router();

/**
 * Verify postback signature
 */
function verifyPostbackSignature(
    provider: string,
    params: Record<string, string>,
    signature: string
): boolean {
    let secret: string | undefined;

    switch (provider) {
        case 'cpagrip':
            secret = env.CPAGRIP_POSTBACK_SECRET;
            break;
        case 'ogads':
            secret = env.OGADS_POSTBACK_SECRET;
            break;
        case 'adgate':
            secret = env.ADGATE_POSTBACK_SECRET;
            break;
        default:
            return false;
    }

    if (!secret) {
        // In development, accept all postbacks
        return env.NODE_ENV === 'development';
    }

    // Build signature string (varies by provider)
    const signatureString = Object.keys(params)
        .sort()
        .filter(key => key !== 'sig' && key !== 'signature')
        .map(key => `${key}=${params[key]}`)
        .join('&');

    const expectedSignature = createHmac('sha256', secret)
        .update(signatureString)
        .digest('hex');

    return signature === expectedSignature;
}

/**
 * Process approved task and pay referral commissions
 */
async function processApprovedTask(taskId: string, payoutNano: bigint) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            user: {
                include: {
                    referrer: {
                        include: {
                            referrer: {
                                include: { referrer: true }
                            }
                        }
                    }
                }
            }
        },
    });

    if (!task || !task.user) return;

    const user = task.user;

    // Update task status
    await prisma.task.update({
        where: { id: taskId },
        data: {
            status: 'APPROVED',
            approvedAt: new Date(),
        },
    });

    // Credit user balance
    const newBalance = user.balanceNano + payoutNano;
    await prisma.user.update({
        where: { id: user.id },
        data: {
            balanceNano: newBalance,
            totalEarnedNano: { increment: payoutNano },
            xp: { increment: XP_PER_TASK },
        },
    });

    // Create transaction record
    await prisma.transaction.create({
        data: {
            userId: user.id,
            type: 'TASK_REWARD',
            amountNano: payoutNano,
            balanceAfterNano: newBalance,
            referenceId: taskId,
            referenceType: 'task',
            description: `Task reward`,
        },
    });

    // Process referral commissions (3 tiers)
    const referrers = [
        { user: user.referrer, level: 1, rate: REFERRAL_RATES.TIER_1 },
        { user: user.referrer?.referrer, level: 2, rate: REFERRAL_RATES.TIER_2 },
        { user: user.referrer?.referrer?.referrer, level: 3, rate: REFERRAL_RATES.TIER_3 },
    ];

    for (const { user: referrer, level, rate } of referrers) {
        if (!referrer) continue;

        const commission = BigInt(Math.floor(Number(payoutNano) * rate));
        if (commission <= 0n) continue;

        const referrerNewBalance = referrer.balanceNano + commission;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: referrer.id },
                data: {
                    balanceNano: referrerNewBalance,
                    totalEarnedNano: { increment: commission },
                },
            }),
            prisma.transaction.create({
                data: {
                    userId: referrer.id,
                    type: 'REFERRAL_BONUS',
                    amountNano: commission,
                    balanceAfterNano: referrerNewBalance,
                    referenceId: taskId,
                    referenceType: 'referral',
                    description: `Tier ${level} referral bonus`,
                },
            }),
            prisma.referralEarning.create({
                data: {
                    referrerId: referrer.id,
                    referredId: user.id,
                    level,
                    taskId,
                    amountNano: commission,
                },
            }),
        ]);

        logger.info(
            { referrerId: referrer.id, level, commission: commission.toString() },
            'Referral commission paid'
        );
    }

    logger.info(
        { taskId, userId: user.id, payout: payoutNano.toString() },
        'Task approved and rewards distributed'
    );
}

/**
 * GET /api/postback/cpagrip
 * CPAGrip postback handler
 */
postbackRouter.get('/cpagrip', async (req, res, next) => {
    try {
        const { aff_sub2, payout, status, sig } = req.query as Record<string, string>;

        if (!aff_sub2) {
            return res.status(400).send('Missing session ID');
        }

        // Find task by session ID
        const task = await prisma.task.findUnique({
            where: { sessionId: aff_sub2 },
        });

        if (!task) {
            logger.warn({ sessionId: aff_sub2 }, 'Task not found for postback');
            return res.status(404).send('Task not found');
        }

        if (task.status === 'APPROVED') {
            return res.send('Already processed');
        }

        // Verify signature
        if (sig && !verifyPostbackSignature('cpagrip', req.query as Record<string, string>, sig)) {
            logger.warn({ sessionId: aff_sub2 }, 'Invalid postback signature');
            return res.status(403).send('Invalid signature');
        }

        // Store postback data
        await prisma.task.update({
            where: { id: task.id },
            data: {
                postbackData: req.query as object,
                postbackReceivedAt: new Date(),
                status: status === '1' ? 'PENDING' : 'REJECTED',
                completedAt: new Date(),
            },
        });

        // If approved, process payment
        if (status === '1' || status === 'approved') {
            await processApprovedTask(task.id, task.payoutNano);
        }

        res.send('OK');
    } catch (error) {
        logger.error(error, 'Postback processing error');
        next(error);
    }
});

/**
 * GET /api/postback/ogads
 * OGAds postback handler
 */
postbackRouter.get('/ogads', async (req, res, next) => {
    try {
        const { aff_sub2, payout, status } = req.query as Record<string, string>;

        if (!aff_sub2) {
            return res.status(400).send('Missing session ID');
        }

        const task = await prisma.task.findUnique({
            where: { sessionId: aff_sub2 },
        });

        if (!task) {
            return res.status(404).send('Task not found');
        }

        if (task.status === 'APPROVED') {
            return res.send('Already processed');
        }

        await prisma.task.update({
            where: { id: task.id },
            data: {
                postbackData: req.query as object,
                postbackReceivedAt: new Date(),
                status: 'PENDING',
                completedAt: new Date(),
            },
        });

        // OGAds typically sends status=1 for approved
        if (status === '1') {
            await processApprovedTask(task.id, task.payoutNano);
        }

        res.send('OK');
    } catch (error) {
        logger.error(error, 'OGAds postback error');
        next(error);
    }
});

/**
 * GET /api/postback/adgate
 * AdGate postback handler
 */
postbackRouter.get('/adgate', async (req, res, next) => {
    try {
        const { s2, status } = req.query as Record<string, string>;

        if (!s2) {
            return res.status(400).send('Missing session ID');
        }

        const task = await prisma.task.findUnique({
            where: { sessionId: s2 },
        });

        if (!task) {
            return res.status(404).send('Task not found');
        }

        if (task.status === 'APPROVED') {
            return res.send('Already processed');
        }

        await prisma.task.update({
            where: { id: task.id },
            data: {
                postbackData: req.query as object,
                postbackReceivedAt: new Date(),
                status: 'PENDING',
                completedAt: new Date(),
            },
        });

        if (status === '1' || status === 'completed') {
            await processApprovedTask(task.id, task.payoutNano);
        }

        res.send('OK');
    } catch (error) {
        logger.error(error, 'AdGate postback error');
        next(error);
    }
});
