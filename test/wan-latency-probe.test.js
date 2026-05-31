import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiWanLatencyProbe, METADATA_DIVIDEND_MASK } from '../scripts/wan-latency-probe.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Telemetry Core: probe extracts 24-bit metadata and tracks Eichler mass', () => {
  const probe = new OmiWanLatencyProbe();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(METADATA_DIVIDEND_MASK, 0xFFFFFF0000000000n);

  const mockSlotValue = 0x1A2B3C0000000000n;
  const metrics = probe.executeProbeSweep(S, mockSlotValue, 11, 7);

  assert.ok(metrics.accepted);
  assert.equal(metrics.provenanceReceipt, 0x1A2B);
  assert.equal(metrics.stepReceipt, 0x3C);
  assert.equal(metrics.massTotalWeight, (11 - 1) / 24);
  assert.equal(metrics.telemetryProbeState, "EICHLER_MASS_TELEMETRY_STREAM_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Telemetry Core: catches missing provenance and routes to warning', () => {
  const probe = new OmiWanLatencyProbe();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = probe.executeProbeSweep(S, 0n, 11, -1);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.telemetryProbeState, "METADATA_DIVIDEND_MISSING_ANOMALY");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test('Telemetry Core: jInvariant 0 triggers yellow preset', () => {
  const probe = new OmiWanLatencyProbe();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const mockSlotValue = 0x1A2B3C0000000000n;
  const metrics = probe.executeProbeSweep(S, mockSlotValue, 11, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('Telemetry Core: jInvariant 1728 triggers yellow preset', () => {
  const probe = new OmiWanLatencyProbe();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const mockSlotValue = 0x1A2B3C0000000000n;
  const metrics = probe.executeProbeSweep(S, mockSlotValue, 11, 1728);

  assert.equal(metrics.canvasPresetColorId, "3");
});

test('Telemetry Core: non-Eichler prime p=73 passes with standard preset', () => {
  const probe = new OmiWanLatencyProbe();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const mockSlotValue = 0x1A2B3C0000000000n;
  const metrics = probe.executeProbeSweep(S, mockSlotValue, 73, -1);

  assert.ok(metrics.accepted);
  assert.equal(metrics.massTotalWeight, (73 - 1) / 24);
  assert.equal(metrics.canvasPresetColorId, "5");
});

test('Telemetry Core: GATE_1 eviction on null S', () => {
  const probe = new OmiWanLatencyProbe();

  const metrics = probe.executeProbeSweep(null, 0x1A2B3C0000000000n, 11, 0);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('Telemetry Core: CLA adder fires across dividend slices', () => {
  const probe = new OmiWanLatencyProbe();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const mockSlotValue = 0x1A2B3C0000000000n;
  const metrics = probe.executeProbeSweep(S, mockSlotValue, 11, 0);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
