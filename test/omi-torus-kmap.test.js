import * as Kmap from "../src/omi/omi-torus-kmap.js";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("Omi-Torus KMap", () => {
  it("toGray2 maps indexes correctly", () => {
    assert.equal(Kmap.toGray2(0), 0b00);
    assert.equal(Kmap.toGray2(1), 0b01);
    assert.equal(Kmap.toGray2(2), 0b11);
    assert.equal(Kmap.toGray2(3), 0b10);
  });

  it("fromGray2 inverts toGray2", () => {
    for (let i = 0; i < 4; i++) {
      assert.equal(Kmap.fromGray2(Kmap.toGray2(i)), i);
    }
  });

  it("torusIndex wraps Gray-code at 2-bit boundary", () => {
    const idx = Kmap.torusIndex(0, 0);
    assert.equal(idx, (Kmap.toGray2(0) << 2) | Kmap.toGray2(0));
  });

  it("torusCoord round-trips with torusIndex", () => {
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const idx = Kmap.torusIndex(x, y);
        const coord = Kmap.torusCoord(idx);
        assert.equal(coord.x, x);
        assert.equal(coord.y, y);
      }
    }
  });

  it("neighbors return 4 adjacent cells", () => {
    const ns = Kmap.neighbors(0, 0);
    assert.equal(ns.length, 4);
  });

  it("torus wraps left-to-right and top-to-bottom", () => {
    const ns = Kmap.neighbors(0, 0);
    const right = ns.find(n => n.x === 1 && n.y === 0);
    const left = ns.find(n => n.x === 3 && n.y === 0);
    const down = ns.find(n => n.x === 0 && n.y === 1);
    const up = ns.find(n => n.x === 0 && n.y === 3);
    assert.ok(right);
    assert.ok(left);
    assert.ok(down);
    assert.ok(up);
  });

  it("Gray neighbors differ by one bit", () => {
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const ns = Kmap.neighbors(x, y);
        const gx = Kmap.toGray2(x);
        const gy = Kmap.toGray2(y);
        for (const n of ns) {
          const ngx = Kmap.toGray2(n.x);
          const ngy = Kmap.toGray2(n.y);
          const diff = (gx ^ ngx) | ((gy ^ ngy) << 2);
          const bits = diff.toString(2).split("1").length - 1;
          assert.equal(bits, 1, `(${x},${y}) -> (${n.x},${n.y}) differ by ${bits} bits`);
        }
      }
    }
  });

  it("wrapX and wrapY wrap within [0,3]", () => {
    assert.equal(Kmap.wrapX(4), 0);
    assert.equal(Kmap.wrapX(-1), 3);
    assert.equal(Kmap.wrapY(4), 0);
    assert.equal(Kmap.wrapY(-1), 3);
  });

  it("detectHazard returns false for straight route", () => {
    const route = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    assert.equal(Kmap.detectHazard(route).hazard, false);
  });

  it("detectHazard returns true for non-adjacent jump", () => {
    const route = [{ x: 0, y: 0 }, { x: 2, y: 2 }];
    assert.equal(Kmap.detectHazard(route).hazard, true);
  });

  it("groupCells groups adjacent cells", () => {
    const cells = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    const groups = Kmap.groupCells(cells);
    assert.equal(groups.length, 1);
  });

  it("groupCells separates disconnected cells", () => {
    const cells = [{ x: 0, y: 0 }, { x: 2, y: 2 }];
    const groups = Kmap.groupCells(cells);
    assert.equal(groups.length, 2);
  });

  it("empty route has no hazard", () => {
    assert.equal(Kmap.detectHazard([]).hazard, false);
    assert.equal(Kmap.detectHazard(null).hazard, false);
  });
});
