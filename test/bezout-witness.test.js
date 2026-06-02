import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bezoutWitness,
  verifyWitnessPath,
  composeWitness
} from '../src/omilog/bezout-witness.js';

const ADDR_A = 'omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128';
const ADDR_B = 'omi-0400-03bf-0007-2b04-2f04-0009-039f-04ff/128';
const ADDR_C = 'omi-0500-03bf-0001-2b05-2f05-0003-039f-05ff/96';

describe('bezout-witness', () => {
  it('bezoutWitness produces witness with generator', () => {
    const w = bezoutWitness(ADDR_A, ADDR_B);
    assert.notEqual(w, null);
    assert(w.generator.includes('0400'));
    assert.equal(w.left.role, 'left-arm');
    assert.equal(w.right.role, 'right-arm');
  });

  it('bezoutWitness returns null for invalid input', () => {
    assert.equal(bezoutWitness('bad', ADDR_B), null);
  });

  it('bezoutWitness accepts explicit generator', () => {
    const w = bezoutWitness(ADDR_A, ADDR_B, { type: 'lane', value: 4, generator: 'omi-0400-0000-0000-0000-0000-0000-0000-0000/128' });
    assert.notEqual(w, null);
    assert(w.generator.includes('0400'));
  });

  it('verifyWitnessPath validates complete witness', () => {
    const w = bezoutWitness(ADDR_A, ADDR_B);
    const result = verifyWitnessPath(w);
    assert.equal(result.valid, true);
    assert(result.resolved.generator);
  });

  it('verifyWitnessPath rejects malformed witness', () => {
    const result = verifyWitnessPath(null);
    assert.equal(result.valid, false);
  });

  it('verifyWitnessPath rejects missing arms', () => {
    const result = verifyWitnessPath({ generator: 'x' });
    assert.equal(result.valid, false);
  });

  it('composeWitness combines two same-generator witnesses', () => {
    const w1 = bezoutWitness(ADDR_A, ADDR_B);
    const w2 = bezoutWitness(ADDR_B, ADDR_A);
    const composed = composeWitness(w1, w2);
    assert.notEqual(composed, null);
    assert(composed.combined.includes('COMPOSED'));
  });

  it('composeWitness returns null for mismatched generators', () => {
    const w1 = bezoutWitness(ADDR_A, ADDR_B);
    const w2 = bezoutWitness(ADDR_C, ADDR_A);
    assert.equal(composeWitness(w1, w2), null);
  });

  it('composeWitness returns null for null input', () => {
    assert.equal(composeWitness(null, null), null);
  });
});
