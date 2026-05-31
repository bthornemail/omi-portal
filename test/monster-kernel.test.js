import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiMonsterMegatronKernel, SUPERSINGULAR_PRIMES } from '../src/omi/monster-kernel.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Monster Core: identifies the 15 supersingular primes of the Happy Family', () => {
  const kernel = new OmiMonsterMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(SUPERSINGULAR_PRIMES.length, 15);

  const metrics = kernel.evaluateMonsterPrime(S, 59, 0x1337);

  assert.ok(metrics.accepted);
  assert.equal(metrics.prime, 59);
  assert.equal(metrics.monsterSubquotientModel, "MONSTER_TAIL_CONVERGENCE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Monster Core: base primes 2 and 3 map to monadic model', () => {
  const kernel = new OmiMonsterMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateMonsterPrime(S, 2, 0x1337);
  assert.ok(metrics.accepted);
  assert.equal(metrics.monsterSubquotientModel, "BASE_MONADIC_PRIME");
  assert.equal(metrics.canvasPresetColorId, "4");
});

test('Monster Core: middle supersingular primes route to happy family', () => {
  const kernel = new OmiMonsterMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateMonsterPrime(S, 13, 0x1337);
  assert.ok(metrics.accepted);
  assert.equal(metrics.monsterSubquotientModel, "HAPPY_FAMILY_DIVISOR");
  assert.equal(metrics.canvasPresetColorId, "5");
});

test('Monster Core: blocks non-dividing pariah primes', () => {
  const kernel = new OmiMonsterMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateMonsterPrime(S, 61, 0x1337);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "PARIAH_NON_SUPERSINGULAR_PRIME_EVICTION");
});

test('Monster Core: period-8 orbit offset computed via divmod 36', () => {
  const kernel = new OmiMonsterMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateMonsterPrime(S, 71, 0x1337);
  assert.ok(metrics.accepted);
  assert.ok(metrics.orbitOffset >= 0 && metrics.orbitOffset < 36);
  assert.ok(metrics.derivedDigitB >= 0 && metrics.derivedDigitB <= 9);
});

test('Monster Core: CLA adder fires across prime slices', () => {
  const kernel = new OmiMonsterMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMonsterPrime(S, 41, 0x1337);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
