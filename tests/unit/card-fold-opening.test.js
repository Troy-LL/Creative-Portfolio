import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HATCH_OPENING,
  HATCH_OPENING_DEFAULTS,
  cursorCardWeight,
  FLIP,
  FLIP_DEFAULTS,
  flipLagAlpha,
  flipMotion,
  flipRotateY,
  flipShadowFootprint,
  panelShade,
  panelShadeFromAngles,
  resetFlip,
  resetHatchOpening,
  resetHatchVideo,
  resolveOpeningPeel,
  resolveScrollOnCard,
  setFlip,
  setHatchOpening,
  setHatchVideo,
  hatchVideoVars,
  hatchApertureVars,
  hatchVideoSource,
  formatByteSize,
  HATCH_VIDEO,
  HATCH_VIDEO_DEFAULTS,
  HATCH_VIDEO_FORMATS,
  shouldEnableCursorLean,
  surfacePeel,
} from "../../assets/js/card-fold.js";

describe("card-fold opening", () => {
  it("locks visitor tune at full fold", () => {
    const peel = resolveOpeningPeel(1);
    assert.equal(HATCH_OPENING.heightScale, 1.5);
    assert.equal(HATCH_OPENING.extendBottomPct, 0.4);
    assert.equal(HATCH_OPENING.layerZ, 80);
    assert.ok(peel.topPct < surfacePeel(1).topPct + 0.001);
    assert.ok(peel.heightPct > surfacePeel(1).heightPct - 0.001);
    assert.ok(Math.abs(peel.topPct + peel.heightPct - 1) < 0.001);
  });

  it("hides opening at rest", () => {
    const peel = resolveOpeningPeel(0);
    assert.equal(peel.shiftPct, 0);
    assert.equal(peel.heightPct, 0);
  });

  it("lets debug mutate hatch opening then reset", () => {
    setHatchOpening({ heightScale: 1.2, layerZ: 64 });
    assert.equal(HATCH_OPENING.heightScale, 1.2);
    assert.equal(HATCH_OPENING.layerZ, 64);
    resetHatchOpening();
    assert.equal(HATCH_OPENING.heightScale, HATCH_OPENING_DEFAULTS.heightScale);
    assert.equal(HATCH_OPENING.layerZ, HATCH_OPENING_DEFAULTS.layerZ);
  });

  it("maps hatch video offset and zoom to css vars then reset", () => {
    setHatchVideo({ offsetY: 28, zoom: 1.8 });
    assert.deepEqual(hatchVideoVars(), {
      "--hatch-video-y": "28%",
      "--hatch-video-zoom": "1.8",
      "--hatch-vignette": "0.55",
      "--hatch-vignette-soft": "32%",
      "--hatch-vignette-size": "1",
    });
    resetHatchVideo();
    assert.equal(HATCH_VIDEO.offsetY, HATCH_VIDEO_DEFAULTS.offsetY);
    assert.equal(HATCH_VIDEO.zoom, HATCH_VIDEO_DEFAULTS.zoom);
    assert.deepEqual(hatchVideoVars(), {
      "--hatch-video-y": "50%",
      "--hatch-video-zoom": "1",
      "--hatch-vignette": "0.55",
      "--hatch-vignette-soft": "32%",
      "--hatch-vignette-size": "1",
    });
  });

  it("maps hatch video vignette amount and softness to css vars", () => {
    setHatchVideo({ vignette: 0.8, vignetteSoft: 18 });
    assert.deepEqual(hatchVideoVars(), {
      "--hatch-video-y": "50%",
      "--hatch-video-zoom": "1",
      "--hatch-vignette": "0.8",
      "--hatch-vignette-soft": "18%",
      "--hatch-vignette-size": "1",
    });
    resetHatchVideo();
    assert.equal(HATCH_VIDEO.vignette, HATCH_VIDEO_DEFAULTS.vignette);
    assert.equal(HATCH_VIDEO.vignetteSoft, HATCH_VIDEO_DEFAULTS.vignetteSoft);
  });

  it("maps hatch video vignette size to a css scale", () => {
    setHatchVideo({ vignetteSize: 0.4 });
    assert.equal(hatchVideoVars()["--hatch-vignette-size"], "0.4");
    resetHatchVideo();
    assert.equal(HATCH_VIDEO.vignetteSize, HATCH_VIDEO_DEFAULTS.vignetteSize);
    assert.equal(hatchVideoVars()["--hatch-vignette-size"], "1");
  });

  it("sizes hatch vignette to the visible opening, not the full well", () => {
    const rest = hatchApertureVars(resolveOpeningPeel(0));
    assert.equal(rest["--hatch-aperture-top"], "100%");
    assert.equal(rest["--hatch-aperture-height"], "0%");

    const peel = resolveOpeningPeel(1);
    const vars = hatchApertureVars(peel);
    const top = Number.parseFloat(vars["--hatch-aperture-top"]);
    const height = Number.parseFloat(vars["--hatch-aperture-height"]);
    assert.ok(
      height < 70 && height > 20,
      "vignette hugs the video slit below the folded card",
    );
    assert.ok(top > 25);
    assert.ok(Math.abs(top + height - 100) < 0.05);

    const cardBottom =
      (Number(peel.stackTopPct) || 0) +
      (Number.isFinite(Number(peel.stackHeightPct))
        ? Number(peel.stackHeightPct)
        : 1);
    const expectedTop =
      Math.max(peel.topPct, 1 - peel.shiftPct, cardBottom) * 100;
    assert.ok(Math.abs(top - expectedTop) < 0.1);
  });

  it("resolves hatch video formats and uncached byte labels", () => {
    assert.equal(hatchVideoSource("webm").type, "video/webm");
    assert.equal(hatchVideoSource("webm").src.endsWith(".webm"), true);
    assert.equal(hatchVideoSource("mp4").type, "video/mp4");
    assert.equal(hatchVideoSource("nope").id, HATCH_VIDEO_DEFAULTS.format);
    setHatchVideo({ format: "webm" });
    assert.equal(hatchVideoSource().id, "webm");
    resetHatchVideo();
    assert.equal(HATCH_VIDEO.format, HATCH_VIDEO_DEFAULTS.format);
    assert.equal(hatchVideoSource().id, "webm");
    assert.equal(formatByteSize(8951863), "8.54 MB");
    assert.equal(formatByteSize(-1), "—");
  });

  it("cursorCardWeight stays smooth across the card edge", () => {
    const samples = [];
    for (let x = 0.94; x <= 1.08; x += 0.01) {
      samples.push(cursorCardWeight(x, 0));
    }
    for (let i = 1; i < samples.length; i++) {
      assert.ok(
        Math.abs(samples[i] - samples[i - 1]) < 0.08,
        `edge step ${samples[i - 1].toFixed(3)} → ${samples[i].toFixed(3)}`,
      );
    }
    assert.equal(cursorCardWeight(0, 0), 1);
    assert.ok(cursorCardWeight(2, 0) < cursorCardWeight(1.05, 0));
  });

  it("flipRotateY turns the card over at full progress", () => {
    assert.equal(flipRotateY(0), 0);
    assert.equal(flipRotateY(1), 180);
    assert.equal(flipRotateY(0.5), 90);
    assert.equal(flipRotateY(-1), 0);
    assert.equal(flipRotateY(2), 180);
  });

  it("flipMotion lifts and scales toward the viewer at mid-flip", () => {
    const rest = flipMotion(0);
    const mid = flipMotion(0.5);
    const end = flipMotion(1);
    assert.ok(mid.liftZ > 80);
    assert.ok(mid.scale > 1.08);
    assert.equal(mid.rotateY, 90);
    assert.ok(end.liftZ < 0.01);
    assert.ok(Math.abs(end.scale - 1) < 0.001);
  });

  it("flipShadowFootprint shrinks when the card is edge-on", () => {
    const flat = flipShadowFootprint(0);
    const edge = flipShadowFootprint(0.5);
    assert.equal(flat.width, 1);
    assert.ok(edge.width < flat.width * 0.2);
    assert.ok(edge.opacity < flat.opacity);
  });

  it("panelShade ramps with fold angle", () => {
    assert.deepEqual(panelShadeFromAngles({ top: 0, mid: 0, bot: 0 }), {
      top: 0,
      mid: 0,
      bot: 0,
    });
    const full = panelShade(1);
    assert.ok(full.mid > full.top);
    assert.ok(full.mid >= 0.18);
  });

  it("flipLagAlpha is slower at the locked 900ms than a ~220ms snap", () => {
    assert.equal(FLIP.ms, 900);
    const slow = flipLagAlpha(900);
    const snap = flipLagAlpha(220);
    assert.ok(slow < snap, "longer duration must lag less per frame");
    assert.ok(slow < 0.09);
    assert.ok(snap > 0.15 && snap < 0.26);
    setFlip({ ms: 1400 });
    assert.ok(flipLagAlpha() < slow);
    resetFlip();
    assert.equal(FLIP.ms, FLIP_DEFAULTS.ms);
  });

  it("shouldEnableCursorLean stays on when settled on the back", () => {
    const settledBack = {
      foldDisplay: 0,
      flipTarget: 1,
      flipDisplay: 1,
      foldPhase: "idle",
    };
    assert.equal(shouldEnableCursorLean(settledBack), true);
    assert.equal(
      shouldEnableCursorLean({ ...settledBack, flipDisplay: 0.52, flipTarget: 1 }),
      false,
    );
    assert.equal(
      shouldEnableCursorLean({ ...settledBack, foldDisplay: 0.2 }),
      false,
    );
  });

  it("resolveScrollOnCard flips to front before fold can start", () => {
    const back = resolveScrollOnCard({ flipTarget: 1, flipDisplay: 1, delta: 0.08 });
    assert.equal(back.kind, "flip-to-front");
    assert.equal(back.flipTarget, 0);
    assert.equal(back.stashDelta, 0.08);

    const midFlip = resolveScrollOnCard({
      flipTarget: 0,
      flipDisplay: 0.7,
      delta: 0.05,
    });
    assert.equal(midFlip.kind, "defer-fold");
    assert.equal(midFlip.stashDelta, 0.05);

    const front = resolveScrollOnCard({ flipTarget: 0, flipDisplay: 0, delta: 0.04 });
    assert.equal(front.kind, "fold");
    assert.equal(front.stashDelta, 0);
  });
});
