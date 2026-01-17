import { CPAGripProvider } from './providers/cpagrip.js';
import { OGAdsProvider } from './providers/ogads.js';
import { AdGateProvider } from './providers/adgate.js';
import type { ICPAProvider } from './base.js';
import type { CPAOffer, CPAPostback, CPAProviderConfig, TrackingUrlParams } from './types.js';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';
import { prisma } from '../index.js';

/**
 * CPA Manager - Manages all CPA network providers
 */
export class CPAManager {
    private providers: Map<string, ICPAProvider> = new Map();
    private marginPercent: number;

    constructor() {
        // Default 55% margin (you keep 55%, user gets 45%)
        this.marginPercent = parseInt(env.CPA_MARGIN_PERCENT || '55', 10);

        this.initializeProviders();
    }

    /**
     * Initialize all configured CPA providers
     */
    private initializeProviders() {
        // CPAGrip
        if (env.CPAGRIP_API_KEY && env.CPAGRIP_PUBLISHER_ID) {
            const config: CPAProviderConfig = {
                name: 'CPAGRIP',
                apiKey: env.CPAGRIP_API_KEY,
                publisherId: env.CPAGRIP_PUBLISHER_ID,
                baseUrl: 'https://www.cpagrip.com',
                postbackSecret: env.CPAGRIP_POSTBACK_SECRET,
                isEnabled: true,
            };
            this.providers.set('CPAGRIP', new CPAGripProvider(config, this.marginPercent));
            logger.info('CPAGrip provider initialized');
        }

        // OGAds
        if (env.OGADS_API_KEY && env.OGADS_PUBLISHER_ID) {
            const config: CPAProviderConfig = {
                name: 'OGADS',
                apiKey: env.OGADS_API_KEY,
                publisherId: env.OGADS_PUBLISHER_ID,
                baseUrl: 'https://api.ogads.com',
                postbackSecret: env.OGADS_POSTBACK_SECRET,
                isEnabled: true,
            };
            this.providers.set('OGADS', new OGAdsProvider(config, this.marginPercent));
            logger.info('OGAds provider initialized');
        }

        // AdGate
        if (env.ADGATE_API_KEY && env.ADGATE_PUBLISHER_ID) {
            const config: CPAProviderConfig = {
                name: 'ADGATE',
                apiKey: env.ADGATE_API_KEY,
                publisherId: env.ADGATE_PUBLISHER_ID,
                baseUrl: 'https://api.adgatemedia.com',
                postbackSecret: env.ADGATE_POSTBACK_SECRET,
                isEnabled: true,
            };
            this.providers.set('ADGATE', new AdGateProvider(config, this.marginPercent));
            logger.info('AdGate provider initialized');
        }

        logger.info({ count: this.providers.size }, 'CPA providers initialized');
    }

    /**
     * Get a specific provider
     */
    getProvider(name: string): ICPAProvider | undefined {
        return this.providers.get(name.toUpperCase());
    }

    /**
     * Get all active providers
     */
    getActiveProviders(): ICPAProvider[] {
        return Array.from(this.providers.values()).filter(p => p.isConfigured());
    }

    /**
     * Fetch offers from all providers
     */
    async fetchAllOffers(): Promise<CPAOffer[]> {
        const allOffers: CPAOffer[] = [];

        for (const provider of this.getActiveProviders()) {
            try {
                const offers = await provider.fetchOffers();
                allOffers.push(...offers);
                logger.info({ provider: provider.name, count: offers.length }, 'Fetched offers');
            } catch (error) {
                logger.error({ error, provider: provider.name }, 'Failed to fetch offers');
            }
        }

        return allOffers;
    }

    /**
     * Sync offers to database
     */
    async syncOffers(): Promise<{ created: number; updated: number; errors: number }> {
        const stats = { created: 0, updated: 0, errors: 0 };

        const offers = await this.fetchAllOffers();
        logger.info({ totalOffers: offers.length }, 'Starting offer sync');

        for (const offer of offers) {
            try {
                // Convert USD cents to TON nano
                const tonPrice = parseFloat(env.TON_USD_RATE || '2');
                const payoutUsd = offer.userPayoutCents / 100;
                const payoutTon = payoutUsd / tonPrice;
                const payoutNano = BigInt(Math.floor(payoutTon * 1e9));

                await prisma.offer.upsert({
                    where: {
                        externalId_provider: {
                            externalId: offer.externalId,
                            provider: offer.provider,
                        },
                    },
                    update: {
                        name: offer.name,
                        description: offer.description,
                        instructions: offer.instructions,
                        imageUrl: offer.imageUrl,
                        payoutCents: offer.userPayoutCents, // Store USER payout, not network payout
                        payoutNano,
                        category: offer.category as any,
                        difficulty: offer.difficulty as any,
                        estimatedMinutes: offer.estimatedMinutes,
                        countries: offer.countries,
                        devices: offer.devices,
                        trackingUrl: offer.trackingUrl,
                        conversionRate: offer.conversionRate,
                        isActive: offer.isActive,
                        updatedAt: new Date(),
                    },
                    create: {
                        externalId: offer.externalId,
                        provider: offer.provider,
                        name: offer.name,
                        description: offer.description,
                        instructions: offer.instructions,
                        imageUrl: offer.imageUrl,
                        payoutCents: offer.userPayoutCents,
                        payoutNano,
                        category: offer.category as any,
                        difficulty: offer.difficulty as any,
                        estimatedMinutes: offer.estimatedMinutes,
                        countries: offer.countries,
                        devices: offer.devices,
                        trackingUrl: offer.trackingUrl,
                        conversionRate: offer.conversionRate,
                        isActive: offer.isActive,
                    },
                });

                if (stats.created === 0) {
                    stats.updated++;
                } else {
                    stats.created++;
                }
            } catch (error) {
                logger.error({ error, offer: offer.externalId }, 'Failed to sync offer');
                stats.errors++;
            }
        }

        logger.info(stats, 'Offer sync completed');
        return stats;
    }

    /**
     * Generate tracking URL for an offer
     */
    generateTrackingUrl(providerId: string, params: TrackingUrlParams): string | null {
        const provider = this.getProvider(providerId);
        if (!provider) {
            logger.warn({ providerId }, 'Provider not found');
            return null;
        }

        return provider.generateTrackingUrl(params);
    }

    /**
     * Process postback from a provider
     */
    processPostback(providerId: string, queryParams: Record<string, string>, body?: unknown): CPAPostback | null {
        const provider = this.getProvider(providerId);
        if (!provider) {
            logger.warn({ providerId }, 'Provider not found for postback');
            return null;
        }

        return provider.verifyPostback(queryParams, body);
    }

    /**
     * Get margin configuration
     */
    getMarginConfig() {
        return {
            marginPercent: this.marginPercent,
            userPercent: 100 - this.marginPercent,
            description: `You keep ${this.marginPercent}%, users get ${100 - this.marginPercent}%`,
        };
    }

    /**
     * Update margin (runtime change, not persisted)
     */
    setMargin(marginPercent: number) {
        if (marginPercent < 0 || marginPercent > 100) {
            throw new Error('Margin must be between 0 and 100');
        }
        this.marginPercent = marginPercent;
        logger.info({ marginPercent }, 'Margin updated');
    }
}

// Singleton instance
let cpaManager: CPAManager | null = null;

export function getCPAManager(): CPAManager {
    if (!cpaManager) {
        cpaManager = new CPAManager();
    }
    return cpaManager;
}
