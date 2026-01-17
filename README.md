# Traffic Arb - Telegram Task Wall Platform

A complete, production-ready Telegram Mini App for task-based crypto earnings.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Blockchain**: TON Connect

## Project Structure

```
TrafficArb/
├── apps/
│   ├── mini-app/     # Telegram Mini App (Next.js)
│   ├── api/          # Backend API (Express)
│   └── admin/        # Admin Dashboard
├── packages/
│   ├── database/     # Prisma schema
│   ├── shared/       # Shared types/utils
│   └── config/       # ESLint, TSConfig
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Development Setup

```bash
# Install dependencies
pnpm install

# Start database services
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start all apps in dev mode
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` in each app and fill in the values.

## Apps

### Mini App (apps/mini-app)

Telegram Mini App frontend - loads inside Telegram WebView.

### API (apps/api)

Backend REST API handling auth, offers, tasks, payouts.

### Admin (apps/admin)

Admin dashboard for managing users, offers, and payouts.

## License

Private - All Rights Reserved
