import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiHellenisticAstroKernel, OMICRON_NUMERAL_VALUE } from '../src/omi/astro-kernel.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Astro Core: omicron-70 collapses to true zero placeholder', () => {
  const kernel = new OmiHellenisticAstroKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(OMICRON_NUMERAL_VALUE, 70);

  const metrics = kernel.processSexagesimalFraction(S, 70, 12);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isOmicronZeroActive, true);
  assert.equal(metrics.derivedFractionalDigit, 0);
  assert.equal(metrics.astroFractionalModel, "OMICRON_ZERO_PIVOT_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "3");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Astro Core: standard sexagesimal operand maps to fractional digit', () => {
  const kernel = new OmiHellenisticAstroKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.processSexagesimalFraction(S, 42, 5);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isOmicronZeroActive, false);
  assert.equal(metrics.derivedFractionalDigit, 42);
  assert.equal(metrics.astroFractionalModel, "STANDARD_SEXAGESIMAL_TRACK");
  assert.equal(metrics.canvasPresetColorId, "5");
});

test('Astro Core: terminal slot clamp fires at boundary 54', () => {
  const kernel = new OmiHellenisticAstroKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.processSexagesimalFraction(S, 54, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.astroFractionalModel, "HELLENISTIC_TERMINAL_SLOT_CLAMP");
  assert.equal(metrics.canvasPresetColorId, "6");
});

test('Astro Core: evicts values exceeding Hellenistic max slot 54', () => {
  const kernel = new OmiHellenisticAstroKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.processSexagesimalFraction(S, 58, 0);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "EXCEEDS_HELLENISTIC_MAX_SLOT_EVICTION");
});

test('Astro Core: CLA adder fires across fractional components', () => {
  const kernel = new OmiHellenisticAstroKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.processSexagesimalFraction(S, 42, 5);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
