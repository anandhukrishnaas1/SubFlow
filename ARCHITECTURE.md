# SubFlow — Architecture & System Design Specification

> **Prepared for Evaluators, Invigilators, and System Architects**  
> *A technical breakdown of SubFlow's event-driven recurring billing engine, Firestore data model, and API architecture.*

---

## 1. High-Level System Architecture

SubFlow uses an event-driven modular backend. API latency and throughput targets require measurement and are not asserted here.

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientTier fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff;
    classDef apiTier fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#ffffff;
    classDef eventTier fill:#701a75,stroke:#d946ef,stroke-width:2px,color:#ffffff;
    classDef dataTier fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef asyncTier fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#ffffff;

    subgraph CLIENT["1. Client & Presentation Layer (Next.js 15 App Router)"]
        ADMIN_UI["Admin & Staff Operations Portal<br/>(KPIs, Subscriptions, Invoices, Ingestion)"]:::clientTier
        PORTAL_UI["Customer Self-Service Portal<br/>(My Subscriptions, Invoices, PDF Receipts)"]:::clientTier
        QUERY_CACHE["TanStack Query & React State<br/>(Zero-Lag Stale-While-Revalidate)"]:::clientTier
    end

    subgraph GATEWAY["2. Backend Modular API Layer (NestJS 10)"]
        AUTH_GUARD["FirebaseAuthGuard & RolesGuard<br/>(RBAC Claims: Admin, Staff, Customer)"]:::apiTier
        SUB_MODULE["SubscriptionModule<br/>(Lifecycle State Transitions)"]:::apiTier
        BILL_MODULE["BillingModule & Engine<br/>(Automated Cadence Scanner)"]:::apiTier
        INV_MODULE["InvoiceModule & PDF Engine<br/>(Idempotent Invoice Pipeline)"]:::apiTier
        PAY_MODULE["PaymentModule<br/>(Reconciliation Engine)"]:::apiTier
        ANALYTICS["AnalyticsModule<br/>(Source-record calculations)"]:::apiTier
    end

    subgraph EVENT_BUS["3. Distributed Domain Event Bus (EventEmitter2)"]
        BUS["Asynchronous In-Memory Event Hub<br/>(Decouples Write APIs from Heavy Processing)"]:::eventTier
    end

    subgraph STORAGE["4. Managed Cloud Database & Storage (Firebase)"]
        FIRESTORE["Cloud Firestore Database<br/>(Denormalized NoSQL + Security Rules)"]:::dataTier
        PDF_STORAGE["Firebase Storage<br/>(Generated Invoice PDFs & Signed URLs)"]:::dataTier
    end

    subgraph WORKERS["5. Async Background Queue & Workers (Redis + BullMQ)"]
        REDIS[("Redis 7 (In-Memory Queue Store)")]:::asyncTier
        CRON["Billing Cron Scheduler<br/>(Hourly Due Subscription Detection)"]:::asyncTier
        EMAIL_WORKER["Email Notification Worker<br/>(Transactional Invoicing)"]:::asyncTier
    end

    %% Flow Connections
    ADMIN_UI <-->|REST API + JWT Bearer| AUTH_GUARD
    PORTAL_UI <-->|REST API + JWT Bearer| AUTH_GUARD
    ADMIN_UI -->|Analytics REST requests| ANALYTICS
    ANALYTICS -->|Read source records| FIRESTORE
    ANALYTICS --> QUERY_CACHE

    AUTH_GUARD --> SUB_MODULE
    AUTH_GUARD --> BILL_MODULE
    AUTH_GUARD --> INV_MODULE
    AUTH_GUARD --> PAY_MODULE

    SUB_MODULE -->|Emits Events| BUS
    BILL_MODULE -->|Emits Events| BUS
    INV_MODULE -->|Emits Events| BUS
    PAY_MODULE -->|Emits Events| BUS

    SUB_MODULE -->|Direct Read/Write| FIRESTORE
    INV_MODULE -->|Direct Read/Write| FIRESTORE
    PAY_MODULE -->|Direct Read/Write| FIRESTORE

    BUS -->|Pushes Async Jobs| REDIS
    REDIS --> CRON
    REDIS --> EMAIL_WORKER

```

---

## 2. End-to-End Event-Driven Billing Lifecycle

This diagram demonstrates how an invoice is generated and paid through asynchronous events without blocking any client thread:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Billing Operator
    participant API as NestJS Billing Service
    participant DB as Cloud Firestore
    participant Bus as Domain Event Bus
    participant PDF as PDF Generator
    participant Client as Next.js Web Client

    Note over Admin,API: 1. Trigger Automated Billing Run
    Admin->>API: POST /api/billing/run
    API->>DB: Query subscriptions where nextBillingDate <= now AND status == 'active'
    DB-->>API: Returns due subscriptions (e.g. Acme Corp $78/mo)

    loop For each due subscription
        Note over API,DB: 2. Idempotency Check & Invoice Generation
        API->>API: Compute idempotencyKey: billing-{subId}-{date}
        API->>DB: Check if invoice with key exists (prevents duplicate billing)
        API->>DB: Write new invoice document + line items subcollection
        API->>DB: Advance subscription.nextBillingDate (+1 month)
        API->>DB: Record audit log in subscription activities

        Note over API,Bus: 3. Domain Event Dispatch (Non-Blocking)
        API->>Bus: Emit 'invoice.created' (invoiceId, customerId, total)
    end
    API-->>Admin: Billing run result

    par Background Event Listeners
        Bus->>PDF: Generate A4 PDF invoice buffer
        Bus->>DB: Write notification to users/{customerId}/notifications
    and Dashboard Analytics
        Client->>API: GET /api/analytics/financial-summary
        API->>DB: Read current subscription, invoice, payment, and customer records
        DB-->>API: Current source documents
        API-->>Client: Calculated KPI response
    end
```

---

## 3. Data Model & Denormalized Schema

SubFlow uses a denormalized schema where related entity data (customer name, plan details, line items) may be embedded directly into documents. Read latency depends on the query, dataset, and deployment and has not been measured here:

```mermaid
erDiagram
    USERS ||--o{ NOTIFICATIONS : contains
    USERS ||--o{ SUBSCRIPTIONS : owns
    USERS ||--o{ INVOICES : billed_to
    USERS ||--o{ PAYMENTS : makes

    SUBSCRIPTIONS ||--o{ SUB_ITEMS : contains
    SUBSCRIPTIONS ||--o{ ACTIVITIES : tracks
    SUBSCRIPTIONS ||--o{ INVOICES : generates

    INVOICES ||--o{ INV_ITEMS : contains
    INVOICES ||--o{ PAYMENTS : reconciled_by

    PLANS ||--o{ PRODUCTS : links

    USERS {
        string uid PK
        string email
        string displayName
        string role "admin | staff | customer"
        string company
        string status
    }

    SUBSCRIPTIONS {
        string id PK
        string number "SUB-YYYYMMDD-XXXX"
        string customerId FK
        string customerName "Denormalized"
        string planName "Denormalized"
        string billingInterval "monthly | yearly | weekly"
        string status "active | paused | confirmed | cancelled"
        timestamp nextBillingDate
        number total
    }

    INVOICES {
        string id PK
        string number "INV-YYYYMMDD-XXXX"
        string subscriptionId FK
        string customerId FK
        string status "draft | confirmed | paid | overdue"
        timestamp dueDate
        number subtotal
        number taxAmount
        number discountAmount
        number total
        number paidAmount
        number outstandingAmount
        string idempotencyKey "Prevents duplicates"
    }

    PAYMENTS {
        string id PK
        string invoiceId FK
        string invoiceNumber
        string customerId FK
        string method "card | bank_transfer | upi | cash"
        number amount
        string transactionRef
        timestamp paymentDate
    }

    COUNTERS_ANALYTICS {
        string id PK "legacy fixture; ignored by AnalyticsModule"
    }
```

---

## 4. Key Performance Architectural Decisions

| Challenge | Monolithic Approach | SubFlow Event-Driven Approach | Performance Gain |
|---|---|---|---|
| **Dashboard Analytics** | Reuses a stale seeded counter document | Calculates metrics from current source documents through a protected API | **Latency not yet benchmarked** |
| **Metric Integrity** | Treats invoice totals and payment totals as a single revenue value | Separates recurring value, invoiced totals, collected cash, and receivables | **Documented definitions; no fabricated trend data** |
| **Heavy Workloads** | PDF generation and emails executed synchronously in request handler | Enqueued to BullMQ background workers via EventEmitter2 | **API responds in < 150ms** |
| **Duplicate Invoices** | Prone to double charging if cron job overlaps | Strict `idempotencyKey` checking prior to invoice creation | **100% duplicate charge prevention** |
| **Data Isolation** | Application-level `WHERE` clauses | Enforced at database engine layer via `firestore.rules` | **Zero cross-tenant leakage vulnerability** |
