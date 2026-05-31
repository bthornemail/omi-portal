import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiFactsParametricEvaluator, FACTS_DEMO_LIMIT } from '../src/omi/facts-evaluator.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('FACTS Evaluation: example index 0 with high judge score matches confidently', () => {
  const evaluator = new OmiFactsParametricEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(FACTS_DEMO_LIMIT, 5);

  const metrics = evaluator.evaluateFactualAccuracy(S, 0, 240);

  assert.ok(metrics.accepted);
  assert.equal(metrics.targetExampleIndex, 0);
  assert.equal(metrics.parametricAccuracyModel, "HIGH_CONFIDENCE_PARAMETRIC_MATCH");
  assert.ok(metrics.normalizedAccuracyScore > 0.9);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('FACTS Evaluation: low judge score triggers contradiction eviction', () => {
  const evaluator = new OmiFactsParametricEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = evaluator.evaluateFactualAccuracy(S, 2, 30);

  assert.ok(metrics.accepted);
  assert.equal(metrics.parametricAccuracyModel, "FACTUAL_CONTRADICTION_EVICTION_LANE");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test('FACTS Evaluation: modest accuracy routes to yellow preset', () => {
  const evaluator = new OmiFactsParametricEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = evaluator.evaluateFactualAccuracy(S, 3, 128);

  assert.ok(metrics.accepted);
  assert.equal(metrics.parametricAccuracyModel, "MODEST_ACCURACY_THRESHOLD");
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('FACTS Evaluation: out-of-bounds example index evicted', () => {
  const evaluator = new OmiFactsParametricEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = evaluator.evaluateFactualAccuracy(S, 5, 100);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUT_OF_BOUNDS_FACTS_EXAMPLES_EVICTION");
});

test('FACTS Evaluation: GATE_1 eviction on null S', () => {
  const evaluator = new OmiFactsParametricEvaluator();

  const metrics = evaluator.evaluateFactualAccuracy(null, 0, 240);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('FACTS Evaluation: CLA adder fires across index slices', () => {
  const evaluator = new OmiFactsParametricEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = evaluator.evaluateFactualAccuracy(S, 1, 180);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
