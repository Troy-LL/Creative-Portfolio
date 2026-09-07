import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HORIZON,
  advanceHorizon,
  overflowPx,
  stationIndex,
  trackTranslatePx,
} from "../../assets/js/portfolio-horizon.js";

const view = { viewportHeight: 800, viewportWidth: 1200 };

describe("portfolio horizon", () => {
  it("does not pan while fold is still closing", () => {
    const next = advanceHorizon({
      fold: 0.4,
      hold: 0,
      travel: 0,
      deltaPx: 200,
      ...view,
    });
    assert.equal(next.kind, "fold");
    assert.equal(next.hold, 0);
    assert.equal(next.travel, 0);
  });

  it("hold consumes extra downward scroll after fold is open before any translate", () => {
    const holdPx = HORIZON.holdVh * view.viewportHeight;
    const next = advanceHorizon({
      fold: 1,
      hold: 0,
      travel: 0,
      deltaPx: holdPx * 0.4,
      ...view,
    });
    assert.equal(next.kind, "hold");
    assert.ok(next.hold > 0 && next.hold < 1);
    assert.equal(next.travel, 0);
    assert.equal(trackTranslatePx(next.travel, overflowPx(view.viewportWidth)), 0);
  });

  it("starts traveling left only after hold is full", () => {
    const travelPx = HORIZON.travelVw * view.viewportWidth;
    const next = advanceHorizon({
      fold: 1,
      hold: 1,
      travel: 0,
      deltaPx: travelPx * 0.25,
      ...view,
    });
    assert.equal(next.kind, "travel");
    assert.equal(next.hold, 1);
    assert.ok(Math.abs(next.travel - 0.25) < 1e-9);
    assert.ok(trackTranslatePx(next.travel, overflowPx(view.viewportWidth)) < 0);
  });

  it("never scales — translate is x-only pixels", () => {
    assert.equal(trackTranslatePx(0.5, 2000), -1000);
    assert.equal(trackTranslatePx(0, 2000), 0);
    assert.equal(trackTranslatePx(1, 2000), -2000);
  });

  it("spills leftover wheel from a completed hold into travel", () => {
    const holdPx = HORIZON.holdVh * view.viewportHeight;
    const travelPx = HORIZON.travelVw * view.viewportWidth;
    const next = advanceHorizon({
      fold: 1,
      hold: 0.9,
      travel: 0,
      deltaPx: holdPx * 0.2 + travelPx * 0.1,
      ...view,
    });
    assert.equal(next.hold, 1);
    assert.ok(next.travel > 0.05);
  });

  it("clamps at the end of the intro strip", () => {
    const next = advanceHorizon({
      fold: 1,
      hold: 1,
      travel: 1,
      deltaPx: 800,
      ...view,
    });
    assert.equal(next.kind, "end");
    assert.equal(next.travel, 1);
  });

  it("scroll up from the intro returns through travel then hold then fold", () => {
    const travelPx = HORIZON.travelVw * view.viewportWidth;
    const back = advanceHorizon({
      fold: 1,
      hold: 1,
      travel: 0.2,
      deltaPx: -travelPx * 0.2,
      ...view,
    });
    assert.ok(back.travel < 0.01);

    const holdPx = HORIZON.holdVh * view.viewportHeight;
    const throughHold = advanceHorizon({
      fold: 1,
      hold: 0.5,
      travel: 0,
      deltaPx: -holdPx,
      ...view,
    });
    assert.equal(throughHold.hold, 0);

    const toFold = advanceHorizon({
      fold: 1,
      hold: 0,
      travel: 0,
      deltaPx: -40,
      ...view,
    });
    assert.equal(toFold.kind, "fold");
  });

  it("first page wall is short so leaving 01 is easy", () => {
    assert.ok(HORIZON.holdVh > 0);
    assert.ok(HORIZON.holdVh <= 0.28);
  });

  it("travel is one viewport — Welcome is the last page, not a runway", () => {
    assert.equal(HORIZON.travelVw, 1);
    assert.equal(overflowPx(view.viewportWidth), view.viewportWidth);
    assert.equal(
      trackTranslatePx(1, overflowPx(view.viewportWidth)),
      -view.viewportWidth,
    );
  });

  it("ticks station 02 once the intro occupies the viewport center", () => {
    assert.equal(stationIndex(0), "01");
    assert.equal(stationIndex(0.49), "01");
    assert.equal(stationIndex(0.5), "02");
    assert.equal(stationIndex(1), "02");
  });
});
