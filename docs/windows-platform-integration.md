# Aventas Companion — Windows platform integration

## Implemented

The Windows app is a Tauri 2 + React UI. The website Cloudflare Worker/D1 is authoritative.

- **Tournaments** reads the website's public /api/tournaments list and /api/tournaments/:slug detail (teams, matches, score, champion). Selected brackets refresh while the screen is open. The desktop app never creates seeds, scores or matches.
- **Live Tracker** signs into an existing Aventas website account with email/password using /api/auth/login. The bearer token is held in native Rust process memory and is not returned to React or written to browser storage/disk. Sign-out calls /api/auth/logout when reachable and always clears local memory. Restarting the app requires sign-in again.
- The Rust API bridge allows only profile, dashboard, matches, agents, maps, progress, insights, and analytics over HTTPS to the fixed Aventas website origin; there is no arbitrary URL fetch or privileged bot key.
- The tracker displays backend data only; if Riot data is absent or RSO unauthorized, it renders an explicit unavailable state rather than fake match results. Pre-existing demo Analysis screens still have their demo notices.
- **Gaming Utilities** includes supported local VALORANT process detection and an observation timer while this tab is open. Historical overlay controls remain opt-in; no game-memory scanning, injection, opponent scouting or unauthorized live data capture.

## Shared website change

Paired website PR: https://github.com/Aventas-Org/Aventas-website/pull/131

A real authenticated website member receives a private, empty Companion user row on first access if one does not exist. The website session is authoritative; the public player directory remains opt-in; no Riot identity, match, rank, or real-time feed is inferred. The website returns 401 without a valid session except for its explicitly configured development demo fallback.

## Not yet available

A Tracker.gg-scale **production** Riot tracker requires approved Riot production application credentials, player-authorized Riot Sign On, backend ingestion, rate-limit handling, privacy review, and real-world acceptance tests. The website's Riot transport has development-only stubs. Do not scrape VALORANT process memory or derive opponents' live statistics. Discord-only accounts cannot yet use email/password desktop login; a secure browser/device authorization extension is a separate requirement.

Official tournament registration/check-in, Discord private captain verification, Windows hardware telemetry and software auto-update distribution also need further scoped API and permission checks. The bot's separate bracket.announced consumer does not depend on desktop authentication.

## Release checks

1. Run npm ci, npm run build and the Windows Tauri installer workflow against the exact PR head.
2. Use distinct test accounts to verify isolation. Check an account without a Riot link has no invented history, and a revoked token cannot retrieve data. No credentials should be persisted by the webview.
3. Select a real staging tournament and compare matches, score corrections, champion and timestamps against website API results; verify empty/offline states.
4. Test login/logout, restart, and overlay on a real Windows desktop. A green compiler build is not a substitute for this smoke test.
5. Stage Website Worker/D1 and bot separately; review migrations and event versions; roll out bot then website then desktop in compatible stages. Never send public Discord announcements during CI.
