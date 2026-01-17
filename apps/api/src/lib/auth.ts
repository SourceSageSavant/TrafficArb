import { createHmac } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { TelegramWebAppInitData } from '@traffic-arb/shared';
import { env } from './env.js';

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const TOKEN_EXPIRY = '7d';

/**
 * Validate Telegram WebApp initData
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string): TelegramWebAppInitData | null {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        if (!hash) return null;

        params.delete('hash');
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Create secret key from bot token
        const secretKey = createHmac('sha256', 'WebAppData')
            .update(env.TELEGRAM_BOT_TOKEN)
            .digest();

        // Calculate expected hash
        const expectedHash = createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        if (hash !== expectedHash) {
            return null;
        }

        // Parse user data
        const userJson = params.get('user');
        const user = userJson ? JSON.parse(userJson) : undefined;

        return {
            user,
            auth_date: parseInt(params.get('auth_date') || '0', 10),
            hash,
            query_id: params.get('query_id') || undefined,
            start_param: params.get('start_param') || undefined,
        };
    } catch (error) {
        return null;
    }
}

/**
 * Create JWT token for authenticated user
 */
export async function createAuthToken(userId: string, telegramId: bigint): Promise<string> {
    return new SignJWT({ userId, telegramId: telegramId.toString() })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRY)
        .sign(JWT_SECRET);
}

/**
 * Verify and decode JWT token
 */
export async function verifyAuthToken(token: string): Promise<{ userId: string; telegramId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return {
            userId: payload.userId as string,
            telegramId: payload.telegramId as string,
        };
    } catch {
        return null;
    }
}
