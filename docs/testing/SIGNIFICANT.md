# Significant greybox events

Log these signals to `docs/testing/greybox-log.jsonl` (fields: `ts`, `scenario`, `app`, `signal`, `durationMs`, `detail`, optional `screenshot`).

## Seed topics

| Topic | When to log |
|-------|-------------|
| **boot gate** | Desktop viewport incorrectly shows / hides the mobile gate |
| **open visibility** | App overlay/window open or fail to become visible |
| **geometry clip** | Window bounding box leaves `#desktop` (tolerance 2px) |
| **hit-test** | Chrome control not under `elementFromPoint` at its center |
| **drag delta** | Titlebar drag moves window by unexpected delta or clamps oddly |
| **resize delta** | Resize handle changes size incorrectly or clips out of frame |
| **perf overrun** | Single scenario duration exceeds 8000ms budget |

## Signal values

- `pass` — scenario completed
- `fail` — assertion or runtime error (attach screenshot when possible)
- `perf` — duration / budget notes
- `note` — noteworthy but non-failing observation
