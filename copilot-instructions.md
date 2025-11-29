You are my senior front-end engineer for a dual Rider/Driver app built with:
- Expo / React Native + web
- TypeScript
- Framer Motion / Reanimated / Animated worklets
- 3D (three.js) and maps (Mapbox/MapLibre)

REPO STRUCTURE (IMPORTANT)
The repo looks like this (partial, relevant bits):

src/app
  _layout.tsx
  (rider)/*
  (driver)/*
  driver.tsx
  (admin)/*
src/components
  3d/Globe.*        ← existing globe implementations
  map/*             ← map container + aura style
  rider/*           ← rider-specific UI
  driver/*          ← driver-specific UI
  ui/*              ← shared UI (Glass, Nav, Buttons, Noise, etc.)
src/constants/theme.ts  ← design tokens (colors, radii, typography, shadows)
src/hooks
  useAnimations.ts
  useReducedMotion.ts
  useHaptics.ts
  useMagneticInteraction.tsx
  useRippleEffect.tsx
src/providers
  AnimationProvider.tsx
  ThemeLocaleProvider.tsx
  NetworkStatusProvider.tsx
docs/*.md          ← multiple feature/UX docs

There is also a new optimized `RiderApp` visual shell (phone frame + globe + map + ride sheet + bottom nav). Treat that as the VISUAL GOLDEN MASTER for the Aura style.

------------------------------------------------------------------
GLOBAL GOAL
------------------------------------------------------------------

1. FULLY AUDIT the repo (Rider + Driver) for:
   - Visual consistency with the **Aura** style.
   - Motion consistency with **Telegram X / iMessage**:
     - High-FPS, snappy, precise, delightful but subtle.
     - Short, springy transitions with clean inertia.
     - No overdone bouncing or slow easing.

2. IMPLEMENT a unified style and motion system across:
   - Rider app: `src/app/(rider)/**/*.tsx`, `src/components/rider/**/*`
   - Driver app: `src/app/(driver)/**/*.tsx`, `src/app/driver.tsx`, `src/components/driver/**/*`
   - Shared UI: `src/components/ui/**/*` (SleekNav, Glass, Buttons, Toasts, etc.)
   - 3D/Map: `src/components/3d/*`, `src/components/map/*`

3. NO hacks, NO `eslint-disable`, NO `@ts-ignore` for new work.
   - Keep everything production-grade, strongly typed, and in line with existing ESLint/TS config.

------------------------------------------------------------------
STYLE & MOTION PRINCIPLES
------------------------------------------------------------------

VISUAL (AURA)
- Single source of truth for tokens: `src/constants/theme.ts`.
- Use the existing glass and shell components:
  - `GlassCard`, `GlassView`, `AuraCard`, `NoiseOverlay`, `ShellBackdrop`,
    `NeonButton`, `PremiumButton`, `SleekNav`, `FloatingTabBar`, etc.
- Everything in Rider + Driver should feel like variants of the same Aura product:
  - Dark, glassy, subtle neon (primary = cyan/teal, secondary = lime/green).
  - Rounded radii, soft shadows, consistent border opacity.
  - Typography and spacing from the theme file.

MOTION (TELEGRAM X / IMESSAGE VIBE)
- Short and snappy:
  - Typical durations: 120–250ms for simple transitions, 300–400ms for complex.
  - Use spring animations with high stiffness and controlled damping.
- Telegram X feel:
  - Sheets and panels: crisp slide with tiny overshoot, quick settle.
  - Nav taps: micro-scale, “magnetic” highlight, no sluggish bounce.
  - Lists: light staggered fades/slides, not heavy parallax.
- iMessage feel:
  - Bubbles/cards pop in with a soft scale + fade.
  - Transition between screens feels “layered” and directional, but subtle.
- Always respect `useReducedMotion`:
  - If reduced motion is ON, switch to ultra-short opacity transitions or instant snapshots.
  - No heavy movement for those users.

You MUST centralize motion primitives via `src/hooks/useAnimations.ts` and `src/providers/AnimationProvider.tsx` instead of random per-component ad-hoc motion.

------------------------------------------------------------------
PHASE 1 – AUDIT & INVENTORY
------------------------------------------------------------------

1. Scan the following:
   - `src/app/(rider)/**/*`
   - `src/app/(driver)/**/*` + `src/app/driver.tsx`
   - `src/components/rider/**/*`
   - `src/components/driver/**/*`
   - `src/components/ui/**/*`
   - `src/components/3d/**/*`
   - `src/components/map/**/*`

2. For each screen/complex component, record:
   - Styling:
     - Inline styles vs. `theme.ts` tokens vs. local ad-hoc constants.
     - Uses of `GlassCard`, `GlassView`, `NoiseOverlay`, `ShellBackdrop`,
       `NeonButton`, `PremiumButton`, `SleekNav`, `FloatingTabBar`, `StatusBanner`, etc.
   - Motion:
     - Where Framer Motion / Reanimated / Animated are used, and how.
     - Any inconsistent easing, durations, or “off” transitions.
     - Any missing use of `useReducedMotion` or `AnimationProvider`.

3. Write `docs/AURA_UI_MOTION_AUDIT.md`:
   - Section per app: **Rider**, **Driver**, **Shared UI**, **3D/Map**.
   - For each major screen/component:
     - Current style mode (good | partial Aura | legacy/mixed).
     - Current motion mode (static | minimal | inconsistent | good).
     - Concrete notes: “Bottom nav uses old styles,” “Ride cards not using Aura glass,”
       “Driver earnings sheet missing TelegramX/iMessage motion,” etc.

------------------------------------------------------------------
PHASE 2 – THEME & MOTION PRIMITIVES (CENTRALIZATION)
------------------------------------------------------------------

A. THEME CONSOLIDATION
1. In `src/constants/theme.ts`:
   - Ensure tokens cover:
     - Colors (primary, secondary, background, surface, glass, borders, error, text, muted).
     - Radii (device, card, pill).
     - Shadows (soft, glow).
     - Spacing and typography if not already present.
2. Replace duplicated inline DS objects across the repo with imports from `theme.ts`.
   - Example targets: local `ds = { colors: ... }` clones.
3. Normalize all shells and panels to use:
   - `GlassCard` / `GlassView` / `AuraCard` with theme tokens.
   - `NoiseOverlay` and `ShellBackdrop` for global layers when appropriate.

B. MOTION SYSTEM (TELEGRAM X / IMESSAGE)
1. In `src/hooks/useAnimations.ts` and/or a new `src/constants/motion.ts`:
   - Define motion tokens:
     - Durations: `{ xfast: 0.12, fast: 0.18, normal: 0.24, slow: 0.32 }`.
     - Easing: 
       - fastOut: `[0.32, 0.72, 0, 1]` (Telegram-style pop).
       - smooth: `[0.23, 1, 0.32, 1]` (iMessage-style).
   - Springs:
     - `springSnappy`: `{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }`.
     - `springSoft`: `{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }`.
2. Add canonical variants:
   - `sheetVariants` (for bottom sheets like ride selection, earnings):
     - Initial: `y: '100%', opacity: 0`.
     - Animate: `y: 0, opacity: 1` with `springSnappy`.
     - Exit: `y: '100%', opacity: 0` (fastOut).
   - `navItemVariants` (SleekNav, FloatingTabBar):
     - Hover/pressed: small scale to `0.94`, then snap back.
     - Active indicator animating like Telegram X tab indicator.
   - `cardVariants` (ride cards, inbox, history, earnings items):
     - Initial: `{ y: 10, opacity: 0 }`.
     - Animate: `{ y: 0, opacity: 1 }` with short stagger.
   - `screenTransitionVariants`:
     - Forward: slide from right with faint parallax and fade.
     - Back: slide from left with matching feel.
3. Integrate `useReducedMotion`:
   - Wrap Framer Motion usage with that hook and downgrade animation to:
     - No movement, minimal opacity change, or instant snap for reduced motion.

------------------------------------------------------------------
PHASE 3 – RIDER APP (UNIFY VISUALS + MOTION)
------------------------------------------------------------------

1. In `src/app/(rider)/*.tsx` screens (`index.tsx`, `location.tsx`, `active-ride.tsx`, `ride-history.tsx`, `ride-completion.tsx`, `add-payment.tsx`, `profile.tsx`):
   - Use a shared Rider shell component (you can create one in `src/components/rider/RiderShell.tsx`) that:
     - Wraps content in the Aura phone frame (similar to the optimized `RiderApp`).
     - Internally uses:
       - `ShellBackdrop` / `NoiseOverlay` for background layers.
       - `SleekNav` or a unified bottom nav for primary navigation.
   - Replace inline layout styles with:
       - Aura layout primitives from `theme.ts` and shared UI components (Glass cards, buttons, etc.).
2. For Rider flows:
   - Destination entry, ride selection, active ride, completion, and payment screens must:
     - Use Aura glass panels for input sections and summaries.
     - Use `NeonButton` / `PremiumButton` for primary CTAs.
   - Motion:
     - Bottom sheets (price confirmation, ride selection, cancellation, payment recap):
       - Use `sheetVariants` for mount/unmount with `AnimatePresence`.
     - Ride options / cards:
       - Use `cardVariants` for entry, subtle Telegram X-style snap on press.
     - Transition between main Rider screens:
       - Use `screenTransitionVariants` driven by navigation state.

------------------------------------------------------------------
PHASE 4 – DRIVER APP (MIRROR BUT DRIVER-SPECIFIC)
------------------------------------------------------------------

1. In `src/app/(driver)/**/*` and `src/app/driver.tsx`, plus `src/components/driver/**/*`:
   - Apply the same Aura shell:
     - Use a `DriverShell` (parallel to `RiderShell`) that shares most of the structure but can adjust:
       - Color accent tweaks if needed (e.g. stronger emphasis on earnings/alerts).
   - Replace any legacy styling with Aura primitives (Glass panels, Neon buttons, SleekNav).
2. Driver-specific screens:
   - Active trip, incoming request, queue, earnings dashboard, cancellation flows:
     - Use bottom sheets and cards with `sheetVariants` and `cardVariants`.
     - Treat “incoming ride request” like a Telegram X notification/banner:
       - Slide-down or pop-in banner with quick spring.
   - Earnings dashboard:
       - Soft list animation; items appear with staggered card variants.
3. Navigation:
   - Normalize driver navigation to use `SleekNav` / `FloatingTabBar` styling + motion:
     - Magnetic tab indicator like Telegram X.
     - Tap interactions with micro-scale and color brightening.

------------------------------------------------------------------
PHASE 5 – 3D / MAP INTEGRATION
------------------------------------------------------------------

1. Use existing 3D and map components:
   - `src/components/3d/Globe.*` and `src/components/map/MapContainer.tsx`.
   - Align them with the optimized RiderApp globe/map behavior:
     - Smooth camera transitions, but durations consistent with motion tokens.
     - Respect `useReducedMotion` (no long spinning/zoom for those users).
2. Ensure overlays (cards, sheets, nav) sit on top of 3D/map layers with consistent Aura glass styling.

------------------------------------------------------------------
PHASE 6 – CLEANUP, QA, AND DOCS
------------------------------------------------------------------

1. Clean up:
   - Remove dead/unreferenced legacy styles and ad-hoc DS.
   - Eliminate inline `style` objects when they duplicate Aura styles.
2. Run full quality gate:
   - `pnpm lint` / `pnpm test` / `pnpm typecheck` (or project equivalents).
   - Fix all new lint/type issues without disabling rules.
3. Visual QA:
   - Verify key Rider & Driver flows:
     - Onboarding, requesting ride, active ride, cancellation, payment, earnings.
   - Confirm:
     - Visual consistency (same Aura “feel” for both roles).
     - Motion consistency (Telegram X / iMessage vibe everywhere).
     - Respect for `useReducedMotion` and `useHaptics`.
4. Documentation:
   - Create `docs/AURA_UI_MOTION_GUIDE.md`:
     - Usage examples for theme tokens, shared components, motion tokens, and variants.
     - “How to build a new Aura screen” playbook:
       - Wrap in RiderShell/DriverShell.
       - Use Glass components and buttons.
       - Use motion variants from `useAnimations` + `AnimatePresence`.

Operate autonomously:
- Make changes, don’t just suggest them.
- Keep diffs scoped and meaningful (no random reformatting).
- Final state: repo builds cleanly, tests pass, UI and motion are Aura + Telegram X / iMessage-grade across Rider and Driver.
