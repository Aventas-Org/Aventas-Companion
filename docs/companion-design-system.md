# Aventas Companion — product experience system

## Direction: the competitive command desk

Aventas is an esport player's **personal workstation**, not a marketing landing page.
The product's visual voice is **restrained editorial / precision instrument**:
native Windows typography, compact technical labels, high-contrast data, one warm
Aventas coral accent, narrow status colors only when they convey real state, and
asymmetric reading patterns where they make data easier to scan.

### Design decisions

- Keep the existing Bahnschrift + Segoe UI Variable pairing. They are native on
  Windows, require no web fonts and keep offline rendering deterministic.
- Backgrounds use existing Aventas color tokens and flat/graduated surfaces,
  not purple gradients, visual noise, unearned 3D and decorative glass cards.
- Data tables, event indices, meters, bracket matchup cards and progress states
  own their layouts; avoid making every feature an identical grid of metric cards.
- Every metric must trace to an actual website or native OS response. Never
  display invented matches, KDA, ranks, scores, player lists or stream health.
- Tokenized theme presets and user accent choices remain supported.
- Distinguish live/official/opted-in from guest/demo/unverified at all times.
- Animations should be mostly hover/focus micro-feedback and page entrance;
  the existing prefers-reduced-motion override remains authoritative.
- All loading, empty, error, disconnected and permission-unavailable states must
  communicate the exact limitation and provide a recoverable action if useful.
- Preserve the existing app shell and command palette with Ctrl+K navigation.

## Researched open-source guidance

Design and interaction references, **not copied templates or bundled code**:

- Anthropic [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design):
  deliberate aesthetic direction, typography, purposeful hierarchy.
- Vercel [agent-skills / web-design-guidelines](https://github.com/vercel-labs/agent-skills):
  keyboard access, focus, form labels, motion and state handling.
- [shadcn/ui](https://github.com/shadcn-ui/ui) (MIT): accessible component
  composition philosophy and explicit state semantics.
- [Base UI](https://github.com/mui/base-ui): headless interaction patterns,
  not a borrowed visual identity.
- [Vantage](https://github.com/ccjakje/vantage): useful comparable Windows
  Tauri performance UI patterns; **do not adopt local Riot lockfile/API
  scraping or live opponent scouting**. All data collection must remain approved.

The Companion workspaces are authored in this repository. No source code or
assets from the above projects were copied into the application.

## User acceptance checklist — Windows

Use the Windows x64 artifact from the *latest successful exact-head*
`Build Windows desktop app` GitHub Actions run. It is an **unsigned test
build**, not a verified signed production installer.

1. Open at 1366×768 and 1920×1080, dark and light theme; no clipped controls
   or unreadable foreground/background combinations.
2. Ctrl+K opens the page switcher. Escape closes it. Tab/Shift+Tab reaches
   sign-in, filters, refresh and tournament selection with visible focus.
3. Sign in with a real website **test account**. Confirm session information
   appears but bearer tokens are not returned to the React webview. Sign out
   while a request is in flight: previous account data must not reappear.
4. With a user who has no Riot link, show explicit Pending Riot state and
   empty match history—never invented rank, RR or match results.
5. Live Tracker: move through Summary / Match history / Agents / Maps /
   Progress / Insights, filter recorded matches by outcome/map/agent, then
   refresh. No stale requests should replace the active tab.
6. Tournaments: compare website list and selected bracket in Companion.
   Check completed scores, live status, pairings, 64-team horizontal scroll,
   missing bracket, offline error and new result after 60 seconds.
7. Directory: verify only opted-in profiles appear and a profile becomes
   inaccessible after visibility is withdrawn; no email/PUUID/private matches.
8. Utilities: launch/close VALORANT, confirm actual shipping executable detection,
   CPU and RAM system-wide figures, timer reset and overlay toggle. No
   game memory access or unsupported FPS/temperature claim.
8a. Settings: with a real test account, leave player directory visibility off
    by default, opt in after the explicit confirmation, verify searchable
    public aggregates, opt out and confirm the listing disappears. Never expose
    email/PUUID/private match history.
9. Disable network: public and authenticated pages should fail visibly without
   backfilling demo data. Reconnect and retry.
10. Windows SmartScreen may flag unsigned development builds; do not override
    enterprise security policy or treat CI success as malware/signing clearance.
11. Capture a screenshot and repro steps for visual bugs; do not publish
    customer identity or Riot credentials in tickets.

## Explicit release exclusions

Riot production API access and player-consented Riot linking still depend on
approval. Live Discord bot staging, signing, auto-update distribution and
real-machine compatibility remain separate external gates. The redesign alone
does not constitute a production release.
