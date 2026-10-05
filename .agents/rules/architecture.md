# Architecture & Coding Guidelines

`iina-emby` is an open-source macOS media plugin connecting [IINA](https://iina.io/) video player with [Emby Media Server](https://emby.media/). It renders an embedded web interface inside IINA's standalone window and controls video playback via IINA's native JavaScript plugin API.

---

## 1. Tech Stack & Environment

* **Plugin Backend (`plugin/`):** TypeScript, compiled with `tsup` into CommonJS (`dist/plugin/index.js`, `dist/plugin/global.js`) using IINA Plugin API.
* **Frontend UI (`app/`):** React 19, TypeScript, React Router 7 (`HashRouter`), `@tanstack/react-query` (caching & server state), Vite with `vite-plugin-singlefile` compiling into `dist/client/index.html`.
* **Realtime Sync:** Emby WebSocket (`emby-websocket-client.ts`) for instant cache invalidation upon server library/user changes.
* **Shared Code (`shared/`):** Shared interfaces, types, and utility functions imported as `@shared`.
* **Styling:** CSS Modules (`*.module.css`) + strict design tokens in `app/theme/tokens.css`.
* **Testing:** [Vitest](https://vitest.dev/) for unit and integration testing.
* **Linting & Formatting:** [Biome](https://biomejs.dev/) (`biome check .`, `biome format --write .`).
* **Icons:** `@tabler/icons-react`.
* **Runtime:** macOS WKWebView inside IINA standalone window.

---

## 2. Project Structure & Layer Separation

```
iina-emby/
├── plugin/           # IINA Plugin Backend (Node/CommonJS, runs inside IINA)
│   └── src/
│       ├── index.ts              # Plugin entrypoint (window management, menu items)
│       ├── global.ts             # Global background service
│       └── lib/
│           ├── server-session-store.ts # Server credentials & sessions (IINA preferences)
│           └── webview-bridge.ts       # IPC relay between IINA and React UI
├── app/              # Frontend Web UI (React 19, single-file bundle for WKWebView)
│   ├── components/   # Feature and layout components
│   │   └── ui/       # Design system primitives (Button, DropdownMenu, GlassElement, etc.)
│   ├── hooks/        # React hooks (useIINABridge, useInfiniteScroll, useSeriesEpisodes, etc.)
│   ├── lib/          # Emby API & Query clients (emby-*-client.ts, query-client.ts, query-keys.ts)
│   ├── routes/       # React Router route pages (HashRouter)
│   └── theme/        # CSS design tokens (tokens.css)
└── shared/           # Cross-boundary shared code (imported as "@shared")
    ├── types/        # TypeScript interfaces for Emby models and IPC messages
    └── utils/        # Shared helpers (image URL generation, ticks-to-seconds, etc.)
```

### Import Rules:
* `@shared` is mapped in tsconfig. Both `plugin/` and `app/` may import from `@shared`.
* `plugin/` code **must never** import from `app/`.
* `app/` code **must never** import from `plugin/` or `iina` native modules.
* Cross-boundary communication happens **strictly through typed IPC messages** (`postMessage`). All message types must be registered in `BridgeInboundMap` or `BridgeOutboundMap` in `shared/types/bridge.ts`.

---

## 3. Emby API Integration & Client Rules

All API calls must reside in `app/lib/emby-*-client.ts`:

1. **Authentication Headers:**
   Always use `buildAuthHeaders(server.accessToken, ...)`:
   ```ts
   headers: buildAuthHeaders(server.accessToken, { Accept: "application/json" })
   ```

2. **Caching & Request Deduplication Strategy (TanStack Query):**
   * **Pure Fetchers:** All API functions in `app/lib/emby-*-client.ts` are pure network fetchers accepting `server: EmbyServer`, options, and optional `signal?: AbortSignal`.
   * **Centralized Query Keys:** Always use centralized query key factories from `app/lib/query-keys.ts` (`embyKeys`). Never hardcode string array keys.
   * **Cache Lifetimes:** Default `staleTime` is 5 minutes, `gcTime` is 30 minutes (`app/lib/query-client.ts`).
   * **Realtime Invalidation via WebSocket:**
     * `embyWebSocket` listens to Emby WebSocket events (`LibraryChanged`, `UserDataChanged`).
     * On `LibraryChanged` / `UserDataChanged`, it dispatches `queryClient.invalidateQueries({ queryKey: embyKeys.server(serverId) })`, keeping views, shelves, continue watching, and item states synchronized automatically.

3. **Streamability & Container Rule (CRITICAL):**
   * **Only `Episode` and `Movie` items are playable video streams.**
   * **NEVER** pass a `Series` or `Season` ID to `buildStreamUrl(server, id)` or attempt to play a container item. Emby returns `400 Bad Request` / `cannot open file or stream`.
   * When playing a series:
     1. Use `nextUpEpisode` if available (from `/Shows/NextUp`).
     2. If `nextUpEpisode` is null (no watch history yet or series completed), fall back to the first episode of the series (`S01E01`) using `fetchEpisodes(server, seriesId, undefined, signal, false, 1)`.
     3. Always guard playback: `if (playTarget.Type === "Series") return;`.

4. **Multi-User Server Sessions:**
   * A single Emby server URL may have multiple distinct user accounts.
   * Servers are identified and matched by `id` first, or by `(serverUrl + userId)`.
   * Never match or deduplicate servers solely by `serverUrl`.

---

## 4. React Architecture & State Management

1. **Router:**
   * The app runs inside WKWebView via `HashRouter` (`/#/path`).
   * Never use `BrowserRouter` as it breaks inside file:// or standalone window contexts.

2. **State Management & Data Fetching:**
   * Use TanStack Query (`useQuery`, `useMutation`) for all server-bound state.
   * Feature hooks (`useContinueWatching`, `useLibrarySections`, `useSeriesEpisodes`) encapsulate `useQuery` calls using keys from `embyKeys`.
   * **Optimistic Updates:** Use `queryClient.setQueryData` for immediate UI feedback (e.g. metadata identify preview or played toggles).
   * **WebSocket Lifecycle:** `embyWebSocket` is a singleton manager that handles connection reuse and reconnects. Do not aggressively call `disconnect()` on every effect re-render or during the `CONNECTING` phase.

3. **Infinite Scrolling & Progressive Rendering:**
   * Never implement ad-hoc `IntersectionObserver` loops in components; always use the shared `useIntersectionSentinel` hook (`app/hooks/useIntersectionSentinel.ts`).
   * For server-paginated data (where pages are fetched over HTTP as you scroll), use `useInfiniteScroll<T>` from `app/hooks/useInfiniteScroll.ts`.
   * For large in-memory collections (loaded once into client memory for instant filtering/sorting), use `useProgressiveScroll<T>` from `app/hooks/useProgressiveScroll.ts` to incrementally render DOM nodes and images.
   * Routes should remain thin presenters focusing on UI composition and headers.

4. **Preventing Infinite Loops in Bridge / Effects:**
   * `activeServer` in `useIINABridge` and `item` in parent components are object references.
   * **Never** place full `activeServer` or `item` objects in `useCallback` or `useEffect` dependency arrays.
   * Always decompose dependencies into primitives:
     ```ts
     [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken, activeServer?.userId, item?.Id, item?.Type]
     ```

5. **Resource Cleanup:**
   * All asynchronous API calls in effects must accept an `AbortSignal` and abort on effect cleanup.
   * Polling loops (e.g. `LibraryScan`) must clear intervals and abort controllers on unmount.

---

## 5. Language & Commit Conventions

* **Zero Cyrillic in Source Code:** All code, comments, CSS, and user-facing UI text must be in idiomatic English.
* **Conventional Commits:** Write commit messages using `feat(...)`, `fix(...)`, `perf(...)`, `refactor(...)`.

---

## 6. Common Commands & Verification

Always verify before committing:
```sh
# Lint and format check (Biome)
pnpm run lint

# Auto-format codebase
pnpm run format

# Run automated tests (Vitest)
pnpm run test

# Typecheck TypeScript
pnpm run typecheck

# Build both client (Vite singlefile) and plugin (tsup)
pnpm run build

# Development watch
pnpm run dev
```
Ensure 0 linter errors, 0 test failures, 0 TypeScript errors, and successful production bundling.
