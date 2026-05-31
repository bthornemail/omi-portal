import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiExtrusionKernel, EXTRUSION_MAX_ORDER } from '../src/canvas/extrusion-kernel.js';

test('Extrusion Core: engine accurately processes Decomino structures and isolates cdr polycubes', () => {
  const kernel = new OmiExtrusionKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(EXTRUSION_MAX_ORDER, 10);

  const metrics = kernel.evaluateCellExtrusion(S, 10, 2, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.polyominoOrder, 10);
  assert.equal(metrics.extrusionLayerModel, "CDR_POLYCUBE_VOLUME_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Extrusion Core: evicts cell structural models exceeding maximum polyomino order scales', () => {
  const kernel = new OmiExtrusionKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.evaluateCellExtrusion(S, 12, 0, false);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUT_OF_BOUNDS_POLYOMINO_ORDER_EVICTION");
});
