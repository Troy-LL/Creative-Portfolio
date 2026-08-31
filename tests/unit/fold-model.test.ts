import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SNAP_OPEN_THRESHOLD,
  SURFACE_PEEL,
  applyHatchDebug,
  HATCH_DEBUG_DEFAULTS,
  applyLag,
  dampFoldDelta,
  foldProgressFromDelta,
  creaseAmount,
  panelAngles,
  panelAnglesAtEnd,
  surfacePeel,
  shouldSnapOpen,
  alignPose,
  enterZoom,
  WORLD_SCALE_REST,
  WORLD_SCALE_ENTER,
} from "../../calling-card/src/fold/model.ts";

describe("fold model", () => {
  it("maps upward drag to fold progress clamped 0..1", () => {
    assert.equal(foldProgressFromDelta(0, 400), 0);
    assert.equal(foldProgressFromDelta(-200, 400), 0.5);
    assert.equal(foldProgressFromDelta(-400, 400), 1);
    assert.equal(foldProgressFromDelta(-800, 400), 1);
    assert.equal(foldProgressFromDelta(50, 400), 0);
  });

  it("lags the fold behind the pointer target", () => {
    const next = applyLag(0, 1, 0.25);
    assert.ok(next > 0 && next < 1);
    assert.equal(applyLag(0.5, 0.5, 0.3), 0.5);
  });

  it("damps pointer delta more near the open end", () => {
    const mid = dampFoldDelta(40, 0.4);
    const near = dampFoldDelta(40, 0.92);
    assert.ok(near < mid);
    assert.ok(near > 0);
  });

  it("snaps open only at or above the threshold", () => {
    assert.equal(shouldSnapOpen(SNAP_OPEN_THRESHOLD - 0.01), false);
    assert.equal(shouldSnapOpen(SNAP_OPEN_THRESHOLD), true);
    assert.equal(shouldSnapOpen(1), true);
    assert.ok(Math.abs(SNAP_OPEN_THRESHOLD - 0.55) < 0.001);
  });

  it("springs pose toward upright harder as fold progresses", () => {
    const tilted = { rotateX: 8, rotateY: -6, rotateZ: 4 };
    const early = alignPose(0.1, tilted, 1);
    const late = alignPose(0.9, tilted, 1);
    assert.ok(Math.abs(late.rotateX) < Math.abs(early.rotateX));
    assert.ok(Math.abs(late.rotateY) < Math.abs(early.rotateY));
    assert.ok(Math.abs(late.rotateZ) < Math.abs(early.rotateZ));
  });

  it("builds nested Z fold sequential upward bot → mid → top", () => {
    const closed = panelAngles(0);
    assert.equal(closed.top, 0);
    assert.equal(closed.mid, 0);
    assert.equal(closed.bot, 0);

    // Early: bot leads, top still near flat
    const early = panelAngles(0.2);
    assert.ok(Math.abs(early.bot) > Math.abs(early.top));

    const open = panelAngles(1);
    assert.equal(open.top, 20);
    assert.equal(open.mid, 103);
    assert.equal(open.bot, -111);
  });

  it("creases grow as the geometry folds", () => {
    assert.equal(creaseAmount(0), 0);
    assert.ok(creaseAmount(0.5) > 0.3);
    assert.ok(creaseAmount(1) > 0.7);
  });

  it("enter zoom stays at rest until enter progress, then accelerates", () => {
    assert.ok(Math.abs(enterZoom(0) - WORLD_SCALE_REST) < 0.02);
    assert.ok(enterZoom(0.5) < enterZoom(0.85));
    assert.ok(enterZoom(1) >= WORLD_SCALE_ENTER - 0.01);
  });

  it("slides the wall surface up in sync with fold (reveals inside)", () => {
    const closed = surfacePeel(0);
    assert.equal(closed.shiftPct, 0);
    assert.equal(closed.rotateX, 0);
    assert.equal(closed.heightPct, 0);
    assert.equal(closed.topPct, 1);

    const early = surfacePeel(0.2);
    const mid = surfacePeel(0.5);
    const open = surfacePeel(1);

    assert.equal(early.rotateX, 0);
    assert.ok(early.shiftPct > 0);
    assert.ok(mid.shiftPct > early.shiftPct);
    assert.ok(open.shiftPct > mid.shiftPct);
    assert.equal(open.shiftPct, SURFACE_PEEL.shiftPct);
    assert.ok(early.heightPct >= 0);
    assert.ok(open.heightPct > 0);
  });

  it("opening uses full card slot — reveal line → bottom edge", () => {
    const mid = surfacePeel(0.5);
    assert.ok(mid.topPct < 1);
    assert.ok(mid.heightPct > 0);
    assert.ok(Math.abs(mid.topPct + mid.heightPct - 1) < 0.001);

    const open = surfacePeel(1);
    assert.ok(open.heightPct > 0.5);
    assert.ok(Math.abs(open.topPct + open.heightPct - 1) < 0.001);
  });

  it("panelAnglesAtEnd scrubs from flat to end pose", () => {
    assert.deepEqual(panelAnglesAtEnd(0, { top: 20, mid: 103, bot: -111 }), {
      top: 0,
      mid: 0,
      bot: 0,
    });
    const mid = panelAnglesAtEnd(0.5, { top: 20, mid: 103, bot: -111 });
    assert.ok(Math.abs(mid.bot) > Math.abs(mid.top));
    const end = panelAnglesAtEnd(1, { top: 20, mid: 103, bot: -111 });
    assert.equal(end.top, 20);
    assert.equal(end.mid, 103);
    assert.equal(end.bot, -111);
  });

  it("extend bottom and pull reveal enlarge opening", () => {
    const base = surfacePeel(1);
    const pulled = applyHatchDebug(base, {
      ...HATCH_DEBUG_DEFAULTS,
      autoSilhouette: true,
      topPullPct: 0.15,
      heightScale: 1.2,
      extendBottomPct: 0.05,
    });
    assert.ok(pulled.topPct < base.topPct);
    assert.ok(pulled.heightPct >= base.heightPct);
    assert.ok(pulled.topPct + pulled.heightPct <= 1.001);
  });
});
