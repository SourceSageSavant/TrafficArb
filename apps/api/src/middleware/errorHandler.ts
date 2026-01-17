import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: Record<string, unknown>;
}

export class HttpError extends Error implements ApiError {
    statusCode: number;
    code: string;
    details?: Record<string, unknown>;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

// Common error factories
export const errors = {
    unauthorized: (message = 'Unauthorized') =>
        new HttpError(message, 401, 'UNAUTHORIZED'),

    forbidden: (message = 'Forbidden') =>
        new HttpError(message, 403, 'FORBIDDEN'),

    notFound: (resource = 'Resource') =>
        new HttpError(`${resource} not found`, 404, 'NOT_FOUND'),

    badRequest: (message: string, details?: Record<string, unknown>) =>
        new HttpError(message, 400, 'BAD_REQUEST', details),

    conflict: (message: string) =>
        new HttpError(message, 409, 'CONFLICT'),

    tooManyRequests: (message = 'Too many requests') =>
        new HttpError(message, 429, 'TOO_MANY_REQUESTS'),

    internal: (message = 'Internal server error') =>
        new HttpError(message, 500, 'INTERNAL_ERROR'),
};

export function errorHandler(
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';

    // Log error
    if (statusCode >= 500) {
        logger.error({ err, req: { method: req.method, url: req.url } }, 'Server error');
    } else {
        logger.warn({ err, req: { method: req.method, url: req.url } }, 'Client error');
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message: err.message,
            ...(err.details && { details: err.details }),
        },
    });
}
