# SafeReach Mobile — CLAUDE.md

## Repo structure

```
SafeReach-RN/
  app/
    (tabs)/
      index.tsx        ← Emergency landing screen (tab 0)
      contacts.tsx      ← Resources tab route (tab title: Resources)
      map.tsx
      profile.tsx
      _layout.tsx
    _layout.tsx
    family-dash.tsx
    family-join.tsx
    camera.tsx
  src/
    AppContext.tsx      ← emergencyActive, startEmergency, userName, saveUserName
    theme.ts           ← colors, radius, font
    screens/
      EmergencyActiveScreen.tsx
    components/
      ChatInterface.tsx
```

## In-progress changes

### Resources tab redesign (branch: edits)
- **File:** `app/(tabs)/contacts.tsx`
- **Route note:** The tab layout currently exposes `contacts.tsx` with the title `Resources`; this file is intentionally serving the Resources tab in this repo.
- **Goal:** Keep Resources calm, location-first, and non-overwhelming instead of a broad article directory.
- **Design:** White iOS-like screen with `Resources` title, short subtitle, exactly 3 nearby demo resource cards, one compact `How to use naloxone` guide, and one small `Call 911` fallback action.
- **Data:** Nearby results are mocked demo data; no GPS permissions, backend, or complex map logic added.
- **Do not touch for this work:** emergency, triage, profile, tab bar, map implementation, or unrelated flows.
- **911 urgent-help card:** Must remain visually polished, high-priority, and consistent with the app's soft emergency aesthetic — warm pinkish tint (`#FFF1F2`), refined red border, prominent "Call 911" headline (`font['2xl']`, weight `800`), and a clearly labeled pill button ("Call 911"). Do not let it become visually loud, flashy, or disconnected from the rest of the screen.

### Emergency screen redesign (branch: edits)
- **File:** `app/(tabs)/index.tsx`
- **Goal:** Replace dark cluttered layout with white minimal iOS-native design
- **Design spec:** White background, "Emergency Help" title, gray subtitle, large red SOS button with two soft-pink concentric rings, "Double-tap to confirm" hint, footer disclaimer
- **Functional flow preserved:** `handleSOS → startEmergency()`, `if (emergencyActive) return <EmergencyActiveScreen />`
- **Removed visual sections:** dark status bar, tips row, name prompt, join-family button — these were the "clutter" being replaced
- **Do not touch:** `src/app/resources.tsx` (does not exist in this repo)

## Back button component (branch: edits)

- **File:** `src/components/EmergencyBackButton.tsx`
- **Contract:** `onBack` (tap → step back), `onHoldComplete` (1000ms hold → exit emergency)
- **Used in:** `src/screens/EmergencyActiveScreen.tsx` — rendered in `stepNav` row above `StepPill` during steps 1–3
- **Hold behavior:** Short press fires `onBack`. Press-and-hold ≥1000ms fires `onHoldComplete` + heavy haptic + cancels animation. The existing header "End" button is preserved as a redundant exit.
- **Visual:** 36px circle, hairline border, animated border color during hold (white→red), light iOS-native language
- **Do not:** replace the header "End" button, split `EmergencyActiveScreen` into per-step routes, or change `endEmergency` semantics

## Profile screen redesign (branch: edits)

- **File:** `app/(tabs)/profile.tsx`
- **Design:** White background, map-forward — `MapView` card (230px, light UI style), category filter chips, Overpass-powered nearby list, footnote
- **Account action:** Top-right 36px circle button — shows initials if `userName` set, person icon outline if not. Opens a slide-up Modal with name TextInput wired to `saveUserName()`, info rows, and disclaimer
- **Tab exposed:** `href: null` removed in `app/(tabs)/_layout.tsx`; Profile tab now visible with a person SVG icon
- **Navigation:** Tapping the map card navigates to `/(tabs)/map` (full map screen remains unchanged)
- **Data:** Duplicates haversine + Overpass fetch from `map.tsx` — do not consolidate without confirming `map.tsx` is safe to touch
- **Do not touch:** `app/(tabs)/map.tsx` (working, dark-themed, teammate-adjacent)

## Voice / Mic Transcription (emergency chat)

- **File:** `src/components/ChatInterface.tsx` — `transcribeAudio`, `startVoice`, `stopVoice`
- **Service:** OpenAI Whisper (`whisper-1`) called directly from the frontend via `EXPO_PUBLIC_OPENAI_API_KEY`
- **Root cause of Whisper 401:** `EXPO_PUBLIC_OPENAI_API_KEY` env var was unset → empty Bearer token → 401
- **Fix applied:** `transcribeAudio` now throws `TRANSCRIPTION_UNAVAILABLE` sentinel when key is absent; `stopVoice` catch shows a clean user-facing alert instead of the raw API error string
- **Demo fallback:** When no key is set, user sees: *"Voice transcription is unavailable. Please type your message instead."*
- **Security rule:** Never expose OpenAI keys in the app binary. Production path must proxy through a backend endpoint. The `EXPO_PUBLIC_` prefix makes the key visible in the bundle — this is acceptable for demos only.
- **Never** show raw provider error strings (`Whisper 401`, etc.) to users — log in dev only via `__DEV__ && console.warn`
- **Env vars:** See `.env.example` for all required keys. Copy to `.env` (gitignored) and restart Expo to activate.

## Code Architecture Goal

The repository is organized into clean isolation layers. Each layer should mostly talk only to adjacent layers:

| Layer | Owns | Should not touch |
|---|---|---|
| **Visual design** | Colors, spacing, typography, layout polish | Backend/API logic |
| **Frontend UI** | Components, screens, forms, state | Backend internals |
| **Frontend API contract** | Request/response shapes, `src/lib/api.js` | Styling |
| **Backend routes** | Endpoints, validation, JSON responses | UI layout |
| **Backend services / AI** | Prompts, parsing, mock/database logic | Frontend styling |

## Constraints

- Never touch a file owned by another teammate without explicit permission
- Prefer isolated UI-layer edits; do not spread logic changes
- Keep `emergencyActive` guard and haptics behavior intact
- Do not split `EmergencyActiveScreen` into per-step route files
