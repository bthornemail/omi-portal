import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  principalGenerator,
  generatedIdeal,
  isPrincipalRegion,
  factorOmiPointer
} from '../src/omilog/principal-domain.js';
import { commonGenerator } from '../src/omilog/omi-gcd.js';

const ADDR_A = 'omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128';
const ADDR_B = 'omi-0400-03bf-0007-2b04-2f04-0009-039f-04ff/128';
const ADDR_C = 'omi-0500-03bf-0001-2b05-2f05-0003-039f-05ff/128';

describe('principal-domain', () => {
  it('factorOmiPointer parses canonical address', () => {
    const f = factorOmiPointer(ADDR_A);
    assert.notEqual(f, null);
    assert.equal(f.lane, 4);
    assert.equal(f.bodyNN, 3);
    assert.equal(f.carrierMM, 2);
    assert.equal(f.prefix, 128);
  });

  it('factorOmiPointer returns null for invalid input', () => {
    assert.equal(factorOmiPointer(''), null);
    assert.equal(factorOmiPointer(123), null);
    assert.equal(factorOmiPointer('not-an-omi-address'), null);
  });

  it('principalGenerator returns one generator for same-base records', () => {
    const records = [ADDR_A, ADDR_B];
    const gen = principalGenerator(records);
    assert.notEqual(gen, null);
    assert(gen.includes('0400'));
  });

  it('principalGenerator handles empty records', () => {
    assert.equal(principalGenerator([]), null);
  });

  it('generatedIdeal filters by generator prefix', () => {
    const records = [ADDR_A, ADDR_B, ADDR_C];
    const gen = principalGenerator([ADDR_A]);
    const ideal = generatedIdeal(gen, records);
    assert.equal(ideal.length, 2);
  });

  it('commonGenerator returns lane type for same-LL pointers', () => {
    const gen = commonGenerator(ADDR_A, ADDR_B);
    assert.notEqual(gen, null);
    assert.equal(gen.type, 'lane');
    assert.equal(gen.value, 4);
  });

  it('commonGenerator returns prefix type for different-LL pointers', () => {
    const gen = commonGenerator(ADDR_A, ADDR_C);
    assert.notEqual(gen, null);
    assert.equal(gen.type, 'prefix');
  });

  it('commonGenerator returns null for invalid inputs', () => {
    assert.equal(commonGenerator('bad', ADDR_A), null);
  });

  it('isPrincipalRegion true for single-generator set', () => {
    assert.equal(isPrincipalRegion([ADDR_A, ADDR_B]), true);
  });

  it('isPrincipalRegion true for single record', () => {
    assert.equal(isPrincipalRegion([ADDR_A]), true);
  });

  it('isPrincipalRegion false for empty set', () => {
    assert.equal(isPrincipalRegion([]), false);
  });

  it('factorOmiPointer handles fallback format', () => {
    const f = factorOmiPointer('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128');
    assert.notEqual(f, null);
    assert.equal(f.lane, 4);
  });
});
