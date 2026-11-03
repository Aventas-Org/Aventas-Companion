# Aventas Companion

**Your competitive desk for Windows.** A personal workspace for verified
VALORANT performance, Aventas tournament brackets, opted-in public player
profiles and local system monitoring.

Aventas Companion is a [Tauri v2](https://tauri.app/) desktop application
built with React, TypeScript and Rust. It is part of the Aventas platform
alongside [the website](https://github.com/Aventas-Org/Aventas-website) and
[tournament Discord service](https://github.com/Aventas-Org/Aventas-tournaments).

## Try the Windows preview

1. Open [Companion Windows builds](https://github.com/Aventas-Org/Aventas-Companion/actions/workflows/build-windows.yml).
2. Choose the **latest successful** build for `main`, or the verified PR head
   indicated in release notes.
3. Download the `aventas-companion-windows-x64` artifact from that run.
   Extract the ZIP and launch the NSIS `.exe` installer (or MSI).
4. Open Companion on Windows, browse Tournaments / Device / Practice lab,
   and connect a website test account in Live Tracker.
5. Note any UI or runtime issues using the checklists in
   [docs/companion-design-system.md](docs/companion-design-system.md).

**Preview builds are unsigned.** Windows may show a SmartScreen warning.
Do not bypass workplace security policies; the public release will need
proper code signing and real-device compatibility testing.

## Features

| Workspace | Data source | Status |
|---|---|---|
| Home | Website account + public events + Windows process | Preview |
| Live Tracker | Authenticated website Companion API | Preview; data may be empty pending Riot approval |
| Match archive, agents, maps, progression, insights | Authenticated owner-only website API | Preview |
| Tournaments + full brackets | Official public website D1 snapshots | Preview, read-only |
| Player directory | Explicitly opted-in website profiles | Preview |
| Gaming utilities | Windows read-only CPU, RAM and process APIs | Preview |
| Practice lab | Clearly labeled simulated fixtures | Demo |
| Overlay | Historical self-only sample HUD | Demo, opt-in |

The website owns official event registrations, matchups, scores and results.
The Discord bot publishes organizer-approved official brackets; the desktop
client **never** invents competing tournament records.

The production VALORANT ingestion pipeline still requires approved Riot access
and player consent. Companion does not inject into VALORANT, inspect memory,
scrape opponents or bypass Vanguard. The test build is functional without
a Riot token, but real gameplay history may be empty until account linking
is approved.

## Development

On Windows with Node.js 24+, a Rust MSVC toolchain and Tauri Windows prerequisites:

```powershell
npm ci
npm test
npm run build
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run tauri:dev
```

To package a local Windows installer:

```powershell
npm run tauri:build
```

The frontend is **not** a standalone authenticated web client: the website
transport and session token are intentionally handled in Rust native commands.
Running only `npm run dev` does not provide the native API and process detector.

## Architecture and privacy

- `src-tauri/src/platform_api.rs` — reviewed, allowlisted HTTPS APIs, native
  memory-only website session, public tournament browser opener.
- `src-tauri/src/process.rs` and `system_metrics.rs` — read-only Windows OS
  queries; no game state access.
- `src/pages/` — data-driven workspaces and explicit offline/empty states.
- `src/components/WorkspaceUI.tsx` — shared Aventas presentation primitives.
- `src/services/tournamentContract.mjs` — official bracket payload validator.
- `docs/platform-release-gates.md` — coordinated website/bot/desktop rollout.
- `docs/companion-design-system.md` — design rationale and Windows test plan.

Authenticated website bearer tokens remain inside the native process, never in
React state or localStorage. The overlay cannot access account or official
website APIs. Opt-in public profiles never include email, PUUID or private
individual matches. Losing network access does not silently substitute demo
statistics for real data.

## Current external release gates

- **Riot RSO / production VALORANT API** — application access, player consent
  and approved backend match ingestion.
- **Public distribution** — signed installer, staged website/tournament
  acceptance and real Windows smoke tests.

Track outstanding work in [GitHub Issues](https://github.com/Aventas-Org/Aventas-Companion/issues).
