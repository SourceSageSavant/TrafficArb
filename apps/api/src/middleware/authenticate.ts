import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../lib/auth.js';
import { errors } from './errorHandler.js';
import { prisma } from '../index.js';
import type { User } from '@traffic-arb/database';

// Extend Express Request to include authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: User;
            userId?: string;
        }
    }
}

// Export type for use in other middleware
export type AuthenticatedRequest = Request & { user: User; userId: string };

/**
 * Middleware to authenticate requests using JWT token
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw errors.unauthorized('Missing authorization token');
        }

        const token = authHeader.slice(7);
        const payload = await verifyAuthToken(token);

        if (!payload) {
            throw errors.unauthorized('Invalid or expired token');
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        });

        if (!user) {
            throw errors.unauthorized('User not found');
        }

        if (user.status !== 'ACTIVE') {
            throw errors.forbidden('Account is suspended or banned');
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;

        // Update last active timestamp (async, don't wait)
        prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() },
        }).catch(() => { }); // Ignore errors

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.slice(7);
        const payload = await verifyAuthToken(token);

        if (payload) {
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
            });

            if (user && user.status === 'ACTIVE') {
                req.user = user;
                req.userId = user.id;
            }
        }

        next();
    } catch (error) {
        // Don't fail on auth errors for optional auth
        next();
    }
}
