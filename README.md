# SubFlow — Event-Driven Subscription Management & Recurring Billing Platform

SubFlow is an enterprise-grade, event-driven subscription management and automated recurring billing SaaS platform designed for sub-second read performance (< 50ms) and real-time live data streaming using **Firebase Firestore**, **Next.js 15**, and **NestJS 10**.


---

## Key Highlights & Architecture

- **Event-Driven Architecture**: Powered by `@nestjs/event-emitter` (EventEmitter2) and BullMQ. Status transitions (confirm, activate, pause, renew, cancel, invoice, pay) emit domain events asynchronously without blocking request threads.
- **Ultra-Fast Performance (< 2s SLA)**: Pre-computed KPI documents in `counters/analytics` and denormalized document models deliver sub-50ms reads.
- **Zero-Polling Real-Time UI**: Client hooks subscribe via Firestore `onSnapshot` to automatically stream updates across KPI dashboards, notification badges, and invoice states.
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
        LIVE_SYNC["Firestore onSnapshot Live Sync<br/>(Instant UI Push < 50ms)"]:::clientTier
    end

    subgraph GATEWAY["2. Modular Backend Engine (NestJS 10)"]
        AUTH_GUARD["RBAC & Firebase Auth Guards<br/>(Custom Claims: Admin, Staff, Customer)"]:::apiTier
        CORE_SERVICES["Business Services<br/>(Subscription, Billing, Invoice, Payment, Tax)"]:::apiTier
    end

    subgraph EVENTS["3. Asynchronous Domain Event Hub"]
        BUS["EventEmitter2 Domain Event Bus<br/>(Non-blocking Write Pipeline < 150ms)"]:::eventTier
    end

    subgraph DATA["4. Database & Pre-Computed Analytics"]
        FIRESTORE["Cloud Firestore Database<br/>(Denormalized NoSQL + Security Rules)"]:::dataTier
        COUNTERS["counters/analytics<br/>(Pre-Computed Metrics for Instant Reads)"]:::dataTier
    end

    subgraph WORKERS["5. Async Jobs & Cache"]
        QUEUE["BullMQ & Redis 7<br/>(Billing Cadence, PDF Gen, Emails)"]:::asyncTier
    end

    ADMIN_UI <-->|REST API| AUTH_GUARD
    PORTAL_UI <-->|REST API| AUTH_GUARD
    AUTH_GUARD --> CORE_SERVICES
    CORE_SERVICES -->|Emits Events| BUS
    CORE_SERVICES <-->|Direct CRUD| FIRESTORE
    BUS -->|Pushes Async Tasks| QUEUE
    BUS -->|Updates Realtime KPIs| COUNTERS
    COUNTERS -.->|Live Data Push| LIVE_SYNC
    LIVE_SYNC -.->|Zero-Lag Render| ADMIN_UI
```

> **Full System Architecture Guide & Sequence Diagrams**: See [ARCHITECTURE.md](file:///Users/anandhukrishnaas/Desktop/SubFlow/ARCHITECTURE.md).

---

## Environment Variables (.env)

A ready-to-use configuration is provided in [.env](file:///Users/anandhukrishnaas/Desktop/SubFlow/.env) and [.env.example](file:///Users/anandhukrishnaas/Desktop/SubFlow/.env.example):

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

SubFlow includes a seed script with pre-configured products, plans, taxes, discounts, customers, subscriptions, invoices, and analytics counters:

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
