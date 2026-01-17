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
