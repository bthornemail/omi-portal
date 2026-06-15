import test from "node:test";
import assert from "node:assert/strict";
import { computeMatrixCycle } from "../src/omi/omi-matrix-actor-cycle.js";

test("computeMatrixCycle default state matches canonical values", () => {
  const result = computeMatrixCycle({
    gauge: "US",
    p: 2,
    r: "∞",
    car: "3C",
    cdr: "base64url-payload",
  });

  assert.equal(result.gauge, "US");
  assert.equal(result.p, 2);
  assert.equal(result.r, "∞");
  assert.equal(result.word16, 0x55AA);
  assert.equal(result.sealedGauge, 0x1000AA55);
  assert.equal(result.car, "3C");
  assert.equal(result.cdr, "base64url-payload");
  assert.equal(result.value36, 120);
  assert.equal(result.region36, 7);
  assert.equal(result.local16, 8);
  assert.equal(result.x, 0);
  assert.equal(result.y, 2);
  assert.equal(result.qxy, 16);
  assert.equal(result.local240, 16);
  assert.equal(result.fano7, 0);
  assert.equal(result.role3, 0);
  assert.equal(result.slot5040, 16);
});

test("computeMatrixCycle FS card with 2,3 rails", () => {
  const result = computeMatrixCycle({
    gauge: "FS",
    p: 2,
    r: 3,
    car: "A",
    cdr: "",
  });

  assert.equal(result.gauge, "FS");
  assert.equal(result.word16, 0x5566);
  assert.equal(result.sealedGauge, 0x0001AA55);
  assert.ok(result.x >= 0 && result.x <= 3);
  assert.ok(result.y >= 0 && result.y <= 3);
  assert.ok(result.slot5040 >= 0 && result.slot5040 < 5040);
});

test("computeMatrixCycle RS card with infinity rails", () => {
  const result = computeMatrixCycle({
    gauge: "RS",
    p: "∞",
    r: "∞",
    car: "Z",
    cdr: "abc123",
  });

  assert.equal(result.word16, 0xAAAA);
  assert.equal(result.sealedGauge, 0x0100AA55);
  assert.equal(result.cdr, "abc123");
});

test("computeMatrixCycle GS card produces role3=1", () => {
  const result = computeMatrixCycle({
    gauge: "GS",
    p: 3,
    r: 4,
    car: "10",
    cdr: "payload",
  });

  assert.equal(result.role3, 1);
});

test("computeMatrixCycle throws on invalid gauge", () => {
  assert.throws(
    () => computeMatrixCycle({ gauge: "XX", p: 2, r: 2, car: "0", cdr: "" }),
    RangeError
  );
});

test("computeMatrixCycle throws on invalid rail", () => {
  assert.throws(
    () => computeMatrixCycle({ gauge: "FS", p: 7, r: 2, car: "0", cdr: "" }),
    RangeError
  );
});

test("computeMatrixCycle throws on invalid Base36 socket", () => {
  assert.throws(
    () => computeMatrixCycle({ gauge: "FS", p: 2, r: 2, car: "!!!", cdr: "" }),
    SyntaxError
  );
});
