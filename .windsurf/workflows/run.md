---
description: runmode
auto_execution_mode: 3
---

🔄 Project Aura – Elite UI Dev Workflow

You are an AI dev working inside Project Aura.
Your job: systematically refactor the app so every surface obeys the Aura spec and passes all gates.

You must follow this workflow every time you touch UI code.

0. Setup & Mode

Read inputs (single target only):

Current Phase (1–6).

Target file/screen (e.g. AuraShell, RiderHome, DriverHome).

The spec (Aura v2 document + DS in src/constants/theme.ts).

Lock scope:

Work on one phase + one surface/file at a time.

No cross-phase “quick fixes”.

No touching other files unless absolutely required by types.

1. Analyze the Target File (Max 10 minutes)

Parse the file and classify violations:

Local ds objects / hardcoded styles.

DOM / web APIs (document, window, <div>, <button>, <input>, <canvas>).

framer-motion usage.

Audio hacks (Web Audio, HTML audio).

Layout / motion not using DS or shared components.

Write a short internal plan (comments or progress.md entry):

[Aura] Target: src/app/AuraShell.tsx
Phase: 1–3 (premium shell + globe + globe→map)
Plan:
- Remove local ds & inline styles -> import DS
- Replace DOM + framer-motion with RN + Reanimated/Moti
- Swap Web Audio for useHaptics/useSound
- Wire Globe (R3F) + Map (rnmapbox) crossfade per spec


No code yet. Only understanding and plan.

2. DS Normalization Pass (Visual Law)

Goal: this file must not define its own design system.

Import DS:

import { ds } from '@/constants/theme';


Delete local design tokens:

Remove any const ds = { ... } defined in this file.

Remove any local “theme” objects that duplicate DS concerns.

Normalize styles:

Replace all literals:

Colors ('#0A0A0A', rgba(...), etc.)

Radii ('40px')

Spacing (margin: '20px')

Font sizes / weights

With DS tokens only:

ds.colors.*

ds.radius.*

ds.spacing.*

ds.typography.size.*

ds.typography.weight.*

ds.shadow.*, ds.effects.*, ds.motion.*

Move remaining styles into StyleSheet.create or component-level style objects that only reference ds.

Gate:

File has zero hard-coded colors, radii, spacing, font sizes, shadows, or blur values.

The only source of visual truth is ds.

3. Platform Normalization Pass (Expo/React Native Only)

Goal: file must be pure Expo/React Native, no browser-only APIs.

Replace DOM elements:

<div> → <View>

<button> → <Pressable> or <NeonButton>

<input> → <TextInput>

<canvas> → 3D canvas via @react-three/fiber (wrapped in RN view)

Remove:

document.*, window.*, AudioContext, script injection, CDN <script> loading.

Any direct DOM manipulation (classList, style changes, etc.).

Assume fonts already loaded in _layout.tsx.

Remove any document.head.appendChild font hacks.

Gate:

No document or window references.

No DOM tags.

File compiles as a normal React Native/Expo component.

4. Motion Pass (Reanimated + Moti + DS Motion Grammar)

Goal: all motion uses Reanimated/Moti and ds.motion.

Remove framer-motion:

Delete import { motion, AnimatePresence } from 'framer-motion';

Replace motion wrappers with Moti / Reanimated equivalents.

Implement Aura motion grammar:

Entrance:

Duration: ds.motion.duration.entrance

Easing: ds.motion.easing.entrance

Props: opacity 0→1, translateY(12→0), scale(0.98→1)

Exit:

Duration: ds.motion.duration.exit

Easing: ds.motion.easing.exit

Micro-tap:

Duration: ds.motion.duration.micro

Easing: ds.motion.easing.micro

Scale: 1 → 0.97 → 1

Extract shared motion configs into a motionTokens helper (if not already present):

export const auraMotion = {
  entrance: { /* from ds.motion */ },
  exit: { /* ... */ },
  microTap: { /* ... */ },
};


Use Layout Animations for cards, lists, and nav bar transitions.

Gate:

No framer-motion imports.

All animation constants taken from ds.motion.

Major surfaces (hero, bottom sheet, nav) use entrance/micro/exit patterns.

5. Multisensory Pass (Haptics + Sound + Light)

Goal: every important interaction = motion + haptic + sound + glow.

Import multisensory hooks:

import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';


Delete all inline audio hacks (e.g. playSound() with Web Audio).

In the main component:

const haptics = useHaptics();
const sound = useSound();


Wire interactions:

Primary CTA press:

haptics.tap();

sound.play('tapSoft');

Confirm ride:

haptics.confirm();

sound.play('success');

Error:

haptics.error();

sound.play('warning');

Tab switch, language change:

haptics.tap();

sound.play('tapSoft');

Add light/glow reaction via DS:

Use ds.colors.glowCyan, ds.colors.glowMagenta.

Animate a small radial glow or border intensity on press.

Gate:

No custom Web Audio code.

All primary UI actions trigger motion + haptic + sound + light.

6. 3D + Map Phase Pass (2–3 only)

Only if this file is responsible for globe + map (like your current shell).

Replace ad-hoc Three.js with:

@react-three/fiber + @react-three/drei

A GlobeScene component that:

Exposes zoomToLocation(lat, lon).

Uses atmosphere + starfield per spec.

Memoizes geometry/materials.

Replace maplibre-gl with @rnmapbox/maps:

MapContainer with dark style (from config).

Camera sync with globe zoom destination.

Implement cross-fade:

Globe opacity 1→0, Map opacity 0→1 on zoomToLocation complete.

Use Reanimated values and ds.motion timings.

Verify performance on emulator/device:

Idle ≥ 60 FPS, transition ≥ 55 FPS.

Gate:

No window.THREE / window.maplibregl / dynamic scripts.

Globe → Map feels like a single cinematic motion, no stutters.

7. Componentization Pass (GlassView / NeonButton / AuraCard / FloatingTabBar)

Goal: this file should compose primitives, not reinvent them.

Import and use shared components:

GlassView for all glass surfaces.

NeonButton for main CTAs.

AuraCard for ride options, info panels.

FloatingTabBar for bottom navigation.

Replace local implementations:

Bottom sheet → GlassView + AuraCards.

Primary buttons → NeonButton.

Nav bar → FloatingTabBar with the correct items.

Ensure props:

inverse, elevated, interactive flags, etc., match the library contracts.

No stray <Pressable> styled as a button where a NeonButton should be.

Gate:

File no longer defines raw “card/button/nav” visuals.

All key surfaces built from shared UI primitives.

8. Phase Discipline Check

Tag blocks with comments:

// Phase 1: Premium shell (onboarding + hero)
// Phase 2: Globe background
// Phase 3: Globe → Map transition


Verify code does not implement Phase 4+ flows in this file unless the app’s structure says so.

If you discover a regression or missing gate:

Mark the lowest phase affected.

Fix until that phase’s gates are all green again.

Gate:

Code is clearly structured by phase.

No “future-phase” snippets hacked into earlier phases.

9. Testing & Quality Gates (Per-File)

After each refactor loop for this file:

Static checks

pnpm lint
pnpm lint:types
pnpm test -- <relevant-pattern>      # if tests exist for this area


Runtime checks (sim / device)

Boot via npx expo start.

Run through only the flows this file participates in.

Check:

No RedBox/YellowBox.

Motion = per spec.

Multisensory responses fire correctly.

EN & BG localization don’t break layout.

If anything fails:

Fix locally.

Re-run checks.

Do not proceed to the next file/phase until green.

10. Logging & Done Criteria

For each completed file:

Append to progress.md:

## [Aura] 2025-11-23 – src/app/AuraShell.tsx

Phase(s): 1–3
Changes:
- DS normalization (removed local ds, inline styles)
- RN + Expo-only (removed DOM/Web APIs)
- Reanimated/Moti motion per ds.motion
- useHaptics/useSound multisensory wiring
- Globe (R3F) + Map (rnmapbox) crossfade

Gates:
- tsc --noEmit ✅
- pnpm lint / lint:types ✅
- Expo sim (iOS/Android) – FPS & multisensory ✅
- EN/BG layout ✅

Known limitations: none


A file is DONE when:

All gates above are ✅.

Known limitations section is empty.