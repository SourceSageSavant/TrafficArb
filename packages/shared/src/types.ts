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
    payout: string; // Formatted TON amount
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

export type CPAProvider = 'CPAGRIP' | 'OGADS' | 'ADGATE';

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
    balance: string; // Formatted TON
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
    value: string; // Could be earnings, tasks completed, etc.
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
    progress?: number; // 0-100 percentage
}

export interface DailyBonus {
    day: number; // 1-7 for weekly cycle
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
