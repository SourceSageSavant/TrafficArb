import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../index.js';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';

// Get bot instance (re-use the existing one from telegram.ts)
let bot: TelegramBot | null = null;

export function initNotificationBot(botInstance: TelegramBot) {
    bot = botInstance;
}

/**
 * Send a push notification to a user via Telegram
 */
export async function sendPushNotification(
    userId: string,
    message: string,
    options?: {
        parseMode?: 'HTML' | 'Markdown';
        replyMarkup?: TelegramBot.InlineKeyboardMarkup;
    }
): Promise<boolean> {
    try {
        // Get user's Telegram ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { telegramId: true },
        });

        if (!user) {
            logger.warn({ userId }, 'User not found for notification');
            return false;
        }

        if (!bot) {
            logger.warn('Notification bot not initialized');
            return false;
        }

        await bot.sendMessage(Number(user.telegramId), message, {
            parse_mode: options?.parseMode || 'HTML',
            reply_markup: options?.replyMarkup,
        });

        logger.info({ userId, telegramId: user.telegramId.toString() }, 'Push notification sent');
        return true;
    } catch (error: any) {
        logger.error({ userId, error: error.message }, 'Failed to send push notification');
        return false;
    }
}

/**
 * Notify user when their withdrawal is approved
 */
export async function notifyWithdrawalApproved(userId: string, amountTon: number, txHash?: string): Promise<void> {
    const message = `🎉 <b>Withdrawal Approved!</b>\n\n` +
        `💰 Amount: <b>${amountTon.toFixed(2)} TON</b>\n` +
        (txHash ? `🔗 <a href="https://tonscan.org/tx/${txHash}">View Transaction</a>` : '') +
        `\n\nYour funds have been sent to your wallet!`;

    await sendPushNotification(userId, message, { parseMode: 'HTML' });
}

/**
 * Notify user when their withdrawal is rejected
 */
export async function notifyWithdrawalRejected(userId: string, amountTon: number, reason?: string): Promise<void> {
    const message = `❌ <b>Withdrawal Rejected</b>\n\n` +
        `💰 Amount: ${amountTon.toFixed(2)} TON\n` +
        `📝 Reason: ${reason || 'Not specified'}\n\n` +
        `Your balance has been refunded. Please contact support if you have questions.`;

    await sendPushNotification(userId, message, { parseMode: 'HTML' });
}

/**
 * Notify user when they unlock an achievement
 */
export async function notifyAchievementUnlocked(userId: string, achievementName: string, xpReward: number): Promise<void> {
    const message = `🏆 <b>Achievement Unlocked!</b>\n\n` +
        `🎖 ${achievementName}\n` +
        `✨ +${xpReward} XP\n\n` +
        `Keep up the great work!`;

    await sendPushNotification(userId, message, { parseMode: 'HTML' });
}

/**
 * Notify user when they receive a referral bonus
 */
export async function notifyReferralBonus(userId: string, amountTon: number, referredUsername: string): Promise<void> {
    const message = `💸 <b>Referral Bonus!</b>\n\n` +
        `Your friend <b>${referredUsername}</b> completed a task!\n` +
        `💰 You earned: <b>${amountTon.toFixed(4)} TON</b>\n\n` +
        `Keep inviting friends to earn more!`;

    await sendPushNotification(userId, message, { parseMode: 'HTML' });
}

/**
 * Notify user about their daily streak
 */
export async function notifyStreakReminder(userId: string, currentStreak: number): Promise<void> {
    const message = `🔥 <b>Daily Streak Reminder</b>\n\n` +
        `You're on a <b>${currentStreak} day</b> streak!\n` +
        `Don't forget to claim your daily bonus to keep it going!\n\n` +
        `⏰ Time is running out for today!`;

    await sendPushNotification(userId, message, {
        parseMode: 'HTML',
        replyMarkup: {
            inline_keyboard: [[
                { text: '🎁 Claim Bonus', url: 'https://t.me/YourBot' }
            ]],
        },
    });
}

/**
 * Broadcast message to all users (for announcements)
 */
export async function broadcastMessage(
    message: string,
    options?: { onlyActiveUsers?: boolean; limit?: number }
): Promise<{ sent: number; failed: number }> {
    const where: any = {};
    if (options?.onlyActiveUsers) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        where.lastActiveAt = { gte: thirtyDaysAgo };
    }

    const users = await prisma.user.findMany({
        where,
        select: { id: true, telegramId: true },
        take: options?.limit || 1000,
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
        try {
            if (bot) {
                await bot.sendMessage(Number(user.telegramId), message, { parse_mode: 'HTML' });
                sent++;
            }
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch {
            failed++;
        }
    }

    logger.info({ sent, failed, total: users.length }, 'Broadcast completed');
    return { sent, failed };
}
