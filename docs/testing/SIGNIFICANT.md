# Significant greybox events

Log these signals to `docs/testing/greybox-log.jsonl` (fields: `ts`, `scenario`, `app`, `signal`, `durationMs`, `detail`, optional `screenshot`).

## Seed topics

| Topic | When to log |
|-------|-------------|
| **boot gate** | Desktop viewport incorrectly shows / hides the mobile gate |
| **open visibility** | App overlay/window open or fail to become visible |
| **geometry clip** | Window leaves `#desktop-workarea` (2px) or overlaps `.desktop-dock` |
| **os selection** | Shell text/images selectable when they should not be |
| **hit-test** | Chrome control not under `elementFromPoint` at its center |
| **drag delta** | Titlebar drag moves window by unexpected delta or clamps oddly |
| **resize delta** | Resize handle changes size incorrectly or clips out of frame |
| **perf overrun** | Single scenario duration exceeds 8000ms budget |

## Signal values

- `pass` — scenario completed
- `fail` — assertion or runtime error (attach screenshot when possible)
- `perf` — duration / budget notes
- `note` — noteworthy but non-failing observation

## Trial discoveries

- Frame is `#desktop-workarea`, not `#desktop`
- Safari/Spotify open with negative `x` (~-430..-470) — clipped left (open-apps RED)
- Workarea `bottom:0` overlapped dock band (`work.bottom` > `dock.top`) — structural
- settings@1280×720 sat under dock until workarea insets + clamp (sanity 2026-07-17)
- Wallpaper `user-select: auto` — shell selectable until `#desktop` OS rule
- Probe artifact: `docs/testing/sanity-probe-2026-07-17.json`
