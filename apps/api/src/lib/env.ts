import { z } from 'zod';

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('4000'),
    CORS_ORIGINS: z.string().transform(s => s.split(',')).default('http://localhost:3000'),

    // Database
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().url().default('redis://localhost:6379'),

    // Telegram
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_BOT_USERNAME: z.string().default('TrafficArbBot'),

    // TON
    TON_NETWORK: z.enum(['mainnet', 'testnet']).default('testnet'),
    TON_WALLET_MNEMONIC: z.string().optional(),
    TON_API_KEY: z.string().optional(),

    // CPA Networks
    CPAGRIP_API_KEY: z.string().optional(),
    CPAGRIP_PUBLISHER_ID: z.string().optional(),
    CPAGRIP_POSTBACK_SECRET: z.string().optional(),
    OGADS_API_KEY: z.string().optional(),
    OGADS_PUBLISHER_ID: z.string().optional(),
    OGADS_POSTBACK_SECRET: z.string().optional(),
    ADGATE_API_KEY: z.string().optional(),
    ADGATE_PUBLISHER_ID: z.string().optional(),
    ADGATE_POSTBACK_SECRET: z.string().optional(),

    // CPA Configuration
    CPA_MARGIN_PERCENT: z.string().default('55'), // Your profit percentage
    TON_USD_RATE: z.string().default('2'),        // TON to USD conversion rate
    OFFER_SYNC_INTERVAL_MS: z.string().default('1800000'), // 30 minutes

    // Security
    JWT_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().min(32).optional(),

    // Feature Flags
    ENABLE_WITHDRAWALS: z.string().transform(s => s === 'true').default('true'),
    MIN_WITHDRAWAL_NANO: z.string().transform(BigInt).default('0'),
});

function loadEnv() {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missing = error.errors.map(e => e.path.join('.')).join(', ');
            console.error(`Missing or invalid environment variables: ${missing}`);
            console.error(error.errors);
        }
        // In development, provide sensible defaults
        if (process.env.NODE_ENV !== 'production') {
            return {
                NODE_ENV: 'development' as const,
                PORT: 4000,
                CORS_ORIGINS: ['http://localhost:3000'],
                DATABASE_URL: 'postgresql://trafficarb:trafficarb_dev_password@localhost:5432/trafficarb',
                REDIS_URL: 'redis://localhost:6379',
                TELEGRAM_BOT_TOKEN: 'development_token',
                TELEGRAM_BOT_USERNAME: 'TrafficArbBot',
                TON_NETWORK: 'testnet' as const,
                JWT_SECRET: 'development_jwt_secret_32_chars__',
                ENABLE_WITHDRAWALS: true,
                MIN_WITHDRAWAL_NANO: 0n,
                // CPA Networks (optional in dev)
                CPAGRIP_API_KEY: undefined,
                CPAGRIP_PUBLISHER_ID: undefined,
                CPAGRIP_POSTBACK_SECRET: undefined,
                OGADS_API_KEY: undefined,
                OGADS_PUBLISHER_ID: undefined,
                OGADS_POSTBACK_SECRET: undefined,
                ADGATE_API_KEY: undefined,
                ADGATE_PUBLISHER_ID: undefined,
                ADGATE_POSTBACK_SECRET: undefined,
                // CPA Configuration
                CPA_MARGIN_PERCENT: '55',
                TON_USD_RATE: '2',
                OFFER_SYNC_INTERVAL_MS: '1800000',
            };
        }
        process.exit(1);
    }
}

export const env = loadEnv();
