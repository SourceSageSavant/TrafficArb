import type { CPAOffer, CPAPostback, CPAProviderConfig, TrackingUrlParams } from './types.js';

/**
 * Base CPA Provider Interface
 * 
 * All CPA network providers must implement this interface
 */
export interface ICPAProvider {
    name: string;
    config: CPAProviderConfig;

    /**
     * Fetch all available offers from the network
     */
    fetchOffers(): Promise<CPAOffer[]>;

    /**
     * Generate a tracking URL for a specific offer
     */
    generateTrackingUrl(params: TrackingUrlParams): string;

    /**
     * Verify and parse a postback request
     */
    verifyPostback(queryParams: Record<string, string>, body?: unknown): CPAPostback | null;

    /**
     * Check if provider is properly configured
     */
    isConfigured(): boolean;
}

/**
 * Base class with common functionality
 */
export abstract class BaseCPAProvider implements ICPAProvider {
    abstract name: string;
    config: CPAProviderConfig;

    protected marginPercent: number;

    constructor(config: CPAProviderConfig, marginPercent: number = 55) {
        this.config = config;
        this.marginPercent = marginPercent; // Default 55% margin (45% to user)
    }

    abstract fetchOffers(): Promise<CPAOffer[]>;
    abstract generateTrackingUrl(params: TrackingUrlParams): string;
    abstract verifyPostback(queryParams: Record<string, string>, body?: unknown): CPAPostback | null;

    isConfigured(): boolean {
        return !!(
            this.config.apiKey &&
            this.config.publisherId &&
            this.config.isEnabled
        );
    }

    /**
     * Calculate user payout after applying margin
     */
    protected calculateUserPayout(payoutCents: number): number {
        // User gets (100 - marginPercent)% of the payout
        const userPercent = (100 - this.marginPercent) / 100;
        return Math.floor(payoutCents * userPercent);
    }

    /**
     * Map offer category to our standard categories
     */
    protected mapCategory(category: string): string {
        const categoryMap: Record<string, string> = {
            // CPAGrip categories
            'install': 'APP_INSTALL',
            'mobile': 'APP_INSTALL',
            'app': 'APP_INSTALL',
            'game': 'GAME',
            'games': 'GAME',
            'survey': 'SURVEY',
            'surveys': 'SURVEY',
            'email': 'SIGNUP',
            'email submit': 'SIGNUP',
            'signup': 'SIGNUP',
            'registration': 'SIGNUP',
            'video': 'VIDEO',
            'watch': 'VIDEO',
            'social': 'SOCIAL',
            'follow': 'SOCIAL',
            'download': 'APP_INSTALL',
            'trial': 'APP_INSTALL',
            'subscription': 'APP_INSTALL',
            'cc submit': 'OTHER',
            'pin submit': 'OTHER',
        };

        const normalized = category.toLowerCase().trim();
        return categoryMap[normalized] || 'OTHER';
    }

    /**
     * Estimate difficulty based on payout
     */
    protected estimateDifficulty(payoutCents: number): 'EASY' | 'MEDIUM' | 'HARD' {
        if (payoutCents < 50) return 'EASY';      // < $0.50
        if (payoutCents < 150) return 'MEDIUM';   // $0.50 - $1.50
        return 'HARD';                             // > $1.50
    }

    /**
     * Estimate completion time based on category and difficulty
     */
    protected estimateMinutes(category: string, difficulty: string): number {
        const baseMinutes: Record<string, number> = {
            'APP_INSTALL': 5,
            'GAME': 15,
            'SURVEY': 5,
            'SIGNUP': 3,
            'VIDEO': 2,
            'SOCIAL': 2,
            'OTHER': 5,
        };

        const base = baseMinutes[category] || 5;
        const multiplier = difficulty === 'HARD' ? 2 : difficulty === 'MEDIUM' ? 1.5 : 1;

        return Math.round(base * multiplier);
    }
}
