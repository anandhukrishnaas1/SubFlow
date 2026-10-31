# SubFlow Reliability Audit — Baseline

Captured 2026-10-31 before making any changes for the broader reliability audit.

## Repository state

- Current branch: `doom`, tracking `origin/doom`.
- No branch switch, commit, push, merge, or changes to `main`.
- `git diff --check` passes at baseline.
- Worktree was already dirty before this audit. It contained 20 modified/deleted tracked files and 6 untracked API files. Those changes are treated as existing work and must not be discarded or attributed wholesale to this audit.
- Existing dirty paths at capture:
  - Modified: `.env.example`, `ARCHITECTURE.md`, `README.md`, `apps/api/package.json`, `apps/api/src/common/guards/firebase-auth.guard.ts`, `apps/api/src/firebase/firebase.service.ts`, `apps/api/src/firebase/mock-firestore.ts`, `apps/api/src/modules/analytics/analytics.controller.ts`, `apps/api/src/modules/analytics/analytics.module.ts`, `apps/api/src/modules/analytics/analytics.service.ts`, `apps/api/src/seed/index.ts`, `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/reports/page.tsx`, `apps/web/src/components/dashboard/ai-assistant-drawer.tsx`, `apps/web/src/components/dashboard/churn-upsell-cards.tsx`, `apps/web/src/components/dashboard/financial-report-card.tsx`, `apps/web/src/components/dashboard/nrr-cohort-analysis.tsx`, `apps/web/src/components/layout/header.tsx`, `apps/web/src/lib/api.ts`.
  - Deleted: `apps/api/src/modules/analytics/analytics.listener.ts`.
  - Untracked: `apps/api/src/common/guards/firebase-auth.guard.spec.ts`, `apps/api/src/modules/analytics/analytics-copilot.service.ts`, `apps/api/src/modules/analytics/analytics.calculations.spec.ts`, `apps/api/src/modules/analytics/analytics.calculations.ts`, `apps/api/src/modules/analytics/analytics.service.spec.ts`, `apps/api/src/modules/analytics/analytics.types.ts`.
- Baseline tracked diff summary: 20 paths, 1,711 insertions, 1,359 deletions; untracked files are not included in that count.

## Architecture and execution surface

- Monorepo: npm workspaces with `apps/api`, `apps/web`, `packages/events`, `packages/firebase`, and `packages/shared`; Turbo coordinates builds and development.
- API: NestJS 10, Firebase Admin/Firestore, class-validator, Nest EventEmitter, scheduler, throttler, BullMQ/ioredis, Nodemailer, and PDFKit.
- Web: Next.js 15 App Router, React 19, TanStack Query, Firebase client SDK, and Recharts.
- API modules discovered: activity, analytics, auth, billing, customer, discount, invoice, notification, payment, plan, product, quotation, subscription, and tax. Shared API infrastructure includes Firebase, guards/decorators, an HTTP exception filter, and a logging interceptor.
- Frontend routes discovered: home, customers, dashboard, discounts, invoices, payments, plans, portal, products, quotations, reports, subscriptions, and taxes.
- Firestore collections and their access rules are defined in `firestore.rules`; `docker-compose.yml` configures Redis only.
- Current `README.md` and `ARCHITECTURE.md` describe the system as event-driven. Runtime event durability and end-to-end operation are not established by those documents.

## Scripts and test coverage at baseline

- Root scripts include `dev`, `build`, `lint`, `dev:web`, `dev:api`, `dev:all`, and `seed`.
- API scripts include `build`, `dev`, `start`, `start:prod`, `lint`, `test`, and `seed`.
- Web scripts include `dev`, `build`, `start`, and `lint`.
- The API test script runs three Node test files: the auth guard test and analytics calculation/service tests. The last observed run before this audit had 17 passing tests.
- No web test script or frontend component/E2E test files were found in the initial inventory. This is not a complete statement about all possible manual or external tests.
- The last observed full workspace build and web lint passed before this audit.
- API lint is known to fail under ESLint 9 because the repository has no API flat config; the tracked flat ESLint config is under `apps/web`. No lint config was introduced for this baseline.

## Initial observability and reliability observations

These are source-level observations, not claims that workflows are verified:

- The API globally registers `LoggingInterceptor` and `AllExceptionsFilter`.
- The interceptor logs method, URL, and elapsed time on successful completion only; no request/correlation ID or structured operation fields are present in that log.
- The exception filter logs unhandled exceptions, including stack traces, and returns a response body containing the exception message/response under `error`. Safe error-code and request-ID behavior has not been established.
- Nest's in-memory `EventEmitterModule` is configured. Event producers/listeners exist. Durable publication, retry behavior, idempotent consumption, event correlation, and handling of listener write failures are not established.
- Firestore rules contain role and owner checks, but API access patterns and all ownership paths require a separate security review.
- The frontend API client and route pages exist. A centralized browser error-monitoring or React error-boundary system was not identified in this initial inventory.
- Firebase credentials/project configuration, Gemini provider configuration, and Redis availability are environment-dependent. No secrets were printed or inspected for this baseline.

## Preliminary feature inventory

“Implemented but unverified” means a source surface exists; it does not mean the feature works end to end. More detailed workflow verification remains necessary.

| Feature | Preliminary state | Evidence / limitation |
|---|---|---|
| Authentication and roles | Implemented but unverified | Auth controllers, Firebase auth guard, and role guard exist; full login/logout and ownership journeys are not covered by the discovered tests. |
| Customer management | Implemented but unverified | API module and frontend route exist; no discovered E2E coverage. |
| Product, plan, tax, and discount management | Implemented but unverified | API modules and frontend routes exist; no discovered E2E coverage. |
| Subscription lifecycle | Implemented but unverified | API transitions/events and frontend route exist; lifecycle edge cases and cross-layer workflows are not comprehensively tested. |
| Invoices and PDF | Implemented but unverified | Invoice API and PDF service exist; financial invariants and failure/consistency behavior need verification. |
| Payments and reconciliation | Implemented but unverified | Payment API/service exists; provider integration, duplicate handling, refunds, and reconciliation guarantees need verification. |
| Analytics and reports | Implemented; targeted unit tests exist | Analytics API and UI exist; historical snapshot metrics are intentionally unavailable; broader integration coverage remains incomplete. |
| AI Copilot | Implemented but unverified | Grounded API service and UI exist; provider failure/timeout and all requested intents need end-to-end verification. |
| Notifications and activity | Implemented but unverified | Services, controllers, and event listeners exist; durable audit guarantees and listener failure behavior are not established. |
| Settings/profile and onboarding | Unknown / not identified in initial route inventory | No dedicated route appeared among the discovered App Router pages; auth service surfaces need further inspection before classifying. |
| Background processing | Partially implemented / unverified | Scheduler, BullMQ dependencies, Redis compose, billing module, and event infrastructure exist; actual durable worker paths and operational failure handling remain to be verified. |
| Structured logs and request tracing | Partially implemented | A basic API logging interceptor/filter exists; correlation IDs, structured production logs, and frontend monitoring were not established. |
| Automated end-to-end suite | Not identified | No E2E runner or frontend test script appeared in the initial scripts/test inventory. |

This report is the pre-audit checkpoint, not a final system-health assessment. Features must not be marked PASS until their workflows are exercised by deterministic tests or runtime verification.

## Post-audit status

Captured 2026-10-31 after the reliability and security audit work in this session. The baseline above is intentionally retained as the pre-change record.

### Changes made during the audit

- Locked public registration to the customer role, validated registration and payment DTOs, rejected unsupported Firebase role claims, and added customer ownership checks to protected resource operations.
- Tightened Firestore profile and nested-document rules; enabled the configured API throttler globally with a stricter registration limit; restricted CORS to configured frontend origins.
- Added request/correlation IDs, response headers, structured API logs, and sanitized 5xx responses. Corrected logged HTTP status codes for thrown HTTP exceptions.
- Made browser demo fallback development-only.
- Reworked payment recording so payment creation and invoice reconciliation use one Firestore transaction, with transaction-reference idempotency, amount/balance validation, and disallowed draft/cancelled invoice states.
- Fixed cached-query refetch errors so dashboard and Reports show failed-request states and retry controls instead of reporting successful emptiness. Mounted Copilot on Reports as well as Dashboard.
- Added API regression coverage for authorization, request context, payment reconciliation/idempotency and invoice eligibility. Existing analytics regression coverage remains in the API suite.

### Verification results

| Area | Result | Evidence / boundary |
|---|---|---|
| API tests | PASS — 32 tests | `npm run test --workspace @subflow/api`; includes analytics, auth, request-context, and payment cases. |
| Workspace build | PASS | `npm run build`; all five workspace packages succeeded. Next.js emitted the existing missing-plugin warning for its ESLint configuration. |
| Web lint | PASS | `npm run lint --workspace @subflow/web`. |
| API lint | BLOCKED | `npm run lint --workspace @subflow/api` fails because ESLint 9 cannot find an API `eslint.config.*`; this is a repository configuration gap. No unrelated ESLint config was introduced. |
| Diff whitespace | PASS | `git diff --check`. |
| Browser dashboard / Reports | VERIFIED with local mock setup | Loading, populated demo lists, analytics unavailable/empty states, and API-outage error/retry states were opened in the browser. The mock dataset is synthetic and analytics excludes it unless `INCLUDE_SYNTHETIC_ANALYTICS=true`. |
| Browser Copilot | VERIFIED with local mock setup | The nine requested metric questions were submitted through the UI; answers matched the analytics API's zero-valued/explicitly unavailable results. Unknown-question fallback was also exercised. No Gemini provider was configured, so deterministic analytics responses were verified, not provider-backed responses. |
| Payment persistence | UNIT-TESTED, NOT emulator-verified | Tests use the in-memory Firestore mock. Production Firestore transaction behavior, concurrent requests, and deployed rules were not exercised against a Firebase emulator/project. |
| Firestore rules | SOURCE-UPDATED, NOT emulator-validated | Rules emulator/tooling was not available in the configured test workflow. |

### Remaining limitations and follow-up

- Historical snapshots for revenue churn, NRR, cohorts, and forecasting are absent; the API explicitly reports these metrics as unavailable rather than fabricating values.
- No production Firebase project or Firestore emulator was used. Rules syntax and server-side transaction behavior still need emulator/integration verification before deployment.
- The runtime smoke tests used the explicitly enabled development Firestore mock. Its synthetic records are excluded from analytics by default, while the development demo UI can still display sample operational records; do not treat these values as production evidence.
- The event emitter remains in-memory. Durable delivery, retries, listener-failure recovery, and event idempotency are not established. Refund workflows and provider-side payment authorization were outside this change.
- No full E2E suite or Redis-backed background-worker verification was available. Browser checks do not replace authenticated production-user journey tests.
- API ESLint remains blocked by the missing flat config. Establish ownership and intended API lint rules separately rather than copying the web config without review.

### Final repository state

- Branch remains `doom`; no commit, push, merge, or branch switch was performed.
- The worktree remains dirty and includes changes that predated this broader audit. Do not attribute the full worktree diff to this audit or discard those existing changes.
- No claim is made that production Firebase, durable events, AI provider availability, or all application routes were verified end to end.
