import { Router } from 'express';
import { z } from 'zod';
import { validateTelegramInitData, createAuthToken } from '../lib/auth.js';
import { prisma } from '../index.js';
import { errors } from '../middleware/errorHandler.js';
import { logger } from '../lib/logger.js';

export const authRouter = Router();

const loginSchema = z.object({
    initData: z.string().min(1),
});

/**
 * POST /api/auth/telegram
 * Authenticate user using Telegram WebApp initData
 */
authRouter.post('/telegram', async (req, res, next) => {
    try {
        const body = loginSchema.parse(req.body);

        // Validate Telegram initData
        const initData = validateTelegramInitData(body.initData);
        if (!initData || !initData.user) {
            throw errors.unauthorized('Invalid Telegram authentication data');
        }

        const telegramUser = initData.user;
        const telegramId = BigInt(telegramUser.id);

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { telegramId },
        });

        const isNewUser = !user;

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    telegramId,
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    languageCode: telegramUser.language_code,
                },
            });

            // Handle referral if start_param is present
            if (initData.start_param?.startsWith('ref_')) {
                const referrerTelegramId = initData.start_param.replace('ref_', '');
                try {
                    const referrer = await prisma.user.findFirst({
                        where: { telegramId: BigInt(referrerTelegramId) },
                    });

                    if (referrer && referrer.id !== user.id) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { referrerId: referrer.id },
                        });

                        logger.info({ userId: user.id, referrerId: referrer.id }, 'Referral linked');
                    }
                } catch (err) {
                    logger.warn({ err, startParam: initData.start_param }, 'Failed to process referral');
                }
            }

            // Create initial streak record
            await prisma.dailyStreak.create({
                data: { userId: user.id },
            });

            logger.info({ userId: user.id, telegramId: telegramId.toString() }, 'New user created');
        } else {
            // Update existing user info
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    lastActiveAt: new Date(),
                },
            });
        }

        // Create JWT token
        const token = await createAuthToken(user.id, telegramId);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    telegramId: telegramId.toString(),
                    username: user.username,
                    firstName: user.firstName,
                    level: user.level,
                    isNewUser,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});
