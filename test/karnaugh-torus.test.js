import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiKarnaughToroidOptimizer, OmiMetacircularTorusInterpreter } from '../src/canvas/karnaugh-canvas.js';

test('Toroidal K-Map: minimizes cell 8 into overlapping red/green zone', () => {
  const optimizer = new OmiKarnaughToroidOptimizer();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = optimizer.minimizeToroidalCell(S, 1, 0, 0, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.mintermIndex, 8);
  assert.equal(metrics.isOutputTrue, true);
  assert.equal(metrics.optimizedTermKey, "OVERLAP_BROWN_ZONE");
  assert.equal(metrics.canvasPresetColorId, "1");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Toroidal K-Map: extracts standalone blue term with carry lookahead', () => {
  const optimizer = new OmiKarnaughToroidOptimizer();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = optimizer.minimizeToroidalCell(S, 0, 1, 1, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.mintermIndex, 6);
  assert.equal(metrics.optimizedTermKey, "TERM_BLUE_BCD_PRIME");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.ok(metrics.simulatedAdderResult);
  assert.equal(metrics.simulatedAdderResult.sum, 4);
});

test('Metacircular Interpreter: standard minterms with proxy alignment', () => {
  const interp = new OmiMetacircularTorusInterpreter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = interp.evaluateMetacircularTransition(S, 1, 1, 0, 1, 0xD5);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isRaceConditionActive, false);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Metacircular Interpreter: race condition triggers yellow consensus bridge', () => {
  const interp = new OmiMetacircularTorusInterpreter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = interp.evaluateMetacircularTransition(S, 1, 0, 1, 0, 0xD5);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isRaceConditionActive, true);
  assert.equal(metrics.optimizedLogicModel, "HAZARD_SECURED_CONSENSUS");
  assert.equal(metrics.canvasPresetColorId, "3");
  assert.ok(metrics.simulatedAdderResult);
  assert.equal(metrics.simulatedAdderResult.sum, 5);
});
