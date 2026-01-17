import { getCPAManager } from '../cpa/manager.js';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';

/**
 * Offer Sync Job
 * 
 * Periodically fetches offers from all CPA networks and syncs to database.
 * Runs every 30 minutes by default.
 */

let syncInterval: NodeJS.Timeout | null = null;

/**
 * Start the offer sync job
 */
export function startOfferSyncJob() {
    const intervalMs = parseInt(env.OFFER_SYNC_INTERVAL_MS || '1800000', 10); // 30 mins default

    logger.info({ intervalMs }, 'Starting offer sync job');

    // Run immediately on startup
    runSync();

    // Schedule periodic sync
    syncInterval = setInterval(runSync, intervalMs);
}

/**
 * Stop the offer sync job
 */
export function stopOfferSyncJob() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        logger.info('Offer sync job stopped');
    }
}

/**
 * Run a single sync
 */
async function runSync() {
    const startTime = Date.now();
    logger.info('Running offer sync...');

    try {
        const cpaManager = getCPAManager();
        const stats = await cpaManager.syncOffers();

        const duration = Date.now() - startTime;
        logger.info({
            ...stats,
            durationMs: duration,
        }, 'Offer sync completed');

        return stats;
    } catch (error) {
        logger.error({ error }, 'Offer sync failed');
        throw error;
    }
}

/**
 * Manual sync trigger (for admin use)
 */
export async function triggerOfferSync() {
    return runSync();
}
