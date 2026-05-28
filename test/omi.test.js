import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOmiIndex,
  compileTextToAnimatedDocument,
  compileTextToWordNetTetraSCGNN,
  formatOmiAddress,
  makeOmiAddressForAtom,
  parseOmiAddress,
  projectUPOSPort
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

test("OMI parser accepts and normalizes canonical IPv4-mapped FS/GS/RS/US addresses", () => {
  const address = "omi-8-ffff-127-0-0-1-0x1A-0x41-AAC_QEAAAL_AykAQA";
  const parsed = parseOmiAddress(address);

  assert.equal(parsed.address, "omi-8-ffff-127-0-0-1-0x1a-0x41-AAC_QEAAAL_AykAQA");
  assert.equal(parsed.deprecatedShorthand, false);
  assert.equal(parsed.fs, "8");
  assert.equal(parsed.gs, "ffff-127-0-0-1");
  assert.equal(parsed.gsIPv4, "127.0.0.1");
  assert.equal(parsed.ipv6Mapped, "::ffff:127.0.0.1");
  assert.equal(parsed.rsValue, 0x1a);
  assert.equal(parsed.usValue, 0x41);
  assert.equal(formatOmiAddress(parsed), parsed.address);
});

test("OMI parser accepts deprecated localhost shorthand and emits canonical mapped form", () => {
  const parsed = parseOmiAddress("omi-8-127-0-0-1-0x1a-0x41-AAC_QEAAAL_AykAQA");

  assert.equal(parsed.deprecatedShorthand, true);
  assert.equal(parsed.address, "omi-8-ffff-127-0-0-1-0x1a-0x41-AAC_QEAAAL_AykAQA");
  assert.equal(formatOmiAddress(parsed), parsed.address);
});

test("OMI parser rejects malformed prefixes, octets, and bounded RS/US frames", () => {
  assert.throws(() => parseOmiAddress("bad-8-ffff-127-0-0-1-0x1a-0x41"), /prefix/);
  assert.throws(() => parseOmiAddress("omi-8-ffff-127-0-0-999-0x1a-0x41"), /octet/);
  assert.throws(() => parseOmiAddress("omi-8-ffff-127-0-0-1-0x40-0x41"), /exceeds/);
  assert.throws(() => parseOmiAddress("omi-8-ffff-127-0-0-1-0x1a-0x80"), /exceeds/);
});

test("UPOS projection follows Omi Porting partition without changing graph channels", () => {
  assert.equal(projectUPOSPort("NOUN").portChannel, "FS");
  assert.equal(projectUPOSPort("DET").portChannel, "GS");
  assert.equal(projectUPOSPort("PRON").portChannel, "RS");
  assert.equal(projectUPOSPort("SYM").portChannel, "US");
  assert.equal(projectUPOSPort("NOUN").posHex, "0x07");
});

test("atoms receive deterministic OMI addresses and data attributes", async () => {
  const doc = await compileTextToAnimatedDocument("DOM terms animate CSSOM documents.", { wordpos });
  const atom = doc.atoms[0];

  assert.match(atom.omi.address, /^omi-8-ffff-127-0-0-1-0x[0-9a-f]{2}-0x[0-9a-f]{2}-/);
  assert.equal(atom.omi.dataAttributes["data-omi"], atom.omi.address);
  assert.match(doc.html, /data-omi="omi-8-ffff-127-0-0-1-/);
});

test("buildOmiIndex queries address prefixes and semantic routing keys", async () => {
  const compiled = await compileTextToWordNetTetraSCGNN("DOM terms animate CSSOM documents.", { wordpos });
  const index = buildOmiIndex(compiled);
  const atom = index.atoms[0];

  assert.ok(index.queryPrefix("omi-8").length > 0);
  assert.ok(index.queryPrefix("omi-8-ffff-127-0-0-1").length > 0);
  assert.ok(index.byAddress.get(atom.omi.address).includes(atom));
  assert.ok(index.byCIDR.get(atom.address).includes(atom));
  assert.ok(index.byCentroid.get(atom.centroid).includes(atom));
  assert.ok(index.byPOSHex.get(atom.omi.posHex).includes(atom));
  assert.ok(index.bySynsetCell.get("S0").length > 0);
});

test("JSON Canvas nodes expose OMI metadata", async () => {
  const compiled = await compileTextToWordNetTetraSCGNN("DOM terms animate CSSOM documents.", { wordpos });
  const node = compiled.canvas.nodes.find((n) => n.id === "tok-0000");

  assert.ok(node.omi.address.startsWith("omi-8-ffff-127-0-0-1-"));
  assert.equal(node.omi.dataAttributes["data-omi"], node.omi.address);
});

test("makeOmiAddressForAtom is deterministic for the same atom", () => {
  const atom = { id: "tok-0001", label: "NOUN:node", feature: { pos: "NOUN" } };
  assert.equal(makeOmiAddressForAtom(atom).address, makeOmiAddressForAtom(atom).address);
});
