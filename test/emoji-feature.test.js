import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiEmojiFeatureKernel, UNICODE_17_TOTAL_EMOJI, UNICODE_17_CHARACTER_LIMIT } from '../src/omi/emoji-feature.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Emoji Feature Core: open-class inflection maps to icosahedron routing', () => {
  const kernel = new OmiEmojiFeatureKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(UNICODE_17_TOTAL_EMOJI, 3953);
  assert.equal(UNICODE_17_CHARACTER_LIMIT, 1438);

  const metrics = kernel.evaluateFeatureRoute(S, 0x1F600, 0, 1);

  assert.ok(metrics.accepted);
  assert.equal(metrics.targetCodepointHex, "1f600");
  assert.equal(metrics.emojiFeatureRoutingModel, "REGULAR_ICOSAHEDRON_DODECAHEDRON_INFLECTION_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Emoji Feature Core: other-lexical maps to stellated octahedron routing', () => {
  const kernel = new OmiEmojiFeatureKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateFeatureRoute(S, 0x1F601, 2, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.emojiFeatureRoutingModel, "REGULAR_STELLATED_OCTAHEDRON_LEXICAL_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.ok(metrics.simulatedAdderResult);
  assert.equal(metrics.simulatedAdderResult.sumValue, 3);
});

test('Emoji Feature Core: other-other maps to point-line-plane pointer', () => {
  const kernel = new OmiEmojiFeatureKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateFeatureRoute(S, 0x1F602, 2, 2);

  assert.ok(metrics.accepted);
  assert.equal(metrics.emojiFeatureRoutingModel, "TOPOLOGICAL_POINT_LINE_PLANE_POINTER_LOCKED");
  assert.equal(metrics.canvasPresetColorId, "4");
});

test('Emoji Feature Core: GATE_1 eviction on null S', () => {
  const kernel = new OmiEmojiFeatureKernel();

  const metrics = kernel.evaluateFeatureRoute(null, 0x1F600, 0, 1);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('Emoji Feature Core: out-of-bounds codepoint triggers block eviction', () => {
  const kernel = new OmiEmojiFeatureKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateFeatureRoute(S, 0x0041, 0, 1);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUT_OF_BOUNDS_UNICODE_17_BLOCK_EVICTION");
});

test('Emoji Feature Core: CLA adder fires across pos/feat slices', () => {
  const kernel = new OmiEmojiFeatureKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateFeatureRoute(S, 0x1F600, 0, 1);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
