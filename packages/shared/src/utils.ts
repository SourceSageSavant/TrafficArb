import { NANO_PER_TON, TON_DECIMALS, LEVEL_XP_REQUIREMENTS, MAX_LEVEL } from './constants.js';

// =============================================================================
// TON UTILITIES
// =============================================================================

/**
 * Convert nano TON to TON (string for display)
 */
export function nanoToTon(nano: bigint | string): string {
    const nanoValue = typeof nano === 'string' ? BigInt(nano) : nano;
    const tonValue = Number(nanoValue) / Number(NANO_PER_TON);
    return tonValue.toFixed(TON_DECIMALS).replace(/\.?0+$/, '');
}

/**
 * Convert TON to nano TON
 */
export function tonToNano(ton: number | string): bigint {
    const tonValue = typeof ton === 'string' ? parseFloat(ton) : ton;
    return BigInt(Math.floor(tonValue * Number(NANO_PER_TON)));
}

/**
 * Format TON amount for display
 */
export function formatTon(nano: bigint | string, decimals = 4): string {
    const nanoValue = typeof nano === 'string' ? BigInt(nano) : nano;
    const tonValue = Number(nanoValue) / Number(NANO_PER_TON);
    return tonValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });
}

/**
 * Convert USD cents to nano TON (requires current TON/USD rate)
 */
export function usdCentsToNano(cents: number, tonUsdRate: number): bigint {
    const usd = cents / 100;
    const ton = usd / tonUsdRate;
    return tonToNano(ton);
}

// =============================================================================
// LEVEL UTILITIES
// =============================================================================

/**
 * Calculate user level from XP
 */
export function calculateLevel(xp: number): number {
    for (let level = MAX_LEVEL; level >= 1; level--) {
        if (xp >= LEVEL_XP_REQUIREMENTS[level - 1]) {
            return level;
        }
    }
    return 1;
}

/**
 * Get XP required for next level
 */
export function getXpForNextLevel(currentLevel: number): number {
    if (currentLevel >= MAX_LEVEL) {
        return LEVEL_XP_REQUIREMENTS[MAX_LEVEL - 1];
    }
    return LEVEL_XP_REQUIREMENTS[currentLevel];
}

/**
 * Get level progress percentage
 */
export function getLevelProgress(xp: number, level: number): number {
    if (level >= MAX_LEVEL) return 100;

    const currentLevelXp = LEVEL_XP_REQUIREMENTS[level - 1];
    const nextLevelXp = LEVEL_XP_REQUIREMENTS[level];
    const xpInLevel = xp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;

    return Math.floor((xpInLevel / xpNeeded) * 100);
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate TON wallet address
 */
export function isValidTonAddress(address: string): boolean {
    // TON addresses are either raw (64 hex chars) or user-friendly (48 base64 chars)
    const rawAddressRegex = /^[0-9a-fA-F]{64}$/;
    const userFriendlyRegex = /^[A-Za-z0-9_-]{48}$/;

    // Also support EQ/UQ prefixed addresses
    const prefixedRegex = /^(EQ|UQ)[A-Za-z0-9_-]{46}$/;

    return rawAddressRegex.test(address) ||
        userFriendlyRegex.test(address) ||
        prefixedRegex.test(address);
}

/**
 * Validate Telegram user ID
 */
export function isValidTelegramId(id: number | string): boolean {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return Number.isInteger(numId) && numId > 0 && numId < Number.MAX_SAFE_INTEGER;
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Check if a date is today (UTC)
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return (
        date.getUTCFullYear() === today.getUTCFullYear() &&
        date.getUTCMonth() === today.getUTCMonth() &&
        date.getUTCDate() === today.getUTCDate()
    );
}

/**
 * Check if a date is yesterday (UTC)
 */
export function isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return (
        date.getUTCFullYear() === yesterday.getUTCFullYear() &&
        date.getUTCMonth() === yesterday.getUTCMonth() &&
        date.getUTCDate() === yesterday.getUTCDate()
    );
}

/**
 * Get start of day (UTC)
 */
export function getStartOfDay(date: Date = new Date()): Date {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return start;
}

/**
 * Get start of week (Monday, UTC)
 */
export function getStartOfWeek(date: Date = new Date()): Date {
    const start = new Date(date);
    const day = start.getUTCDay();
    const diff = start.getUTCDate() - day + (day === 0 ? -6 : 1);
    start.setUTCDate(diff);
    start.setUTCHours(0, 0, 0, 0);
    return start;
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

/**
 * Mask wallet address for display
 */
export function maskAddress(address: string, visibleChars = 6): string {
    if (address.length <= visibleChars * 2) return address;
    return `${address.slice(0, visibleChars)}...${address.slice(-visibleChars)}`;
}

/**
 * Generate random session ID
 */
export function generateSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
