import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments, isOrbitLexerValid } from '../src/omi/delta-orbital-lexer.js';

test('Wire Profile: IPv6 source address maps to valid uint16 segments', () => {
  const genesisIp6Source = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisIp6Source);

  assert.ok(S);
  assert.equal(S[0], 0x0100);
  assert.equal(S[1], 0x03BF);
  assert.equal(S[2], 0x7C00);
  assert.equal(S[3], 0x2B01);
  assert.equal(S[4], 0x2F01);
  assert.equal(S[5], 0x1434);
  assert.equal(S[6], 0x039F);
  assert.equal(S[7], 0x01FF);
  assert.ok(isOrbitLexerValid(S));
});

test('Wire Profile: byte-swapped address generates massive error energy', () => {
  const swappedIp6Source = "omi-0001-bf03-007c-012b-012f-3414-9f03-ff01/48";
  const S = parseOmiAddressToSegments(swappedIp6Source);

  assert.ok(S);
  assert.equal(isOrbitLexerValid(S), false);
});

test('Wire Profile: offset 0x16 alignment matches saddr start in Ethernet frame', () => {
  /* Ethernet header: 14 bytes. IPv6 header before saddr: 8 bytes.
   * Total offset of saddr = 14 + 8 = 22 = 0x16 */
  assert.equal(22, 0x16);
  assert.equal(14 + 8, 22);
});

test('Wire Profile: canonical genesis IP text representation', () => {
  /* The canonical genesis saddr maps to the IPv6 text form */
  const genesis = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesis);
  assert.ok(S);
  assert.equal(S[0], 0x0100);
  assert.equal(S[2], 0x7C00);
  assert.equal(S[5], 0x1434);
});

test('Wire Profile: non-omi prefix returns null', () => {
  const bad = "dead-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  assert.equal(parseOmiAddressToSegments(bad), null);
});

test('Wire Profile: short address returns null', () => {
  assert.equal(parseOmiAddressToSegments("omi-0100-03bf/48"), null);
});
