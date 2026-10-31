# SubFlow Branch Comparison

Comparison captured 2026-10-31 before implementation changes.

## Revisions compared

| Branch | Commit | Subject |
|---|---|---|
| `origin/main` | `cf334af9df7e39ce018d3e9b9c0d60c9585b0b78` | `feat(dashboard): refine status design with blue checkmark for Paid and low-opacity grey dots for Pending` |
| `origin/doom` | `954d3981f22425a8b77bb8cdf37a3e35f6325bf1` | `Improve analytics, security, and application reliability` |

Fresh clone: `C:\Users\victo\Downloads\New folder\SubFlow-integration`. The remote URL is `https://github.com/anandhukrishnaas1/SubFlow.git`; both remote refs were fetched and verified. `origin/main` is the remote default branch and was the clone's initial `HEAD`. At comparison time, `main` had 14 commits not on `doom`; `doom` had one commit not on `main`, and both diverged at `7475707791230479697819260d78c6522355d8f2`.

The source comparison covered branch history, changed paths and diffs, API services/controllers, Firebase and Firestore rules, frontend pages/components/client, package scripts, test inventory, configuration, and documentation. These are source-level findings, not runtime verification.

## Feature-by-feature comparison

| Feature | Latest main | Doom | Integration decision |
|---|---|---|---|
| A1. Analytics source of truth | Partial: `getKpis()` reads cached counters and recalculates only when absent; event listener refreshes counters asynchronously. | Implemented: computes from Firestore source collections and avoids trusting counters. | **Improve** main service in place; retain existing endpoints and events where useful. |
| A2. MRR/ARR normalization, tax, discounts, precision | Partial: active subscription `total` is used (can include tax); weekly/daily use approximate multipliers; values are rounded independently. | Implemented with shared calculations, recurring-value fields, discounts, no tax, and display-consistent ARR. | **Port/adapt** calculations to main's subscription schema; validate fields against billing/subscription creation. |
| A3. Invoiced versus collected amounts | Partial: total payment amount is called revenue; KPI contract lacks invoiced total and collection metrics. | Implemented as independent source-derived totals. | **Port** distinct metrics while retaining any consumers of legacy `totalRevenue`. |
| A4. Outstanding and overdue invoices | Partial: existing calculation excludes paid/cancelled invoices but trusts stored outstanding values and has limited eligibility checks. | Implemented with invoice helpers and eligibility/status checks. | **Improve** main calculation and add tests. |
| A5. Customer-level churn | Missing. | Implemented with a trailing-period calculation that returns unavailable when lifecycle evidence is incomplete. | **Port/adapt** calculation and explicit availability; do not infer missing history. |
| A6. Collection periods, failed payments, duplicate records | Missing: trends aggregate payment rows in a six-month window without status filtering or deduplication. | Implemented: all-record default, calendar periods/date ranges, success filtering, and deduplication. | **Port** period semantics and regressions, adapting payment record fields. |
| A7. Subscription breakdown and renewal analytics | Partial: breakdown exists and upcoming renewals are included in KPI recalculation. | Implemented with explicit renewal endpoint and source-derived metrics. | **Improve** existing routes; preserve main's recurring billing lifecycle. |
| A8. Revenue churn, NRR, cohorts, forecasts | Missing. | Explicitly reported unavailable without historical snapshots. | **Port** honest availability responses; do not synthesize history. |
| A9. Analytics calculation modularity/tests | Missing: no analytics tests found in `main`. | Implemented with separated calculations and API regression tests. | **Port** tests and helpers, adapting interfaces. |
| B1. Backend-connected Copilot | Missing: no analytics question API/client method found. | Implemented via analytics endpoint/service. | **Port/adapt** API endpoint and service. |
| B2. Separate customer churn, revenue churn, NRR, cohort intents | Missing. | Implemented as distinct intents. | **Port** intent routing and regression tests. |
| B3. Evidence-grounded answers and limitations | Missing. | Implemented with evidence and limitation fields. | **Port** response contract and expose it in the current UI. |
| B4. Unknown questions, empty data, API/provider failures | Missing: no grounded backend path. | Implemented with safe fallback and explicit errors/limitations. | **Port/adapt** without masking API errors or adding fabricated fallback data. |
| B5. Copilot on Dashboard and Reports | Partial: Dashboard contains a Copilot control, but it is not backed by analytics; Reports has no Copilot integration. | Implemented on both pages. | **Port** API-backed interaction to both current pages. |
| C1. Firebase authentication | Implemented: bearer token verification and authenticated route guards; latest main also adds required web login and Email/Password, Google, and Apple SSO. | Implemented, but older branch omits the latest main web auth experience. | **Keep main** auth flow; do not port/revert Doom auth UI or replace provider support. |
| C2. Role authorization and claim validation | Partial: role guard exists, but arbitrary decoded claims are accepted and admin is a superuser. | Improved with supported-role validation and security tests. | **Improve** server-side claim validation within main auth behavior. |
| C3. Customer resource ownership | Partial: list filtering exists in some controllers, but item lookups and several operations lack a shared owner guard. | Implemented common ownership guard and controller checks. | **Port/adapt** ownership enforcement without restricting staff/admin workflows. |
| C4. Firestore rules | Partial: broad self-profile writes and authenticated reads of nested items. | Tightened profile fields and parent-owner checks for nested records. | **Port/adapt** least-privilege rules; verify against current document schema. |
| C5. Mock authentication | Partial/insecure: accepts mock headers in non-production and a demo token without explicit mock-firestore gating. | Restricted to explicitly enabled development mock mode and validates roles. | **Port** gating and role validation. |
| C6. Protected endpoint coverage | Partial: guards are present on many controllers, but role/ownership coverage is inconsistent. | Improved protections and endpoint regressions. | **Audit and selectively port** protections; preserve intentional public registration and login-related flows. |
| C7. Security regression tests | Missing. | Implemented for auth, roles, and request access. | **Port/adapt** tests. |
| D1. Transactional payment recording | Missing: payment row and invoice update are separate writes. | Implemented using Firestore transaction. | **Port/adapt** transaction to main's `InvoiceService` and event contracts. |
| D2. Payment/invoice reconciliation | Partial: sequential reconciliation exists, so partial failure can leave inconsistent state. | Atomic payment plus invoice balance/status update. | **Port** transaction and consistency checks. |
| D3. Duplicate transaction reference/idempotency | Missing for payments. | Implemented with matching-request idempotency and conflicting-reuse rejection. | **Port/adapt** while preserving billing invoice idempotency. |
| D4. Payment input and invoice eligibility validation | Partial: positive amount and balance checks exist; invoice state and request validation are limited. | Improved amount, balance, and invoice-state validation. | **Port/adapt** with DTO validation and current `InvoiceStatus` values. |
| D5. Payment reconciliation/rollback tests | Missing. | Implemented with mock-backed service tests. | **Port/adapt** tests; emulator concurrency remains a separate verification requirement. |
| E1. Structured request logs | Partial: basic method/URL/duration logger. | Implemented structured logs with request context. | **Port/adapt** while retaining Nest logging conventions. |
| E2. Request/correlation IDs | Missing. | Implemented with validation, response headers, and async-local context. | **Port** request context and tests. |
| E3. Safe centralized error responses | Partial: exception filter can expose internal 5xx messages and does not consistently log request context. | Improved sanitized 5xx responses and status handling. | **Port/adapt** filter and tests. |
| E4. Active API rate limiting | Partial: module configured, but no global `APP_GUARD` was found. | Global throttler and stricter registration limit. | **Port** global guard and registration throttle; preserve suitable endpoint limits. |
| E5. CORS configuration | Partial/insecure: `origin: true`. | Environment-configured allowlist. | **Port** allowlist configuration. |
| F1. Dashboard API integration | Partial: KPI query exists, but current main dashboard still displays hardcoded financial, growth, and churn values. | API-driven analytics dashboard. | **Adapt** data-backed values into main's newer design; retain its currency switcher, layout, and actions. |
| F2. Reports API integration | Partial: billing trends are queried, but report cards and fallback chart data contain hardcoded values. | API-backed report metrics and explicit request states. | **Port/adapt** data contracts and states into main Reports page. |
| F3. Copilot frontend connectivity | Missing: Dashboard control is not connected to a grounded analytics API. | Connected to analytics service. | **Port** drawer behavior into current UI. |
| F4. Financial report card | Missing as live data: current card has hardcoded amounts and margin. | Replaced with source-derived values/availability. | **Improve** current component; keep main's design. |
| F5. Churn/risk/upsell cards | Missing as live analytics: presentation uses unsupported values. | Replaced with evidence-based risks and explicit availability. | **Port/adapt** only supported server-derived values; do not claim a forecast without history. |
| F6. NRR/cohort presentation | Missing as live analytics: historical values are not source-backed. | Explicit unavailable state without snapshots. | **Port** availability UX; preserve the current layout. |
| F7. Loading/error/empty/retry states | Partial: React Query is used, but failed requests can appear as empty or fallback data. | Explicit loading, error, empty, retry handling. | **Port/adapt** consistent query states. |
| F8. Fabricated analytics removal | Missing: current dashboard, reports, and cards include hardcoded metrics. | Removed unsupported metrics from analytics surfaces. | **Port** removal of fabricated values, except for clearly marked demo records unrelated to analytics. |
| G1. MockFirestore | Partial: in-memory domain store exists, but transaction writes are not atomic and sample records are not marked synthetic. | Improved transaction mock and synthetic provenance markers. | **Port/adapt** transaction behavior and provenance; do not replace main's store wholesale. |
| G2. Seed/sample data | Partial: demo records exist but lack synthetic provenance. | Synthetic records excluded from analytics unless explicitly enabled in development. | **Port/adapt** provenance and exclusion; preserve sample records needed by current workflows. |
| G3. API/environment configuration | Partial: mock fallback defaults and permissive CORS/API URL conventions. | Explicit mock flags, API base URL, CORS allowlist, optional AI provider. | **Port only required config**; no credentials; retain main Firebase setup and provider choices. |
| G4. Shared packages and billing compatibility | Main has newer billing scheduler, invoice idempotency, quotation conversion, and auth/UI integration absent from `doom`. | The Doom diff removes or reverts several of these newer surfaces. | **Keep main**; explicitly do not port branch-wide deletions or older replacement implementations. |
| G5. Architecture/README docs | Partial/different: main includes current product, auth, billing, and visual design changes. | Adds analytics/security baseline and limitations report. | **Port/update selectively**; keep current main documentation and add integration findings. |
| G6. Test coverage | Missing in main for the reviewed analytics/security/payment areas. | Regression tests cover these areas. | **Port/adapt** relevant tests to current contracts. |
| G7. Latest-main-only product work | Implemented: new mandatory-login/AuthGuard experience, Email/Password + Google + Apple sign-in, scheduled auto-billing, quote conversion, currency switcher, updated warm theme/status visuals, and associated components/assets. | Missing or reverted. | **Keep main unchanged**; never copy Doom's whole frontend/API files over these additions. |

## Summary of comparison decisions

- **Already implemented and to keep:** Firebase bearer authentication and role guards at a baseline level, subscription breakdown/upcoming renewal counters, in-memory demo records, payment/invoice event integration, and the latest main-only auth, billing, UI, and currency features.
- **Partially implemented and to improve:** source-derived analytics, MRR/ARR and invoice accounting, dashboard/reports metrics, API auth hardening/ownership, Firestore access, errors/logging, rate limiting/CORS, and mock/test setup.
- **Missing and valuable to port:** historical-metric availability, analytics/Copilot API and tests, reliable payment transactions/idempotency, request context, API security regression tests, and truthful loading/error/empty UI states.
- **Intentionally not ported as replacements:** Doom's older full dashboard, report, auth, API-client, billing/subscription, and Firestore service files where they would remove or conflict with newer main functionality. The integration will adapt behavior within current main files and preserve newer main-only product features.
- **Integration branch:** `integration/doom-improvements`, created from `origin/main` at `cf334af9df7e39ce018d3e9b9c0d60c9585b0b78`.

## Integration results and verification

The selective implementation is on local branch `integration/doom-improvements`. Its `HEAD` and merge base remain the exact `origin/main` baseline `cf334af9df7e39ce018d3e9b9c0d60c9585b0b78`; `origin/doom` remains `954d3981f22425a8b77bb8cdf37a3e35f6325bf1`. No branch was merged, no commit was created, and nothing was pushed.

### Comparison counts

The 46 comparison rows classify the baseline as **3 implemented**, **25 partial**, and **18 missing**. The 18 missing areas were addressed with adapted functionality, regression coverage, or an explicit unavailable response where the required source history does not exist. Partial areas were improved where needed without replacing newer main behavior.

### Integrated behavior

- Analytics now derive billing, collections, subscription metrics, customer churn, renewal information, and risks from records rather than cached counters. Revenue churn, NRR, cohorts, and forecasts remain explicitly unavailable without historical snapshots.
- Copilot answers supported questions through the analytics API, includes evidence and limitations, and keeps unknown questions in a bounded fallback.
- Payments use transactional invoice reconciliation, duplicate-reference idempotency, and validation; development seed records carry synthetic provenance and are excluded from analytics unless explicitly opted in.
- Authentication/authorization, resource ownership, Firestore rules, mock-auth restrictions, request IDs, structured logging, CORS, throttling, and sanitized API errors were adapted to main's current implementation.
- Dashboard and Reports use source-backed values with loading, empty, error, and retry states. Unsupported preview metrics, fictional uptime/forecast figures, and demo credentials were removed or made explicit. Demo sign-in requires development mode plus the explicit mock-auth flag.
- Main's mandatory-login experience, Email/Password + Google + Apple sign-in, scheduled billing, quotation conversion, currency controls, and design changes were preserved.

### Intentionally not implemented as calculations

- Revenue churn, NRR, cohort retention, and forecasts are not synthesized; the UI and Copilot identify the missing historical snapshots.
- No external AI provider, payment gateway integration, or complete OpenTelemetry deployment was added; the Copilot is deterministic and source-grounded, payments are recorded/reconciled by the application, and request tracing/logging were adapted without importing the demo stack.
- The Firebase Emulator and live Firebase project were not available for verification; in-memory mock tests are not evidence of Firestore transaction concurrency or production identity behavior.

### Validation performed

| Check | Result |
|---|---|
| `npm test --workspace=@subflow/api` | Pass: 21 tests |
| `npm run build` | Pass: all five workspaces |
| `npm run lint --workspace=@subflow/web` | Pass |
| `git diff --check` | Pass |
| API ESLint | Blocked by missing ESLint 9 flat config; neither `origin/main` nor `origin/doom` contains an API/root ESLint config. No config was added. |
| Browser: Dashboard and Reports | Opened against the local development mock. Verified synthetic records are labeled/excluded, empty analytics are shown as empty/unavailable, and failed API requests show error and retry states rather than empty-result copy. |
| Browser: Copilot | Verified current MRR answer/evidence against the API, NRR unavailable response with evidence/limitations, and safe fallback for an unsupported question. |
| Firebase Emulator / production Firebase | Not run. |

The local API rejected an unauthenticated analytics request with HTTP 401. Browser checks used only the explicitly enabled development mock; they do not establish production Firebase or gateway behavior. A transient Next.js development-cache error occurred when a production build was run alongside the dev server; both servers were stopped, the app was restarted, browser scenarios were rerun, and the final build passed with servers stopped.

### Changed-file inventory

**Added (10):**

- `BRANCH_COMPARISON_REPORT.md`
- `apps/api/src/common/guards/firebase-auth.guard.spec.ts`
- `apps/api/src/common/request-context.spec.ts`
- `apps/api/src/common/request-context.ts`
- `apps/api/src/common/structured-log.ts`
- `apps/api/src/modules/analytics/analytics.calculations.spec.ts`
- `apps/api/src/modules/analytics/analytics.calculations.ts`
- `apps/api/src/modules/analytics/analytics.service.spec.ts`
- `apps/api/src/modules/analytics/analytics.types.ts`
- `apps/api/src/modules/payment/payment.service.spec.ts`

**Modified (35):**

- `.env.example`
- `apps/api/package.json`
- `apps/api/src/app.module.ts`
- `apps/api/src/common/filters/http-exception.filter.ts`
- `apps/api/src/common/guards/firebase-auth.guard.ts`
- `apps/api/src/common/interceptors/logging.interceptor.ts`
- `apps/api/src/firebase/firebase.service.ts`
- `apps/api/src/firebase/mock-firestore.ts`
- `apps/api/src/main.ts`
- `apps/api/src/modules/analytics/analytics.controller.ts`
- `apps/api/src/modules/analytics/analytics.service.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/invoice/invoice.controller.ts`
- `apps/api/src/modules/payment/payment.controller.ts`
- `apps/api/src/modules/payment/payment.module.ts`
- `apps/api/src/modules/payment/payment.service.ts`
- `apps/api/src/modules/quotation/quotation.controller.ts`
- `apps/api/src/modules/subscription/subscription.controller.ts`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/reports/page.tsx`
- `apps/web/src/components/dashboard/ai-assistant-drawer.tsx`
- `apps/web/src/components/dashboard/cash-flow-diagram.tsx`
- `apps/web/src/components/dashboard/churn-upsell-cards.tsx`
- `apps/web/src/components/dashboard/financial-report-card.tsx`
- `apps/web/src/components/dashboard/monthly-goal-card.tsx`
- `apps/web/src/components/dashboard/nrr-cohort-analysis.tsx`
- `apps/web/src/components/dashboard/recent-sales-card.tsx`
- `apps/web/src/components/dashboard/revenue-by-plan-card.tsx`
- `apps/web/src/components/dashboard/subscription-pipeline-diagram.tsx`
- `apps/web/src/components/dashboard/user-activity-card.tsx`
- `apps/web/src/hooks/use-auth.tsx`
- `apps/web/src/lib/api.ts`
- `firestore.rules`

**Deleted:** none.
