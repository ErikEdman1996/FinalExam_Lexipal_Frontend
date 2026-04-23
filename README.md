# Lexipal Frontend

Frontend for Lexipal, a React + TypeScript reading companion with library tracking, reading sessions, BookCircles, Codex capture, challenges, XP progression, and Keycloak-based sign-in.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Keycloak

## Requirements

- Node.js 22+
- npm 10+
- A running Lexipal backend
- A running Keycloak instance

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the backend services the frontend expects:

- Backend API at `http://localhost:8585`
- Keycloak at `http://localhost:8080`

3. Review authentication settings in `src/features/auth/keycloak.ts`.

Current defaults:

- `url`: `http://localhost:8080`
- `realm`: `Lexipal_Realm`
- `clientId`: `Lexipal_Frontend`

4. Optionally set `VITE_API_ROOT_URL` if the API is not served from the same origin.

Example `.env.local`:

```bash
VITE_API_ROOT_URL=http://localhost:8585
```

If `VITE_API_ROOT_URL` is omitted, Vite proxy rules in `vite.config.ts` forward `/lexipal` and `/test` to `http://localhost:8585` during local development.

## Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` runs the production build
- `npm run lint` runs ESLint
- `npm run typecheck` runs `tsc --noEmit -p tsconfig.app.json`
- `npm run preview` serves the built app locally

## Quality Gates

Run these before shipping changes:

```bash
npm run lint
npm run typecheck
npm run build
```

## Project Notes

- The main app entry is `src/main.tsx`.
- API access lives in `src/api/api.ts`.
- App-wide auth state is managed from `src/features/auth/AuthProvider.tsx`.
- Bottom navigation and responsive shell UI live in `src/components/BottomNav.tsx`.

## Authentication Flow

- The app initializes Keycloak with `check-sso`.
- After authentication, the frontend bootstraps the current profile from the backend.
- If the user still needs onboarding, the nickname flow is shown before normal app usage.

## Current Development Assumptions

- Backend routes are served under `/lexipal/api/v1`
- Dictionary lookups also use `/test`
- Keycloak configuration is currently checked into source rather than loaded from env

## Manual Regression Checklist

- Library search, card navigation, and add-book flow
- Book details, notes, and reading-session entry
- Reading session reflection, word lookup, and note capture
- BookCircles create, join, copy-code, and member-details flows
- Codex page navigation and captured-word detail modal
- Challenge and flashcard flows
- Profile nickname update, streaks, and recent activity
