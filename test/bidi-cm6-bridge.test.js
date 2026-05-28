import test from "node:test";
import assert from "node:assert/strict";

import {
  OMI_BIDI_PROFILE,
  OmiBiDiCM6CoreEngine,
  compileOmiBiDiExtension
} from "../src/index.js";

function encodeFloats(values) {
  return Buffer.from(new Float32Array(values).buffer).toString("base64url");
}

test("BiDi core evaluates LRE/LRO text transactions against the SAB timeline", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const view = new DataView(sab);
  view.setBigUint64(8, 0b1111n, true);
  const engine = new OmiBiDiCM6CoreEngine(sab);
  const payload = encodeFloats([1.5, 2, -0.5, 10]);
  const cell = engine.processBiDiTransaction(`omi-8-\u202a\u202d-ffff-127-0-0-1-0x1a-0x41-${payload}`, 12);

  assert.equal(engine.car(cell).profile, OMI_BIDI_PROFILE.POSITIVE);
  assert.equal(engine.car(cell).isLittleEndian, true);
  assert.equal(engine.cdr(cell).cursorOffset, 12);
  assert.ok(engine.cdr(cell).extrusionDepth > 0);
});

test("BiDi core evaluates RLE/RLO as negative chirality", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const view = new DataView(sab);
  view.setBigUint64(8, 0b11n, false);
  const engine = new OmiBiDiCM6CoreEngine(sab);
  const payload = encodeFloats([1, 0, 0, 0]);
  const cell = engine.processBiDiTransaction(`omi-8-\u202b\u202e-ffff-127-0-0-1-0x1a-0x41-${payload}`, 0);

  assert.equal(engine.car(cell).profile, OMI_BIDI_PROFILE.NEGATIVE);
  assert.equal(engine.car(cell).isLittleEndian, false);
  assert.ok(engine.cdr(cell).extrusionDepth < 0);
});

test("BiDi clock advances and resets at the 5040 boundary", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const view = new DataView(sab);
  const engine = new OmiBiDiCM6CoreEngine(sab);
  view.setBigUint64(0, 5039n, true);

  assert.equal(engine.advanceClockTimeline(), 0);
  assert.equal(view.getBigUint64(0, true), 0n);
});

test("CM6 bridge requires an injected ViewPlugin dependency", () => {
  assert.throws(() => compileOmiBiDiExtension(new SharedArrayBuffer(5040 * 8)), /ViewPlugin/);
});
