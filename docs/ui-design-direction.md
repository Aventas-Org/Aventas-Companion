# Aventas Companion / Design direction

**Character:** esports operations desk, not a neon arcade or generic SaaS dashboard. It should feel like a tightly edited broadcast control surface: precise, informative, quietly energetic.

**Design references** (inspiration, not copied code): [Anthropic's frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [shadcn/ui](https://github.com/shadcn-ui/ui) for considered accessibility and source ownership, and real tracker information hierarchies. No copied screenshots, assets or proprietary interface components are included.

## Visual system

- Graphite `#0D1118`, raised slate `#171D25`, rules `#2A3441`, warm ivory `#F1F2F0`, muted blue-grey `#A0ADBA`, tournament coral `#F16F63`.
- Use Windows-native Bahnschrift for striking numeric and section headings, Segoe UI Variable for legible content, Consolas only for actual data such as dates and compact numeric strips. No remote fonts; works with Tauri CSP and offline builds.
- Persistent narrow navigation rail: Home / Compete / Community / Tools; demos live behind an explicitly marked Practice lab disclosure. Distinguish authoritative website records from the simulator.
- A **single memorable signal display** in the home hero: concentric concentric radar/rings around true local game-process status; no fabricated numbers. Use restrained motion with reduced-motion compliance.
- Hierarchy uses an irregular hero + thin ledger metrics + operational feeds rather than twenty identically sized cards. Use coral only for active navigation, one CTA and consequential status, not to tint everything.
- Functional navigation with Ctrl+K, keyboard-operable dialog, Escape, and per-view headings; clear empty and error guidance.

## Quality gates

Keyboard and focus visible; content usable at 1024px wide and narrower; theme presets still work; normal color contrast; reduced motion; no external images/fonts; no game-memory reads; all new actions work. Run Node tests and Windows installer build on exact PR head before merge.
