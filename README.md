# CYBOTICS TAP

**Scan. Tap. Beat the ranking.** A mobile reaction game and live arena display for the CYBOTICS ESITH Club Fair.

## What is in this repository

- Mobile-first React + Vite + TypeScript client.
- Express + TypeScript API and Socket.IO server.
- PostgreSQL persistence with startup migrations.
- Server-generated rounds, server-measured response times, server-calculated scores, and per-game ownership checks.
- Live Top 10, event statistics, QR code, result screen, and password-protected admin pages.
- Deployment blueprint for a Render backend/database and a Vercel frontend.

The stand PC only displays `/arena`. Phones connect directly to the public app and backend.

## Architecture

```text
Phone browser ── HTTPS ──> Vercel static client
                                 │ REST + Socket.IO
                                 ▼
                         Render Node service ──> Render PostgreSQL
                                 ▲
Arena PC ───── HTTPS ────────────┘
```

The client receives one round at a time. The server stores the answer, starts the next round timer, checks ordering and game ownership, and calculates the final score from persisted round data. The browser's reported score and reaction time are not accepted as score inputs.

## Requirements

- Node.js 20 or newer.
- Docker Desktop for the local PostgreSQL option, or another PostgreSQL server.
- npm.

## Run locally

1. In the repository root, copy `.env.example` to `.env`. Keep the local database URL and local frontend URLs for development.
2. Start PostgreSQL:

   ```sh
   docker compose up -d
   ```

3. Start the API (migrations run automatically when the server starts):

   ```sh
   cd server
   npm install
   npm run dev
   ```

4. In another terminal, start the client:

   ```sh
   cd client
   npm install
   npm run dev
   ```

5. Open `http://localhost:5173`; the API listens on `http://localhost:3000`. To use a phone on the same Wi-Fi, find the PC's IPv4 address with `ipconfig`, then open `http://<PC-IPv4>:5173` on the phone. The development client automatically uses that same host for API and Socket.IO requests. Allow Node.js through Windows Firewall for private networks if prompted. Local HTTP is for development only.

Build both applications with `npm run build` from `server` and `client` respectively.

## Environment variables

Server variables are read from the repository root `.env` when started from `server`, or from the server process environment:

| Variable | Purpose |
| --- | --- |
| `PORT` | API and Socket.IO port (default `3000`). |
| `NODE_ENV` | Set to `production` on the hosted API. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated if needed. |
| `PUBLIC_GAME_URL` | Canonical public phone URL returned by `/api/config` and encoded in the arena QR code. |
| `ADMIN_SECRET` | Admin login password. Use a unique secret in production. |
| `JWT_SECRET` | Signs admin session tokens. Use a unique secret in production. |
| `DEFAULT_ROUNDS` | Rounds per game (default `20`). |
| `DEFAULT_EVENT_NAME` | Event created when there is no active event. |

For Vercel, set these build variables on the `client` project:

- `VITE_API_BASE_URL=https://<render-service>.onrender.com/api`
- `VITE_SOCKET_URL=https://<render-service>.onrender.com`
- `VITE_PUBLIC_GAME_URL=https://<your-public-game-domain>` (optional client fallback if the API cannot be reached)

Render's `PUBLIC_GAME_URL` is the canonical QR destination, fetched by the arena from `/api/config`; update it when the public phone URL changes. `VITE_PUBLIC_GAME_URL` is only a fallback. Also update Render's `CLIENT_URL` when the frontend domain changes. Never commit `.env` or production secrets.

## Database and game rules

The API applies its schema migration on startup. A new active event is created if none exists. Each round has a stored target and grid; only the current round is returned to that game. Round submissions must be in order and belong to the player's token. Each game's answers can only be recorded once. The server derives reaction time from the round presentation timestamp and uses it with correctness and combo state to calculate score.

The leaderboard sorts by score descending, then average reaction time ascending, then finish time ascending. Replaying creates a new game record; equal nicknames are allowed. Resetting an event archives its games so its old results are retained.

## API and real-time events

All API routes are under `/api`:

- `POST /players` — register a nickname and receive a player token.
- `POST /games/start` — start an independent game (requires `x-player-token`).
- `POST /games/:id/round` — submit the selected item (requires the owning player's token).
- `POST /games/:id/finish` — finalize and rank a completed game.
- `GET /leaderboard` and `GET /leaderboard/player/:playerId`.
- `GET /stats`.
- Admin endpoints under `/admin` for players, games, event management, export, and stats (JWT bearer token required).

Arena Socket.IO updates: `leaderboard:update`, `stats:update`, and `new-record`. On page load the arena also fetches the current leaderboard, so a refresh recovers current results.

## Admin

Open `/admin` and log in with `ADMIN_SECRET`. Admin tools list players and games, delete a game, export CSV, create a new event, archive/reset an event leaderboard, and inspect event statistics. The round count and default event name are configured through server environment variables; the current admin screen does not edit these settings at runtime.

For the event, create/select the intended event before play. Reset archives existing games instead of deleting them. CSV export is for the active event.

## Deploy online

### Render: API and PostgreSQL

1. Push the repository to a Git provider.
2. In Render, create a Blueprint from `render.yaml`.
3. Wait for the web service and PostgreSQL database to finish deploying. The service runs `npm run build` and `npm start`; the server runs migrations at startup.
4. In the service environment, set `CLIENT_URL` to the exact Vercel origin and `PUBLIC_GAME_URL` to the public phone URL. Set unique `ADMIN_SECRET` and `JWT_SECRET` values. Render generates secrets in the blueprint, but replace any test values before the event.
5. Copy the public Render service URL for Vercel configuration.

### Vercel: client

1. Import the repository as a Vercel project and set **Root Directory** to `client` with the Vite preset.
2. Configure `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, and `VITE_PUBLIC_GAME_URL` as described above.
3. Deploy, then verify the client, API health (`https://<render-service>.onrender.com/api/health`), and WebSocket connection over HTTPS.
4. If you change a domain, update the corresponding environment values and redeploy the client. The API CORS origin must exactly match the deployed frontend origin.

The blueprint currently selects Render Postgres Free for setup/testing. Render documents that Free Postgres expires after 30 days and has no backups; upgrade to a paid database before the fair if the results must remain available or recoverable. Free web instances can also sleep, so confirm the service plan, connection limits, and current terms before the fair. Use a persistent PostgreSQL service for event scores.

## Club Fair setup

1. Deploy the API, PostgreSQL, and frontend; verify `/api/health` responds with `{"status":"ok"}`.
2. Open `/admin`, sign in, and create a fresh event for the fair if needed. Check the event name before opening the stand.
3. Open `https://<your-frontend-domain>/arena` on the stand PC and use full-screen mode. Confirm the QR points to the public phone URL.
4. Scan the QR with phones using mobile data or Wi-Fi. Register with a nickname, play, and confirm the score appears in the live ranking.
5. Keep admin access available to monitor games and export CSV at the end.

The PC is a display only. Closing it does not stop API or phone games.

## Load test

The script simulates 10, 25, then 50 independent players. It checks completion and game ID uniqueness, verifies that spoofed scores and duplicate rounds are rejected, confirms repeated finish requests return the same score, and listens for live Socket.IO leaderboard updates:

```sh
node scripts/load-test.mjs https://<test-api-host>
```

It creates player/game rows and should only be run against a test database or event. Do not run it against the live fair leaderboard. A successful run is a result from a real reachable API/database; client/server builds alone do not establish deployment capacity.

## Known operational limits

- A player refresh or browser close during an active game does not restore that in-progress game; incomplete games expire after ten minutes.
- Scores are protected against simple client-side score/reaction-time forgery, duplicate round submissions, and cross-player game access. This is practical event-game validation, not a high-stakes competitive anti-cheat system.
- Socket.IO runs on the same Node service as the API. Multi-instance horizontal scaling would need a shared Socket.IO adapter and coordinated cache invalidation.
