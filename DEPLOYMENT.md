# Deploying Traffic Arb to Production

This guide covers deploying the full Traffic Arb system to production.

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (e.g., Supabase, Neon, Railway)
- Redis instance (e.g., Upstash, Redis Cloud)
- Domain for Mini App (SSL required)
- Telegram Bot (created via @BotFather)
- CPA network accounts (CPAGrip, OGAds, AdGate)

## Step 1: Database Setup

```bash
# Set your production DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@host:5432/trafficarb?sslmode=require"

# Run migrations
cd packages/database
pnpm prisma migrate deploy
```

## Step 2: Environment Variables

### API Server (.env)

```bash
# Server
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://yourdomain.com,https://t.me

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=YourBotName

# Mini App URL
MINI_APP_URL=https://t.me/YourBotName/app

# TON
TON_NETWORK=mainnet
TON_WALLET_MNEMONIC=your 24 word mnemonic
TON_API_KEY=your_ton_api_key

# CPA Networks
CPAGRIP_API_KEY=
CPAGRIP_PUBLISHER_ID=
CPAGRIP_POSTBACK_SECRET=
OGADS_API_KEY=
OGADS_PUBLISHER_ID=
OGADS_POSTBACK_SECRET=
ADGATE_API_KEY=
ADGATE_PUBLISHER_ID=
ADGATE_POSTBACK_SECRET=

# CPA Configuration
CPA_MARGIN_PERCENT=55
TON_USD_RATE=2
OFFER_SYNC_INTERVAL_MS=1800000

# Security
JWT_SECRET=generate_with_openssl_rand_hex_32
ENCRYPTION_KEY=generate_with_openssl_rand_hex_32

# Features
ENABLE_WITHDRAWALS=true
MIN_WITHDRAWAL_NANO=3000000000
```

### Mini App (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_TON_MANIFEST_URL=https://yourdomain.com/tonconnect-manifest.json
```

## Step 3: Build

```bash
# From root directory
pnpm install
pnpm run build
```

## Step 4: Deploy API Server

### Option A: Railway/Render

1. Connect your repository
2. Set environment variables
3. Deploy with build command: `pnpm install && pnpm run build`
4. Start command: `cd apps/api && node dist/index.js`

### Option B: VPS

```bash
# Install PM2
npm install -g pm2

# Start API
cd apps/api
pm2 start dist/index.js --name traffic-arb-api

# Save PM2 config
pm2 save
pm2 startup
```

## Step 5: Deploy Mini App

### Deploy to Vercel

```bash
# From apps/mini-app
vercel --prod
```

Set environment variables in Vercel dashboard.

## Step 6: Configure Telegram Bot

1. Open @BotFather on Telegram
2. `/setmenubutton` - Set Web App button URL
3. `/newapp` - Create Mini App
   - Name: Traffic Arb
   - Web App URL: https://your-vercel-url.vercel.app

## Step 7: CPA Network Postback Setup

Configure postback URLs in each CPA network:

**CPAGrip:**
```
https://api.yourdomain.com/api/postback/cpagrip?s1={s1}&s2={s2}&payout={payout}&status=1&oid={offer_id}
```

**OGAds:**
```
https://api.yourdomain.com/api/postback/ogads?aff_sub={aff_sub}&payout={payout}&status=approved&offer_id={offer_id}
```

**AdGate:**
```
https://api.yourdomain.com/api/postback/adgate?s1={s1}&points={points}&status=approved&offer_id={offer_id}
```

## Step 8: TON Connect Manifest

Create `tonconnect-manifest.json` at your domain root:

```json
{
  "url": "https://yourdomain.com",
  "name": "Traffic Arb",
  "iconUrl": "https://yourdomain.com/icon.png",
  "termsOfUseUrl": "https://yourdomain.com/terms",
  "privacyPolicyUrl": "https://yourdomain.com/privacy"
}
```

## Step 9: Admin Dashboard

Deploy admin dashboard separately with its own auth:

```bash
cd apps/admin
vercel --prod
```

## Monitoring & Maintenance

### Health Check

```bash
curl https://api.yourdomain.com/health
```

### Logs

```bash
# PM2 logs
pm2 logs traffic-arb-api

# Railway/Render
# Check dashboard logs
```

### Database Backups

Set up automated backups with your PostgreSQL provider.

## Security Checklist

- [ ] SSL certificates configured
- [ ] Environment variables secured
- [ ] JWT secret is unique and strong
- [ ] CPA postback secrets configured
- [ ] Rate limiting enabled
- [ ] Admin dashboard password protected
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
