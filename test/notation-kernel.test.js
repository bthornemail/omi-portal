/**
 * ============================================================================
 * OMI PROTOCOL: NOTATIONAL PERIMETER MANIFOLD REGRESSION CHECK
 * File Target: test/notation-kernel.test.js
 * ============================================================================
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiNotationKernel, HIGH_SEXAGESIMAL_CEILING } from '../src/omi/notation-kernel.js';

test('Notation Core: engine accurately handles Babylonian synodic chronometers and maps purple', (t) => {
  const kernel = new OmiNotationKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(HIGH_SEXAGESIMAL_CEILING, 59);

  const metrics = kernel.evaluatePositionalAddress(S, 29, 31, 50, 12, 11, 0x03BF, 0x039F);

  assert.ok(metrics.accepted);
  assert.equal(metrics.currentOrderN, 12);
  assert.equal(metrics.priorOrderN1, 11);
  assert.equal(metrics.notationRoutingModel, "SYNODIC_CHRONOMETER_CENTROID_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Notation Core: evicts positions trying to violate the omicron-0x(N)-0x(N-1)-omicron structural fence', (t) => {
  const kernel = new OmiNotationKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.evaluatePositionalAddress(S, 29, 31, 50, 12, 5, 0x03BF, 0x039F);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OMICRON_FIBONACCI_ENCAPSULATION_VIOLATION_EVICTION");
});
