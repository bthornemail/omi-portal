import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyCanvasColor, routeCanvasColor, isLowerHexColor, isUpperPresetColor,
  hexToPreset, presetToHex,
} from "../src/canvas/omi-canvas-color-router.js";

describe("Canvas Color Router — Classification", () => {
  it("classifies #FF0000 as LOWER_HEX_STRUCTURAL_COLOR", () => {
    const result = classifyCanvasColor("#FF0000");
    assert.equal(result.classification, "LOWER_HEX_STRUCTURAL_COLOR");
    assert.equal(result.layer, "lower");
    assert.equal(result.stack, "≤8!");
  });

  it("classifies #00FF00 as lower hex", () => {
    const result = classifyCanvasColor("#00FF00");
    assert.equal(result.layer, "lower");
  });

  it("classifies #abcdef as lower hex", () => {
    const result = classifyCanvasColor("#abcdef");
    assert.equal(result.layer, "lower");
  });

  it("classifies '1' as UPPER_PRESET_READER_COLOR", () => {
    const result = classifyCanvasColor("1");
    assert.equal(result.classification, "UPPER_PRESET_READER_COLOR");
    assert.equal(result.layer, "upper");
    assert.equal(result.stack, "9!–12!");
    assert.equal(result.preset.name, "red");
  });

  it("classifies presets '2' through '6'", () => {
    const names = { "2": "orange", "3": "yellow", "4": "green", "5": "cyan", "6": "purple" };
    for (const [key, name] of Object.entries(names)) {
      const result = classifyCanvasColor(key);
      assert.equal(result.layer, "upper");
      assert.equal(result.preset.name, name);
    }
  });

  it("rejects invalid colors", () => {
    assert.equal(classifyCanvasColor("").layer, null);
    assert.equal(classifyCanvasColor(null).layer, null);
    assert.equal(classifyCanvasColor("7").layer, null);
    assert.equal(classifyCanvasColor("#GGGGGG").layer, null);
    assert.equal(classifyCanvasColor("0").layer, null);
  });

  it("rejects non-string input", () => {
    assert.equal(classifyCanvasColor(42).classification, "INVALID");
    assert.equal(classifyCanvasColor(undefined).classification, "INVALID");
  });
});

describe("Canvas Color Router — Routing", () => {
  it("routes lower hex to structural-canvas-body", () => {
    const result = routeCanvasColor("#FF0000");
    assert.equal(result.route, "structural-canvas-body");
    assert.equal(result.authority, "lower-omicron-exact");
  });

  it("routes upper preset to reader-cosmetic-shell", () => {
    const result = routeCanvasColor("3");
    assert.equal(result.route, "reader-cosmetic-shell");
    assert.equal(result.authority, "upper-bidi-preset");
  });

  it("rejects invalid colors", () => {
    const result = routeCanvasColor("invalid");
    assert.equal(result.route, "rejected");
  });
});

describe("Canvas Color Router — Predicates", () => {
  it("isLowerHexColor", () => {
    assert.ok(isLowerHexColor("#FF0000"));
    assert.equal(isLowerHexColor("1"), false);
    assert.equal(isLowerHexColor("invalid"), false);
  });

  it("isUpperPresetColor", () => {
    assert.ok(isUpperPresetColor("1"));
    assert.ok(isUpperPresetColor("6"));
    assert.equal(isUpperPresetColor("#FF0000"), false);
  });
});

describe("Canvas Color Router — Conversion", () => {
  it("hexToPreset matches exact hex", () => {
    assert.deepEqual(hexToPreset("#FF0000"), { key: "1", name: "red" });
    assert.deepEqual(hexToPreset("#00FFFF"), { key: "5", name: "cyan" });
  });

  it("hexToPreset returns null for non-matching hex", () => {
    assert.equal(hexToPreset("#123456"), null);
  });

  it("hexToPreset returns null for preset input", () => {
    assert.equal(hexToPreset("1"), null);
  });

  it("presetToHex maps preset to hex", () => {
    assert.equal(presetToHex("1"), "#FF0000");
    assert.equal(presetToHex("6"), "#800080");
  });

  it("presetToHex returns null for hex input", () => {
    assert.equal(presetToHex("#FF0000"), null);
  });

  it("presetToHex returns null for invalid input", () => {
    assert.equal(presetToHex("7"), null);
  });
});
