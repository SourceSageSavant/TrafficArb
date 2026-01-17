// =============================================================================
// LOCAL TYPES - Copy of @traffic-arb/shared types for Vercel compatibility
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

export type TransactionType =
    | 'TASK_REWARD'
    | 'REFERRAL_BONUS'
    | 'WITHDRAWAL'
    | 'DAILY_BONUS'
    | 'STREAK_BONUS'
    | 'LEVEL_BONUS'
    | 'ADJUSTMENT';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';
export type LeaderboardType = 'earnings' | 'tasks' | 'referrals';
