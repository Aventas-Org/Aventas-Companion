# Aventas Companion — Windows preview test checklist

**Scope:** an unsigned Windows test build for user validation, not a signed/public production release. Riot production access is pending. This checklist deliberately separates **code/build passing** from **actual Windows device acceptance**.

## Get the correct build

1. Open the [GitHub Actions Windows installer workflow](https://github.com/Aventas-Org/Aventas-Companion/actions/workflows/build-windows.yml).
2. Select the newest **successful** run for the desired branch / PR head, preferably the latest tested `main` head after merges.
3. Under **Artifacts**, download `aventas-companion-windows-x64`. Extract the ZIP and choose the NSIS or MSI installer. Do not treat an unverified mirror or unknown downloaded binary as safe.
4. This is an **unsigned development build**. Windows may warn about an unknown publisher. Inspect the GitHub Actions source and only install software you trust; public code signing is tracked separately.

## First boot (offline and connected)

- [ ] App launches with the Aventas brand, no white flash or missing font. Window can resize without cut-off navigation.
- [ ] Left rail groups: Workspace, Compete, System, Practice lab, Settings. Open and close Practice lab. Every page navigates.
- [ ] Press Ctrl+K; type `tournament`; use up/down arrows, Enter and Esc. Repeat on keyboard only. Focus and selection stay visible.
- [ ] On Home, `VALORANT is not running` must appear while the game is closed. A Windows native process-detection failure must say `unavailable` rather than pretending idle.
- [ ] Opening VALORANT should change status once `VALORANT-Win64-Shipping.exe` starts. Opening Riot Client without the game should not falsely indicate active gameplay.
- [ ] If not signed in, verified match metrics must be blank/awaiting sync, not sample numbers.

## Website and account

- [ ] Live Tracker: sign in with an **existing Aventas email/password account**. Never paste credentials, session tokens or OTPs into a bug report.
- [ ] Sign-out immediately hides personal metrics and profile. Restart requires sign-in again; local storage must not contain auth bearer tokens.
- [ ] With Riot approval pending, no match history is a **legitimate empty state**. It must never be filled with fake rank/KD/ACS. If a real consented Riot account is already synced, compare the values directly with the website.
- [ ] On website downtime, account views show a clear error and retry path rather than fabricated data.
- [ ] Player Directory searches only public, opted-in profiles. Search for a consenting public test player; verify the preview is aggregates only. Withdraw consent on the website, and verify the public profile becomes unavailable.
- [ ] Browse tournaments. Compare an actual event's teams, scores, round order, champion and match statuses to the official Aventas website. If no events exist, see a helpful empty state. No browser API keys should be needed.
- [ ] Click **Open event website** from a selected bracket. The app should open only the matching `aventasgaming.com/tournaments/...` page in your normal browser; it should never replace the Companion window or open arbitrary user-supplied URLs.

## Local utilities, overlay and theming

- [ ] The System desk displays read-only total CPU/RAM usage after at least two 5-second samples, without claiming true game FPS or temperatures.
- [ ] The observed session timer starts only after the game process is detected and resets when exiting the tab or game.
- [ ] Overlay control requires acknowledgement of **demo historical content**. The overlay should be click-through by default; if that safety step fails, it closes itself.
- [ ] Change the theme and accent in Settings. Check both dark and light at different window widths and verify text legibility, no horizontal clipping, and a readable overlay.
- [ ] Windows game compatibility and any anti-cheat restrictions must be tested on your own device. Do not attempt injection, memory hooks or unauthorized competitive overlays.

## Report a problem

Open an issue at [Aventas-Companion Issues](https://github.com/Aventas-Org/Aventas-Companion/issues/new) using this structure:

```text
What page / feature:
Actual behavior:
Expected behavior:
Repro steps (from a fresh app launch):
Windows version and display scaling:
Companion artifact workflow run URL or commit:
Screenshots (please redact personal data and tokens):
Relevant errors (never include passwords, cookies or secrets):
```

For the synced Discord announcement path, separately verify staging D1 → signed bot outbox event → one public bracket message in a private test guild. Railway credentials/volume and official Riot RSO/API approval remain tracked as external release gates [#9](https://github.com/Aventas-Org/Aventas-Companion/issues/9) and [#10](https://github.com/Aventas-Org/Aventas-Companion/issues/10).
