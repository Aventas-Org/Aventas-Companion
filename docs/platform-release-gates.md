# Aventas Companion — platform synchronization and release gate

Official data lives behind the Aventas website API. The desktop application is a consumer, **not** a second match/competition database. The tournaments tab currently reads only the public `GET /api/tournaments` feed over native HTTPS and links to the official website bracket. Private player statistics, website login, tournament registrations and check-ins require a separate securely authenticated integration. Do not label demo match history as live or accept a Riot ID as proof of account ownership.

**Release order:** secure versioned website API first; stable and tested Discord consumer for any new tournament event; website organizer action last for new signed events; ship the Windows app after the API endpoints are deployed and compatible. Website D1 remains the official source for seeds, brackets, results and champions.

**Required before Windows release:** exact-head Windows GitHub Actions build, verifiable signed installers and update behavior, actual Windows smoke test, offline/timeout handling, safe URL allowlist, no embedded Riot or bot credentials, server-side authorization, and confirmation that current public tournament listings mirror the website. Backend changes must link matching repository PRs and test backward compatibility. Cloudflare/Discord/Railway staging acceptance is required for coupled tournament actions.

Never deploy based only on a green frontend build. Use a tagged version, written rollback steps, and explicit production release approval. Riot production data use requires appropriate Riot authorization and player consent; no game-process injection or unauthorized live player scouting.
