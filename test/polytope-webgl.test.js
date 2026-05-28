import test from "node:test";
import assert from "node:assert/strict";
import { createPolytopeBuffer, pack4D } from "../src/runtime/polytope-sab.js";
import { unpackPolytopePoints, createPolytopeHUD, PAGE_NAMES } from "../src/web/polytope-webgl.js";

test("unpackPolytopePoints returns Float32Array of 3*stride values", () => {
  const buf = createPolytopeBuffer({ shared: false });
  buf[0] = pack4D(1024, 0, 0, 0);
  buf[1] = pack4D(0, 1024, 0, 0);
  const pts = unpackPolytopePoints(buf, 720, 0);
  assert(pts instanceof Float32Array);
  assert.equal(pts.length, 720 * 3);
  assert.equal(pts[0], 1);
  assert.equal(pts[3], 0);
  assert.equal(pts[4], 1);
});

test("unpackPolytopePoints respects page offset", () => {
  const buf = createPolytopeBuffer({ shared: false });
  buf[720] = pack4D(2048, 0, 0, 0);
  const pts = unpackPolytopePoints(buf, 720, 1);
  assert.equal(pts[0], 2);
});

test("createPolytopeHUD returns tick decomposition", () => {
  const hud = createPolytopeHUD(1000);
  assert.equal(hud.tick, 1000);
  assert.equal(hud.page6, 1);
  assert.equal(hud.block5, 2);
  assert.ok(hud.html.includes("1000"));
});

test("createPolytopeHUD wraps at 5040", () => {
  const hud = createPolytopeHUD(5040);
  assert.equal(hud.tick, 0);
});

test("PAGE_NAMES has 7 entries", () => {
  assert.equal(PAGE_NAMES.length, 7);
  assert.ok(PAGE_NAMES[0].includes("page 0"));
});
