import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiWikimediaStructuredKernel, WIKIMEDIA_SCHEMA_PRECISION } from '../src/omi/wikimedia-kernel.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Wikimedia Core: low risk infobox subject maps to verified truth', () => {
  const kernel = new OmiWikimediaStructuredKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(WIKIMEDIA_SCHEMA_PRECISION, 120);

  const metrics = kernel.evaluateWikimediaPayload(S, 44, 12, 85, 10);

  assert.ok(metrics.accepted);
  assert.equal(metrics.combinedSteinerHash, 44 ^ 12 ^ 85);
  assert.equal(metrics.wikimediaProcessingModel, "VERIFIED_TRUTH_INFOCUBE_MATCH");
  assert.ok(metrics.normalizedReferenceRisk < 0.05);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Wikimedia Core: high reference risk crediblity eviction', () => {
  const kernel = new OmiWikimediaStructuredKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateWikimediaPayload(S, 15, 6, 92, 210);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "HIGH_REFERENCE_RISK_CREDIBILITY_EVICTION");
});

test('Wikimedia Core: moderate risk routes to warning rail', () => {
  const kernel = new OmiWikimediaStructuredKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateWikimediaPayload(S, 50, 20, 30, 140);

  assert.ok(metrics.accepted);
  assert.equal(metrics.wikimediaProcessingModel, "REFERENCE_NEEDED_WARNING_RAIL");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test('Wikimedia Core: middle risk routes to modest schema transition', () => {
  const kernel = new OmiWikimediaStructuredKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateWikimediaPayload(S, 60, 30, 90, 80);

  assert.ok(metrics.accepted);
  assert.equal(metrics.wikimediaProcessingModel, "MODEST_SCHEMA_TRANSITION");
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('Wikimedia Core: GATE_1 eviction on null S', () => {
  const kernel = new OmiWikimediaStructuredKernel();

  const metrics = kernel.evaluateWikimediaPayload(null, 10, 20, 30, 5);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('Wikimedia Core: CLA adder fires across S-P-O hash slices', () => {
  const kernel = new OmiWikimediaStructuredKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateWikimediaPayload(S, 44, 12, 85, 10);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
