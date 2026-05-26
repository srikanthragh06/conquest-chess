# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Running locally (recommended)
```sh
docker-compose up --build -d   # starts server (3000), web (5173), Redis (8001), Postgres (8000)
docker-compose down
```

### Server (without Docker)
```sh
cd server
npm run dev      # nodemon + ts-node, uses .env.dev
npm run build    # tsc compile to dist/
npm run serve    # run compiled dist/main.js
```

### Web (without Docker)
```sh
cd web
npm run dev      # Vite dev server, needs VITE_SERVER_URL in .env
npm run dev1     # forces VITE_SERVER_URL=http://localhost:3000
npm run dev2     # forces VITE_SERVER_URL=http://localhost:3001
npm run build    # tsc + vite build
npm run lint     # eslint
```

## Environment Variables

**server/.env.dev** must include:
- `MODE` — `"dev"` or `"prod"`
- `CLIENT_URL` — allowed origin in dev mode
- `CLIENT_URL_1`, `CLIENT_URL_2` — two allowed origins in prod mode
- `SERVER_PORT` — port the HTTP server listens on
- `REDIS_HOST`, `REDIS_PORT`
- Postgres connection vars (used by `db/postgres.ts`)

**web/.env.dev** (or `.env`):
- `VITE_SERVER_URL` — base URL of the backend (e.g. `http://localhost:3000`)

## Architecture

### Overview
Full-stack real-time multiplayer chess app. All game and lobby state lives in Redis (fast, ephemeral). Completed games and user accounts are persisted in Postgres. Socket.IO carries all real-time game events; Express handles REST auth and user profile endpoints.

### Server (`server/src/`)

**Entry point flow**: `main.ts` wires `io.on("connection", handleIOConnection)`, registers Express middleware and routes, then starts the HTTP server.

**Socket layer** (`sockets/`): Every socket event is registered in `sockets/main.ts` and wrapped with `safeSocketHandler` (catches and logs errors without crashing). Event handlers live in separate files: `user.ts` (register, ongoing-game), `lobby.ts` (create/join/leave lobby, match/participant select), `game.ts` (start-game, make-move, resign, draw, timeout, get-game, get-time), `queueMatch.ts` (matchmaking queue), `disconnect.ts`.

**Redis** (`redis/`): Two clients — `redisClient` for reads/writes, `redisSubscriber` (psubscribe-only) for pub/sub. All keys are namespaced under `chess-app:`. Key patterns:
- `chess-app:gameId:{id}:game` — live game state (JSON `gameType`)
- `chess-app:gameId:{id}:moves` — move list
- `chess-app:userId:{id}:socketId` / `chess-app:socketId:{id}:userId` — bidirectional socket↔user mapping
- `chess-app:userId:{id}:gameId` — user's current game
- `chess-app:lobbyId:{id}:lobby` — lobby state
- `chess-app:guestId:{id}:guest` — guest sessions (7-day TTL)

Concurrent mutations (lobby start, move) use `executeWithRetry` in `redis/client.ts` — WATCH + MULTI/EXEC with retry on conflict.

**Redis pub/sub** (`redis/pubsub.ts`): The server publishes to channels (`chess-app:game-update:{id}`, `chess-app:game-over:{id}`, `chess-app:lobby-update:{id}`, etc.) and `onSubscribePMessage` fan-outs to Socket.IO rooms via `socketEmitRoom`. This is the mechanism for multi-instance scalability.

**Database** (`db/`): Generic query helpers in `db/queries.ts` (`insertRecord`, `updateRecords`, `findOneWithCondition`). Schema has three tables: `Users` (auth + stats), `Games` (completed game records), `Moves` (per-game move log with timestamp). Game state is saved to Postgres only on game-over.

**HTTP routes** (all prefixed `/api`):
- `/api/auth` — signup, login (JWT issued)
- `/api/user` — profile, game history

**Auth flow**: JWT stored client-side. On socket connect, client emits `register-user` with the JWT. Server validates it, maps `userId ↔ socketId` in Redis, and emits back `registered-user`. Guests get a `guestId` created in Redis (no Postgres record).

### Web (`web/src/`)

**Routing** (`App.tsx`): React Router with routes for `/`, `/auth`, `/lobby/:lobbyId`, `/game/:gameId`, `/user/:username`.

**Socket** (`socket/main.ts`): Single shared `socket` instance (autoConnect: false, path `/socket`). `useSocket` hook (called once in `App`) manages connect/disconnect, `register-user` handshake, and ping/pong latency measurement.

**State** (Recoil atoms in `store/`): `auth.ts` holds `userDetails` (id, isGuest) and `isRegistered`. `page.ts` holds error dialog state and loading flags. `connection.ts` holds ping latency.

**API** (`api/`): Axios instance in `api/client.ts` with `baseURL = VITE_SERVER_URL + "/api"`. Thin wrappers in `api/auth.ts` and `api/user.ts`.

**Hooks pattern**: Feature logic lives in hooks (`useGame`, `useLobby`, `useQueueMatch`, etc.) that subscribe to socket events and update local state. Components stay presentation-focused.

**Game logic**: `chess.js` runs on both client and server for move validation. `react-chessboard` renders the board. `useTimers` manages the clock display client-side; authoritative time is tracked server-side in Redis.

### Socket.IO path
Both client and server use path `/socket` (not the default `/socket.io`). This must be consistent in any nginx proxy configuration:
```nginx
location /socket/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
