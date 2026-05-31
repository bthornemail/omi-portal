/**
 * ============================================================================
 * OMI PROTOCOL: QEMU TYPE_CLOCK PLATFORM REGRESSION CHECK
 * File Target: test/qemu-clock.test.js
 * ============================================================================
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiQemuClockKernel, SUPERIOR_COMPOSITE_LCM } from '../src/omi/qemu-clock.js';

test('QEMU Clock Core: engine accurately scales 2^-32 integer units to nanoseconds', (t) => {
  const kernel = new OmiQemuClockKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(SUPERIOR_COMPOSITE_LCM, 60);

  const metrics = kernel.evaluateClockPeriod(S, 4294967296, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isClockGated, false);
  assert.equal(metrics.periodInNanoseconds, 1.0);
  assert.equal(metrics.qemuClockModelType, "MAIN_MACHINE_CLOCK_SOURCE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 60);
});

test('QEMU Clock Core: catches gated zero states and flags disabled channels to warning layouts', (t) => {
  const kernel = new OmiQemuClockKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.evaluateClockPeriod(S, 0, 1);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isClockGated, true);
  assert.equal(metrics.qemuClockModelType, "GATED_INACTIVE_CLOCK_SOURCE");
  assert.equal(metrics.canvasPresetColorId, "1");
});
