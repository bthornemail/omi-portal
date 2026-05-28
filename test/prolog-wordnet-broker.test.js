import test from "node:test";
import assert from "node:assert/strict";
import {
  compileTextToWordNetTetraSCGNN,
  createPrologWordNetBroker,
  formatOmiFanoPrologToken,
  makeOmiSynsetRoutingFrame,
  makeWordNetCentroid,
  parseOmiFanoPrologToken,
  parsePrologFact,
  serializePrologWordNetPacket
} from "../src/index.js";

test("Prolog WordNet fact parser handles synset, gloss, and relation facts", () => {
  assert.deepEqual(parsePrologFact("s(100002684,2,'physical object',n,1,0)."), {
    name: "s",
    args: ["100002684", "2", "physical object", "n", "1", "0"]
  });
  assert.deepEqual(parsePrologFact("hyp(100002684,100001930)."), {
    name: "hyp",
    args: ["100002684", "100001930"]
  });
  assert.deepEqual(parsePrologFact("g(100002684,'a tangible entity; \"it was full of rackets, balls\"')."), {
    name: "g",
    args: ["100002684", "a tangible entity; \"it was full of rackets, balls\""]
  });
});

test("Prolog WordNet broker looks up vendor facts and relation targets", async () => {
  const broker = await createPrologWordNetBroker({
    dictPath: "vendor/prolog",
    operators: ["hyp", "sim", "ent", "ant", "der"]
  });
  const objects = broker.lookupLemma("object");
  assert.ok(objects.some((synset) => synset.id === "100002684"));
  const hypers = broker.queryRelation("hyp", "100002684");
  assert.ok(hypers.some((synset) => synset.id === "100001930"));
  const records = broker.toWordPosRecords("person");
  assert.ok(records.some((record) => record.synonyms.includes("person")));
  assert.ok(records.some((record) => record.ptrs.some((ptr) => ptr.operator === "hyp")));
});

test("Prolog WordNet broker can feed existing stable centroid compilation", async () => {
  const broker = await createPrologWordNetBroker({
    dictPath: "vendor/prolog",
    operators: ["hyp", "sim", "ent", "ant", "der"]
  });
  const centroid = makeWordNetCentroid({
    lemma: "person",
    pos: "NOUN",
    lookupRecords: broker.toWordPosRecords("person"),
    minRelations: 6
  });
  assert.equal(centroid.metric.stable, true);

  const compiled = await compileTextToWordNetTetraSCGNN("person", { wordpos: broker, minRelations: 6 });
  assert.equal(compiled.nodes[0].wordnet.metric.stable, true);
  assert.ok(compiled.nodes[0].wordnet.cells.fiveCell.active.length > 0);
});

test("OMI Fano Prolog token parses, formats, and serializes to a 16-byte packet", () => {
  const payload = Buffer.from(new Float32Array([1.5, 2.25, 3.5, 4.75]).buffer).toString("base64url");
  const token = formatOmiFanoPrologToken({
    fanoPoint: "p3",
    transport: "local",
    operator: "hyp",
    sourceId: "100002684",
    targetId: "100001930",
    featureTokens: ["Mood_Ind", "Tense_Pres"],
    slot: 720,
    payload
  });
  const parsed = parseOmiFanoPrologToken(token);
  assert.equal(parsed.operator, "hyp");
  assert.equal(parsed.sourceCategory, 1);
  assert.equal(parsed.sourceOffset, 2684);
  assert.equal(parsed.featureMask, "Mood_Ind-Tense_Pres");

  const packet = serializePrologWordNetPacket(token);
  const view = new DataView(packet);
  assert.equal(packet.byteLength, 16);
  assert.equal(view.getUint8(0), 3);
  assert.equal(view.getUint8(1), 1);
  assert.equal(view.getUint32(2, true), 2684);
  assert.equal(view.getFloat32(6, true), 1.5);
  assert.equal(view.getFloat32(10, true), 2.25);
  assert.equal(view.getUint16(14, true), 720);

  const frame = makeOmiSynsetRoutingFrame({ ...parsed, payload }, { upos: "NOUN", universalFeatures: ["Mood_Ind", "Tense_Pres"] });
  assert.equal(frame.serviceBus, "::3");
  assert.equal(frame.dataAttributes["data-omi-service-bus"], "3");
  assert.equal(frame.dataAttributes["data-omi-context-root"], "::ffff:127.0.0.1");
  assert.equal(frame.dataAttributes["data-ufeatures"], "Mood_Ind Tense_Pres");
});

test("OMI Fano Prolog token rejects malformed routing fields", () => {
  assert.throws(() => parseOmiFanoPrologToken("omi-fano-p8-local-hyp-100002684-100001930-x-slot720-AAAA"), /point/);
  assert.throws(() => parseOmiFanoPrologToken("omi-fano-p1-local-nope-100002684-100001930-x-slot720-AAAA"), /operator/);
  assert.throws(() => parseOmiFanoPrologToken("omi-fano-p1-local-hyp-900002684-100001930-x-slot720-AAAA"), /synset/);
  assert.throws(() => parseOmiFanoPrologToken("omi-fano-p1-local-hyp-100002684-100001930-x-slot720-***"), /payload/);
});
