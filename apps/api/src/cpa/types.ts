/**
 * CPA Provider Configuration Types
 */

export interface CPAProviderConfig {
    name: 'CPAGRIP' | 'OGADS' | 'ADGATE';
    apiKey: string;
    apiSecret?: string;
    publisherId: string;
    baseUrl: string;
    postbackSecret?: string;
    isEnabled: boolean;
}

export interface CPAOffer {
    // Identifiers
    externalId: string;
    provider: 'CPAGRIP' | 'OGADS' | 'ADGATE';

    // Offer details
    name: string;
    description?: string;
    instructions?: string;
    imageUrl?: string;

    // Payout (in USD cents)
    payoutCents: number;        // What CPA pays YOU
    userPayoutCents: number;    // What you pay USER (after margin)

    // Categorization
    category: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    estimatedMinutes?: number;

    // Targeting
    countries: string[];
    devices: string[];
    os?: string[];

    // Tracking
    trackingUrl: string;

    // Performance
    conversionRate?: number;
    epc?: number; // Earnings per click

    // Status
    isActive: boolean;
}

export interface CPAPostback {
    provider: 'CPAGRIP' | 'OGADS' | 'ADGATE';
    sessionId: string;
    offerId: string;
    payoutCents: number;
    status: 'approved' | 'pending' | 'rejected';
    clickId?: string;
    ipAddress?: string;
    userAgent?: string;
    rawData: Record<string, unknown>;
}

export interface TrackingUrlParams {
    offerId: string;
    sessionId: string;
    userId: string;
    subId1?: string;
    subId2?: string;
    subId3?: string;
}
