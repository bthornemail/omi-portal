import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  commonPrefixScope,
  commonLaneLL,
  commonFrameShell,
  commonGenerator
} from '../src/omilog/omi-gcd.js';

const ADDR_A = 'omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128';
const ADDR_B = 'omi-0400-03bf-0007-2b04-2f04-0009-039f-04ff/128';
const ADDR_C = 'omi-0500-03bf-0001-2b05-2f05-0003-039f-05ff/96';

describe('omi-gcd', () => {
  it('commonPrefixScope returns min prefix', () => {
    assert.equal(commonPrefixScope(ADDR_A, ADDR_C), 96);
  });

  it('commonPrefixScope returns same prefix for equal scopes', () => {
    assert.equal(commonPrefixScope(ADDR_A, ADDR_B), 128);
  });

  it('commonLaneLL returns same LL for same-lane pointers', () => {
    assert.equal(commonLaneLL(ADDR_A, ADDR_B), 4);
  });

  it('commonLaneLL returns null for different lanes', () => {
    assert.equal(commonLaneLL(ADDR_A, ADDR_C), null);
  });

  it('commonFrameShell detects matching S1/S6', () => {
    const shell = commonFrameShell(ADDR_A, ADDR_B);
    assert.notEqual(shell, null);
    assert.equal(shell.s1, '03bf');
    assert.equal(shell.s6, '039f');
  });

  it('commonFrameShell returns null for invalid input', () => {
    assert.equal(commonFrameShell('bad', ADDR_A), null);
  });

  it('commonGenerator returns lane type for same-LL pair', () => {
    const gen = commonGenerator(ADDR_A, ADDR_B);
    assert.notEqual(gen, null);
    assert.equal(gen.type, 'lane');
    assert(gen.generator.includes('0400'));
  });

  it('commonGenerator returns prefix type for different-LL pair', () => {
    const gen = commonGenerator(ADDR_A, ADDR_C);
    assert.notEqual(gen, null);
    assert.equal(gen.type, 'prefix');
  });

  it('commonGenerator returns null for invalid input', () => {
    assert.equal(commonGenerator(42, ADDR_A), null);
  });

  it('commonLaneLL returns null for invalid input', () => {
    assert.equal(commonLaneLL('bad', ADDR_B), null);
  });
});
