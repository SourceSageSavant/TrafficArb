import { createHmac } from 'crypto';
import { BaseCPAProvider } from '../base.js';
import type { CPAOffer, CPAPostback, CPAProviderConfig, TrackingUrlParams } from '../types.js';
import { logger } from '../../lib/logger.js';

/**
 * CPAGrip Provider Integration
 * 
 * API Documentation: https://www.cpagrip.com/api
 */
export class CPAGripProvider extends BaseCPAProvider {
    name = 'CPAGRIP';

    constructor(config: CPAProviderConfig, marginPercent?: number) {
        super(config, marginPercent);
    }

    /**
     * Fetch offers from CPAGrip API
     */
    async fetchOffers(): Promise<CPAOffer[]> {
        if (!this.isConfigured()) {
            logger.warn('CPAGrip is not configured');
            return [];
        }

        try {
            const url = new URL(`${this.config.baseUrl}/common/offer_feed_json.php`);
            url.searchParams.set('pubkey', this.config.apiKey);
            url.searchParams.set('tracking_id', this.config.publisherId);

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`CPAGrip API error: ${response.status}`);
            }

            const data = await response.json() as { offers?: unknown[] };

            if (!data.offers || !Array.isArray(data.offers)) {
                logger.warn('CPAGrip returned no offers');
                return [];
            }

            return data.offers.map((offer: any) => this.mapOffer(offer));
        } catch (error) {
            logger.error({ error }, 'Failed to fetch CPAGrip offers');
            return [];
        }
    }

    /**
     * Map CPAGrip offer to our format
     */
    private mapOffer(raw: any): CPAOffer {
        const payoutCents = Math.round(parseFloat(raw.payout || '0') * 100);
        const category = this.mapCategory(raw.category || 'other');
        const difficulty = this.estimateDifficulty(payoutCents);

        return {
            externalId: String(raw.campid || raw.offerid),
            provider: 'CPAGRIP',
            name: raw.title || raw.campaign_name || 'Unknown Offer',
            description: raw.description || '',
            instructions: raw.requirements || '',
            imageUrl: raw.creatives?.[0]?.url || raw.icon || '',
            payoutCents,
            userPayoutCents: this.calculateUserPayout(payoutCents),
            category,
            difficulty,
            estimatedMinutes: this.estimateMinutes(category, difficulty),
            countries: this.parseCountries(raw.countries || raw.country),
            devices: this.parseDevices(raw.devices || raw.platform),
            trackingUrl: raw.url || raw.offer_url || '',
            conversionRate: parseFloat(raw.conversion_rate || '0'),
            epc: parseFloat(raw.epc || '0'),
            isActive: raw.status !== 'inactive',
        };
    }

    /**
     * Generate tracking URL with subids
     */
    generateTrackingUrl(params: TrackingUrlParams): string {
        const baseUrl = `${this.config.baseUrl}/show.php`;
        const url = new URL(baseUrl);

        url.searchParams.set('l', params.offerId);
        url.searchParams.set('u', this.config.publisherId);
        url.searchParams.set('s1', params.sessionId);  // Session ID - used in postback
        url.searchParams.set('s2', params.userId);     // User ID
        url.searchParams.set('s3', params.subId1 || '');
        url.searchParams.set('s4', params.subId2 || '');
        url.searchParams.set('s5', params.subId3 || '');

        return url.toString();
    }

    /**
     * Verify and parse postback
     * 
     * CPAGrip postback URL format:
     * ?s1={s1}&s2={s2}&payout={payout}&status={status}&oid={offer_id}&sig={signature}
     */
    verifyPostback(queryParams: Record<string, string>): CPAPostback | null {
        try {
            const { s1, s2, payout, status, oid, sig, click_id, ip, ua } = queryParams;

            // Verify signature if secret is configured
            if (this.config.postbackSecret && sig) {
                const expectedSig = createHmac('sha256', this.config.postbackSecret)
                    .update(`${s1}${payout}${oid}`)
                    .digest('hex');

                if (sig !== expectedSig) {
                    logger.warn({ s1, sig }, 'Invalid CPAGrip postback signature');
                    return null;
                }
            }

            const payoutCents = Math.round(parseFloat(payout || '0') * 100);

            return {
                provider: 'CPAGRIP',
                sessionId: s1,
                offerId: oid,
                payoutCents,
                status: this.mapStatus(status),
                clickId: click_id,
                ipAddress: ip,
                userAgent: ua,
                rawData: queryParams,
            };
        } catch (error) {
            logger.error({ error, queryParams }, 'Failed to parse CPAGrip postback');
            return null;
        }
    }

    private parseCountries(countries: string | string[]): string[] {
        if (!countries) return [];
        if (Array.isArray(countries)) return countries.map(c => c.toUpperCase());
        return countries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    }

    private parseDevices(devices: string | string[]): string[] {
        if (!devices) return ['mobile', 'desktop'];
        if (Array.isArray(devices)) return devices;

        const deviceMap: Record<string, string> = {
            'mobile': 'mobile',
            'android': 'mobile',
            'ios': 'mobile',
            'iphone': 'mobile',
            'ipad': 'tablet',
            'tablet': 'tablet',
            'desktop': 'desktop',
            'windows': 'desktop',
            'mac': 'desktop',
        };

        return devices.toLowerCase().split(',')
            .map(d => deviceMap[d.trim()] || d.trim())
            .filter(Boolean);
    }

    private mapStatus(status: string): 'approved' | 'pending' | 'rejected' {
        const statusLower = (status || '').toLowerCase();
        if (statusLower === '1' || statusLower === 'approved' || statusLower === 'converted') {
            return 'approved';
        }
        if (statusLower === '2' || statusLower === 'rejected' || statusLower === 'reversed') {
            return 'rejected';
        }
        return 'pending';
    }
}
