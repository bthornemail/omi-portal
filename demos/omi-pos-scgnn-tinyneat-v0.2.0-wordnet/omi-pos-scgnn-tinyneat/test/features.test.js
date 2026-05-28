import test from "node:test";
import assert from "node:assert/strict";
import { featureTokens, posFeatureVector } from "../src/nlp/features.js";

const tokens = [
  { value: "The", normal: "the", pos: "DET" },
  { value: "clock", normal: "clock", pos: "NOUN" },
  { value: "routes", normal: "routes", pos: "VERB" },
  { value: ".", normal: ".", pos: "PUNCT" }
];

test("POS feature vector creates normalized POS and channel counts", () => {
  const f = posFeatureVector(tokens);
  assert.equal(f.posCounts.DET, 1);
  assert.equal(f.posCounts.NOUN, 1);
  assert.equal(f.channelCounts.GS, 1);
  assert.equal(f.channelCounts.US, 1);
  assert.equal(f.channelCounts.RS, 1);
  assert.equal(f.channelCounts.FS, 1);
  assert.equal(f.featureVector.length, 21);
});

test("feature tokens preserve POS transitions", () => {
  const ft = featureTokens(tokens);
  assert.equal(ft[0].transition, "BOS");
  assert.equal(ft[2].transition, "POS:NOUN>VERB");
});
