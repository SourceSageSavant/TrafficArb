import TelegramBot from 'node-telegram-bot-api';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../index.js';

/**
 * Telegram Bot Service
 * 
 * Handles commands, messages, and webhook callbacks from Telegram
 */

let bot: TelegramBot | null = null;

export function initializeTelegramBot() {
    const token = env.TELEGRAM_BOT_TOKEN;

    if (!token ||
        token === 'development_token' ||
        token.length < 20 ||
        token.includes('your_bot_token') ||
        token.includes('EXAMPLE')) {
        logger.warn('Telegram bot token not configured or invalid - bot disabled');
        return null;
    }

    // Initialize bot with polling in development, webhook in production
    const isProduction = env.NODE_ENV === 'production';

    bot = new TelegramBot(token, {
        polling: !isProduction,
    });

    // Register command handlers
    registerCommands();

    logger.info('Telegram bot initialized');
    return bot;
}

function registerCommands() {
    if (!bot) return;

    // /start command - new user or referral
    bot.onText(/\/start(?:\s+(.+))?/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const username = msg.from?.username;
        const firstName = msg.from?.first_name;
        const lastName = msg.from?.last_name;
        const referralCode = match?.[1]; // Referral code from deep link

        if (!userId) return;

        try {
            // Check if user exists
            let user = await prisma.user.findUnique({
                where: { telegramId: BigInt(userId) },
            });

            if (!user) {
                // Create new user - generate referral code from telegramId
                user = await prisma.user.create({
                    data: {
                        telegramId: BigInt(userId),
                        username: username || null,
                        firstName: firstName || '',
                        lastName: lastName || null,
                    },
                });

                logger.info({ userId, username }, 'New user created via bot');

                // Handle referral if code provided
                if (referralCode && referralCode.startsWith('ref_')) {
                    const referrerId = referralCode.replace('ref_', '');
                    const referrer = await prisma.user.findFirst({
                        where: {
                            telegramId: BigInt(referrerId),
                        },
                    });

                    if (referrer && referrer.id !== user.id) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { referrerId: referrer.id },
                        });

                        logger.info({ userId, referrerId: referrer.id }, 'Referral linked');
                    }
                }
            }

            // Generate referral code from telegramId
            const userReferralCode = `ref_${user.telegramId}`;
            const webAppUrl = process.env.MINI_APP_URL || 'https://t.me/TrafficArbBot/app';

            await bot!.sendMessage(chatId,
                `🚀 *Welcome to Traffic Arb!*\n\n` +
                `Complete simple tasks and earn TON crypto! 💰\n\n` +
                `Your referral code: \`${userReferralCode}\`\n\n` +
                `Tap the button below to start earning!`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🎯 Start Earning', web_app: { url: webAppUrl } }
                        ]]
                    }
                }
            );
        } catch (error) {
            logger.error({ error, userId }, 'Error handling /start command');
            await bot!.sendMessage(chatId, 'Something went wrong. Please try again.');
        }
    });

    // /balance command
    bot.onText(/\/balance/, async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;

        if (!userId) return;

        try {
            const user = await prisma.user.findUnique({
                where: { telegramId: BigInt(userId) },
                select: {
                    balanceNano: true,
                    totalEarnedNano: true,
                    level: true,
                },
            });

            if (!user) {
                await bot!.sendMessage(chatId, 'Please start the bot first with /start');
                return;
            }

            const balance = (Number(user.balanceNano) / 1e9).toFixed(4);
            const totalEarned = (Number(user.totalEarnedNano) / 1e9).toFixed(4);

            await bot!.sendMessage(chatId,
                `💰 *Your Balance*\n\n` +
                `Available: \`${balance} TON\`\n` +
                `Total Earned: \`${totalEarned} TON\`\n` +
                `Level: ${user.level}`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            logger.error({ error, userId }, 'Error handling /balance command');
            await bot!.sendMessage(chatId, 'Failed to fetch balance. Please try again.');
        }
    });

    // /referral command
    bot.onText(/\/referral/, async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;

        if (!userId) return;

        try {
            const user = await prisma.user.findUnique({
                where: { telegramId: BigInt(userId) },
            });

            if (!user) {
                await bot!.sendMessage(chatId, 'Please start the bot first with /start');
                return;
            }

            // Count referrals
            const referralCount = await prisma.user.count({
                where: { referrerId: user.id },
            });

            // Generate referral code from telegramId
            const userRefCode = `ref_${user.telegramId}`;
            const referralLink = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${userRefCode}`;

            await bot!.sendMessage(chatId,
                `👥 *Your Referral Info*\n\n` +
                `Total Referrals: ${referralCount}\n\n` +
                `📎 *Your Referral Link:*\n\`${referralLink}\`\n\n` +
                `Earn 10% of what your referrals earn! 💸`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            logger.error({ error, userId }, 'Error handling /referral command');
            await bot!.sendMessage(chatId, 'Failed to fetch referral info.');
        }
    });

    // /help command
    bot.onText(/\/help/, async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id;

        await bot!.sendMessage(chatId,
            `📚 *Traffic Arb Commands*\n\n` +
            `/start - Start the bot or open the app\n` +
            `/balance - Check your TON balance\n` +
            `/referral - Get your referral link\n` +
            `/help - Show this help message\n\n` +
            `🎯 *How it works:*\n` +
            `1. Open the mini app\n` +
            `2. Complete simple tasks\n` +
            `3. Earn TON rewards!\n` +
            `4. Invite friends for 10% bonus`,
            { parse_mode: 'Markdown' }
        );
    });

    // Handle callback queries (button clicks)
    bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
        if (!query.data) return;

        try {
            // Acknowledge the callback
            await bot!.answerCallbackQuery(query.id);

            // Handle different callback data
            if (query.data.startsWith('task_')) {
                const taskId = query.data.replace('task_', '');
                // Handle task-related callbacks
                logger.info({ taskId, userId: query.from.id }, 'Task callback received');
            }
        } catch (error) {
            logger.error({ error }, 'Error handling callback query');
        }
    });

    logger.info('Telegram bot commands registered');
}

/**
 * Send notification to user
 */
export async function sendNotification(
    telegramId: string,
    message: string,
    options?: TelegramBot.SendMessageOptions
) {
    if (!bot) {
        logger.warn('Telegram bot not initialized');
        return false;
    }

    try {
        await bot.sendMessage(telegramId, message, {
            parse_mode: 'Markdown',
            ...options,
        });
        return true;
    } catch (error) {
        logger.error({ error, telegramId }, 'Failed to send notification');
        return false;
    }
}

/**
 * Send task completion notification
 */
export async function notifyTaskCompletion(
    telegramId: string,
    taskName: string,
    payoutTon: string
) {
    return sendNotification(
        telegramId,
        `✅ *Task Completed!*\n\n` +
        `${taskName}\n` +
        `Earned: \`${payoutTon} TON\` 💰`
    );
}

/**
 * Send withdrawal notification
 */
export async function notifyWithdrawal(
    telegramId: string,
    amount: string,
    status: 'pending' | 'completed' | 'failed'
) {
    const statusEmoji = {
        pending: '⏳',
        completed: '✅',
        failed: '❌',
    };

    return sendNotification(
        telegramId,
        `${statusEmoji[status]} *Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}*\n\n` +
        `Amount: \`${amount} TON\``
    );
}

export function getTelegramBot() {
    return bot;
}
