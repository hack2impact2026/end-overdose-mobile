# SafeReach Mobile — AGENTS.md

## Repo structure

```
SafeReach-RN/
  app/
    (tabs)/
      index.tsx        ← Emergency landing screen (tab 0)
      contacts.tsx
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

### Emergency screen redesign (branch: edits)
- **File:** `app/(tabs)/index.tsx`
- **Goal:** Replace dark cluttered layout with white minimal iOS-native design
- **Design spec:** White background, "Emergency Help" title, gray subtitle, large red SOS button with two soft-pink concentric rings, "Double-tap to confirm" hint, footer disclaimer
- **Functional flow preserved:** `handleSOS → startEmergency()`, `if (emergencyActive) return <EmergencyActiveScreen />`
- **Removed visual sections:** dark status bar, tips row, name prompt, join-family button — these were the "clutter" being replaced
- **Do not touch:** `src/app/resources.tsx` (does not exist in this repo), contacts owned by teammates

## Constraints

- Never touch a file owned by another teammate without explicit permission
- Prefer isolated UI-layer edits; do not spread logic changes
- Keep `emergencyActive` guard and haptics behavior intact
