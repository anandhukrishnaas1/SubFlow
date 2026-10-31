# SubFlow — Event-Driven Subscription Management & Recurring Billing Platform

SubFlow is an event-driven subscription management and recurring billing platform using **Firebase Firestore**, **Next.js 15**, and **NestJS 10**. Performance targets are not claimed without measured results.


---

## Key Highlights & Architecture

- **Event-Driven Architecture**: Powered by `@nestjs/event-emitter` (EventEmitter2) and BullMQ. Status transitions (confirm, activate, pause, renew, cancel, invoice, pay) emit domain events asynchronously without blocking request threads.
- **Source-Derived Analytics**: The Analytics API calculates financial metrics from current business records; the legacy `counters/analytics` document is not treated as authoritative.
- **Evidence-Grounded Copilot**: Questions use backend-calculated metrics and return supporting evidence and data limitations. Gemini explanations are optional and receive only aggregate numeric evidence.
- **Automated Billing Engine**: Idempotent billing execution calculates tax rules, coupon discounts, line item quantities, and advances subscription billing dates without duplicating invoices.
- **Role-Based Tenant Isolation**: Enforced at the database layer via `firestore.rules` for Admin, Staff, and Customer users.
- **Customer Self-Service Portal**: A dedicated `/portal` view for subscribers to track active plans, review billing history, and download PDF receipts.

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientTier fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff;
    classDef apiTier fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#ffffff;
    classDef eventTier fill:#701a75,stroke:#d946ef,stroke-width:2px,color:#ffffff;
    classDef dataTier fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef asyncTier fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#ffffff;

    subgraph CLIENT["1. Presentation Tier (Next.js 15)"]
        ADMIN_UI["Admin & Staff Dashboard<br/>(Live KPIs, Catalog, Invoices, Subscriptions)"]:::clientTier
        PORTAL_UI["Customer Self-Service Portal<br/>(My Subscriptions, Invoices, Receipts)"]:::clientTier
        QUERY_CACHE["TanStack Query API data"]:::clientTier
    end

    subgraph GATEWAY["2. Modular Backend Engine (NestJS 10)"]
        AUTH_GUARD["RBAC & Firebase Auth Guards<br/>(Custom Claims: Admin, Staff, Customer)"]:::apiTier
        CORE_SERVICES["Business Services<br/>(Subscription, Billing, Invoice, Payment, Tax)"]:::apiTier
        ANALYTICS["AnalyticsModule<br/>(Calculates from source records)"]:::apiTier
    end

    subgraph EVENTS["3. Asynchronous Domain Event Hub"]
        BUS["EventEmitter2 Domain Event Bus<br/>(Non-blocking Write Pipeline < 150ms)"]:::eventTier
    end

    subgraph DATA["4. Business Data"]
        FIRESTORE["Cloud Firestore Database<br/>(Denormalized NoSQL + Security Rules)"]:::dataTier
    end

    subgraph WORKERS["5. Async Jobs & Cache"]
        QUEUE["BullMQ & Redis 7<br/>(Billing Cadence, PDF Gen, Emails)"]:::asyncTier
    end

    ADMIN_UI <-->|REST API| AUTH_GUARD
    PORTAL_UI <-->|REST API| AUTH_GUARD
    AUTH_GUARD --> CORE_SERVICES
    AUTH_GUARD --> ANALYTICS
    CORE_SERVICES -->|Emits Events| BUS
    CORE_SERVICES <-->|Direct CRUD| FIRESTORE
    ANALYTICS -->|Read source records| FIRESTORE
    BUS -->|Pushes Async Tasks| QUEUE
    ANALYTICS -->|REST responses| QUERY_CACHE
    QUERY_CACHE --> ADMIN_UI
```

> **Full System Architecture Guide & Sequence Diagrams**: See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Analytics and Copilot

The dashboard and reports use `/api/analytics` endpoints; analytics requests are restricted to authenticated administrators and staff.

- **MRR**: active subscription recurring value normalized to a month, calculated from pre-tax subtotal after discounts. Tax-inclusive totals are not used when a subtotal is present.
- **ARR**: displayed MRR × 12, rounded to the currency precision so the reported values remain consistent.
- **Invoiced**: non-draft, non-cancelled invoice totals grouped by invoice issue date (UTC).
- **Collected**: recorded payment amounts excluding records explicitly marked failed, cancelled, void, or refunded; trends use payment date (UTC).
- **Receivables**: positive outstanding balances on non-draft, non-cancelled invoices.
- **Net collection rate**: invoice-recorded paid amounts divided by eligible invoice totals. It is unavailable when there are no eligible invoices.
- **ARPU**: current MRR divided by current customer count; unavailable with no customers.
- Customer churn is calculated over the trailing 30 days only when eligible subscriptions have sufficient lifecycle dates. Revenue churn, NRR, cohort retention, and forecasts remain unavailable without historical value/cohort snapshots. Risks include record-level evidence.
- The Copilot's unqualified collection question covers all available recorded payments; “this month”, “last month”, and ISO date ranges use UTC calendar dates. Payments sharing a transaction reference are counted once.

Endpoints include `GET /api/analytics/financial-summary`, `GET /api/analytics/billing-trends`, `GET /api/analytics/subscription-metrics`, `GET /api/analytics/renewals`, `GET /api/analytics/risks`, `GET /api/analytics/insights`, and `POST /api/analytics/ask`. Billing trends accept optional `from` and `to` dates spanning at most 24 months.

For local development, set `SUBFLOW_MOCK_FIRESTORE=true`, `SUBFLOW_ENABLE_MOCK_AUTH=true`, and `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true` explicitly in a development-only `.env`. Never enable mock authentication in production. Seeded mock records are tagged `SYNTHETIC` and excluded by default; to view these records in development only, explicitly set `INCLUDE_SYNTHETIC_ANALYTICS=true`. `NEXT_PUBLIC_DEMO_MODE=true` is a read-only frontend fallback for non-analytics lists; analytics and mutations always require the API. Configure both `GEMINI_API_KEY` and `GEMINI_MODEL` to enable optional grounded explanations; without them, deterministic answers still work.

---

## Environment Variables (.env)

A configuration template is provided in [.env.example](./.env.example):

```env
# Firebase Client SDK (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDemoSubFlowKeyForLocalDevelopment
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=subflow-demo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=subflow-demo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=subflow-demo.appspot.com

# Firebase Admin SDK (Backend)
FIREBASE_PROJECT_ID=subflow-demo
FIREBASE_STORAGE_BUCKET=subflow-demo.appspot.com

# API Configuration
PORT=4000
API_URL=http://127.0.0.1:4000/api
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/api

# Redis (Job Queue Backend)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Build All Workspace Packages
```bash
npm run build
```

### 4. Run Development Servers
To run both the Next.js frontend (port 3000) and NestJS API (port 4000) simultaneously:
```bash
npm run dev
```

Or run individually:
```bash
# Frontend only (port 3000)
npm run dev:web

# Backend API only (port 4000)
npm run dev:api
```

---

## Seed Demo Data

SubFlow includes a seed script with pre-configured products, plans, taxes, discounts, customers, subscriptions, and invoices. Seeded `counters/analytics` values are legacy fixtures and are ignored by current analytics calculations.

```bash
# Seed Firestore
npm run seed
```

---

## Project Structure

```
SubFlow/
├── apps/
│   ├── web/                     # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/             # App Router pages (/dashboard, /subscriptions, /invoices, /portal...)
│   │   │   ├── components/      # Sidebar, Header, Providers, Charts
│   │   │   ├── hooks/           # useAuth, useRealtime
│   │   │   └── lib/             # API client & Firebase Client init
│   └── api/                     # NestJS 10 Modular Backend
│       ├── src/
│       │   ├── common/          # FirebaseAuthGuard, RolesGuard, LoggingInterceptor
│       │   ├── firebase/        # Admin SDK FirebaseService & Module
│       │   ├── modules/         # Auth, Customer, Product, Plan, Quote, Sub, Billing, Invoice, Pay...
│       │   └── seed/            # Firestore seed data runner
│
├── packages/
│   ├── shared/                  # Enums, types, and Zod validation schemas
│   ├── events/                  # Domain event map and payload types
│   └── firebase/                # Client & Admin Firebase configurations
│
├── firestore.rules              # Database-level tenant and role security rules
├── firestore.indexes.json       # Composite query index definitions
├── docker-compose.yml           # Redis container for queue backend
└── turbo.json                   # Monorepo build pipeline config
```

---

## Firestore Security Rules

Access control is enforced at the database level in [firestore.rules](file:///Users/anandhukrishnaas/Desktop/SubFlow/firestore.rules):
- **Admin**: Full read and write access across all collections.
- **Staff**: Operational access to customers, subscriptions, quotes, and invoices.
- **Customer**: Strictly isolated read access to their own user profile, active subscriptions, invoices, and payments (`request.auth.uid == customerId`).
