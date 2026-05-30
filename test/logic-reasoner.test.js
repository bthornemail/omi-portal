import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiMultiValuedLogicReasoner } from '../src/omi/logic-reasoner.js';

test('Logic Core: maps 0x3C selector to five-value yellow preset', () => {
  const reasoner = new OmiMultiValuedLogicReasoner();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = reasoner.evaluateLogicPrime(S, 0x3C);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isFiveValuePrimeGate, true);
  assert.equal(metrics.logicTierModel, "FIVE_VALUE_PRIME");
  assert.equal(metrics.canvasPresetColorId, "3");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Logic Core: extracts three-value neutral tracks on zero significand', () => {
  const reasoner = new OmiMultiValuedLogicReasoner();
  const zeroWeightToken = "omi-0100-03bf-0000-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(zeroWeightToken);

  const metrics = reasoner.evaluateLogicPrime(S, 0x20);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isFiveValuePrimeGate, false);
  assert.equal(metrics.logicTierModel, "THREE_VALUE_PRIME");
  assert.equal(metrics.canvasPresetColorId, "6");
});
