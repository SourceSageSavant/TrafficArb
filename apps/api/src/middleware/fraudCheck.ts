import type { Request, Response, NextFunction } from 'express';
import { analyzeUserFraud, getClientIp, type DeviceFingerprint } from '../lib/fraud.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../index.js';
import type { AuthenticatedRequest } from './authenticate.js';

/**
 * Fraud detection middleware
 * 
 * Checks for fraud signals on sensitive operations like:
 * - Starting tasks
 * - Claiming rewards
 * - Withdrawals
 */
export function fraudCheck(options: {
    blockOnHighRisk?: boolean;
    updateUserRiskScore?: boolean;
} = {}) {
    const { blockOnHighRisk = true, updateUserRiskScore = true } = options;

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next();
            }

            // Get fingerprint from request body or headers
            const fingerprint = extractFingerprint(req);
            const ipAddress = getClientIp(req);

            // Analyze for fraud
            const signals = await analyzeUserFraud(req.user.id, fingerprint, ipAddress);

            // Attach signals to request for downstream use
            (req as any).fraudSignals = signals;

            // Log the analysis
            logger.debug({
                userId: req.user.id,
                riskScore: signals.riskScore,
                riskLevel: signals.riskLevel,
                endpoint: req.path,
            }, 'Fraud check completed');

            // Update user's risk score
            if (updateUserRiskScore && signals.riskScore > 0) {
                await updateRiskScore(req.user.id, signals.riskScore);
            }

            // Block high-risk requests
            if (blockOnHighRisk && signals.riskLevel === 'CRITICAL') {
                logger.warn({
                    userId: req.user.id,
                    riskScore: signals.riskScore,
                    flags: signals.flags,
                }, 'Request blocked due to high fraud risk');

                return res.status(403).json({
                    error: 'Request blocked',
                    code: 'FRAUD_DETECTED',
                    message: 'Your request has been flagged for review. Please contact support.',
                });
            }

            // Flag high-risk but don't block
            if (signals.riskLevel === 'HIGH') {
                res.setHeader('X-Fraud-Risk', 'high');
            }

            next();
        } catch (error) {
            logger.error({ error }, 'Fraud check error');
            // Don't block on error, just log and continue
            next();
        }
    };
}

/**
 * Extract fingerprint from request
 */
function extractFingerprint(req: Request): DeviceFingerprint {
    // Try to get from body first (for POST requests)
    if (req.body?.fingerprint) {
        return req.body.fingerprint;
    }

    // Try to get from header (encoded)
    const fpHeader = req.headers['x-device-fingerprint'];
    if (fpHeader && typeof fpHeader === 'string') {
        try {
            return JSON.parse(Buffer.from(fpHeader, 'base64').toString());
        } catch {
            // Invalid fingerprint header
        }
    }

    // Return minimal fingerprint from available data
    return {
        userAgent: req.headers['user-agent'] || 'unknown',
        language: req.headers['accept-language']?.split(',')[0] || 'unknown',
        languages: [],
        platform: 'unknown',
        screenWidth: 0,
        screenHeight: 0,
        timezone: 'unknown',
        timezoneOffset: 0,
        hardwareConcurrency: 0,
        deviceMemory: null,
        maxTouchPoints: 0,
        canvasHash: '',
        webglVendor: null,
        webglRenderer: null,
        audioHash: '',
        fontsSample: [],
        telegramWebApp: false,
        telegramPlatform: null,
        fingerprintHash: '',
    };
}

/**
 * Update user's risk score in database
 */
async function updateRiskScore(userId: string, newScore: number): Promise<void> {
    try {
        // Get current score
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { riskScore: true },
        });

        if (!user) return;

        // Calculate weighted average (new score has 30% weight)
        const updatedScore = Math.round(user.riskScore * 0.7 + newScore * 0.3);

        await prisma.user.update({
            where: { id: userId },
            data: { riskScore: updatedScore },
        });
    } catch (error) {
        logger.error({ error, userId }, 'Failed to update risk score');
    }
}

/**
 * Rate limiting middleware based on user behavior
 */
export function adaptiveRateLimit() {
    const requestCounts = new Map<string, { count: number; resetAt: number }>();

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();

        // Get or create rate limit entry
        let entry = requestCounts.get(userId);
        if (!entry || entry.resetAt < now) {
            entry = { count: 0, resetAt: now + 60000 }; // 1 minute window
            requestCounts.set(userId, entry);
        }

        entry.count++;

        // Get user's risk score to determine limit
        const fraudSignals = (req as any).fraudSignals;
        const riskLevel = fraudSignals?.riskLevel || 'LOW';

        // Adaptive limits based on risk
        const limits: Record<string, number> = {
            LOW: 60,      // 60 requests per minute
            MEDIUM: 30,   // 30 requests per minute
            HIGH: 10,     // 10 requests per minute
            CRITICAL: 5,  // 5 requests per minute
        };

        const limit = limits[riskLevel];

        if (entry.count > limit) {
            logger.warn({
                userId,
                count: entry.count,
                limit,
                riskLevel,
            }, 'Adaptive rate limit exceeded');

            return res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMITED',
                retryAfter: Math.ceil((entry.resetAt - now) / 1000),
            });
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

        next();
    };
}

/**
 * Withdrawal fraud check (more strict)
 */
export async function withdrawalFraudCheck(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const fraudSignals = (req as any).fraudSignals;

        // Block any withdrawal for high-risk users
        if (fraudSignals?.riskLevel === 'HIGH' || fraudSignals?.riskLevel === 'CRITICAL') {
            logger.warn({
                userId: req.user.id,
                riskScore: fraudSignals.riskScore,
                flags: fraudSignals.flags,
            }, 'Withdrawal blocked due to fraud risk');

            return res.status(403).json({
                error: 'Withdrawal blocked',
                code: 'FRAUD_REVIEW_REQUIRED',
                message: 'Your account requires review before withdrawals. Please contact support.',
            });
        }

        // Check for specific fraud flags that block withdrawals
        const blockingFlags = [
            'SELF_REFERRAL_SUSPECT',
            'REFERRAL_FARMING_SUSPECT',
            'UNUSUALLY_FAST_COMPLETION',
        ];

        const hasBlockingFlag = fraudSignals?.flags?.some((f: string) => blockingFlags.includes(f));

        if (hasBlockingFlag) {
            return res.status(403).json({
                error: 'Withdrawal under review',
                code: 'MANUAL_REVIEW_REQUIRED',
                message: 'This withdrawal requires manual review. It will be processed within 24 hours.',
            });
        }

        next();
    } catch (error) {
        logger.error({ error }, 'Withdrawal fraud check error');
        return res.status(500).json({ error: 'Internal server error' });
    }
}
