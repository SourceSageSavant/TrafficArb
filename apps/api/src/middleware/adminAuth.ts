import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { errors } from './errorHandler.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Extend Express Request to include admin user
declare global {
    namespace Express {
        interface Request {
            adminUser?: {
                id: string;
                email: string;
                name: string;
                role: string;
            };
        }
    }
}

const JWT_SECRET = env.JWT_SECRET || 'admin-secret-change-in-production';

/**
 * Generate JWT token for admin user
 */
export function generateAdminToken(adminUser: { id: string; email: string; name: string; role: string }): string {
    return jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role, type: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

/**
 * Verify admin password and return admin user
 */
export async function verifyAdminCredentials(email: string, password: string) {
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
        return null;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
        return null;
    }

    // Update last login
    await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
    });

    return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
    };
}

/**
 * Create a new admin user (for initial setup)
 */
export async function createAdminUser(email: string, password: string, name: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    return prisma.adminUser.create({
        data: {
            email,
            passwordHash,
            name,
            role: 'admin',
        },
    });
}

/**
 * Middleware to authenticate admin requests via JWT
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw errors.unauthorized('Missing admin authorization token');
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: string;
            email: string;
            role: string;
            type: string;
        };

        if (decoded.type !== 'admin') {
            throw errors.unauthorized('Invalid token type');
        }

        req.adminUser = {
            id: decoded.id,
            email: decoded.email,
            name: '', // Will be populated if needed
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(errors.unauthorized('Invalid admin token'));
        } else {
            next(error);
        }
    }
}

/**
 * Middleware to require specific admin role
 */
export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.adminUser) {
            return next(errors.unauthorized('Admin authentication required'));
        }
        if (!roles.includes(req.adminUser.role)) {
            return next(errors.forbidden('Insufficient permissions'));
        }
        next();
    };
}
