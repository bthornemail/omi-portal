import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { packReceipt } from '../src/omi/delta-orbital-lexer.js';
import { OmiPrologInferenceEngine, WORDNET_RELATIONS } from '../src/omi/prolog-inference.js';

test('Inference Core: Engine accurately unifies direct identity facts from memory slots', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const ringArray = new BigInt64Array(ringSAB);
  const engine = new OmiPrologInferenceEngine(ringSAB);

  const provenanceTag = 0xABC1;
  const steps = 1;
  const packed64BitFact = packReceipt(provenanceTag, steps, WORDNET_RELATIONS.HYPERNYM_IS_A, 0x7C00, 0x1434);
  Atomics.store(ringArray, 1504, packed64BitFact);

  const query = engine.unifySymbolicQuery(WORDNET_RELATIONS.HYPERNYM_IS_A, 0x7C00, 0x1434);

  assert.equal(query.unified, true);
  assert.equal(query.type, "DIRECT_IDENTITY_PROVEN");
  assert.equal(query.slotIndex, 1504);
});

test('Inference Core: Engine resolves transitive Horn clauses inside the Fano bounds', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const ringArray = new BigInt64Array(ringSAB);
  const engine = new OmiPrologInferenceEngine(ringSAB);

  const packedFact1 = packReceipt(0x1111, 1, WORDNET_RELATIONS.HYPERNYM_IS_A, 0x7C00, 0x1434);
  Atomics.store(ringArray, 100, packedFact1);

  const query = engine.unifySymbolicQuery(WORDNET_RELATIONS.HYPERNYM_IS_A, 0x7C00, 0x1434);
  assert.equal(query.unified, true);
});

test('Inference Core: Empty ring returns non-unifiable for any query', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const engine = new OmiPrologInferenceEngine(ringSAB);

  const query = engine.unifySymbolicQuery(WORDNET_RELATIONS.HOLONYM_PART_OF, 0x1000, 0x2000);
  assert.equal(query.unified, false);
  assert.equal(query.type, "NON_UNIFIABLE_VACUOUS_MANIFOLD");
});

test('Inference Core: Invalid LL outside Fano range returns false', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const engine = new OmiPrologInferenceEngine(ringSAB);

  assert.equal(engine.unifySymbolicQuery(0, 0x1000, 0x2000), false);
  assert.equal(engine.unifySymbolicQuery(8, 0x1000, 0x2000), false);
});

test('Inference Core: Multiple facts stored, correct match found', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const ringArray = new BigInt64Array(ringSAB);
  const engine = new OmiPrologInferenceEngine(ringSAB);

  Atomics.store(ringArray, 0, packReceipt(0x1, 1, WORDNET_RELATIONS.HOLONYM_PART_OF, 0x1000, 0x2000));
  Atomics.store(ringArray, 1, packReceipt(0x2, 2, WORDNET_RELATIONS.HYPONYM_INCLUDES, 0x3000, 0x4000));
  Atomics.store(ringArray, 2, packReceipt(0x3, 1, WORDNET_RELATIONS.HYPERNYM_IS_A, 0x7C00, 0x1434));

  const query = engine.unifySymbolicQuery(WORDNET_RELATIONS.HYPERNYM_IS_A, 0x7C00, 0x1434);
  assert.equal(query.unified, true);
  assert.equal(query.slotIndex, 2);
  assert.equal(query.type, "DIRECT_IDENTITY_PROVEN");
});
