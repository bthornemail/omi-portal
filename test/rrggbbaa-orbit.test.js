import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAAModeSwitch, recoverRRGGBBAAOrbit, composeRRGGBBAAOrbit,
  recoverRGBFromSeed32, verifyColorOrbit,
} from "../src/canvas/rrggbbaa-orbit.js";

describe("RRGGBBAA Orbit — Mode Switch Detection", () => {
  it("detects AA=37 (0x25) as mode switch", () => {
    assert.ok(isAAModeSwitch(0x25));
    assert.ok(isAAModeSwitch("25"));
  });

  it("does not flag AA=0x00 as mode switch", () => {
    assert.equal(isAAModeSwitch(0x00), false);
    assert.equal(isAAModeSwitch("00"), false);
  });

  it("does not flag other values as mode switch", () => {
    assert.equal(isAAModeSwitch(0x01), false);
    assert.equal(isAAModeSwitch(0xFF), false);
  });
});

describe("RRGGBBAA Orbit — recoverRRGGBBAAOrbit", () => {
  it("recover 0xFF000025 as orbit=118838614 offset=13 base36=d", () => {
    const r = recoverRRGGBBAAOrbit("FF000025");
    assert.equal(r.seed32 >>> 0, 0xFF000025 >>> 0);
    assert.equal(r.orbit, 118838614);
    assert.equal(r.offset, 13);
    assert.equal(r.base36, "d");
    assert.ok(r.isValidOffset);
  });

  it("offset is always 0..35", () => {
    for (const seed of ["00000000", "00000024", "00000FFF", "FF000000"]) {
      const r = recoverRRGGBBAAOrbit(seed);
      assert.ok(r.offset >= 0 && r.offset <= 35, `seed ${seed} offset ${r.offset}`);
    }
  });

  it("detects mode switch when AA=37", () => {
    const r = recoverRRGGBBAAOrbit("00000025");
    assert.equal(r.modeSwitch, true);
  });

  it("no mode switch for AA=0", () => {
    const r = recoverRRGGBBAAOrbit("00000000");
    assert.equal(r.modeSwitch, false);
  });

  it("handles numeric input", () => {
    const r = recoverRRGGBBAAOrbit(0xFF000000);
    assert.equal(r.seed32, 0xFF000000);
    assert.equal(r.offset, 0xFF000000 % 36);
  });
});

describe("RRGGBBAA Orbit — composeRRGGBBAAOrbit", () => {
  it("composes from rgb and aa values", () => {
    const r = composeRRGGBBAAOrbit(0xFF0000, 0x25);
    assert.equal(r.seed32, 0xFF000025);
    assert.equal(r.orbit, Math.floor(0xFF000025 / 36));
    assert.equal(r.offset, 0xFF000025 % 36);
    assert.equal(r.modeSwitch, true);
    assert.equal(r.rgb, 0xFF0000);
    assert.equal(r.aa, 0x25);
  });

  it("composes from hex strings", () => {
    const r = composeRRGGBBAAOrbit("FF0000", "25");
    assert.equal(r.seed32, 0xFF000025);
  });

  it("composes from #FF0000 string", () => {
    const r = composeRRGGBBAAOrbit("#00FF00", "00");
    assert.equal(r.seed32, 0x00FF0000);
  });

  it("AA=0x25 triggers modeSwitch", () => {
    const r = composeRRGGBBAAOrbit(0x000000, 0x25);
    assert.ok(r.modeSwitch);
  });
});

describe("RRGGBBAA Orbit — recoverRGBFromSeed32", () => {
  it("extracts rgb and aa from seed", () => {
    const r = recoverRGBFromSeed32(0xFF000025);
    assert.equal(r.rgb, 0xFF0000);
    assert.equal(r.aa, 0x25);
    assert.equal(r.display, "#ff0000");
    assert.equal(r.aaDecimal, 37);
    assert.ok(r.modeSwitch);
  });

  it("extracts zero values", () => {
    const r = recoverRGBFromSeed32(0x00000000);
    assert.equal(r.rgb, 0x000000);
    assert.equal(r.aa, 0x00);
    assert.equal(r.modeSwitch, false);
  });
});

describe("RRGGBBAA Orbit — verifyColorOrbit", () => {
  it("round-trips through compose and recover", () => {
    const r = verifyColorOrbit("FF0000", "25");
    assert.equal(r.rgb, 0xFF0000);
    assert.equal(r.aa, 0x25);
    assert.ok(r.verify);
  });

  it("verify is false on mismatch", () => {
    const r = verifyColorOrbit("000000", "00");
    assert.ok(r.verify);
  });
});
