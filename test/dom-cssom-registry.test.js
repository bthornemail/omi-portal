import test from "node:test";
import assert from "node:assert/strict";

import {
  applyDOMCSSOMAttributes,
  atomToDOMCSSOMDetails,
  buildDOMCSSOMRegistry,
  compileTextToAnimatedDocument,
  filterDOMCSSOMAtoms
} from "../src/index.js";

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

test("DOM/CSSOM registry builds around animated document atoms and OMI index maps", async () => {
  const compiled = await compileTextToAnimatedDocument("Documented synsets animate DOM terms.", { wordpos });
  const registry = buildDOMCSSOMRegistry(compiled);
  const atom = registry.atoms[0];

  assert.equal(registry.atoms.length, compiled.atoms.length);
  assert.equal(registry.metrics.totalAtoms, compiled.atoms.length);
  assert.equal(registry.metrics.visibleAtoms, compiled.atoms.length);
  assert.ok(registry.index.byAddress.get(atom.omi.address).includes(atom));
  assert.ok(registry.metrics.tetrahedronCentroid.startsWith("2001:db8:"));
});

test("DOM/CSSOM registry filters by OMI prefix and atom routing keys", async () => {
  const compiled = await compileTextToAnimatedDocument("Documented synsets animate DOM terms.", { wordpos });
  const registry = buildDOMCSSOMRegistry(compiled);
  const atom = registry.atoms[0];
  const synsetCell = atom.synsetCells.fiveCell.active[0];

  assert.ok(filterDOMCSSOMAtoms(registry, { omiPrefix: "omi-ffff" }).length > 0);
  assert.ok(filterDOMCSSOMAtoms(registry, { omiPrefix: "omi-ffff-127-0-0-1" }).length > 0);
  assert.ok(filterDOMCSSOMAtoms(registry, { graphChannel: atom.channel }).includes(atom));
  assert.ok(filterDOMCSSOMAtoms(registry, { omiPortChannel: atom.omi.portChannel }).includes(atom));
  assert.ok(filterDOMCSSOMAtoms(registry, { posHex: atom.omi.posHex }).includes(atom));
  assert.deepEqual(filterDOMCSSOMAtoms(registry, { cidr: atom.cidr }), [atom]);
  assert.deepEqual(filterDOMCSSOMAtoms(registry, { centroid: atom.centroid }), [atom]);
  assert.ok(filterDOMCSSOMAtoms(registry, { synsetCell }).includes(atom));
});

test("DOM/CSSOM details and attributes expose canonical OMI metadata", async () => {
  const compiled = await compileTextToAnimatedDocument("Documented synsets animate DOM terms.", { wordpos });
  const registry = buildDOMCSSOMRegistry(compiled);
  const atom = registry.atoms[0];
  const details = atomToDOMCSSOMDetails(atom, { tetrahedron: compiled.tetrahedron });
  const writes = new Map();
  const element = { setAttribute(name, value) { writes.set(name, value); } };

  applyDOMCSSOMAttributes(element, atom);

  assert.equal(details.omiAddress, atom.omi.address);
  assert.equal(details.selector, atom.omi.selector);
  assert.equal(details.posHex, atom.omi.posHex);
  assert.equal(details.tetrahedron.vertices.length, 4);
  assert.equal(writes.get("data-omi"), atom.omi.address);
  assert.equal(writes.get("data-omi-graph-channel"), atom.channel);
  assert.match(writes.get("data-omi-synset-cells"), /S\d/);
});
