# SafeReach — Expo React Native App

## Quick Start

```bash
cd SafeReach-RN

# Install dependencies
npm install

# Set up your API keys
cp .env.example .env
# Edit .env with your actual keys

# Run on iOS simulator
npx expo start --ios

# Run on Android
npx expo start --android

# Run in browser (limited features)
npx expo start --web
```

## API Keys Needed

1. **Claude API Key** (`EXPO_PUBLIC_CLAUDE_API_KEY`) — from https://console.anthropic.com
   - Powers the Reach AI chat companion
   - Powers the AI symptom vision scanner

2. **Google Maps API Key** (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`) *(optional)*
   - The map tab uses react-native-maps with Apple/Google Maps
   - Works without a key on iOS (uses Apple Maps natively)

## Features

| Feature | Status |
|---------|--------|
| SOS button with animated rings | ✅ |
| Reach AI chat companion | ✅ (needs Claude API key) |
| AI symptom camera scan | ✅ (needs Claude API key) |
| GPS location tracking | ✅ |
| Family join session | ✅ |
| Family live map dashboard | ✅ |
| Emergency contacts | ✅ |
| Nearby hospitals/pharmacies map | ✅ |
| Share alert / copy code | ✅ |
| Text-to-speech (Reach's voice) | ✅ |
| Haptic feedback | ✅ |
| Call 911 | ✅ |

## Architecture

```
app/
  _layout.tsx          — Root layout (providers, safe area)
  (tabs)/
    _layout.tsx        — Bottom tab navigator
    index.tsx          — Emergency tab (Home + Active Emergency)
    contacts.tsx       — Emergency contacts manager
    map.tsx            — Nearby resources map
    profile.tsx        — User profile
  camera.tsx           — AI symptom scanner (full screen modal)
  family-join.tsx      — Join a session by code
  family-dash.tsx      — Family member live view

src/
  AppContext.tsx        — Global state (emergency, session, user)
  config.ts            — AI prompts, API config, fallbacks
  theme.ts             — Colors, spacing, typography
  utils/session.ts     — Session management (AsyncStorage)
  screens/EmergencyActiveScreen.tsx
  components/ChatInterface.tsx
```

## Notes

- Sessions are stored locally on each device via AsyncStorage
- For real multi-device family sessions, you need a backend (Firebase, Supabase, etc.)
- The Twilio SMS integration from the web version requires a backend endpoint
- Deep link join flow (/join/CODE) requires configuring expo-linking in app.json
