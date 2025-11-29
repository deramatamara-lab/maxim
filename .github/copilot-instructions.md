# Project Aura - AI Coding Agent Instructions

## Project Overview
Project Aura is an ultra-premium ride-sharing mobile application built with Expo/React Native, emphasizing cinematic user experience, performance, and "buttery smooth" interactions. Every component must have micro-interactions (haptics + animations) with zero lag tolerance.

## Critical Architecture Pattern: 6-Phase Development Pipeline
**NEVER jump phases. Each must be completed and verified before proceeding.**

1. **Premium Shell**: Design system scaffolding with `GlassView` component using expo-blur
2. **Cinematic Core**: 3D Globe integration with React Three Fiber (mobile-optimized)
3. **Seamless Transition**: Cross-fade logic between 3D globe and Mapbox dark-mode maps
4. **Rider Flow**: Input panels with glass morphism and Reanimated Layout Animations
5. **Driver Flow**: Custom toggle switches with heavy haptics and modal overlays
6. **Buttery Polish**: 60+ FPS optimization with useMemo and Reanimated worklets

## Strict Tech Stack (Non-Negotiable)
- **Framework**: Expo SDK 50+ (Managed Workflow only)
- **Language**: TypeScript strict mode
- **Navigation**: Expo Router v3 (file-based routing)
- **State**: Zustand + TanStack Query
- **3D**: @react-three/fiber + @react-three/drei (mobile optimized)
- **Maps**: @rnmapbox/maps with custom dark JSON styles
- **Animations**: React Native Reanimated 3 + Moti
- **Effects**: expo-blur for glass morphism, react-native-svg for custom icons
 - **Localization**: `expo-localization` + `i18next` (or equivalent) with JSON dictionaries
 - **Platforms**: iOS, Android, Web (Expo web) with unified design system

Backend/infra (high level, can be refined later):
- **API transport**: HTTPS JSON REST as default; GraphQL only if explicitly introduced.
- **Config**: Use Expo env (`EXPO_PUBLIC_*`) for public config and a typed config module for consumption.

## Design System & Tokens (`src/constants/theme.ts`)
`ds` is the single source of truth for design tokens. All visual decisions must reference tokens instead of hard-coded values.

Minimum shape (extend, but never override at call sites):
```ts
export const ds = {
  colors: {
    primary: '#00F5FF',      // Cyber Blue
    secondary: '#00FF73',    // Neon Green
    background: '#0A0A0A',   // True black
    surface: 'rgba(22,22,22,0.95)',
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    family: 'Poppins',
    weight: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
} as const;
```

Guidelines:
- Use `ds.colors.*`, `ds.radius.*`, `ds.spacing.*`, `ds.typography.*` everywhere (no inline hex/rgba except in DS itself).
- If a new token is required, extend `ds` first, then consume it.

## Core Components Pattern
- **GlassView**: Reusable blur component (Tint: 'dark', Intensity: 50-80) wrapped in Reanimated View
- **Custom Icons**: Use exact SVG paths from `reference.md`, never generic icon libraries
- **Globe Scene**: Low-poly sphere (64x64 segments max) with GLSL shader materials
- **Noise Overlay**: Global absolute positioned texture (opacity: 0.03) for premium feel

All reusable UI primitives live under `src/components/ui`; 3D primitives under `src/components/3d`; map primitives under `src/components/map`.

Examples:
- `src/components/ui/GlassView.tsx`: token-driven blur container used by inputs, cards, modals.
- `src/components/ui/Icon.tsx`: SVG icon wrapper using paths from `reference.md` and `ds.colors` for strokes.
- `src/components/3d/Globe.tsx`: memoized Three/Fiber globe consuming DS colors for atmosphere/glow.

## Critical Performance Requirements
- **60 FPS minimum** (120 FPS on ProMotion devices)
- All 3D geometries wrapped in `useMemo`
- Heavy computations in Reanimated worklets or C++
- Sound assets preloaded in `_layout.tsx`
- Interactive cards wrapped in `GestureDetector` for premium touch response

## Folder Structure (Enforced)
```
/src
  /components
    /ui      # GlassView, Button, Input, Icon
    /3d      # Globe, Stars, Atmosphere  
    /map     # MapContainer, BuildingLayer
  /constants
    theme.ts # The DS object (design system)
  /hooks
    useHaptics.ts, useSound.ts
  /api        # Typed API clients and query functions
  /i18n       # Localization setup and locale JSON files
  /admin      # Admin-only screens/panels (if rendered in-app or on web)
  /app     # Expo Router pages
```

## State, Hooks & Data Flow
- **Zustand Store (`src/context/Store.ts`)**
  - Central place for session-level state: auth, rider/driver mode, selected ride, UI preferences.
  - Create slices (`createRideSlice`, `createDriverSlice`) and compose; avoid one mega-store.
  - Select state via hooks (`useStore(s => s.currentRide)`) to minimize re-renders.

- **TanStack Query**
  - All server/API data must go through TanStack Query hooks (`useQuery`, `useMutation`).
  - Co-locate query keys + functions in domain folders (e.g. `src/api/rides.ts`).
  - Use optimistic updates + rollback for critical interactions (accept ride, cancel, etc.).

- **Custom Hooks**
  - `useHaptics` (`src/hooks/useHaptics.ts`): wraps `expo-haptics` patterns (selection, heavy, success, error). Always call from interaction entrypoints.
  - `useSound` (`src/hooks/useSound.ts`): wraps `expo-av` with preloaded buffers (click, power-up, success). Should expose low-latency `play(type)` API.
  - Additional hooks (e.g. `usePerfMarks`, `useSafeInsets`) should be token-aware and avoid business logic duplication.

Pattern: screens compose hooks + domain components; hooks never access navigation directly except via passed-in callbacks.

## API, Env & Data Contracts
- **API client location**: Implement a shared client in `src/api/client.ts` and domain-specific modules like `src/api/rides.ts`, `src/api/auth.ts`.
- **Transport**: JSON over HTTPS; all functions return typed responses (no `any`). Handle network and server errors explicitly.
- **Env config**:
  - Use `EXPO_PUBLIC_API_BASE_URL` and other `EXPO_PUBLIC_*` keys for client-side config.
  - Wrap access in a small `src/constants/config.ts` module that validates presence and shape at startup.
  - Fail fast (throw) if required env values are missing or malformed.
- **Auth**:
  - Centralize auth token handling in a dedicated slice (e.g. `createAuthSlice`) and a helper in `src/api/client.ts`.
  - Use secure storage mechanisms when integrated; never log tokens or PII.
- **Error surface**:
  - Convert low-level errors into user-safe messages via a mapper (e.g. `mapApiErrorToMessage`).
  - Surface them using standardized UI components (see Error/Loading section) with paired haptics.

## Localization & Language Experience
- **Languages**: The app must fully support at least English (`en`) and Bulgarian (`bg`) from day one.
- **Resource structure**:
  - Store translation files under `src/i18n/locales/{en,bg}.json`.
  - Use consistent, hierarchical keys (e.g. `home.title`, `ride.confirm`, `driver.goOnline`).
- **Initialization**:
  - Centralize i18n setup in `src/i18n/index.ts` using `expo-localization` for default locale detection.
  - Ensure i18n is initialized before first UI paint in `_layout.tsx`.
- **Language switcher**:
  - Provide a global language toggle accessible from profile/settings (and optionally onboarding).
  - Store the chosen language in Zustand (e.g. `ui.language`) and persist via `AsyncStorage`.
  - When switching language: update i18n locale, trigger light haptic + subtle sound, and re-render without full app reload.
- **Text usage rules**:
  - No hard-coded copy in components; always use a `useTranslation()`-style hook or helper.
  - Keep microcopy short and Telegram X–level clean; avoid verbose labels.
  - For Bulgarian, respect proper casing and spacing; do not concatenate raw strings.
- **Layout & RTL/LTR**:
  - Design components so that copy length changes (Bulgarian strings often longer) do not break layouts (use flex, min/max width, and tokenized spacing).
  - Even if Bulgarian is LTR, ensure constraints won’t block future RTL expansion.

## Key Integration Points
- **3D-to-Map Transition**: `zoomToLocation()` function with gsap/Reanimated camera interpolation (z: 15 → z: 5) followed by cross-fade between globe and map layers
- **Haptics Pattern**: Every interaction requires `Haptics.selectionAsync()` + audio feedback
- **Glass Effect Layering**: Layer 1 (Map, opacity: 0), Layer 2 (Globe, opacity: 1), Layer 3 (UI)

## Navigation & Routing Conventions
- Use Expo Router v3 file-based routing under `/src/app`.
- Group domains with segments (e.g. `(rider)`, `(driver)`, `(admin)`) so routes stay organized:
  - Rider home: `src/app/(rider)/index.tsx`
  - Driver home: `src/app/(driver)/index.tsx`
  - Admin panel shell: `src/app/(admin)/index.tsx`
- Route params must be fully typed; avoid `any` in loaders or hooks.
- Deep links should map to these routes; centralize link handling if added.

## Cross-Platform UI & Layout Standards
- **Device targets**: Design must feel native and premium on iPhone (including Pro/Max), Android phones (small to large), and modern desktop browsers (Expo web).
- **Responsive layout**:
  - Use tokenized spacing and flex layouts; avoid absolute pixel coordinates for primary layout.
  - Gate large-screen adaptations via hooks (e.g. `useWindowDimensions`, `useSafeInsets`) and DS breakpoints if added later.
  - On web/large screens, center the main surface with max-width and maintain the same glassmorphism hierarchy.
- **Safe areas & gestures**:
  - Always respect notches and home indicators using safe area hooks.
  - Verify all critical gestures and swipe interactions work with both touch and pointer input (for web).
- **Typography & density**:
  - Use `ds.typography` for font family/weights; scale font sizes consistently across platforms (no platform-specific one-offs unless behind DS tokens).
  - Maintain Telegram X–level information density: minimal chrome, high signal, clear hierarchy.
- **Visual quality bar**:
  - Blur, glow, and motion should feel crisp at high DPI (Retina, high‑density Android, desktop).
  - Avoid platform-specific visual regressions; test dark surfaces, gradients, and icons on each platform.

## Development Workflow
- **Phase discipline**: Implement work strictly within the current phase; only touch future-phase files when the current phase gates are all passed.
- **Progress logging**: After each meaningful change, append an entry to `progress.md` following the defined template (phase, action type, verification, status).
- **Build & tooling (expected scripts)**:
  - Type check: `pnpm lint:types` or `npm run lint:types` → `tsc --noEmit`.
  - Lint: `pnpm lint` or `npm run lint` (ESLint, no warnings for committed code).
  - Dev run: `pnpm dev` or `npx expo start` (managed workflow, no redbox/yellowbox).
- **Device matrix**: Verify critical flows on both iOS and Android (simulator or device) before marking a phase complete.
- **Reference fidelity**: Use `reference.md` for motion, icon paths, and layout patterns; adapt to mobile constraints but keep the same cinematic intent.
- **Animation stack**: All animations must use Reanimated 3 (and Moti where suitable) with shared element transitions; no `setTimeout` choreography or ad‑hoc timing hacks.

## Quality Gates & Phase Advancement
Zero tolerance: A phase is ONLY "done" when all gates pass. Do not advance with known issues; do not retro-fix past phases unless you formally roll back.
- Lint/Types: `tsc --noEmit` returns 0 errors; ESLint (when configured) returns 0 errors; no `any` except intentional, documented utility escape hatches.
- Build Boot: `expo start --clear` launches without redbox warnings or yellowbox logs.
- Performance Baseline: Home screen idle frame time <16ms on mid-tier Android & iOS simulators; no layout thrash (avoid forced sync measures).
- Asset Readiness: Fonts, sounds, noise texture, and icon components all load without runtime fallback.
- Interaction Audit: Every interactive element produces haptic + sound (selection or heavy pattern) without delay.
- Visual Consistency: Glass surfaces use identical blur tint 'dark' intensity 50–80 and DS colors only; no ad‑hoc rgba values.
- 3D Stability: Globe renders at target poly (≤64x64) and cross-fade path callable without throwing.

Advancement Rule: If any gate fails after moving forward, you must return to that phase and re-run the full gate list before touching subsequent phases.

## Animation & Motion Standards
- Timing Curves: Default entrance easing `cubic-bezier(0.22,1,0.36,1)`; exit easing `cubic-bezier(0.4,0,0.2,1)` for snappier offboarding.
- Durations: Primary UI mount 300–450ms; micro-interaction feedback 120–180ms; cross-fade globe→map 500ms simultaneous.
- Properties: Restrict to transform (translate/scale) + opacity; avoid expensive shadow/blur animations (static blur only).
- Shared Transitions: Use Reanimated shared elements for panel and card transitions; forbid manual setTimeout choreography.
- Haptic Pairing: Trigger haptics at animation start; audio playback <30ms delay (preloaded buffer from `_layout`).
- Cancellation: All running animations must be cancelable cleanly on navigation or gesture abort (use Reanimated cancellation APIs).

## Component Implementation Checklist
For every new component (e.g. `GlassView`, `RideCard`, `ToggleOnline`):
1. Location matches folder taxonomy (`/components/ui`, `/components/3d`, `/components/map`).
2. Props fully typed; no implicit `any`; export a prop interface.
3. Visual layer uses DS tokens only (`ds.colors`, font family, radius values if added later).
4. Wrapped in Reanimated `Animated.*` where motion/haptics are expected.
5. Haptics + sound integrated in the primary press/gesture handler.
6. Memoization: Heavy children or static geometry wrapped with `React.memo` + `useMemo` for data structures.
7. No side effects on mount besides required asset/context registration.
8. Accessibility: Provide `accessibilityRole` & descriptive label when interactive.
9. Performance: Verify no unnecessary re-renders via React DevTools (props stable, derived values memoized).

## Testing & Verification Workflow
- Type Pass: `tsc --noEmit` (must be clean).
- Runtime Smoke: Launch on iOS & Android; open Home, trigger Globe zoom, ensure cross-fade executes w/o frame hitch.
- Interaction Audit: Tap each interactive element; confirm haptic & audio; log any missing pairings immediately.
- Frame Profiling: Use Expo performance monitor; ensure FPS ≥60 sustained during globe rotation & map cross-fade.
- Asset Preload Check: Confirm fonts & sounds loaded before first interaction (no delayed first-play audio).
- Visual Snapshot (Optional): Capture screenshots of key panels to detect unintended visual drift when refactoring.
- Rollback Protocol: If a test fails post-advancement, revert to the phase branch/tag and re-apply fix before continuing.
 - Admin Panel: Verify admin-only flows (e.g. dashboards, monitoring views) on web and mobile, ensuring they respect the same DS tokens and performance standards.

When implementing features:
- Reference the exact design tokens and animation specifications from the `ds` object; never hard-code layout, color, or typography outside `theme.ts`.
- Route all state through the prescribed layers (Zustand store + TanStack Query + hooks) instead of local one-off state for cross-screen concerns.
- Treat `progress.md` as the ground truth for what is actually done; if it is not logged and gated, it is not considered implemented.

These instructions are binding for all AI coding agents. The goal is a production-grade, ultra-premium mobile experience that can ship without foundational rework.