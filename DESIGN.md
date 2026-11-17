# DESIGN.md — Sakshi Visual System

## Visual World
**Precision Cold-Chain Instrument & Botanical Ledger.**  
Daylight-first surfaces built for packhouse docks, export compliance desks, and mobile field verification, anchored by one deep canopy dark hardware showcase band on the landing surface.

## Typography
- **Display & Headings:** `Plus Jakarta Sans` (tight geometric authority, `-0.025em` to `-0.035em` tracking, balanced wrapping, zero eyebrow/kicker labels above headings).
- **Body & UI Controls:** `Inter` (`450`–`600` weights, `65–72ch` measure on reading blocks).
- **Measurements, Hashes & Signatures Only:** `JetBrains Mono` with `font-variant-numeric: tabular-nums`. Never used as decorative tech costume.

## Color System (Tinted from Botanical Hue — Never Dead Gray)
- `--bg-canvas`: `#F6F7F4` (Warm Alabaster)
- `--bg-surface`: `#FFFFFF` (Pure Instrument Card)
- `--bg-subtle`: `#ECEFE9` (Tinted Sage Wash)
- `--bg-canopy`: `#0B1D16` (Deep Botanical Anchor Band)
- `--ink-primary`: `#0E1B14` (Deep Forest Ink — contrast > 15:1)
- `--ink-secondary`: `#3B4F43` (Botanical Slate — contrast > 7:1)
- `--ink-muted`: `#586E61` (Contrast ≥ 4.6:1 on canvas/surface)
- `--border-crisp`: `#D8E0D5`
- `--accent-primary`: `#0D4F36` (Botanical Cedar, hover `#093B28`)
- `--status-verified`: `#0B7A53` on `#E6F5EE`
- `--status-cold`: `#0369A1` on `#E0F2FE`
- `--status-warning`: `#B45309` on `#FEF3C7`
- `--status-tamper`: `#BE123C` on `#FFE4E6`

## Elevation & Craft Floor Rules
- Single-mechanism elevation: crisp `1px solid var(--border-crisp)` on operational surfaces; subtle directional shadow (`0 10px 28px -12px rgba(14, 27, 20, 0.12)`) only on floating drawers/popovers.
- Card border radius: `14px` (`10px` on inner controls, full pill only on compact status chips).
- Strict bans enforced: no kickers/eyebrows above headings, no gradient text, no one-sided border bars (`border-l-4`), no uniform 3-card icon grids as page structure, no emoji icons.
