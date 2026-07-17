import fs from "node:fs";
import path from "node:path";

const LOG_PATH = path.resolve("docs/testing/greybox-log.jsonl");

/**
 * @param {{
 *   ts?: string,
 *   scenario: string,
 *   app: string,
 *   signal: "pass" | "fail" | "perf" | "note",
 *   durationMs: number,
 *   detail: string,
 *   screenshot?: string,
 * }} entry
 */
export function appendGreyboxLog(entry) {
  const line = JSON.stringify({
    ts: entry.ts || new Date().toISOString(),
    scenario: entry.scenario,
    app: entry.app,
    signal: entry.signal,
    durationMs: entry.durationMs,
    detail: entry.detail,
    ...(entry.screenshot ? { screenshot: entry.screenshot } : {}),
  });

  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, `${line}\n`, "utf8");
}
