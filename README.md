# Lexipal Frontend
### A personal reading space built with React and TypeScript

The web interface for **Lexipal**, my graduation project and reading companion. Readers can organise their library, track reading sessions, save notes and vocabulary, and follow their progress over time.

[Backend and project overview](https://github.com/ErikEdman1996/FinalExam_Lexipal) · [Application entry point](src/main.tsx) · [API client](src/api/api.ts)

## Features

- Personal library, book details and reading lists.
- Reading sessions with reflections, notes and word lookups.
- Book circles with shared reading and chat.
- Challenges, flashcards, crosswords, XP and streaks.
- Keycloak authentication and profile onboarding.
- Responsive application shell and bottom navigation.

## Technology

| Area | Stack |
| --- | --- |
| UI | React 18, TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Navigation | React Router |
| Authentication | Keycloak JS |
| Quality checks | ESLint, TypeScript compiler |

## Run locally

Use a current **Node.js 22 LTS** release (the major version is pinned in [.nvmrc](.nvmrc)) and npm. Start the [backend](https://github.com/ErikEdman1996/FinalExam_Lexipal#run-locally), PostgreSQL and Keycloak first.

```bash
git clone https://github.com/ErikEdman1996/FinalExam_Lexipal_Frontend.git
cd FinalExam_Lexipal_Frontend
npm ci
cp .env.example .env.local
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`. Open **http://localhost:5173**.

### Environment

The application reads its configuration from Vite environment variables. See [.env.example](.env.example).

| Variable | Local value |
| --- | --- |
| `VITE_API_ROOT_URL` | `http://localhost:8585` |
| `VITE_KEYCLOAK_URL` | `http://localhost:8080` |
| `VITE_KEYCLOAK_REALM` | `Lexipal_Realm` |
| `VITE_KEYCLOAK_CLIENT_ID` | `Lexipal_Frontend` |
| `VITE_KEYCLOAK_BACKEND_CLIENT_ID` | `Lexipal_Backend` |

Vite variables are part of the browser bundle: they must not contain secrets. Restart the dev server after changing them. When no API root is supplied, Vite forwards `/lexipal` requests (including WebSockets) to port 8585.

### Keycloak configuration

Configure a public OpenID Connect client named `Lexipal_Frontend` in `Lexipal_Realm`, with Standard Flow enabled:

- Valid redirect URIs: `http://localhost:5173/*`
- Valid post-logout redirect URIs: `http://localhost:5173/*`
- Web origins: `http://localhost:5173`

The frontend uses `check-sso`, then loads the user's backend profile and displays nickname onboarding when needed. Configure backend roles and token claims consistently with the backend JWT converter.

Vite uses `strictPort: true` to keep redirect URLs predictable. Free port 5173 rather than silently starting on another port.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check application TypeScript |
| `npm run build` | Type-check and produce the production bundle |
| `npm run preview` | Preview the built bundle locally |

Before submitting a change:

```bash
npm run lint
npm run typecheck
npm run build
```

These are static/build checks; the repository does not define an automated frontend test command.

## Code map

| Path | Responsibility |
| --- | --- |
| [src/main.tsx](src/main.tsx) | Application bootstrap |
| [src/api/api.ts](src/api/api.ts) | Backend API access |
| [src/features/auth](src/features/auth) | Keycloak and authentication state |
| [src/components](src/components) | Shared UI components |
| [vite.config.ts](vite.config.ts) | Development server and proxies |

## Manual checks

After a change, verify sign-in and sign-out, book search and creation, reading sessions and notes, vocabulary practice, book circles and chat, and profile progress.

This repository is the frontend portion of a graduation project with continued development. A working backend and a configured Keycloak realm are required; a realm export is not included.

Built by **Erik Edman** · [LinkedIn](https://www.linkedin.com/in/erik-edman-b98a12395/)
