# SafeReach / End Overdose Mobile App

A minimal emergency overdose response mobile app with clean iOS-style UI, two emergency entry paths, a hold-to-exit safety pattern, and isolated frontend/backend architecture so design, UI, API contracts, and backend logic can be worked on independently.

## Code Architecture Goal

The repository is organized into clean isolation layers:

| Layer | Owns | Should not touch |
|---|---|---|
| **Visual design** | Colors, spacing, typography, layout polish | Backend/API logic |
| **Frontend UI** | Components, screens, forms, state | Backend internals |
| **Frontend API contract** | Request/response shapes, `src/lib/api.js` | Styling |
| **Backend routes** | Endpoints, validation, JSON responses | UI layout |
| **Backend services / AI** | Prompts, parsing, mock/database logic | Frontend styling |

*Rule of thumb: each layer should mostly talk only to adjacent layers.*