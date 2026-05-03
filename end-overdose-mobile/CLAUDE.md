# Project Guide

Mobile-first Expo React Native app for the End Overdose emergency flow. The primary target is the iPhone simulator.

Never use "Overdose" as the primary screen title. Use "Emergency Help" in the UI unless a later task explicitly changes the wording.

## File Ownership — CRITICAL

Someone else owns `src/app/resources.tsx`. Do **not** create, edit, or modify it.

For the current phase, most tasks should stay within:

- `src/app/emergency.tsx`
- `src/app/emergency-active.tsx`
- `src/app/emergency-911.tsx`
- `src/app/triage.tsx`
- `src/app/profile.tsx`
- `src/components/guided-flow-back-button.tsx`
- `src/components/hold-to-cancel-button.tsx`
- `src/components/more-guidance-panel.tsx`
- `src/components/sos-emergency-button.tsx`
- `src/components/step-progress-pill.tsx`
- `src/components/custom-tab-bar.tsx`
- `CLAUDE.md`

If a task needs more than those files, explain why before editing.

## AI Tool Instructions

Before making changes:

- Read `CLAUDE.md`
- Identify the layer being changed
- List the files you expect to touch
- Do not change unrelated tabs or flows
- Preserve the emergency demo flow unless asked to expand it
- Run `npm run lint` after code changes when possible

## Tech Stack

- Expo SDK 55, managed workflow
- React Native 0.83 / React 19
- Expo Router (file-based routing) — `Tabs` at root, `href: null` for full-screen screens
- React Native Reanimated 4.2 — use for Pressable feedback (scale + opacity) and bouncing animations
- React Native `Animated` API — use for looping ring animations (simpler, proven)
- `@expo/vector-icons` with Ionicons — tab bar icons
- No backend; all data mocked in `lib/demoData.js`

## Routing Architecture

`src/app/_layout.tsx` is a `Tabs` navigator. Three visible tabs:
1. `emergency` — Emergency Help
2. `resources` — Resources (owned by another teammate, do not modify)
3. `profile` — Profile

Two hidden screens (no tab bar, `href: null`):
- `emergency-active` — full red screen
- `triage` — decision tree

The custom tab bar (`src/components/custom-tab-bar.tsx`) renders `null` when the current screen is `emergency-active` or `triage`.

## Current App Status

- Expo Router app running in the iPhone simulator
- Frontend only — no backend, API, database, auth, or notifications
- Emergency screen is the active design surface

## Screen Flow

1. `/emergency` — SOS button with 2 breathing rings; double-tap → `/emergency-active`
2. `/emergency-active` — Full red screen; "OK, I'm ready" → `/triage`; "Cancel" → `/emergency`
3. `/triage` — Decision tree; result "Find nearby help" → `/resources`
4. `/resources` — Owned by another teammate; do not touch
5. `/profile` — Find My style map with contact pins

## Design Tokens

```txt
Emergency red:    #E60023
Ring 1:           rgba(230,0,35,0.22)  — 220px
Ring 2:           rgba(230,0,35,0.10)  — 300px
Background:       #FFFFFF
Text primary:     #111111
Text secondary:   #6E6E73
Text muted:       #AEAEB2
Tab active icon:  #E60023
Tab inactive:     #8E8E93
Tab pill:         #F2F2F7
Tab border:       #E5E5EA
```

## Visual Direction

- White backgrounds for standard screens
- Full `#E60023` background for emergency-active
- iOS-like spacing and typography via `fontFamily: 'System'`
- No gradients, no dark mode, no heavy shadows
- Generous whitespace, minimal elements per screen
- Every touchable: `Pressable` with scale `0.96`, opacity `0.85`, spring back on release

## SOS Button Specs

- Button circle: `160px`, static (does not animate itself)
- Ring 1: `220px`, `rgba(230,0,35,0.22)`, breathes `1.0 → 1.06 → 1.0`, `2800ms`, ease-in-out, loops forever
- Ring 2: `300px`, `rgba(230,0,35,0.10)`, same animation with `500ms` phase offset
- Armed state (first tap): rings pulse faster (`1400ms` total cycle), instruction text turns red

## Hold To Cancel Control

- Use `src/components/hold-to-cancel-button.tsx` for emergency-only cancel/back interactions
- Intended for full-screen emergency states where accidental exits would be risky
- Behavior: press and hold for `1000ms` to trigger; releasing early resets progress to `0`
- Visuals: `52px` circular control, translucent pink/red center, white chevron icon, white circular progress ring
- Placement: top-left of emergency screens, padded with safe-area inset so it clears the iPhone status area / Dynamic Island
- Label is optional; use `Hold to cancel` on the initiated emergency screen when space allows
- Keep this control isolated and reusable; do not re-implement hold logic inside individual screens

## Guided Flow Controls

- Use `src/components/guided-flow-back-button.tsx` on normal guided-response screens such as `/triage`
- This control should step back within the local flow on tap
- When the current design calls for it, the same control may support a `1000ms` hold gesture that returns the user to `/emergency`
- Visuals: white circular fill, pale pink border, soft pink shadow, muted coral chevron
- Keep placement top-left and safe-area aware on iPhone layouts
- Use `src/components/step-progress-pill.tsx` for bottom-centered guided-flow progress
- Default progress model is `3` total steps with one compact elongated active segment and inactive gray dots
- The guided triage screen may use `assets/images/triage-response-illustration.png` as the supporting illustration to match the current mockup direction

## Emergency Copy Rules

- Emergency screens must use minimal words by default.
- Main emergency screens should show only:
  1. A short title
  2. One critical instruction
  3. One primary action button
  4. Optional `More guidance`
- Do not place long paragraphs on the main emergency screen surface.
- The default overdose response flow should follow:
  1. `Call`
  2. `Naloxone`
  3. `Breathing`
- Use this exact short-copy direction unless a later task explicitly changes it:
  - `Call help` / `Call 911 now.` / `Call 911` / `I already called`
  - `Give naloxone` / `Spray into one nostril.` / `Naloxone given` / `No naloxone`
  - `Check breathing` / `Are they breathing normally?` / `Yes` / `No / unsure`
  - `Support breathing` / `Keep airway open.` / `Breathing now` / `EMS arrived`
  - `On their side` / `Stay until help arrives.` / `EMS arrived`
- Longer educational instructions belong inside a reusable `More guidance` panel or bottom sheet that is easy to close and never blocks the primary action.

## Layer Boundaries

### Visual Design Layer

Owns colors, spacing, animation feel, shadows, sizing, layout polish.

May touch:
- `src/constants/theme.ts`
- style objects inside components

Must not touch:
- API shapes, data models, business logic

### Frontend UI Layer

Owns screens, components, tap behavior, navigation, local UI state.

May touch:
- `src/app/`
- `src/components/`

Must not:
- invent backend endpoints
- spread flow logic across unrelated screens
