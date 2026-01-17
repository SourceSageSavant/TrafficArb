import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { PrismaClient } from './lib/database.js';
import { createRedisClient } from './lib/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { offersRouter } from './routes/offers.js';
import { tasksRouter } from './routes/tasks.js';
import { walletRouter } from './routes/wallet.js';
import { referralsRouter } from './routes/referrals.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { postbackRouter } from './routes/postback.js';
import { adminRouter } from './routes/admin.js';
import { achievementsRouter } from './routes/achievements.js';
import { generalLimiter, strictLimiter, authLimiter, withdrawalLimiter } from './middleware/rateLimit.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { initializeTelegramBot } from './services/telegram.js';
import { startOfferSyncJob, stopOfferSyncJob } from './jobs/offerSync.js';

// Initialize clients
export const prisma = new PrismaClient();
export const redis = createRedisClient();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
}));
app.use(express.json());
app.use(pinoHttp({ logger }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Health check (no rate limit)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/offers', offersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/postback', postbackRouter);
app.use('/api/admin', authLimiter, adminRouter);
app.use('/api/achievements', achievementsRouter);

// Error handler
app.use(errorHandler);

// Start server
const PORT = env.PORT || 4000;

async function start() {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('Connected to PostgreSQL');

        // Test Redis connection
        await redis.ping();
        logger.info('Connected to Redis');

        // Initialize Telegram Bot
        initializeTelegramBot();

        // Start offer sync job
        startOfferSyncJob();

        app.listen(PORT, () => {
            logger.info(`API Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(error, 'Failed to start server');
        process.exit(1);
    }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    stopOfferSyncJob();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
});

