import { createHmac } from 'crypto';
import { BaseCPAProvider } from '../base.js';
import type { CPAOffer, CPAPostback, CPAProviderConfig, TrackingUrlParams } from '../types.js';
import { logger } from '../../lib/logger.js';

/**
 * OGAds Provider Integration
 * 
 * API Documentation: https://ogads.com/api
 */
export class OGAdsProvider extends BaseCPAProvider {
    name = 'OGADS';

    constructor(config: CPAProviderConfig, marginPercent?: number) {
        super(config, marginPercent);
    }

    /**
     * Fetch offers from OGAds API
     */
    async fetchOffers(): Promise<CPAOffer[]> {
        if (!this.isConfigured()) {
            logger.warn('OGAds is not configured');
            return [];
        }

        try {
            const url = new URL(`${this.config.baseUrl}/v1/offers`);

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`OGAds API error: ${response.status}`);
            }

            const data = await response.json() as { offers?: unknown[] };

            if (!data.offers || !Array.isArray(data.offers)) {
                logger.warn('OGAds returned no offers');
                return [];
            }

            return data.offers.map((offer: any) => this.mapOffer(offer));
        } catch (error) {
            logger.error({ error }, 'Failed to fetch OGAds offers');
            return [];
        }
    }

    /**
     * Map OGAds offer to our format
     */
    private mapOffer(raw: any): CPAOffer {
        const payoutCents = Math.round(parseFloat(raw.payout || '0') * 100);
        const category = this.mapCategory(raw.category || raw.vertical || 'other');
        const difficulty = this.estimateDifficulty(payoutCents);

        return {
            externalId: String(raw.id || raw.offer_id),
            provider: 'OGADS',
            name: raw.name || raw.title || 'Unknown Offer',
            description: raw.description || '',
            instructions: raw.instructions || raw.requirements || '',
            imageUrl: raw.icon_url || raw.thumbnail || '',
            payoutCents,
            userPayoutCents: this.calculateUserPayout(payoutCents),
            category,
            difficulty,
            estimatedMinutes: this.estimateMinutes(category, difficulty),
            countries: this.parseCountries(raw.countries || raw.geo),
            devices: this.parseDevices(raw.platforms || raw.devices),
            os: raw.os ? [raw.os] : undefined,
            trackingUrl: raw.link || raw.tracking_url || '',
            conversionRate: parseFloat(raw.cr || raw.conversion_rate || '0'),
            epc: parseFloat(raw.epc || '0'),
            isActive: raw.status === 'active' || raw.active === true,
        };
    }

    /**
     * Generate tracking URL with subids
     */
    generateTrackingUrl(params: TrackingUrlParams): string {
        const baseUrl = `${this.config.baseUrl}/offer`;
        const url = new URL(`${baseUrl}/${params.offerId}`);

        url.searchParams.set('aff_id', this.config.publisherId);
        url.searchParams.set('aff_sub', params.sessionId);    // Session ID
        url.searchParams.set('aff_sub2', params.userId);      // User ID
        url.searchParams.set('aff_sub3', params.subId1 || '');
        url.searchParams.set('aff_sub4', params.subId2 || '');
        url.searchParams.set('aff_sub5', params.subId3 || '');

        return url.toString();
    }

    /**
     * Verify and parse postback
     * 
     * OGAds postback URL format:
     * ?aff_sub={aff_sub}&aff_sub2={aff_sub2}&payout={payout}&status={status}&offer_id={offer_id}
     */
    verifyPostback(queryParams: Record<string, string>): CPAPostback | null {
        try {
            const {
                aff_sub, aff_sub2, payout, status, offer_id,
                transaction_id, ip_address, user_agent, sig
            } = queryParams;

            // Verify signature if configured
            if (this.config.postbackSecret && sig) {
                const expectedSig = createHmac('sha256', this.config.postbackSecret)
                    .update(`${aff_sub}${payout}${offer_id}`)
                    .digest('hex');

                if (sig !== expectedSig) {
                    logger.warn({ aff_sub, sig }, 'Invalid OGAds postback signature');
                    return null;
                }
            }

            const payoutCents = Math.round(parseFloat(payout || '0') * 100);

            return {
                provider: 'OGADS',
                sessionId: aff_sub,
                offerId: offer_id,
                payoutCents,
                status: this.mapStatus(status),
                clickId: transaction_id,
                ipAddress: ip_address,
                userAgent: user_agent,
                rawData: queryParams,
            };
        } catch (error) {
            logger.error({ error, queryParams }, 'Failed to parse OGAds postback');
            return null;
        }
    }

    private parseCountries(countries: any): string[] {
        if (!countries) return [];
        if (Array.isArray(countries)) return countries.map(c => String(c).toUpperCase());
        if (typeof countries === 'string') {
            return countries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
        }
        return [];
    }

    private parseDevices(platforms: any): string[] {
        if (!platforms) return ['mobile', 'desktop'];

        const deviceMap: Record<string, string> = {
            'android': 'mobile',
            'ios': 'mobile',
            'mobile': 'mobile',
            'desktop': 'desktop',
            'tablet': 'tablet',
        };

        const platformList = Array.isArray(platforms)
            ? platforms
            : String(platforms).toLowerCase().split(',');

        return platformList
            .map((p: string) => deviceMap[p.trim().toLowerCase()] || p.trim().toLowerCase())
            .filter(Boolean);
    }

    private mapStatus(status: string): 'approved' | 'pending' | 'rejected' {
        const statusLower = (status || '').toLowerCase();
        if (statusLower === 'approved' || statusLower === 'converted' || statusLower === '1') {
            return 'approved';
        }
        if (statusLower === 'rejected' || statusLower === 'reversed' || statusLower === 'chargeback') {
            return 'rejected';
        }
        return 'pending';
    }
}
