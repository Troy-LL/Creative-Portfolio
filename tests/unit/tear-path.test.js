import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TEAR_RECIPES,
  buildTear,
  grabSide,
  mulberry32,
  pickRecipe,
  seamSamples,
  tearClipPolygons,
  tearResistance,
} from "../../assets/js/card-tear/tear-path.js";
import { deckleSeam } from "../../assets/js/card-tear/tear-fiber-edge.js";

describe("tear-path", () => {
  it("mulberry32 is deterministic", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    assert.equal(a(), b());
    assert.equal(a(), b());
  });

  it("pickRecipe stays inside the predetermined set", () => {
    for (let s = 0; s < 40; s++) {
      assert.ok(TEAR_RECIPES.includes(pickRecipe(s * 97)));
    }
  });

  it("same seed → same jagged seam; different seed → different path", () => {
    const a = seamSamples("vertical", 101);
    const b = seamSamples("vertical", 101);
    const c = seamSamples("vertical", 202);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, c);
  });

  it("vertical seam pins to top and bottom rims", () => {
    const seam = seamSamples("vertical", 7);
    assert.equal(seam[0].y, 0);
    assert.equal(seam[seam.length - 1].y, 1);
  });

  it("tearClipPolygons returns two CSS polygons and a pull axis", () => {
    for (const recipe of TEAR_RECIPES) {
      const t = tearClipPolygons(recipe, 33);
      assert.match(t.clipA, /^polygon\(/);
      assert.match(t.clipB, /^polygon\(/);
      assert.ok(Math.hypot(t.pull.x, t.pull.y) > 0.5);
      assert.ok(t.seam.length > 10);
    }
  });

  it("buildTear picks a recipe and is seed-stable", () => {
    const a = buildTear(999);
    const b = buildTear(999);
    assert.equal(a.recipe, b.recipe);
    assert.equal(a.clipA, b.clipA);
  });

  it("tearResistance is sticky then yields", () => {
    assert.ok(tearResistance(0.2) < tearResistance(0.5));
    assert.ok(tearResistance(0.25) < 0.2);
    assert.ok(tearResistance(1) >= 0.95);
  });

  it("grabSide splits the card by recipe", () => {
    assert.equal(grabSide("vertical", 0.2, 0.5), "a");
    assert.equal(grabSide("vertical", 0.8, 0.5), "b");
    assert.equal(grabSide("horizontal", 0.5, 0.2), "a");
    assert.equal(grabSide("horizontal", 0.5, 0.8), "b");
  });

  it("deckleSeam densifies the edge", () => {
    const seam = seamSamples("vertical", 12);
    const d = deckleSeam(seam, 12, 3);
    assert.ok(d.length > seam.length);
  });
});
