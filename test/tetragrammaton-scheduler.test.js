/**
 * ============================================================================
 * OMI PROTOCOL: TETRAGRAMMATON SCHEDULER MANIFOLD REGRESSION CHECK
 * File Target: test/tetragrammaton-scheduler.test.js
 * ============================================================================
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiTetragrammatonScheduler, SUPERIOR_COMPOSITE_LCM } from '../src/omi/tetragrammaton-scheduler.js';

test('Tetragrammaton: scheduler accurately processes regular 15-minute cron slices across Fano nodes', (t) => {
  const scheduler = new OmiTetragrammatonScheduler();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(SUPERIOR_COMPOSITE_LCM, 60);

  const metrics = scheduler.evaluateCronSlice(S, 15, 3, 1);

  assert.ok(metrics.accepted);
  assert.equal(metrics.cronMinute, 15);
  assert.equal(metrics.fanoPointIndex, 3);
  assert.equal(metrics.tetragrammatonModelType, "FANO_PROJECTIVE_SHC_INTERVAL_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "4");
  assert.equal(metrics.timelineSlot, 0x7C00 % 60);
});

test('Tetragrammaton: catches non-regular minutes causing fractional layout drift and flags them', (t) => {
  const scheduler = new OmiTetragrammatonScheduler();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = scheduler.evaluateCronSlice(S, 7, 3, 1);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.tetragrammatonModelType, "FRACTIONAL_DIVISION_DRFT_WARNING");
  assert.equal(metrics.canvasPresetColorId, "1");
});
