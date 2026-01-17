import { createHmac } from 'crypto';
import { BaseCPAProvider } from '../base.js';
import type { CPAOffer, CPAPostback, CPAProviderConfig, TrackingUrlParams } from '../types.js';
import { logger } from '../../lib/logger.js';

/**
 * AdGate Media Provider Integration
 * 
 * API Documentation: https://adgatemedia.com/api
 */
export class AdGateProvider extends BaseCPAProvider {
    name = 'ADGATE';

    constructor(config: CPAProviderConfig, marginPercent?: number) {
        super(config, marginPercent);
    }

    /**
     * Fetch offers from AdGate API
     */
    async fetchOffers(): Promise<CPAOffer[]> {
        if (!this.isConfigured()) {
            logger.warn('AdGate is not configured');
            return [];
        }

        try {
            const url = new URL(`${this.config.baseUrl}/v1/offers`);
            url.searchParams.set('api_key', this.config.apiKey);
            url.searchParams.set('wall_code', this.config.publisherId);

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`AdGate API error: ${response.status}`);
            }

            const data = await response.json() as { data?: unknown[] };

            if (!data.data || !Array.isArray(data.data)) {
                logger.warn('AdGate returned no offers');
                return [];
            }

            return data.data.map((offer: any) => this.mapOffer(offer));
        } catch (error) {
            logger.error({ error }, 'Failed to fetch AdGate offers');
            return [];
        }
    }

    /**
     * Map AdGate offer to our format
     */
    private mapOffer(raw: any): CPAOffer {
        const payoutCents = Math.round(parseFloat(raw.points_value || raw.payout || '0') * 100);
        const category = this.mapCategory(raw.category || raw.type || 'other');
        const difficulty = this.estimateDifficulty(payoutCents);

        return {
            externalId: String(raw.id || raw.offer_id),
            provider: 'ADGATE',
            name: raw.anchor || raw.name || 'Unknown Offer',
            description: raw.description || raw.requirements || '',
            instructions: raw.instructions || '',
            imageUrl: raw.icon || raw.image || '',
            payoutCents,
            userPayoutCents: this.calculateUserPayout(payoutCents),
            category,
            difficulty,
            estimatedMinutes: raw.estimated_time
                ? parseInt(raw.estimated_time)
                : this.estimateMinutes(category, difficulty),
            countries: this.parseCountries(raw.countries || raw.geo_targeting),
            devices: this.parseDevices(raw.devices || raw.platform),
            os: raw.os ? raw.os.split(',').map((o: string) => o.trim()) : undefined,
            trackingUrl: raw.click_url || raw.tracking_link || '',
            conversionRate: parseFloat(raw.conversion_rate || raw.cr || '0'),
            epc: parseFloat(raw.epc || '0'),
            isActive: raw.status !== 'paused' && raw.status !== 'inactive',
        };
    }

    /**
     * Generate tracking URL with subids
     */
    generateTrackingUrl(params: TrackingUrlParams): string {
        const baseUrl = `${this.config.baseUrl}/vc/click`;
        const url = new URL(baseUrl);

        url.searchParams.set('wall_code', this.config.publisherId);
        url.searchParams.set('offer_id', params.offerId);
        url.searchParams.set('s1', params.sessionId);     // Session ID
        url.searchParams.set('s2', params.userId);        // User ID
        url.searchParams.set('s3', params.subId1 || '');
        url.searchParams.set('s4', params.subId2 || '');
        url.searchParams.set('s5', params.subId3 || '');

        return url.toString();
    }

    /**
     * Verify and parse postback
     * 
     * AdGate postback URL format:
     * ?s1={s1}&s2={s2}&points={points}&status={status}&offer_id={offer_id}&transaction_id={tx}
     */
    verifyPostback(queryParams: Record<string, string>): CPAPostback | null {
        try {
            const {
                s1, s2, points, payout, status, offer_id,
                transaction_id, user_ip, user_agent, signature
            } = queryParams;

            // AdGate uses points or payout
            const payoutValue = payout || points;

            // Verify signature if configured
            if (this.config.postbackSecret && signature) {
                const expectedSig = createHmac('sha256', this.config.postbackSecret)
                    .update(`${s1}${payoutValue}${offer_id}`)
                    .digest('hex');

                if (signature !== expectedSig) {
                    logger.warn({ s1, signature }, 'Invalid AdGate postback signature');
                    return null;
                }
            }

            const payoutCents = Math.round(parseFloat(payoutValue || '0') * 100);

            return {
                provider: 'ADGATE',
                sessionId: s1,
                offerId: offer_id,
                payoutCents,
                status: this.mapStatus(status),
                clickId: transaction_id,
                ipAddress: user_ip,
                userAgent: user_agent,
                rawData: queryParams,
            };
        } catch (error) {
            logger.error({ error, queryParams }, 'Failed to parse AdGate postback');
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

    private parseDevices(devices: any): string[] {
        if (!devices) return ['mobile', 'desktop'];

        const deviceMap: Record<string, string> = {
            'android': 'mobile',
            'ios': 'mobile',
            'mobile': 'mobile',
            'phone': 'mobile',
            'desktop': 'desktop',
            'windows': 'desktop',
            'mac': 'desktop',
            'tablet': 'tablet',
            'ipad': 'tablet',
        };

        const deviceList = Array.isArray(devices)
            ? devices
            : String(devices).toLowerCase().split(',');

        return deviceList
            .map((d: string) => deviceMap[d.trim().toLowerCase()] || d.trim().toLowerCase())
            .filter(Boolean);
    }

    private mapStatus(status: string): 'approved' | 'pending' | 'rejected' {
        const statusLower = (status || '').toLowerCase();
        if (statusLower === 'approved' || statusLower === 'credited' || statusLower === '1') {
            return 'approved';
        }
        if (statusLower === 'rejected' || statusLower === 'reversed' || statusLower === 'chargedback') {
            return 'rejected';
        }
        return 'pending';
    }
}
