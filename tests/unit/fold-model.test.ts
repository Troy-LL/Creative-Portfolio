import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SNAP_OPEN_THRESHOLD,
  applyLag,
  dampFoldDelta,
  foldProgressFromDelta,
  creaseAmount,
  panelAngles,
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
});
