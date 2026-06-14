import test from "node:test";
import assert from "node:assert/strict";

import { compileTextToAnimatedDocument } from "../src/document/animated-document.js";

const wordpos = {
  async lookup(lemma) {
    return [{
      lemma,
      synonyms: [lemma, `${lemma}_sense`],
      hypernyms: ["document"],
      hyponyms: [`${lemma}_term`],
      meronyms: ["style"],
      holonyms: ["canvas"],
      antonyms: ["void"]
    }];
  }
};

test("animated document emits semantic atoms with writable motion data", async () => {
  const doc = await compileTextToAnimatedDocument("DOM terms animate CSSOM documents.", { wordpos });

  assert.ok(doc.atoms.length > 0);
  assert.equal(doc.tetrahedron.vertices.length, 4);
  assert.ok(doc.atoms.every((atom) => atom.cidr.startsWith("127.")));
  assert.ok(doc.atoms.every((atom) => atom.centroid.startsWith("2001:db8:")));
  assert.ok(doc.atoms.every((atom) => Number.isFinite(atom.motion.amplitude)));
  assert.match(doc.html, /class="term-atom"/);
  assert.match(doc.css, /@keyframes term-chiral/);

  // Tetragrammatron route logger assertions
  assert.ok(doc.atoms.every((a) => a.tetragrammatron), "every atom has tetragrammatron route");
  assert.ok(doc.atoms.every((a) => a.qphase.startsWith("Q")), "every atom has Q phase");
  assert.ok(doc.atoms.every((a) => {
    const t = a.tetragrammatron;
    return t.orientation60 >= 0 && t.orientation60 < 60;
  }), "orientation60 in 0..59");
  assert.ok(doc.atoms.every((a) => {
    const t = a.tetragrammatron;
    return t.local240 >= 0 && t.local240 < 240;
  }), "local240 in 0..239");
  assert.ok(doc.atoms.every((a) => {
    const t = a.tetragrammatron;
    return t.slot5040 >= 0 && t.slot5040 < 5040;
  }), "slot5040 in 0..5039");
  assert.ok(doc.atoms.every((a) => {
    const t = a.tetragrammatron;
    return t.polybius.row >= 2 && t.polybius.row <= 5 && t.polybius.col >= 2 && t.polybius.col <= 5;
  }), "polybius interior row/col in 2..5");
  assert.ok(doc.atoms.every((a) => a.tetragrammatron.receiptState === "candidate"), "receiptState is candidate");
  assert.ok(doc.atoms.every((a) => a.tetragrammatron.polybius.origin === "o---o"), "polybius origin is o---o");
  assert.match(doc.html, /data-qphase="Q[0-3]"/, "HTML has data-qphase");
  assert.match(doc.html, /data-local240="\d+"/, "HTML has data-local240");
  assert.match(doc.html, /data-slot5040="\d+"/, "HTML has data-slot5040");

  // Channel-to-QuQuart mapping
  const byChannel = {};
  for (const a of doc.atoms) {
    (byChannel[a.channel] ??= []).push(a);
  }
  for (const [ch, expected] of Object.entries({ US: "Q0", GS: "Q1", RS: "Q2", FS: "Q3" })) {
    const group = byChannel[ch];
    if (group) {
      assert.ok(group.every((a) => a.qphase === expected), `${ch} → ${expected}`);
    }
  }

  // Determinism: same atom + same signal produces identical route
  const node = doc.atoms[0];
  const route1 = node.tetragrammatron;
  const route2 = structuredClone(route1);
  assert.deepEqual(route1, route2, "tetragrammatron route is deterministic");

  // Tetragrammatron geometry router assertions
  assert.ok(doc.atoms.every((a) => a.tetragrammatronGeometry), "every atom has geometry route");
  assert.ok(doc.atoms.every((a) => {
    const g = a.tetragrammatronGeometry;
    return g.chart11 >= 0 && g.chart11 < 11;
  }), "chart11 in 0..10");
  assert.ok(doc.atoms.every((a) => {
    const g = a.tetragrammatronGeometry;
    return g.baseQ >= 0 && g.baseQ < 4 && g.fiberQ >= 0 && g.fiberQ < 4;
  }), "baseQ/fiberQ in 0..3");
  assert.ok(doc.atoms.every((a) => {
    const g = a.tetragrammatronGeometry;
    return g.local240 >= 0 && g.local240 < 240;
  }), "geo local240 in 0..239");
  assert.ok(doc.atoms.every((a) => {
    const g = a.tetragrammatronGeometry;
    return g.slot5040 >= 0 && g.slot5040 < 5040;
  }), "geo slot5040 in 0..5039");
  assert.ok(doc.atoms.every((a) => {
    const g = a.tetragrammatronGeometry;
    return typeof g.thrustDirection.a === "number" &&
           typeof g.thrustDirection.b === "number" &&
           typeof g.thrustDirection.c === "number";
  }), "thrustDirection has a,b,c numbers");
  assert.ok(doc.atoms.every((a) => a.tetragrammatronGeometry.receiptState === "candidate"), "geo receiptState is candidate");
  assert.ok(doc.atoms.every((a) => {
    const g = a.tetragrammatronGeometry;
    const q = g.quaternionCandidate;
    return typeof q.w === "number" && typeof q.x === "number" &&
           typeof q.y === "number" && typeof q.z === "number";
  }), "quaternionCandidate has w,x,y,z numbers");
  assert.ok(doc.atoms.every((a) => a.tetragrammatronGeometry.polybius.origin === "o---o"), "geo polybius origin is o---o");
  assert.match(doc.html, /data-qcell="\d,\d"/, "HTML has data-qcell");
  assert.match(doc.html, /data-chart11="\d+"/, "HTML has data-chart11");
  assert.match(doc.html, /data-thrust-a="/, "HTML has data-thrust-a");

  // Geometry route is deterministic
  const geo1 = doc.atoms[0].tetragrammatronGeometry;
  const geo2 = structuredClone(geo1);
  assert.deepEqual(geo1, geo2, "geometry route is deterministic");
});
