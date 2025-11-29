Project Aura — Ultra-Premium Ride Sharing Mobile Application

//================================================================
// 0. MANIFESTO, HARD LAWS & EXPERIENCE PILLARS
//================================================================

Objective
Build Aura, a cinematic, ultra-premium ride-sharing application for iOS and Android that feels closer to a sci-fi vehicle HUD than a normal app.

Vibe
Dark, glassy, neon; atmospheric depth; “buttery smooth” micro-interactions everywhere.

0.1 Hard Laws (Override Everything)

No lag. No jank. No flicker.
Any main flow dropping under 55 FPS is a bug.

Every interaction is multisensory.
Tap = motion + haptic + sound + light response.

Design System is law.
No inline colors, radii, spacing, shadows, blur, or motion values outside ds.

Phase order is sacred.
Never implement Phase N+1 before all gates of Phase N are green.

No hacks. No band-aids.

No ts-ignore.

No any except in tiny, documented utility escape hatches.

No hidden console.log in committed code.

Expo / RN only.
No browser-only APIs (document, window, canvas, DOM) in app code.

0.2 Experience Pillars

Futuristic Cinematic World
Layered depth, glowing glass, live 3D globe, seamless map fusion; feels like a HUD inside a luxury car.

Instant Responsiveness
Visual reaction within 16 ms, haptics/audio within 25 ms (assets preloaded).

Telegram X / iMessage Polish
Crisp typography, perfect alignment, tuned micro-delays.
No raw “web-ish” layouts; everything feels native and intentional.

Multisensory Feedback
Sound, haptics, and light confirm intent on all primary actions.

Visual Consistency
One design language across rider, driver, admin, and web shells.

//================================================================
// 1. STRICT TECH STACK (NON-NEGOTIABLE) – AURA MOBILE
//================================================================

You are building the Rider and Driver apps in Expo / React Native.
This stack is mandatory. No substitutions.

// Runtime & Framework
Expo SDK 50+ (Managed Workflow)
React Native (Expo’s current RN)

// Language
TypeScript with "strict": true

// Navigation
Expo Router v3 (file-based routing only)

// State & Data
Zustand        // UI + session/global state
TanStack Query // server data (rides, auth, pricing, profile, etc.)

// 3D Graphics
@react-three/fiber
@react-three/drei   // helpers, camera/orbit, atmosphere, etc.

// Maps
@rnmapbox/maps      // dark custom style; no react-native-maps fallback

// Animations
React Native Reanimated 3
Moti                    // composition + press/focus wrappers

// Blur / Glass
expo-blur               // blur layer
(optional) @shopify/react-native-skia // glow, masks, inner lights

// SVG
react-native-svg        // icons, progress rings, badges

// Haptics
expo-haptics

// Audio
expo-av                 // UI sounds (tap, success, error, power-up)

// Localization
expo-localization + i18next / react-i18next (JSON dictionaries)

// Tooling
tsc --noEmit           // hard gate
ESLint (React/TS/Reanimated rules)
Prettier (project defaults)


Explicit ban: React 19, Tailwind, Shadcn UI, Mapbox GL JS, Framer Motion, raw Three.js, DOM APIs are for the separate web demo only (see Appendix). Do not use them in Aura mobile.

//================================================================
// 2. DESIGN SYSTEM (ds) – SINGLE SOURCE OF TRUTH
//================================================================

Location: src/constants/theme.ts
All visual / motion / depth decisions must derive from this object.

2.1 Core Tokens
export const ds = {
  colors: {
    // OKLCH-inspired palette mapped to hex/rgba for RN
    primary: '#00F5FF',              // Electric / cyber cyan
    primaryAccent: '#19FBFF',        // Vibrant cyan variant (CTAs)
    secondary: '#00FF73',            // Neon green
    background: '#050607',           // Deep black
    surface: 'rgba(22,22,22,0.95)',  // Main glass surface
    surfaceElevated: 'rgba(32,32,32,0.96)',
    glass: 'rgba(30,30,30,0.6)',
    textPrimary: '#F7F7F7',
    textSecondary: '#A5A5A5',
    danger: '#FF3366',
    success: '#00FFB3',
    glowCyan: 'rgba(0,245,255,0.25)',
    glowMagenta: 'rgba(255,0,255,0.18)',
    outlineSubtle: 'rgba(255,255,255,0.05)',
    borderSubtle: 'rgba(255,255,255,0.08)',
  },

  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40, // for phone frame shells / hero cards
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  typography: {
    family: 'Poppins',
    size: {
      micro: 10,
      caption: 12,
      body: 14,
      bodyLg: 16,
      title: 20,
      display: 32,
      hero: 38,
    },
    weight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  shadow: {
    modern: {
      // multi-layer cyan-tinted outer shadow
      radius: 32,
      offsetY: 18,
      opacity: 0.65,
    },
    glow: {
      radius: 40,
      offsetY: 0,
      opacity: 0.8,
    },
    innerGlow: {
      radius: 18,
      offsetY: -4,
      opacity: 0.35,
    },
  },

  effects: {
    blurIntensity: 60, // ~24px web-equivalent
    noiseOpacity: 0.03,
    neonStrokeWidth: 1.6,
    parallaxTiltMaxDeg: 6,
  },

  motion: {
    duration: {
      entrance: 360,
      exit: 220,
      micro: 140,
      modalIn: 320,
      modalOut: 220,
      tabSwitch: 220,
      toastIn: 200,
      toastOut: 180,
    },
    easing: {
      entrance: [0.22, 1, 0.36, 1],
      exit: [0.4, 0, 0.2, 1],
      micro: [0.18, 0.89, 0.32, 1.28],
    },
  },

  layout: {
    maxContentWidth: 560,
    minHorizontalPadding: 16,
  },
} as const;


Rules:

Only ds may define colors, radii, spacing, blur, shadows, and timing.

No raw margin: 7, borderRadius: 40, #00ffff, etc.

Motion values must come from ds.motion.

2.2 Glassmorphism & Ambient Effects

Glass View

Base: ds.colors.surface with expo-blur at ds.effects.blurIntensity.

Border: ds.colors.borderSubtle.

Optional cyan/magenta rim using Skia or SVG gradient stroke.

Shadows

shadow-modern: multi-layer soft drop shadow on hero shells and floating panels.

shadow-glow: luminous cyan glow for active CTAs and focused inputs.

shadow-inner-glow: subtle inner lighting around key cards.

Ambient

Global NoiseOverlay at ds.effects.noiseOpacity.

Background gradient blobs (top-left / bottom-right) using ds.colors.glowCyan/glowMagenta.

Pointer events carefully controlled to avoid extra hit testing overhead.

//================================================================
// 3. CORE COMPONENTS & UX PATTERNS
//================================================================

All new UI should use shared primitives instead of rolling its own.

3.1 UI Primitives (src/components/ui)

GlassView

Wraps BlurView from expo-blur + View.

Props: elevated?, interactive?, tone? (default, danger, success).

Uses ds.radius, ds.colors.surface*, ds.shadow.*.

NeonButton

Gradient background from ds.colors.primary → ds.colors.primaryAccent.

Pressed state:

Scale to 0.95 using Reanimated/Moti.

Stronger outer glow (shadow-glow).

Focus ring: cyan halo using ds.effects.neonStrokeWidth.

Integrates useHaptics().tap() and useSound().play('tapSoft') on press.

AuraInput

Glass background (surface), subtle border.

On focus:

Border brightens to primary.

Inner glow increases.

Haptic tap + light ripple.

AuraCard

Used for ride options, addresses, summaries.

Gradual overlay (white/5 → transparent) for highlight.

Hover/press: border glow, micro scale, glow shadow.

FloatingTabBar

Glass pill with 4 tabs:

Home, Activity, Location, Profile.

Active tab: cyan icon, glowing dot, slight elevation.

Tab labels via i18n, e.g. t('nav.home').

Toast system

Types: success, error, info, warning.

Each has:

Gradient background, icon, text.

Slide-down + fade + slight scale in/out using ds.motion.toastIn/out.

Triggered on:

Save/delete address, ride confirmation, errors.

Skeleton components

Rectangular, circular, and text skeletons.

Shimmer implemented with Reanimated gradient overlay.

AddressCardSkeleton prebuilt for lists.

3.2 Multisensory Hooks (src/hooks)

useHaptics

tap()

confirm()

error()

useSound

Preloads:

tapSoft, powerUp, success, warning.

play(name: 'tapSoft' | 'powerUp' | 'success' | 'warning').

All primary interactions must call both a useHaptics method and a useSound method, plus visual motion.

3.3 Apps & Surfaces

Rider Mobile App (React Native + Reanimated, ~30+ screens)

Driver Mobile App (React Native + Reanimated, ~20+ screens)

Admin Web Console (Next.js + React, 10–15 screens; separate spec, not in this doc)

Both rider and driver apps are BG/EN bilingual via i18next, with full 60 FPS animation budgets.

//================================================================
// 4. PHASED BUILD PIPELINE (MOBILE)
//================================================================

Use the 6-phase pipeline from earlier instructions:

Phase 1 – Premium Shell

DS, GlassView, NeonButton, AuraCard, FloatingTabBar, NoiseOverlay.

Onboarding hero with proper typography and motion grammar.

Phase 2 – Cinematic Core

GlobeScene behind Rider Home:

3D Earth, atmosphere, starfield, idle rotation.

zoomToLocation(lat, lon) API.

Phase 3 – Seamless Transition

MapContainer using @rnmapbox/maps.

Crossfade Globe → Map and camera sync on destination.

Phase 4 – Rider Flow

Destination input, ride options, CTA.

Micro-interactions + toasts + skeletons.

Phase 5 – Driver Flow

Go Online switch/button, request modal, countdown ring.

Phase 6 – Buttery Polish

Perf passes, GC minimization, memos, selectors, localization stress-test.

Each phase has the same gates:

tsc --noEmit = 0 errors.

ESLint = 0 errors.

No RedBox/YellowBox on main flows.

FPS ≥ 60 (≥55 allowed briefly on transitions).

EN/BG layouts both correct.

//================================================================
// 5. PROJECT & BUSINESS CONTEXT (READ-ONLY FOR AI DEV)
//================================================================

These bullets describe scope & value, not implementation details:

Rider app, Driver app, Admin console.

BG/EN bilingual, 60 FPS Reanimated 3 animations.

Configurable map providers, KYC, Stripe integration.

Backend: Node.js microservices, PostgreSQL + Redis + MongoDB, WebSockets, Docker + Kubernetes, GDPR/PCI considerations.

Typical metrics:

Investment: $400K–$600K full build, or $100K–$150K MVP.

Timeline: 6–9 months full, or 8–12 weeks MVP.

Team: ~5–6 devs.

Consulting value: $50K–$75K+.

AI dev should not design the backend from scratch here; it should assume typed APIs exist and integrate via TanStack Query.

//================================================================
// 6. APPENDIX — REFERENCE WEB GLOBE DEMO (DO NOT COPY STACK)
//================================================================

There exists a separate web demo:

React + TypeScript, React 19

Three.js for 3D globe

Mapbox GL JS

Framer Motion

Tailwind CSS v4 + custom OKLCH color system

Shadcn UI

localStorage

Features:

Photorealistic 3D globe w/ atmosphere, breathing animation.

Nominatim geocoding + caching.

Globe→Map camera animation.

Saved addresses management.

Toasts, skeleton loading states, modern glass UI.

This demo is:

A visual & UX reference only.

Not a codebase or stack to copy into the Aura mobile app.

Rule for AI dev:
You may borrow visual ideas and interaction patterns from the web demo (globe breathing, “Save & Fly” animation feel), but you must implement everything using the mobile stack defined in section 1 (Expo / RN / Reanimated / @react-three/fiber / @rnmapbox/maps) and the design system in section 2.
Fix TypeScript Issues in active-ride.tsx
Implement Payment Integration (Stripe/PayPal)
Build WebSocket Service for real-time updates
Add In-App Chat functionality
Create Ride History screen

ComplexityTime EstimatePriority
Payment Integration
HIGH
4-6 weeks
🔴 Critical
WebSocket Backend
HIGH
3-4 weeks
🔴 Critical
In-App Chat
MEDIUM
2-3 weeks
🔴 Critical
Ride History
LOW
1-2 weeks
🟡 Important
Admin Dashboard
HIGH
6-8 weeks
🟢 Future
AI Features
🔴 HIGH PRIORITY (Production Blockers)
Payment & Billing System
Payment Methods: Credit cards, digital wallets, Apple Pay, Google Pay
Payment Integration: Stripe/PayPal SDK integration
Fare Calculation: Dynamic pricing, surge multiplier, tolls, taxes
Receipt System: Email receipts, in-app history, PDF downloads
Refund Processing: Automatic refunds, dispute resolution
Split Payments: Multiple riders sharing fare
Promo Codes: Discount system, referral codes, loyalty points
Real-time Backend Infrastructure
WebSocket Service: Live location tracking, ride status updates
Geolocation Services: GPS tracking, route optimization, ETA calculation
Push Notifications: Ride alerts, driver arrival, promotional messages
Database Persistence: MongoDB/PostgreSQL for ride history, user data
API Endpoints: RESTful APIs for all operations
Analytics & Metrics: Ride statistics, business intelligence
Rate Limiting & Security: API protection, data encryption
Communication Features
In-App Chat: Rider-driver messaging, file sharing
Voice/Video Calls: In-app calling capability
SMS Integration: Text message notifications
Emergency Features: SOS button, emergency contacts
Multi-language Support: Localization for different regions
🟡 MEDIUM PRIORITY (Core Features)
Order Management & History
Ride History: Past rides, receipts, rating system
Scheduled Rides: Book rides in advance
Cancellation Policies: Time-based cancellation fees
Dispute Resolution: Report issues, customer support
Ride Sharing: Split rides with other passengers
Corporate Accounts: Business travel management
User Profiles & Settings
Profile Management: Photo upload, personal details
Saved Addresses: Home, work, frequent locations
Payment Method Management: Add/remove cards, default settings
Preferences: Music, temperature, conversation level
Loyalty Program: Points system, rewards, tier levels
Accessibility Features: Wheelchair accessible vehicles
Driver Management System
Driver Onboarding: Document verification, background checks
Earnings Dashboard: Daily/weekly/monthly earnings
Driver Ratings: Performance tracking, bonus system
Schedule Management: Working hours, availability
Vehicle Management: Registration, insurance, maintenance
🟢 LOW PRIORITY (Enhancement Features)
Admin Dashboard
Fleet Management: Vehicle tracking, maintenance schedules
Driver Management: Approval system, performance monitoring
Customer Support: Ticket system, live chat integration
Financial Reporting: Revenue tracking, payout processing
Marketing Tools: Promotional campaigns, user analytics
Advanced Features
AI Route Optimization: Traffic-aware routing
Dynamic Pricing: Demand-based pricing algorithms
Business Intelligence: Predictive analytics, trend analysis
Third-party Integrations: Calendar, expense reporting
White-label Solutions: Custom branding for businesses
Edge Cases & Error Handling
Offline Mode: Basic functionality without internet
Network Retry Logic: Automatic reconnection, data sync
Emergency Services: Direct 911 integration
Disaster Recovery: System failover, data backup
Compliance: GDPR, CCPA, local regulations
