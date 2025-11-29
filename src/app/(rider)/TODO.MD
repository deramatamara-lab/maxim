Stabilize TypeScript: drive tsc --noEmit to zero errors (KYC flows, DocumentUploadStep, KYCIntroStep, receiptGenerator, remaining refs to CustomIcon props, etc.)

Enforce "no any" and strict typing across repo, including older components and utilities not yet touched (admin, legacy screens, helpers)

Finish KYC & onboarding type/contracts alignment: KYCDocumentConfig.required, _isLastStep props, KYCIntroStep icon types, button style types, OnboardingModal props

Harden payments & receipts: verify all paymentService and receiptGenerator flows, remove remaining mock-only branches or clearly separate prod vs mock, align ReceiptRequest with apiClient.post Record<string, unknown> contract

Consolidate logging & observability: replace ad-hoc console.warn/error with a structured logger, define log schema, and ensure no PII or sensitive data is logged

Network resilience & offline queue: fully exercise networkResilience, ensure timeouts and retry logic are correct across mobile & web, add tests for offline/online transitions

Stabilize WebSocket and real-time updates: audit websocketService usage, ensure reconnection, backoff, and message type safety, add integration tests for driver/rider live updates

Audit authentication & authorization: ensure tokens, refresh, and role-based access (rider/driver/admin) are enforced at both UI and API service layers

Finalize ride lifecycle contracts: booking → driver assignment → active ride → completion → rating → tipping → receipts, with explicit types and invariants per step

UX polish for rider home & active ride: ensure transitions between globe, map, booking, and active ride are smooth, non-blocking, and resilient to errors

Driver experience hardening: online/offline toggle, request handling, countdowns, and navigation hooks, including failure paths (decline, timeout, cancellation)

KYC and compliance UX: review all onboarding steps (KYCIntroStep, DocumentUploadStep, OnboardingModal), ensure clear copy, progress feedback, and proper disabling of actions until requirements met

Accessibility & internationalization: verify text scaling, screen reader labels, color contrast, and i18n readiness for core flows

Performance profiling: measure startup time, map/globe FPS, memory usage on mid-range Android; add performance budgets and simple profiling hooks

Security review: ensure no secrets in repo, secure storage for tokens, HTTPS-only APIs, certificate pinning strategy (or rationale), and safe handling of payment/PII data

Testing strategy: bring unit, integration, and E2E tests in line with critical paths (ride booking, payment success/failure, cancellation, KYC happy/edge cases)

DevOps & CI/CD: ensure CI runs lint, tests, and type-checks; add basic build pipelines for staging and production with environment separation

Monitoring & incident response: plan for crash reporting, error aggregation, and basic alerting for backend/API failures visible from the client

Configuration & feature flags: centralize env-specific configs (API base URLs, map/stripe keys, feature flags) with safe defaults and no hardcoded secrets

High‑Level Plan
To get this repo to Uber‑grade production you need to:

Reach tsc --noEmit = 0 errors without hacks
Lock down contracts & type safety for all core flows (ride lifecycle, payments, KYC, auth)
Harden reliability & observability (network, WebSockets, logging)
Polish UX for rider/driver/onboarding
Secure the app & data
Add strong tests & CI/CD
Profile & tune performance
Below is a concrete TODO list, ordered by dependency / impact.

1. Get TypeScript Completely Green
These are the current hard blockers (npm run lint:types).

[TS‑01] Fix remaining KYC / onboarding type errors
OnboardingModal / step props
Add _isLastStep: boolean when rendering KYCIntroStep and any other step that requires it.
Consider replacing _isLastStep with a clearer isLastStep prop and updating the step interfaces + call sites consistently.
KYCDocumentConfig.required alignment
In src/api/kycConfiguration.ts:
Add required: boolean to every document entry that implements KYCDocumentConfig.
Ensure the values match the actual product rules (e.g. ID + Selfie required, passport/address optional or role‑dependent).
In DocumentUploadStep.tsx:
Confirm the required field on docsToUpload matches the KYCDocumentConfig definition. Remove any extra fields not in the type.
CustomIcon type in KYCIntroStep.tsx
req.icon is currently string. Constrain it to 
CustomIcon
’s union:
Either type req.icon as CustomIconName union
Or map from string → allowed icon enum before rendering.
[TS‑02] Fix style typing issues with PremiumButton
DocumentUploadStep.tsx: style={[...]} and KYCIntroStep.tsx: style={...}:
PremiumButton’s style prop is ViewStyle, but you’re passing StyleProp<ViewStyle> (ViewStyle | ViewStyle[] | null).
Options:
Change PremiumButtonProps.style to StyleProp<ViewStyle> (recommended).
Or ensure you always pass a single ViewStyle (not array) and never null.
Clean up casts like as StyleProp<ViewStyle> which hide real problems.
[TS‑03] Clean up ReceiptRequest vs Record<string, unknown>
In src/services/receiptGenerator.ts:
Align apiClient.post signature and ReceiptRequest:
Either apiClient.post<T, B extends object> with a generic body type instead of Record<string, unknown>,
Or cast as request as unknown as Record<string, unknown> and hide this behind a small helper toApiPayload(request: ReceiptRequest): Record<string, unknown>.
Do not leave direct as Record<string, unknown> if TS complains; always cast via unknown.
[TS‑04] Fix 
Globe.web.tsx
 ref typing (remove new any)
controlsRef = useRef<any>(null) was added to bypass TS:
Define a proper type: const controlsRef = useRef<OrbitControls | null>(null);
If OrbitControls comes from three/fiber/drei, import and use it explicitly.
Narrow before calling setLookAt:
ts
if (controlsRef.current) {
  controlsRef.current.setLookAt(...);
}
Ensure the ref prop type on the OrbitControls component matches RefObject<OrbitControls | null>.
2. Tighten Type System & Contracts
Once tsc is green, finish type safety and remove workarounds.

[TS‑05] Enforce “no any” globally
Add / keep ESLint rule @typescript-eslint/no-explicit-any: "error" and run it across repo.
Replace remaining any with:
Domain interfaces (Payment, Ride, KYC, User, Driver),
unknown + type guards,
Or strict unions for icons, statuses, roles.
[TS‑06] Normalize core DTOs and contracts
User: { id, role, kycStatus, hasCompletedOnboarding, ... }
Make a User model shared between store, auth, KYC, admin panel.
Ride lifecycle:
RideRequest, RideAssignment, ActiveRide, CompletedRide, ReceiptData interfaces.
Explicitly document which fields are optional in each stage.
Payment:
PaymentMethodInfo
, 
PaymentTransaction
, ReceiptRequest, ReceiptData – align across:
paymentService.ts
, api/payment.ts, receiptGenerator.ts, UI components.
KYC:
KYCDocumentConfig, UserKYCStatus, KYCStepResult.
[TS‑07] Replace casting chains with helpers
Places using as unknown as Record<string, unknown>:
Wrap in helpers like toApiPayload<T extends object>(value: T): Record<string, unknown>.
Centralize these conversions to avoid ad‑hoc unsafe casts.
3. Core Flow Hardening (Like Uber, End‑to‑End)
3.1 Rider Flow
[RF‑01] Define and test rider journey
Search → destination → ride option select → price confirmation → payment selection → request → driver assignment → active ride → completion → rating/tip → receipt.
For each step:
Define input/output types,
Define error states (network fail, no drivers, payment declined, etc.),
Ensure the UI handles each error explicitly (not generic “Something went wrong”).
[RF‑02] Re‑enable NetworkStatusIndicator and OnboardingProvider
Fix types so you can:
Import NetworkStatusIndicator and OnboardingProvider without TS errors,
Re‑enable them in 
RiderHome
.
Ensure:
Network status banner behaves correctly when offline / degraded,
Onboarding gating logic (KYC, profile completion) works and doesn’t deadlock.
3.2 Driver Flow
[DF‑01] Driver lifecycle
Online toggle → request incoming → accept/decline → navigation → pickup → dropoff → completion.
Ensure:
Driver sees consistent states (no “ghost” cancelled rides),
Decline/timeout paths are robust and surface to rider properly.
[DF‑02] Synchronize rider/driver state
Audit WebSocket or polling state transitions:
Consistent event types (e.g. RIDE_ASSIGNED, RIDE_CANCELLED, RIDE_COMPLETED),
Idempotent handlers (safe to re‑receive events),
Explicit versioning of server messages if needed.
4. KYC & Compliance
[KYC‑01] Consolidate KYC configuration
src/api/kycConfiguration.ts + DocumentUploadStep.tsx + KYCIntroStep.tsx:
Single source of truth for documents, required flags, roles, copy, icon mapping.
Ensure requiredForRoles logic is honored in UI enable/disable states.
[KYC‑02] Step engine contracts
OnboardingModal and step components:
Every step must declare:
id, title, canGoBack, _isLastStep (or equivalent),
onComplete(stepData), onBack().
OnboardingModal must enforce invariants:
No skipping required steps,
Safe resume if app restarts mid‑flow (persist progress in store).
[KYC‑03] UX safeguards
Disable “Continue” until:
All required documents uploaded,
Terms/privacy toggles checked.
Add clear error messages when KYC is blocked._
5. Payments & Financial Integrity
[PAY‑01] Separate mock vs production payment flows
Clearly split:
paymentService (real Stripe / PSP integration),
MockPaymentService
 for dev/demo.
Use a clean factory or injection based on NODE_ENV / config.
[PAY‑02] Validate all payment states
Map out:
created, requires_action, succeeded, failed, canceled states,
Retry rules and user messaging for each.
Ensure:
No double‑charge risk (idempotent backend),
Client doesn’t assume success before backend confirms.
[PAY‑03] Receipts & tax
receiptGenerator.ts:
Verify calculations: base fare, distance, time, surge, tolls, taxes, fees, tip.
Ensure compliance‑ready breakdown for future tax / invoicing requirements.
6. Network, Offline, and Real‑Time
[NET‑01] NetworkResilience correctness
Confirm:
All timers use NodeJS.Timeout (or platform‑agnostic type),
Offline queue persists and replays safely,
Backoff and retry policies don’t hammer the backend.
[NET‑02] WebSocketService robustness
Add:
Automatic reconnect with exponential backoff,
Heartbeats / ping‑pong where applicable,
Detection of mismatched protocol versions.
[NET‑03] Offline UX
Rider:
Clear messaging when offline,
Disable actions that require network,
Graceful degradation for map / globe.
7. Observability & Logging
[OBS‑01] Introduce a structured logger
Replace ad‑hoc console.warn/error with a small logging utility:
Levels: debug/info/warn/error,
Structured payloads: { event, component, rideId, userId, severity, timestamp }.
Ensure no PII (names, full addresses, card digits) logged.
[OBS‑02] Crash & error tracking
Integrate Sentry or similar:
Capture fatal errors, JS exceptions,
Tag by user role, app version, route.
8. Security & Privacy
[SEC‑01] Secrets & config
Ensure:
No API keys or secrets in repo,
Use .env with secure loading,
Different keys for dev/staging/prod.
[SEC‑02] Token handling
Store auth tokens securely (SecureStore / Keychain),
Refresh flow:
Safe handling of expiration,
Graceful logout if refresh fails.
[SEC‑03] PII & GDPR
Identify PII:
Names, emails, phone numbers, locations, payment references.
Ensure:
Encrypted in transit (HTTPS only),
Minimal retention on device,
Clear path to data deletion.
9. UX, Design System, and Accessibility
[UX‑01] DS alignment
Replace any remaining magic numbers / hardcoded colors with ds tokens.
Ensure ds.shadow.glow.offsetY etc. are used consistently.
[UX‑02] Motion & haptics
Standardize on useInteractionState and haptics/sound hooks for all primary CTAs.
Ensure all presses are:
Animating,
Multisensory (haptic + sound),
Non‑blocking.
[UX‑03] Accessibility
Add:
accessibilityLabel and roles for key controls,
Color contrast checks,
Larger text support.
10. Testing & CI/CD
[TEST‑01] Unit tests for critical modules
useEnhancedAppStore, paymentService, receiptGenerator, networkResilience, WebSocketService.
[TEST‑02] Integration tests
Flows:
Rider booking + payment success,
Rider booking + payment fail,
KYC completion,
Cancellation mid‑ride.
[TEST‑03] E2E / user journeys
Expand __tests__/e2e/userJourneys.test.tsx to cover:
New KYC/Onboarding gating,
Realistic location updates,
Driver/rider synchronization.
[CI‑01] CI pipeline
Run on every PR:
npm test / pnpm test,
npm run lint,
npm run lint:types,
Optional: build web bundle.
11. Performance & Device Readiness
[PERF‑01] Globe & map profiling
Measure FPS on web + mid‑tier Android:
Idle,
During zoom/rotate,
During transition to map.
Tune:
Object counts,
Animation durations,
Update frequencies.
[PERF‑02] Startup time
Audit bundle size; lazy‑load heavy screens (admin, onboarding, analytics).
Preload critical assets (fonts, icons, core sounds).