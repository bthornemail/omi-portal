import * as PolybiusFrame from "../src/omi/polybius-ququart-frame.js";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("Polybius QuQuart Frame", () => {
  it("has 25 cells (5x5)", () => {
    const cells = PolybiusFrame.forEachCell(c => c);
    assert.equal(cells.length, 25);
  });

  it("1x1 is the o---o origin", () => {
    assert.equal(PolybiusFrame.isOrigin(1, 1), true);
    const origin = PolybiusFrame.getOrigin();
    assert.equal(origin.row, 1);
    assert.equal(origin.col, 1);
  });

  it("top rail has 4 low QuQuart cells", () => {
    for (let i = 0; i < 4; i++) {
      const cell = PolybiusFrame.getLowQuquart(i);
      assert.equal(cell.row, 1);
      assert.equal(cell.col, i + 2);
      assert.equal(PolybiusFrame.isRail(cell.row, cell.col), true);
      assert.equal(PolybiusFrame.isInterior(cell.row, cell.col), false);
    }
  });

  it("left rail has 4 high QuQuart cells", () => {
    for (let i = 0; i < 4; i++) {
      const cell = PolybiusFrame.getHighQuquart(i);
      assert.equal(cell.col, 1);
      assert.equal(cell.row, i + 2);
      assert.equal(PolybiusFrame.isRail(cell.row, cell.col), true);
      assert.equal(PolybiusFrame.isInterior(cell.row, cell.col), false);
    }
  });

  it("interior has 16 cells (4x4)", () => {
    let count = 0;
    PolybiusFrame.forEachCell(c => { if (c.interior) count++; });
    assert.equal(count, 16);
  });

  it("interior cells are accessible via getInteriorCell", () => {
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const cell = PolybiusFrame.getInteriorCell(x, y);
        assert.equal(cell.row, y + 2);
        assert.equal(cell.col, x + 2);
      }
    }
  });

  it("getCell returns null for out-of-range", () => {
    assert.equal(PolybiusFrame.getCell(0, 0), null);
    assert.equal(PolybiusFrame.getCell(6, 1), null);
    assert.equal(PolybiusFrame.getCell(3, 6), null);
  });

  it("origin is not a rail", () => {
    assert.equal(PolybiusFrame.isRail(1, 1), false);
  });

  it("isOrigin is false for non-origin cells", () => {
    assert.equal(PolybiusFrame.isOrigin(1, 2), false);
    assert.equal(PolybiusFrame.isOrigin(2, 1), false);
    assert.equal(PolybiusFrame.isOrigin(3, 3), false);
  });

  it("isRail is false for interior cells", () => {
    assert.equal(PolybiusFrame.isRail(2, 2), false);
    assert.equal(PolybiusFrame.isRail(3, 4), false);
  });

  it("forEachCell provides correct classification", () => {
    PolybiusFrame.forEachCell(c => {
      if (c.origin) {
        assert.equal(c.rail, false);
        assert.equal(c.interior, false);
      } else if (c.rail) {
        assert.equal(c.origin, false);
        assert.equal(c.interior, false);
      } else if (c.interior) {
        assert.equal(c.origin, false);
        assert.equal(c.rail, false);
      }
      assert.equal(c.origin || c.rail || c.interior, true);
    });
  });
});
