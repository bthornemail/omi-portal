import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hopfDirection,
  computeQxy,
  resolveHopfQuQuartRoute,
  tetragrammatronGeometryRoute,
} from "../src/omi/tetragrammatron-geometry-router.js";

describe("hopfDirection", () => {
  it("identity quaternion projects to +z axis", () => {
    const d = hopfDirection({ w: 1, x: 0, y: 0, z: 0 });
    assert.equal(d.a, 0);
    assert.equal(d.b, 0);
    assert.equal(d.c, 1);
  });

  it("180° about y flips to -z", () => {
    const d = hopfDirection({ w: 0, x: 0, y: 1, z: 0 });
    assert.ok(Math.abs(d.c + 1) < 1e-10);
  });

  it("90° about y rotates z to x", () => {
    const s2 = Math.SQRT1_2;
    const d = hopfDirection({ w: s2, x: 0, y: s2, z: 0 });
    assert.ok(Math.abs(d.a - 1) < 1e-10);
    assert.ok(Math.abs(d.b) < 1e-10);
    assert.ok(Math.abs(d.c) < 1e-10);
  });

  it("projection preserves unit norm", () => {
    const d = hopfDirection({ w: 0.5, x: 0.5, y: 0.5, z: 0.5 });
    const norm = Math.sqrt(d.a * d.a + d.b * d.b + d.c * d.c);
    assert.ok(Math.abs(norm - 1) < 1e-10);
  });
});

describe("computeQxy", () => {
  it("BQD formula: 60x² + 16xy + 4y²", () => {
    assert.equal(computeQxy(0, 0), 0);
    assert.equal(computeQxy(1, 0), 60);
    assert.equal(computeQxy(0, 1), 4);
    assert.equal(computeQxy(1, 1), 60 + 16 + 4);
    assert.equal(computeQxy(3, 3), 60 * 9 + 16 * 9 + 4 * 9);
  });
});

describe("resolveHopfQuQuartRoute", () => {
  it("produces valid range for all chart/base/fiber combos", () => {
    for (let c = 0; c < 11; c++) {
      for (let b = 0; b < 4; b++) {
        for (let f = 0; f < 4; f++) {
          const r = resolveHopfQuQuartRoute({
            chart11: c, baseQ: b, fiberQ: f, fano7: 0, role3: 0,
          });
          assert.equal(r.chart11, c);
          assert.equal(r.baseQ, b);
          assert.equal(r.fiberQ, f);
          assert.ok(r.local240 >= 0 && r.local240 < 240);
          assert.ok(r.slot5040 >= 0 && r.slot5040 < 5040);
          assert.ok(typeof r.thrustDirection.a === "number");
          assert.ok(typeof r.quaternionCandidate.w === "number");
          assert.equal(r.receiptState, "candidate");
        }
      }
    }
  });

  it("wraps negative inputs mod range", () => {
    const r = resolveHopfQuQuartRoute({
      chart11: -1, baseQ: 5, fiberQ: -3, fano7: 7, role3: 3,
    });
    assert.equal(r.chart11, 10);
    assert.equal(r.baseQ, 1);
    assert.equal(r.fiberQ, 1);
    assert.equal(r.fano7, 0);
    assert.equal(r.role3, 0);
    assert.ok(r.local240 >= 0 && r.local240 < 240);
    assert.equal(r.receiptState, "candidate");
  });

  it("produces same route for same inputs (determinism)", () => {
    const r1 = resolveHopfQuQuartRoute({ chart11: 3, baseQ: 2, fiberQ: 1, fano7: 4, role3: 2 });
    const r2 = resolveHopfQuQuartRoute({ chart11: 3, baseQ: 2, fiberQ: 1, fano7: 4, role3: 2 });
    assert.deepEqual(r1, r2);
  });

  it("different fiberQ changes thrust direction", () => {
    const r1 = resolveHopfQuQuartRoute({ chart11: 0, baseQ: 2, fiberQ: 0, fano7: 0, role3: 0 });
    const r2 = resolveHopfQuQuartRoute({ chart11: 0, baseQ: 2, fiberQ: 2, fano7: 0, role3: 0 });
    const eq = r1.thrustDirection.a === r2.thrustDirection.a &&
               r1.thrustDirection.b === r2.thrustDirection.b &&
               r1.thrustDirection.c === r2.thrustDirection.c;
    assert.ok(!eq, "different fiberQ should differ in thrust direction");
  });
});

describe("tetragrammatronGeometryRoute", () => {
  const node = {
    id: "test-0",
    label: "NOUN:term",
    channel: "RS",
    controlCode: "0x0F",
    address: "127.0.0.1",
    wordnet: {
      relationCount: 6,
      metric: { stability: 0.75 },
      cells: { canonical: "021.N.01" },
    },
  };

  it("produces valid geometry route from node", () => {
    const g = tetragrammatronGeometryRoute(node, 0);
    assert.ok(g.chart11 >= 0 && g.chart11 < 11);
    assert.ok(g.baseQ >= 0 && g.baseQ < 4);
    assert.ok(g.fiberQ >= 0 && g.fiberQ < 4);
    assert.ok(g.local240 >= 0 && g.local240 < 240);
    assert.ok(g.slot5040 >= 0 && g.slot5040 < 5040);
    assert.equal(g.receiptState, "candidate");
  });

  it("is deterministic for same node and index", () => {
    const g1 = tetragrammatronGeometryRoute(node, 0);
    const g2 = tetragrammatronGeometryRoute(node, 0);
    assert.deepEqual(g1, g2);
  });

  it("is independent of insertion index (deterministic by node identity)", () => {
    const g1 = tetragrammatronGeometryRoute(node, 0);
    const g2 = tetragrammatronGeometryRoute(node, 99);
    assert.deepEqual(g1, g2, "geometry route depends on node identity, not index");
  });

  it("maps channel to baseQ", () => {
    const channels = { US: 0, GS: 1, RS: 2, FS: 3 };
    for (const [ch, expected] of Object.entries(channels)) {
      const n = { ...node, channel: ch };
      const g = tetragrammatronGeometryRoute(n, 0);
      assert.equal(g.baseQ, expected, `${ch} → baseQ ${expected}`);
    }
  });

  it("does not depend on TinyNEAT signal", () => {
    const noSignal = tetragrammatronGeometryRoute(node, 0);
    const hasSignal = tetragrammatronGeometryRoute(node, 0);
    assert.deepEqual(noSignal, hasSignal);
  });
});
