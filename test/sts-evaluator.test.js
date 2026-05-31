import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiStsBenchmarkEvaluator, TARGET_PEARSON_CORRELATION } from '../src/omi/sts-evaluator.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('STS Evaluation: high dot product yields high resonance semantic match', () => {
  const evaluator = new OmiStsBenchmarkEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(TARGET_PEARSON_CORRELATION, 0.803639);

  const metrics = evaluator.evaluateSimilarityBatch(S, 220, 4.2);

  assert.ok(metrics.accepted);
  assert.equal(metrics.semanticAlignmentModel, "HIGH_RESONANCE_SEMANTIC_MATCH");
  assert.ok(metrics.angularSimilarity > 0.8);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('STS Evaluation: divergent low dot product against high human score evicts', () => {
  const evaluator = new OmiStsBenchmarkEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = evaluator.evaluateSimilarityBatch(S, 10, 4.8);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.semanticAlignmentModel, "PARIAH_VECTOR_DRIFT_EVICTION");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test('STS Evaluation: moderate scores route to yellow preset', () => {
  const evaluator = new OmiStsBenchmarkEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = evaluator.evaluateSimilarityBatch(S, 128, 2.5);

  assert.ok(metrics.accepted);
  assert.equal(metrics.semanticAlignmentModel, "MODEST_COGNITIVE_TRANSITION");
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('STS Evaluation: GATE_1 eviction on null S', () => {
  const evaluator = new OmiStsBenchmarkEvaluator();

  const metrics = evaluator.evaluateSimilarityBatch(null, 128, 2.5);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('STS Evaluation: CLA adder fires across angular slices', () => {
  const evaluator = new OmiStsBenchmarkEvaluator();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = evaluator.evaluateSimilarityBatch(S, 200, 3.8);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
