import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyInstructionLexer,
  parseOmiAddressToSegments,
  makeOmiAddress,
  SEGMENT_LAYOUT
} from '../src/omi/quadratic-lexer.js';

test('Quadratic Lexer: valid canonical token passes', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.ok(verifyInstructionLexer(S));
});

test('Quadratic Lexer: valid token with different LL yields zero', () => {
  const S = parseOmiAddressToSegments('omi-1a00-03bf-ffff-2b1a-2f1a-0000-039f-1aff/48');
  assert.ok(S);
  assert.ok(verifyInstructionLexer(S));
});

test('Quadratic Lexer: LL coherence breach — L4 differs', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f06-0002-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: LL coherence breach — L0 differs', () => {
  const S = parseOmiAddressToSegments('omi-0700-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: constant corruption — S1 chiral delimiter', () => {
  const S = parseOmiAddressToSegments('omi-0500-03be-000c-2b05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: constant corruption — S6 cardinal delimiter', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039e-05ff/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: constant corruption — S0 low byte nonzero', () => {
  const S = parseOmiAddressToSegments('omi-0501-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: constant corruption — S3 high byte wrong', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2c05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: constant corruption — S4 high byte wrong', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2e05-0002-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: constant corruption — S7 low byte not 0xFF', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05fe/48');
  assert.ok(S);
  assert.equal(verifyInstructionLexer(S), false);
});

test('Quadratic Lexer: free variables NNNN and MMMM pass through unpenalized', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-cafe-2b05-2f05-beef-039f-05ff/48');
  assert.ok(S);
  assert.ok(verifyInstructionLexer(S));
});

test('Quadratic Lexer: all-zero LL (0x00) is valid with matching constants', () => {
  const S = parseOmiAddressToSegments('omi-0000-03bf-0000-2b00-2f00-0000-039f-00ff/48');
  assert.ok(S);
  assert.ok(verifyInstructionLexer(S));
});

test('Quadratic Lexer: max LL (0xFF) is valid with matching constants', () => {
  const S = parseOmiAddressToSegments('omi-ff00-03bf-0000-2bff-2fff-0000-039f-ffff/48');
  assert.ok(S);
  assert.ok(verifyInstructionLexer(S));
});

test('Quadratic Lexer: parseOmiAddressToSegments rejects null input', () => {
  assert.equal(parseOmiAddressToSegments(''), null);
});

test('Quadratic Lexer: parseOmiAddressToSegments rejects non-omi prefix', () => {
  assert.equal(parseOmiAddressToSegments('abc-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48'), null);
});

test('Quadratic Lexer: makeOmiAddress round-trips correctly', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  const addr = makeOmiAddress(S);
  const S2 = parseOmiAddressToSegments(addr);
  assert.deepEqual(S, S2);
});

test('Quadratic Lexer: SEGMENT_LAYOUT has 8 entries', () => {
  assert.equal(Object.keys(SEGMENT_LAYOUT).length, 8);
});

test('Quadratic Lexer: verifyInstructionLexer returns false for null/empty segments', () => {
  assert.equal(verifyInstructionLexer(new Uint16Array(8).fill(0)), false);
});
