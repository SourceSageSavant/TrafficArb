import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger.js';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    handler: (req, res, next, options) => {
        logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
        res.status(429).json(options.message);
    },
});

/**
 * Strict rate limiter for sensitive endpoints
 * 10 requests per 15 minutes per IP
 */
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests for this action',
        },
    },
});

/**
 * Auth rate limiter
 * 5 login attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT',
            message: 'Too many login attempts, please try again later',
        },
    },
});

/**
 * Withdrawal rate limiter
 * 3 withdrawal requests per hour per user
 */
export const withdrawalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return (req as any).user?.id || req.ip || 'unknown';
    },
    message: {
        success: false,
        error: {
            code: 'WITHDRAWAL_RATE_LIMIT',
            message: 'Too many withdrawal requests, please try again in an hour',
        },
    },
});
