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
});
