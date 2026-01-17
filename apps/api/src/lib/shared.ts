// =============================================================================
// LOCAL COPY OF @traffic-arb/shared for Render deployment
// This avoids workspace package resolution issues
// =============================================================================

// =============================================================================
// TON CONSTANTS
// =============================================================================

/** TON has 9 decimal places (nano) */
export const TON_DECIMALS = 9;

/** 1 TON = 1,000,000,000 nanoTON */
export const NANO_PER_TON = 1_000_000_000n;

// =============================================================================
// GAMIFICATION CONSTANTS
// =============================================================================

/** XP required to reach each level (index = level - 1) */
export const LEVEL_XP_REQUIREMENTS = [
    0,      // Level 1
    100,    // Level 2
    300,    // Level 3
    600,    // Level 4
    1000,   // Level 5
    1500,   // Level 6
    2100,   // Level 7
    2800,   // Level 8
    3600,   // Level 9
    4500,   // Level 10
    5500,   // Level 11
    6600,   // Level 12
    7800,   // Level 13
    9100,   // Level 14
    10500,  // Level 15
    12000,  // Level 16
    13600,  // Level 17
    15300,  // Level 18
    17100,  // Level 19
    19000,  // Level 20
] as const;

export const MAX_LEVEL = LEVEL_XP_REQUIREMENTS.length;

/** XP earned per task completion */
export const XP_PER_TASK = 10;

/** XP earned per referral signup */
export const XP_PER_REFERRAL = 25;

/** Daily streak bonus multipliers */
export const STREAK_BONUSES = {
    7: 1.1,   // 10% bonus at 7 days
    14: 1.15, // 15% bonus at 14 days
    30: 1.2,  // 20% bonus at 30 days
    60: 1.25, // 25% bonus at 60 days
    90: 1.3,  // 30% bonus at 90 days
} as const;

// =============================================================================
// REFERRAL CONSTANTS
// =============================================================================

/** Referral commission rates by tier (percentage) */
export const REFERRAL_RATES = {
    TIER_1: 0.10, // 10% of referred user's earnings
    TIER_2: 0.03, // 3% of tier 1 referral's referred earnings
    TIER_3: 0.01, // 1% of tier 2 referral's referred earnings
} as const;

export const MAX_REFERRAL_DEPTH = 3;

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================

/** Risk score thresholds */
export const RISK_THRESHOLDS = {
    NORMAL: 30,       // 0-30: Normal operation
    ELEVATED: 60,     // 31-60: Manual review queue
    HIGH: 85,         // 61-85: Delayed payouts
    CRITICAL: 100,    // 86-100: Auto suspension
} as const;

/** Risk score weights */
export const RISK_WEIGHTS = {
    NEW_ACCOUNT: 30,           // Account < 24h old
    VPN_DETECTED: 25,          // VPN/Proxy detected
    DATACENTER_IP: 40,         // Datacenter IP (not residential)
    BANNED_FINGERPRINT: 100,   // Fingerprint matches banned user
    MULTI_ACCOUNT: 50,         // Multiple accounts same device
    FAST_COMPLETION: 35,       // Unusually fast task completion
    HIGH_REJECTION_RATE: 20,   // Failed task ratio > 80%
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

export const RATE_LIMITS = {
    TASK_COMPLETION: { max: 100, window: 3600 },    // 100 per hour
    WITHDRAWAL: { max: 10, window: 3600 },           // 10 per hour
    OFFER_FETCH: { max: 60, window: 60 },            // 60 per minute
    LOGIN: { max: 5, window: 900 },                  // 5 per 15 min
} as const;

// =============================================================================
// CPA PROVIDER CONSTANTS
// =============================================================================

export const CPA_PROVIDERS = {
    CPAGRIP: 'CPAGRIP',
    OGADS: 'OGADS',
    ADGATE: 'ADGATE',
} as const;

export type CPAProviderType = keyof typeof CPA_PROVIDERS;

// =============================================================================
// API CONSTANTS
// =============================================================================

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

// =============================================================================
// USER TYPES
// =============================================================================

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
}

export interface TelegramWebAppInitData {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
    start_param?: string; // Referral code
}

export interface UserProfile {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    level: number;
    xp: number;
    balance: string; // Formatted TON amount
    balanceNano: string;
    totalEarned: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    createdAt: string;
    streak: {
        current: number;
        longest: number;
        claimedToday: boolean;
    };
    stats: {
        tasksCompleted: number;
        referralCount: number;
        referralEarnings: string;
    };
}

// =============================================================================
// OFFER TYPES
// =============================================================================

export interface OfferListItem {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    payout: string;
    payoutUsd: string;
    category: OfferCategory;
    difficulty: OfferDifficulty;
    estimatedMinutes: number | null;
    provider: CPAProvider;
}

export interface OfferDetails extends OfferListItem {
    instructions: string | null;
    conversionRate: number | null;
}

export type OfferCategory =
    | 'APP_INSTALL'
    | 'SURVEY'
    | 'SIGNUP'
    | 'VIDEO'
    | 'GAME'
    | 'SOCIAL'
    | 'OTHER';

export type OfferDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type CPAProvider = 'CPAGRIP' | 'OGADS' | 'ADGATE' | 'CUSTOM';

export interface OfferFilters {
    category?: OfferCategory;
    difficulty?: OfferDifficulty;
    minPayout?: number;
    search?: string;
    page?: number;
    limit?: number;
}

// =============================================================================
// TASK TYPES
// =============================================================================

export interface TaskItem {
    id: string;
    offerId: string;
    offerName: string;
    status: TaskStatus;
    payout: string;
    startedAt: string;
    completedAt: string | null;
}

export type TaskStatus = 'STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StartTaskResponse {
    taskId: string;
    sessionId: string;
    trackingUrl: string;
}

// =============================================================================
// WALLET TYPES
// =============================================================================

export interface WalletBalance {
    balance: string;
    balanceNano: string;
    pendingWithdrawals: string;
    totalEarned: string;
}

export interface TransactionItem {
    id: string;
    type: TransactionType;
    amount: string;
    description: string | null;
    createdAt: string;
}

export type TransactionType =
    | 'TASK_REWARD'
    | 'REFERRAL_BONUS'
    | 'WITHDRAWAL'
    | 'DAILY_BONUS'
    | 'STREAK_BONUS'
    | 'LEVEL_BONUS'
    | 'ADJUSTMENT';

export interface WithdrawalRequest {
    amountNano: string;
    walletAddress: string;
}

export interface WithdrawalItem {
    id: string;
    amount: string;
    walletAddress: string;
    status: WithdrawalStatus;
    txHash: string | null;
    createdAt: string;
    processedAt: string | null;
}

export type WithdrawalStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'REJECTED';

// =============================================================================
// REFERRAL TYPES
// =============================================================================

export interface ReferralStats {
    referralCode: string;
    referralLink: string;
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: string;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
}

export interface ReferralUser {
    id: string;
    username: string | null;
    level: number;
    tier: number;
    earnings: string;
    joinedAt: string;
}

// =============================================================================
// LEADERBOARD TYPES
// =============================================================================

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string | null;
    firstName: string | null;
    level: number;
    value: string;
    isCurrentUser: boolean;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';
export type LeaderboardType = 'earnings' | 'tasks' | 'referrals';

// =============================================================================
// GAMIFICATION TYPES
// =============================================================================

export interface Achievement {
    code: string;
    name: string;
    description: string;
    iconUrl: string | null;
    isUnlocked: boolean;
    unlockedAt: string | null;
    progress?: number;
}

export interface DailyBonus {
    day: number;
    reward: string;
    isClaimed: boolean;
    isAvailable: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// =============================================================================
// DEVICE FINGERPRINT TYPES
// =============================================================================

export interface DeviceFingerprintData {
    fingerprint: string;
    platform: string;
    browser: string;
    isMobile: boolean;
    screenResolution: string;
    timezone: string;
    language: string;
}

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
    const rawAddressRegex = /^[0-9a-fA-F]{64}$/;
    const userFriendlyRegex = /^[A-Za-z0-9_-]{48}$/;
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
