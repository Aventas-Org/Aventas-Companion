# Aventas Companion

A Windows desktop esports companion built with **Tauri 2, Rust, React and TypeScript**.

This source tree contains the **preview** client. It brings official Aventas tournament brackets and website-authenticated personal tracker data into a compact Windows control-desk interface. It does not claim to be a production Riot tracker until Riot application approval and authorized real data synchronization are complete.

## What works in this preview

- Aventas command center with actual local VALORANT process detection, website match metrics (when present), and official event listing
- Website account login with native Rust memory-only session tokens; logout clears local data
- Official tournament circuit and scrollable single-elimination bracket tree, synced from the website API
- Opted-in public player search, read-only agents, maps, match history, progress and insights when backend records exist
- Windows CPU/RAM history, a local observation timer, and an optional demo historical overlay
- Clearly separated Practice lab for simulated data, theme library and Ctrl+K command navigation

## Install and test

Open the [Windows installer workflow](https://github.com/Aventas-Org/Aventas-Companion/actions/workflows/build-windows.yml) and select a successful build artifact. The ZIP contains the Windows installers. These test binaries are **unsigned** and are not a published production release.

Follow [the desktop beta test checklist](docs/desktop-beta-smoke-test.md) when reporting feedback.

## Local development

Run `npm ci`, then `npm run tauri:dev` on Windows with Node 24, Rust, and the platform prerequisites for Tauri. Run `npm test` and `npm run build` for frontend checks. Native security/telemetry tests run through `cargo test --locked --manifest-path src-tauri/Cargo.toml` in the Windows workflow.

The website's Cloudflare D1 remains the authoritative home of official tournaments, results and account data. No Riot, Discord bot, or payment API keys belong in this desktop bundle. External gates: [Riot access](https://github.com/Aventas-Org/Aventas-Companion/issues/9) and [staging/signing](https://github.com/Aventas-Org/Aventas-Companion/issues/10).
