import test from "node:test";
import assert from "node:assert/strict";
import { parseBase36, projectSocket } from "../src/omi/base36-socket-projector.js";

test("parseBase36 returns numeric value", () => {
  assert.equal(parseBase36("0"), 0);
  assert.equal(parseBase36("Z"), 35);
  assert.equal(parseBase36("10"), 36);
  assert.equal(parseBase36("3C"), 120);
  assert.equal(parseBase36("6O"), 240);
  assert.equal(parseBase36("K0"), 720);
  assert.equal(parseBase36("3W0"), 5040);
});

test("parseBase36 normalizes lowercase to uppercase", () => {
  assert.equal(parseBase36("3c"), 120);
  assert.equal(parseBase36("3w0"), 5040);
});

test("parseBase36 trims whitespace", () => {
  assert.equal(parseBase36(" 3C "), 120);
});

test("parseBase36 rejects invalid characters", () => {
  assert.throws(() => parseBase36("3C!!!"), SyntaxError);
  assert.throws(() => parseBase36("!"), SyntaxError);
  assert.throws(() => parseBase36(""), SyntaxError);
  assert.throws(() => parseBase36(null), SyntaxError);
});

test("projectSocket(\"3C\", \"US\") returns canonical values", () => {
  const result = projectSocket("3C", "US");
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

test("projectSocket zero socket projects to zero", () => {
  const result = projectSocket("0", "FS");
  assert.equal(result.value36, 0);
  assert.equal(result.region36, 0);
  assert.equal(result.local16, 0);
  assert.equal(result.x, 0);
  assert.equal(result.y, 0);
  assert.equal(result.qxy, 0);
  assert.equal(result.local240, 0);
  assert.equal(result.fano7, 0);
  assert.equal(result.role3, 0);
  assert.equal(result.slot5040, 0);
});

test("projectSocket top socket Z with GS gauge", () => {
  const result = projectSocket("Z", "GS");
  assert.equal(result.value36, 35);
  assert.equal(result.region36, 2);
  assert.equal(result.local16, 3);
  assert.equal(result.x, 3);
  assert.equal(result.y, 0);
  assert.equal(result.qxy, 540);
  assert.equal(result.local240, 60);
  assert.equal(result.fano7, 2);
  assert.equal(result.role3, 1);
  assert.equal(result.slot5040, 1740);
});

test("projectSocket gauge affects role3 but not geometry", () => {
  const fs = projectSocket("3C", "FS");
  const gs = projectSocket("3C", "GS");
  const rs = projectSocket("3C", "RS");
  const us = projectSocket("3C", "US");
  assert.equal(fs.role3, 0);
  assert.equal(gs.role3, 1);
  assert.equal(rs.role3, 2);
  assert.equal(us.role3, 0);
  assert.equal(fs.x, gs.x);
  assert.equal(fs.y, gs.y);
  assert.equal(fs.qxy, gs.qxy);
  assert.equal(fs.local240, gs.local240);
});

test("projectSocket fano7 cycles through region36", () => {
  const r0 = projectSocket("0", "FS");
  assert.equal(r0.region36, 0);
  assert.equal(r0.fano7, 0);
  const rG = projectSocket("G", "FS");
  assert.equal(rG.value36, 16);
  assert.equal(rG.region36, 1);
  assert.equal(rG.fano7, 1);
  const r10 = projectSocket("10", "FS");
  assert.equal(r10.value36, 36);
  assert.equal(r10.region36, 2);
  assert.equal(r10.fano7, 2);
  const r1Z = projectSocket("1Z", "FS");
  assert.equal(r1Z.value36, 71);
  assert.equal(r1Z.region36, 4);
  assert.equal(r1Z.fano7, 4);
  const r2Z = projectSocket("2Z", "FS");
  assert.equal(r2Z.value36, 107);
  assert.equal(r2Z.region36, 6);
  assert.equal(r2Z.fano7, 6);
  const r30 = projectSocket("30", "FS");
  assert.equal(r30.value36, 108);
  assert.equal(r30.region36, 6);
  assert.equal(r30.fano7, 6);
  const r31 = projectSocket("31", "FS");
  assert.equal(r31.value36, 109);
  assert.equal(r31.region36, 6);
  assert.equal(r31.fano7, 6);
  const r3Z = projectSocket("3Z", "FS");
  assert.equal(r3Z.value36, 143);
  assert.equal(r3Z.region36, 8);
  assert.equal(r3Z.fano7, 1);
});

test("every 4×4 local cell produces x,y in 0..3", () => {
  for (let v = 0; v < 256; v++) {
    const car = v.toString(36).toUpperCase();
    const result = projectSocket(car, "FS");
    assert.ok(result.x >= 0 && result.x <= 3, `x=${result.x} out of range for ${car}`);
    assert.ok(result.y >= 0 && result.y <= 3, `y=${result.y} out of range for ${car}`);
  }
});
