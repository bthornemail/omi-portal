import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getLane, setLane,
  getU8, getU16, getU32, getU64,
  setU8, setU16, setU32, setU64,
  lanes, forEachLane,
  LANE_WIDTHS, LANE_COUNTS
} from "../src/omi/omi-imo-lanes.js";

describe("OMI-IMO Lanes (256-bit word lane views)", () => {
  const ZERO = 0n;
  const ALL_ONES = (1n << 256n) - 1n;
  const PATTERN = 0xDEAD_BEEF_CAFE_F00Dn;

  it("getU8 round-trips through setU8", () => {
    let w = ZERO;
    for (let i = 0; i < 32; i++) {
      w = setU8(w, i, (i * 7 + 3) & 0xFF);
    }
    for (let i = 0; i < 32; i++) {
      assert.equal(getU8(w, i), (i * 7 + 3) & 0xFF);
    }
  });

  it("getU16 round-trips through setU16", () => {
    let w = ZERO;
    for (let i = 0; i < 16; i++) {
      w = setU16(w, i, (i * 257 + 13) & 0xFFFF);
    }
    for (let i = 0; i < 16; i++) {
      assert.equal(getU16(w, i), (i * 257 + 13) & 0xFFFF);
    }
  });

  it("getU32 round-trips through setU32", () => {
    let w = ZERO;
    const vals = [0, 0x44332211, 0xAABBCCDD, 0xFFEEDDCC, 0x12345678, 0x87654321, 0xDEADBEEF, 0xCAFEF00D];
    for (let i = 0; i < vals.length; i++) {
      w = setU32(w, i, vals[i]);
    }
    for (let i = 0; i < vals.length; i++) {
      assert.equal(getU32(w, i), vals[i]);
    }
  });

  it("getU64 round-trips through setU64", () => {
    let w = ZERO;
    const vals = [0n, 0xDEAD_BEEF_CAFE_F00Dn, 0x1234_5678_9ABC_DEF0n, 0xFEDC_BA98_7654_3210n];
    for (let i = 0; i < 4; i++) {
      w = setU64(w, i, vals[i]);
    }
    for (let i = 0; i < 4; i++) {
      assert.equal(BigInt(getU64(w, i)), vals[i]);
    }
  });

  it("setLone lane does not disturb neighbors", () => {
    let w = ALL_ONES;
    w = setU8(w, 15, 0x42);
    for (let i = 0; i < 32; i++) {
      const expected = (i === 15) ? 0x42 : 0xFF;
      assert.equal(getU8(w, i), expected);
    }
  });

  it("lanes() returns all lanes for a given width", () => {
    const all = lanes(ALL_ONES, 16);
    assert.equal(all.length, 16);
    assert(all.every(v => v === 0xFFFF));
  });

  it("lanes() for a patterned value", () => {
    const all = lanes(PATTERN, 32);
    assert.equal(all.length, 8);
    assert.equal(all[0], Number(PATTERN & 0xFFFFFFFFn));
    assert.equal(all[1], Number((PATTERN >> 32n) & 0xFFFFFFFFn));
  });

  it("forEachLane iterates all lanes with index", () => {
    const seen = [];
    forEachLane(ALL_ONES, 64, (i, v) => { seen.push(i); });
    assert.deepEqual(seen, [0, 1, 2, 3]);
  });

  it("forEachLane produces correct values", () => {
    let w = ZERO;
    w = setU32(w, 2, 0xBEEF);
    const values = [];
    forEachLane(w, 32, (i, v) => { values.push(v); });
    assert.equal(values[2], 0xBEEF);
    assert.equal(values[0], 0);
  });

  it("getLane with width=1 returns individual bits", () => {
    let w = 1n << 255n;
    for (let i = 0; i < 256; i++) {
      const expected = (i === 255) ? 1 : 0;
      assert.equal(getLane(w, 1, i), expected);
    }
  });

  it("setLane with width=1 sets individual bits", () => {
    let w = 0n;
    w = setLane(w, 1, 255, 1);
    w = setLane(w, 1, 0, 1);
    assert.equal(w, (1n << 255n) | 1n);
  });

  it("throws on out-of-range lane", () => {
    assert.throws(() => getU8(0n, 32), RangeError);
    assert.throws(() => setU8(0n, 32, 0), RangeError);
    assert.throws(() => getU16(0n, 16), RangeError);
    assert.throws(() => setU64(0n, 4, 0n), RangeError);
  });

  it("LANE_WIDTHS and LANE_COUNTS constants", () => {
    assert.equal(LANE_WIDTHS.u8, 8);
    assert.equal(LANE_WIDTHS.u16, 16);
    assert.equal(LANE_WIDTHS.u32, 32);
    assert.equal(LANE_WIDTHS.u64, 64);
    assert.equal(LANE_COUNTS.u8, 32);
    assert.equal(LANE_COUNTS.u16, 16);
    assert.equal(LANE_COUNTS.u32, 8);
    assert.equal(LANE_COUNTS.u64, 4);
  });
});
