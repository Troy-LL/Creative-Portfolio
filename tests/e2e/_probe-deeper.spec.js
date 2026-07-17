/**
 * One-off deeper sanity probe (2026-07-17).
 * Writes docs/testing/sanity-probe-deeper-2026-07-17.json — not part of CI suite.
 */
import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { bootDesktop, openDockApp, assertInFrame } from "./helpers/desktop.js";

const OUT_JSON = path.join(
  "docs",
  "testing",
  "sanity-probe-deeper-2026-07-17.json",
);
const PROOF_DIR = path.join("docs", "testing", "proof");

const APPS = [
  {
    app: "settings",
    overlay: "#settingsOverlay",
    win: ".settings-window",
    close: ".settings-dots .mac-close",
    min: ".settings-dots .mac-min",
    max: ".settings-dots .mac-max",
    drag: ".settings-dots",
  },
  {
    app: "contacts",
    overlay: "#contactsOverlay",
    win: ".contacts-window",
    close: ".contacts-dots .mac-close",
    min: ".contacts-dots .mac-min",
    max: ".contacts-dots .mac-max",
    drag: ".contacts-sidebar-top",
  },
  {
    app: "mail",
    overlay: "#mailOverlay",
    win: ".mail-window",
    close: ".mail-dots .mac-close",
    min: ".mail-dots .mac-min",
    max: ".mail-dots .mac-max",
    drag: ".mail-chrome-toolbar",
  },
  {
    app: "finder",
    overlay: "#finderOverlay",
    win: ".finder-window",
    close: ".finder-window-controls .mac-close",
    min: ".finder-window-controls .mac-min",
    max: ".finder-window-controls .mac-max",
    drag: ".finder-window-controls",
  },
  {
    app: "safari",
    overlay: "#safariOverlay",
    win: ".safari-window",
    close: ".safari-dots .mac-close",
    min: ".safari-dots .mac-min",
    max: ".safari-dots .mac-max",
    drag: ".safari-titlebar",
  },
  {
    app: "spotify",
    overlay: "#spotifyOverlay",
    win: ".spotify-window",
    close: ".spotify-dots .mac-close",
    min: ".spotify-dots .mac-min",
    max: ".spotify-dots .mac-max",
    drag: ".spotify-topnav",
  },
];

const VIEWPORTS = [
  { w: 1440, h: 900, label: "1440x900" },
  { w: 1280, h: 720, label: "1280x720" },
  { w: 1920, h: 1080, label: "1920x1080" },
  { w: 1100, h: 800, label: "1100x800" },
];

/** @type {{ scenario: string, signal: string, app?: string, viewport?: string, detail: string, screenshot?: string }[]} */
const findings = [];
let passCount = 0;
let failCount = 0;
/** @type {string[]} */
const notes = [];

function addFinding(f) {
  findings.push(f);
  if (f.signal === "pass") passCount += 1;
  else if (f.signal === "fail") failCount += 1;
  else if (f.signal === "note") notes.push(f.detail);
}

async function shot(page, name) {
  fs.mkdirSync(PROOF_DIR, { recursive: true });
  const rel = path.join(PROOF_DIR, `probe-deeper-${name}-fail.png`);
  try {
    await page.screenshot({ path: rel, fullPage: true });
    return rel.replace(/\\/g, "/");
  } catch {
    return undefined;
  }
}

async function measureGeometry(page, winSel) {
  return page.evaluate((sel) => {
    const win = document.querySelector(sel);
    const work = document.getElementById("desktop-workarea");
    const dock = document.querySelector(".desktop-dock");
    if (!win || !work || !dock) return null;
    const w = win.getBoundingClientRect();
    const wa = work.getBoundingClientRect();
    const d = dock.getBoundingClientRect();
    return {
      win: { x: w.x, y: w.y, width: w.width, height: w.height, bottom: w.bottom, right: w.right },
      work: { x: wa.x, y: wa.y, width: wa.width, height: wa.height, bottom: wa.bottom, top: wa.top },
      dockTop: d.top,
      underDock: w.bottom > d.top + 2,
      outFrame:
        w.x < wa.x - 2 ||
        w.y < wa.y - 2 ||
        w.right > wa.right + 2 ||
        w.bottom > wa.bottom + 2,
      hasLayout: win.classList.contains("has-explicit-layout"),
    };
  }, winSel);
}

async function assertClamp(page, meta, winSel) {
  const g = await measureGeometry(page, winSel);
  if (!g) {
    const screenshot = await shot(page, `${meta.scenario}-${meta.app}-nogeom`);
    addFinding({
      scenario: meta.scenario,
      signal: "fail",
      app: meta.app,
      viewport: meta.viewport,
      detail: "missing win/workarea/dock geometry",
      screenshot,
    });
    return false;
  }
  try {
    assertInFrame(g.win, g.work, 2);
  } catch (err) {
    const screenshot = await shot(page, `${meta.scenario}-${meta.app}-frame`);
    addFinding({
      scenario: meta.scenario,
      signal: "fail",
      app: meta.app,
      viewport: meta.viewport,
      detail: `outFrame: ${err instanceof Error ? err.message : String(err)}`,
      screenshot,
    });
    return false;
  }
  if (g.underDock) {
    const screenshot = await shot(page, `${meta.scenario}-${meta.app}-dock`);
    addFinding({
      scenario: meta.scenario,
      signal: "fail",
      app: meta.app,
      viewport: meta.viewport,
      detail: `bottom=${g.win.bottom.toFixed(1)} > dock.top=${g.dockTop.toFixed(1)}`,
      screenshot,
    });
    return false;
  }
  addFinding({
    scenario: meta.scenario,
    signal: "pass",
    app: meta.app,
    viewport: meta.viewport,
    detail: `in-frame+above-dock w=${Math.round(g.win.width)}x${Math.round(g.win.height)} bottom=${g.win.bottom.toFixed(0)} dockTop=${g.dockTop.toFixed(0)}`,
  });
  return true;
}

async function waitOpen(page, appDef) {
  await page.locator(appDef.overlay).waitFor({ state: "visible", timeout: 15_000 });
  await page
    .locator(appDef.win)
    .waitFor({ state: "visible", timeout: 15_000 });
  await page
    .locator(appDef.win)
    .evaluate((el) =>
      new Promise((resolve) => {
        const done = () => resolve(undefined);
        if (el.classList.contains("has-explicit-layout")) {
          done();
          return;
        }
        const obs = new MutationObserver(() => {
          if (el.classList.contains("has-explicit-layout")) {
            obs.disconnect();
            done();
          }
        });
        obs.observe(el, { attributes: true, attributeFilter: ["class"] });
        setTimeout(() => {
          obs.disconnect();
          done();
        }, 10_000);
      }),
    );
}

async function closeViaChrome(page, appDef) {
  const close = page.locator(appDef.close).first();
  if (await close.count()) {
    await close.click({ force: true }).catch(() => {});
    await page
      .locator(appDef.overlay)
      .evaluate((el) => !el.classList.contains("is-visible"))
      .catch(() => false);
    await page.waitForTimeout(400);
  }
}

async function hitTest(page, selector) {
  return page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) {
      return { ok: false, reason: "zero-size", tag: null };
    }
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    const ok = Boolean(top && (top === el || el.contains(top)));
    return {
      ok,
      reason: ok ? "ok" : "blocked",
      tag: top ? `${top.tagName}.${top.className}`.slice(0, 80) : null,
      x,
      y,
    };
  });
}

test.describe.configure({ mode: "serial" });

test("deeper desktop sanity probe", async ({ page }) => {
  test.setTimeout(300_000);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(String(err.message || err));
  });

  // ── 1) Sequential open @ each viewport ─────────────────────────────
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await bootDesktop(page);

    for (const appDef of APPS) {
      try {
        await openDockApp(page, appDef.app);
        await waitOpen(page, appDef);
        const visible = await page
          .locator(appDef.overlay)
          .evaluate((el) => el.classList.contains("is-visible"));
        if (!visible) {
          const screenshot = await shot(page, `seq-open-${appDef.app}-${vp.label}`);
          addFinding({
            scenario: "open.sequential",
            signal: "fail",
            app: appDef.app,
            viewport: vp.label,
            detail: "overlay not is-visible after dock click",
            screenshot,
          });
          continue;
        }
        await assertClamp(page, {
          scenario: "open.sequential",
          app: appDef.app,
          viewport: vp.label,
        }, appDef.win);
        await closeViaChrome(page, appDef);
        // Ensure closed before next
        await page
          .locator(appDef.overlay)
          .waitFor({ state: "hidden", timeout: 8_000 })
          .catch(async () => {
            await page.evaluate((sel) => {
              document.querySelector(sel)?.classList.remove("is-visible");
            }, appDef.overlay);
          });
      } catch (err) {
        const screenshot = await shot(page, `seq-open-${appDef.app}-${vp.label}`);
        addFinding({
          scenario: "open.sequential",
          signal: "fail",
          app: appDef.app,
          viewport: vp.label,
          detail: err instanceof Error ? err.message : String(err),
          screenshot,
        });
      }
    }
  }

  // ── 2) Multi-open (2–3 apps) + clamp ───────────────────────────────
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootDesktop(page);
  const multi = [APPS[0], APPS[3], APPS[4]]; // settings, finder, safari
  for (const appDef of multi) {
    await openDockApp(page, appDef.app);
    await waitOpen(page, appDef);
  }
  for (const appDef of multi) {
    await assertClamp(page, {
      scenario: "open.multi",
      app: appDef.app,
      viewport: "1440x900",
    }, appDef.win);
  }

  // z-order: focused app should have highest overlay z among the three
  const zOrder = await page.evaluate(() => {
    return ["settingsOverlay", "finderOverlay", "safariOverlay"].map((id) => {
      const el = document.getElementById(id);
      const win = el?.querySelector(".mac-window");
      return {
        id,
        z: Number(el?.style.zIndex || 0),
        focused: win?.classList.contains("is-focused") ?? false,
        visible: el?.classList.contains("is-visible") ?? false,
      };
    });
  });
  const focused = zOrder.filter((z) => z.focused);
  if (focused.length !== 1) {
    addFinding({
      scenario: "z-order.multi",
      signal: "fail",
      app: "shell",
      viewport: "1440x900",
      detail: `expected 1 focused window, got ${focused.length}: ${JSON.stringify(zOrder)}`,
      screenshot: await shot(page, "z-order-multi"),
    });
  } else {
    const maxZ = Math.max(...zOrder.map((z) => z.z));
    if (focused[0].z < maxZ) {
      addFinding({
        scenario: "z-order.multi",
        signal: "fail",
        app: focused[0].id,
        detail: `focused z=${focused[0].z} < maxZ=${maxZ}`,
        screenshot: await shot(page, "z-order-focus"),
      });
    } else {
      addFinding({
        scenario: "z-order.multi",
        signal: "pass",
        app: "shell",
        detail: JSON.stringify(zOrder),
      });
    }
  }

  // Stuck overlays? pointer-events / visibility ghosts
  const stuck = await page.evaluate(() => {
    return [...document.querySelectorAll(".window-overlay")].map((el) => {
      const cs = getComputedStyle(el);
      return {
        id: el.id,
        visibleClass: el.classList.contains("is-visible"),
        display: cs.display,
        pointerEvents: cs.pointerEvents,
        opacity: cs.opacity,
        z: el.style.zIndex || cs.zIndex,
      };
    });
  });
  const ghost = stuck.filter(
    (s) =>
      !s.visibleClass &&
      s.display !== "none" &&
      Number(s.opacity) > 0.01 &&
      s.pointerEvents !== "none",
  );
  if (ghost.length) {
    addFinding({
      scenario: "overlay.stuck",
      signal: "fail",
      app: "shell",
      detail: `non-visible overlays still interactive: ${JSON.stringify(ghost)}`,
      screenshot: await shot(page, "overlay-stuck"),
    });
  } else {
    addFinding({
      scenario: "overlay.stuck",
      signal: "pass",
      app: "shell",
      detail: `no stuck overlays among ${stuck.length}`,
    });
  }

  // ── 3) Browser resize mid-session with windows open ────────────────
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(350);
  for (const appDef of multi) {
    const stillOpen = await page
      .locator(appDef.overlay)
      .evaluate((el) => el.classList.contains("is-visible"));
    if (!stillOpen) {
      addFinding({
        scenario: "viewport.mid-resize",
        signal: "fail",
        app: appDef.app,
        viewport: "1280x720",
        detail: "app closed or hidden after viewport shrink",
        screenshot: await shot(page, `mid-resize-gone-${appDef.app}`),
      });
      continue;
    }
    await assertClamp(page, {
      scenario: "viewport.mid-resize",
      app: appDef.app,
      viewport: "1280x720",
    }, appDef.win);
  }

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(350);
  for (const appDef of multi) {
    const stillOpen = await page
      .locator(appDef.overlay)
      .evaluate((el) => el.classList.contains("is-visible"));
    if (!stillOpen) continue;
    await assertClamp(page, {
      scenario: "viewport.mid-resize",
      app: appDef.app,
      viewport: "1920x1080",
    }, appDef.win);
  }

  // Tall narrow after multi open
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.waitForTimeout(350);
  for (const appDef of multi) {
    const stillOpen = await page
      .locator(appDef.overlay)
      .evaluate((el) => el.classList.contains("is-visible"));
    if (!stillOpen) continue;
    await assertClamp(page, {
      scenario: "viewport.mid-resize",
      app: appDef.app,
      viewport: "1100x800",
    }, appDef.win);
  }

  // ── 4) visualViewport zoom simulation ──────────────────────────────
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);
  const zoomResult = await page.evaluate(async () => {
    const vv = window.visualViewport;
    if (!vv) return { supported: false };

    const before = [...document.querySelectorAll(".mac-window.has-explicit-layout")]
      .filter((w) => w.closest(".window-overlay.is-visible"))
      .map((w) => {
        const r = w.getBoundingClientRect();
        return {
          cls: w.className.split(" ").find((c) => c.endsWith("-window")),
          bottom: r.bottom,
          right: r.right,
          width: r.width,
          height: r.height,
        };
      });

    // Dispatch visualViewport resize (Playwright can't true-pinch zoom);
    // also temporarily scale root to mimic zoomed layout pressure.
    const root = document.documentElement;
    const prevZoom = root.style.zoom;
    root.style.zoom = "1.25";
    vv.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const during = [...document.querySelectorAll(".mac-window.has-explicit-layout")]
      .filter((w) => w.closest(".window-overlay.is-visible"))
      .map((w) => {
        const r = w.getBoundingClientRect();
        const work = document.getElementById("desktop-workarea")?.getBoundingClientRect();
        const dock = document.querySelector(".desktop-dock")?.getBoundingClientRect();
        return {
          cls: w.className.split(" ").find((c) => c.endsWith("-window")),
          bottom: r.bottom,
          right: r.right,
          width: r.width,
          height: r.height,
          outFrame: work
            ? r.x < work.x - 2 ||
              r.y < work.y - 2 ||
              r.right > work.right + 2 ||
              r.bottom > work.bottom + 2
            : null,
          underDock: dock ? r.bottom > dock.top + 2 : null,
        };
      });

    root.style.zoom = prevZoom || "";
    vv.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    return { supported: true, before, during, scale: vv.scale };
  });

  if (!zoomResult.supported) {
    addFinding({
      scenario: "visualViewport.zoom",
      signal: "note",
      detail: "visualViewport API unavailable",
    });
  } else {
    const bad = (zoomResult.during || []).filter((w) => w.outFrame || w.underDock);
    if (bad.length) {
      addFinding({
        scenario: "visualViewport.zoom",
        signal: "fail",
        app: "shell",
        viewport: "1440x900@zoom1.25",
        detail: `windows not refit under simulated zoom: ${JSON.stringify(bad)}`,
        screenshot: await shot(page, "vv-zoom"),
      });
    } else {
      addFinding({
        scenario: "visualViewport.zoom",
        signal: "pass",
        detail: `refit ok under zoom sim; vv.scale=${zoomResult.scale}; during=${JSON.stringify(zoomResult.during)}`,
      });
    }
    addFinding({
      scenario: "visualViewport.zoom",
      signal: "note",
      detail:
        "Simulated via documentElement.zoom=1.25 + visualViewport/window resize events (not true pinch).",
    });
  }

  // ── 5) OS selection: shell vs Resume preview ───────────────────────
  await page.setViewportSize({ width: 1440, height: 900 });
  // close multi apps first
  for (const appDef of multi) {
    await closeViaChrome(page, appDef);
  }
  await bootDesktop(page);

  const shellSelect = await page.evaluate(() => {
    const wallpaper = getComputedStyle(
      document.querySelector(".desktop-wallpaper"),
    ).userSelect;
    const menubar = getComputedStyle(
      document.querySelector(".desktop-menubar"),
    ).userSelect;
    const dock = getComputedStyle(
      document.querySelector(".desktop-dock"),
    ).userSelect;
    return { wallpaper, menubar, dock };
  });
  const shellOk = ["wallpaper", "menubar", "dock"].every((k) => {
    const v = shellSelect[k];
    return v === "none" || v === "-webkit-none";
  });
  if (shellOk) {
    addFinding({
      scenario: "os.selection.shell",
      signal: "pass",
      app: "shell",
      detail: JSON.stringify(shellSelect),
    });
  } else {
    addFinding({
      scenario: "os.selection.shell",
      signal: "fail",
      app: "shell",
      detail: `chrome still selectable: ${JSON.stringify(shellSelect)}`,
      screenshot: await shot(page, "os-selection-shell"),
    });
  }

  // Open Resume PDF via Finder
  await openDockApp(page, "finder");
  await waitOpen(page, APPS.find((a) => a.app === "finder"));
  // Navigate to Resume folder if needed, then open PDF
  const resumeNav = page.locator('.finder-sidebar-item[data-target="Resume"]');
  if (await resumeNav.count()) {
    await resumeNav.click();
    await page.waitForTimeout(300);
  }
  const resumeIcon = page.locator('.finder-icon[data-pdf*="Resume"]').first();
  if (await resumeIcon.count()) {
    await resumeIcon.dblclick();
    await page.locator(".preview-overlay.is-visible").waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const resumeSelect = await page.evaluate(() => {
      const body = document.querySelector(".preview-overlay .preview-body");
      if (!body) return { error: "no preview-body" };
      const us = getComputedStyle(body).userSelect;
      const child = body.querySelector("iframe, *");
      const childUs = child ? getComputedStyle(child).userSelect : null;
      return { previewBody: us, child: childUs };
    });
    const selectable =
      resumeSelect.previewBody === "text" ||
      resumeSelect.previewBody === "auto" ||
      resumeSelect.previewBody === "contain";
    if (selectable) {
      addFinding({
        scenario: "os.selection.resume",
        signal: "pass",
        app: "preview",
        detail: JSON.stringify(resumeSelect),
      });
    } else {
      addFinding({
        scenario: "os.selection.resume",
        signal: "fail",
        app: "preview",
        detail: `preview-body not selectable: ${JSON.stringify(resumeSelect)}`,
        screenshot: await shot(page, "os-selection-resume"),
      });
    }

    // Preview clamp after open + after viewport shrink (preview NOT in WINDOW_CONFIGS)
    const previewGeom = await page.evaluate(() => {
      const win = document.querySelector(".preview-overlay .preview-window");
      const work = document.getElementById("desktop-workarea");
      const dock = document.querySelector(".desktop-dock");
      if (!win || !work || !dock) return null;
      const w = win.getBoundingClientRect();
      const wa = work.getBoundingClientRect();
      const d = dock.getBoundingClientRect();
      return {
        win: { x: w.x, y: w.y, width: w.width, height: w.height, bottom: w.bottom, right: w.right },
        work: { x: wa.x, y: wa.y, width: wa.width, height: wa.height, bottom: wa.bottom },
        dockTop: d.top,
        underDock: w.bottom > d.top + 2,
        outFrame:
          w.x < wa.x - 2 ||
          w.y < wa.y - 2 ||
          w.right > wa.right + 2 ||
          w.bottom > wa.bottom + 2,
      };
    });
    if (previewGeom?.outFrame || previewGeom?.underDock) {
      addFinding({
        scenario: "open.preview-clamp",
        signal: "fail",
        app: "preview",
        viewport: "1440x900",
        detail: JSON.stringify(previewGeom),
        screenshot: await shot(page, "preview-clamp-open"),
      });
    } else if (previewGeom) {
      addFinding({
        scenario: "open.preview-clamp",
        signal: "pass",
        app: "preview",
        viewport: "1440x900",
        detail: "preview in frame at open",
      });
    }

    for (const vp of [
      { w: 1100, h: 800, label: "1100x800" },
      { w: 1280, h: 720, label: "1280x720" },
    ]) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.waitForTimeout(400);
      const previewAfter = await page.evaluate(() => {
        const win = document.querySelector(".preview-overlay .preview-window");
        const work = document.getElementById("desktop-workarea");
        const dock = document.querySelector(".desktop-dock");
        if (!win || !work || !dock) return { missing: true };
        const w = win.getBoundingClientRect();
        const wa = work.getBoundingClientRect();
        const d = dock.getBoundingClientRect();
        return {
          underDock: w.bottom > d.top + 2,
          outFrame:
            w.x < wa.x - 2 ||
            w.y < wa.y - 2 ||
            w.right > wa.right + 2 ||
            w.bottom > wa.bottom + 2,
          w: {
            bottom: w.bottom,
            right: w.right,
            width: w.width,
            height: w.height,
          },
          workBottom: wa.bottom,
          dockTop: d.top,
          style: {
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height,
          },
        };
      });
      if (previewAfter.missing) {
        addFinding({
          scenario: "viewport.preview-refit",
          signal: "note",
          app: "preview",
          viewport: vp.label,
          detail: "preview missing after viewport change",
        });
      } else if (previewAfter.outFrame || previewAfter.underDock) {
        addFinding({
          scenario: "viewport.preview-refit",
          signal: "fail",
          app: "preview",
          viewport: vp.label,
          detail: `preview not refit on viewport shrink (absent from WINDOW_CONFIGS/refitVisible): ${JSON.stringify(previewAfter)}`,
          screenshot: await shot(page, `preview-refit-${vp.label}`),
        });
      } else {
        addFinding({
          scenario: "viewport.preview-refit",
          signal: "pass",
          app: "preview",
          viewport: vp.label,
          detail: JSON.stringify(previewAfter),
        });
      }
    }

    // close preview
    const prevClose = page.locator(".preview-overlay .mac-close").first();
    if (await prevClose.count()) await prevClose.click().catch(() => {});
  } else {
    addFinding({
      scenario: "os.selection.resume",
      signal: "fail",
      app: "finder",
      detail: "Resume PDF icon not found in Finder",
      screenshot: await shot(page, "resume-missing"),
    });
  }

  // ── 6) Chrome hit-tests (all apps) ─────────────────────────────────
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootDesktop(page);
  for (const appDef of APPS) {
    await openDockApp(page, appDef.app);
    await waitOpen(page, appDef);

    for (const kind of ["close", "min", "max"]) {
      const sel = appDef[kind];
      try {
        const ht = await hitTest(page, sel);
        const isDisabled = await page
          .locator(sel)
          .first()
          .evaluate((el) => el.classList.contains("disabled"));
        if (!ht.ok && kind === "max" && isDisabled) {
          addFinding({
            scenario: "chrome.hit-test",
            signal: "note",
            app: appDef.app,
            detail: `mac-max.disabled pointer-events:none (intentional); center hits ${ht.tag}`,
          });
        } else if (!ht.ok) {
          addFinding({
            scenario: "chrome.hit-test",
            signal: "fail",
            app: appDef.app,
            detail: `${kind} blocked at center: top=${ht.tag} reason=${ht.reason}`,
            screenshot: await shot(page, `hit-${appDef.app}-${kind}`),
          });
        } else if (kind === "max" && isDisabled) {
          addFinding({
            scenario: "chrome.hit-test",
            signal: "note",
            app: appDef.app,
            detail: "mac-max is disabled (hit-testable but inert)",
          });
          addFinding({
            scenario: "chrome.hit-test",
            signal: "pass",
            app: appDef.app,
            detail: `${kind} hit-testable (disabled)`,
          });
        } else {
          addFinding({
            scenario: "chrome.hit-test",
            signal: "pass",
            app: appDef.app,
            detail: `${kind} hit-testable`,
          });
        }
      } catch (err) {
        addFinding({
          scenario: "chrome.hit-test",
          signal: "fail",
          app: appDef.app,
          detail: `${kind}: ${err instanceof Error ? err.message : String(err)}`,
          screenshot: await shot(page, `hit-${appDef.app}-${kind}`),
        });
      }
    }

    // Exercise close
    const beforeClose = await page
      .locator(appDef.overlay)
      .evaluate((el) => el.classList.contains("is-visible"));
    await page.locator(appDef.close).first().click();
    await page.waitForTimeout(450);
    const afterClose = await page
      .locator(appDef.overlay)
      .evaluate((el) => el.classList.contains("is-visible"));
    if (beforeClose && !afterClose) {
      addFinding({
        scenario: "chrome.close",
        signal: "pass",
        app: appDef.app,
        detail: "close hides overlay",
      });
    } else {
      addFinding({
        scenario: "chrome.close",
        signal: "fail",
        app: appDef.app,
        detail: `close did not hide overlay (before=${beforeClose} after=${afterClose})`,
        screenshot: await shot(page, `close-${appDef.app}`),
      });
      await page.evaluate((sel) => {
        document.querySelector(sel)?.classList.remove("is-visible");
      }, appDef.overlay);
    }
  }

  // Minimize behavior note (min == close without dock remove)
  await openDockApp(page, "mail");
  await waitOpen(page, APPS.find((a) => a.app === "mail"));
  await page.locator(APPS.find((a) => a.app === "mail").min).first().click();
  await page.waitForTimeout(450);
  const minState = await page.evaluate(() => {
    const overlay = document.getElementById("mailOverlay");
    const dock = document.querySelector('.dock-icon[data-app="mail"]');
    return {
      visible: overlay?.classList.contains("is-visible") ?? false,
      dockOpen: dock?.classList.contains("is-open") ?? false,
    };
  });
  if (!minState.visible && minState.dockOpen) {
    addFinding({
      scenario: "chrome.min",
      signal: "note",
      app: "mail",
      detail:
        "min hides overlay but keeps dock is-open (closeMacWindow removeDockIndicator=false) — not a true minimize-to-dock",
    });
    addFinding({
      scenario: "chrome.min",
      signal: "pass",
      app: "mail",
      detail: JSON.stringify(minState),
    });
  } else if (!minState.visible) {
    addFinding({
      scenario: "chrome.min",
      signal: "pass",
      app: "mail",
      detail: JSON.stringify(minState),
    });
  } else {
    addFinding({
      scenario: "chrome.min",
      signal: "fail",
      app: "mail",
      detail: `min did not hide: ${JSON.stringify(minState)}`,
      screenshot: await shot(page, "min-mail"),
    });
  }

  // ── 7) Drag + resize after viewport change (2 apps) ────────────────
  await page.setViewportSize({ width: 1280, height: 720 });
  await bootDesktop(page);

  // settings drag
  await openDockApp(page, "settings");
  await waitOpen(page, APPS.find((a) => a.app === "settings"));
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.waitForTimeout(350);
  {
    const win = page.locator(".settings-window");
    const before = await win.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y };
    });
    const handle = page.locator(".settings-dots");
    const box = await handle.boundingBox();
    if (box) {
      const sx = box.x + Math.min(40, box.width * 0.5);
      const sy = box.y + box.height / 2;
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(sx + 80, sy + 50, { steps: 16 });
      await page.mouse.up();
      const after = await win.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      });
      const moved = after.x - before.x >= 20 || after.y - before.y >= 20;
      if (!moved) {
        addFinding({
          scenario: "drag.after-viewport",
          signal: "fail",
          app: "settings",
          viewport: "1100x800",
          detail: `drag delta too small: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`,
          screenshot: await shot(page, "drag-settings-after-vp"),
        });
      } else {
        addFinding({
          scenario: "drag.after-viewport",
          signal: "pass",
          app: "settings",
          viewport: "1100x800",
          detail: `dx=${(after.x - before.x).toFixed(0)} dy=${(after.y - before.y).toFixed(0)}`,
        });
      }
      await assertClamp(page, {
        scenario: "drag.after-viewport",
        app: "settings",
        viewport: "1100x800",
      }, ".settings-window");
    }
  }

  // finder resize
  await openDockApp(page, "finder");
  await waitOpen(page, APPS.find((a) => a.app === "finder"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(350);
  {
    const win = page.locator(".finder-window");
    const handle = win.locator(".mac-window-resize-handle--se");
    await handle.waitFor({ state: "visible", timeout: 10_000 });
    const before = await win.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    const box = await handle.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 70, y + 50, { steps: 12 });
      await page.mouse.up();
      const after = await win.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height };
      });
      const grew =
        after.width - before.width >= 20 || after.height - before.height >= 20;
      if (!grew) {
        addFinding({
          scenario: "resize.after-viewport",
          signal: "fail",
          app: "finder",
          viewport: "1440x900",
          detail: `resize delta too small: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`,
          screenshot: await shot(page, "resize-finder-after-vp"),
        });
      } else {
        addFinding({
          scenario: "resize.after-viewport",
          signal: "pass",
          app: "finder",
          viewport: "1440x900",
          detail: `dw=${(after.width - before.width).toFixed(0)} dh=${(after.height - before.height).toFixed(0)}`,
        });
      }
      await assertClamp(page, {
        scenario: "resize.after-viewport",
        app: "finder",
        viewport: "1440x900",
      }, ".finder-window");
    }
  }

  // contacts drag after shrink (second app)
  await openDockApp(page, "contacts");
  await waitOpen(page, APPS.find((a) => a.app === "contacts"));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(350);
  {
    const win = page.locator(".contacts-window");
    const before = await win.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y };
    });
    const handle = page.locator(".contacts-sidebar-top");
    const box = await handle.boundingBox();
    if (box) {
      const sx = box.x + box.width * 0.5;
      const sy = box.y + box.height / 2;
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(sx + 90, sy + 40, { steps: 14 });
      await page.mouse.up();
      const after = await win.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      });
      const moved = Math.abs(after.x - before.x) >= 15 || Math.abs(after.y - before.y) >= 15;
      if (!moved) {
        addFinding({
          scenario: "drag.after-viewport",
          signal: "fail",
          app: "contacts",
          viewport: "1280x720",
          detail: `drag delta too small: ${JSON.stringify({ before, after })}`,
          screenshot: await shot(page, "drag-contacts-after-vp"),
        });
      } else {
        addFinding({
          scenario: "drag.after-viewport",
          signal: "pass",
          app: "contacts",
          viewport: "1280x720",
          detail: `dx=${(after.x - before.x).toFixed(0)} dy=${(after.y - before.y).toFixed(0)}`,
        });
      }
      await assertClamp(page, {
        scenario: "drag.after-viewport",
        app: "contacts",
        viewport: "1280x720",
      }, ".contacts-window");
    }
  }

  // ── Console errors summary ─────────────────────────────────────────
  const uniqueErrors = [...new Set(consoleErrors)].slice(0, 20);
  if (uniqueErrors.length) {
    addFinding({
      scenario: "console.errors",
      signal: "fail",
      app: "shell",
      detail: uniqueErrors.join(" | "),
    });
  } else {
    addFinding({
      scenario: "console.errors",
      signal: "pass",
      app: "shell",
      detail: "no console errors / pageerrors",
    });
  }

  // Persist JSON
  const payload = {
    ts: new Date().toISOString(),
    summary: {
      pass: passCount,
      fail: failCount,
      notes: notes.slice(0, 30),
    },
    findings,
  };
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  // Soft surface: fail the Playwright test if any fail findings so the run is obvious
  if (failCount > 0) {
    throw new Error(
      `Deeper probe recorded ${failCount} fail(s), ${passCount} pass(es). See ${OUT_JSON}`,
    );
  }
});
