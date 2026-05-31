import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiOpenWorldPortal, PORTAL_MAX_DIMENSION } from '../src/canvas/open-portal.js';

test('Open Portal: engine accurately intercepts valid image files and extracts properties', () => {
  const portal = new OmiOpenWorldPortal();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(PORTAL_MAX_DIMENSION, 4096);

  const metrics = portal.processDroppedAsset(S, 0x49, 1920, 1080, true);

  assert.ok(metrics.accepted);
  assert.equal(metrics.imageWidth, 1920);
  assert.equal(metrics.imageHeight, 1080);
  assert.equal(metrics.openWorldModelType, "PORTAL_STATIC_IMAGE_ASSET_LOADED");
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Open Portal: evicts dropped files that break the maximum coordinate dimensions', () => {
  const portal = new OmiOpenWorldPortal();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = portal.processDroppedAsset(S, 0x49, 5000, 5000, true);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "PORTAL_CANVAS_DIMENSION_OVERFLOW_EVICTION");
});

test('Open Portal: rejects null frames with structural eviction', () => {
  const portal = new OmiOpenWorldPortal();
  const metrics = portal.processDroppedAsset(null, 0x49, 1920, 1080, true);
  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('Open Portal: evicts malformed finder alignment on dropped assets', () => {
  const portal = new OmiOpenWorldPortal();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = portal.processDroppedAsset(S, 0x49, 1920, 1080, false);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "MALFORMED_OPTICAL_FINDER_ALIGNMENT_EVICTION");
});

test('Open Portal: routes video stream type to green preset (4)', () => {
  const portal = new OmiOpenWorldPortal();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = portal.processDroppedAsset(S, 0x56, 640, 480, true);

  assert.ok(metrics.accepted);
  assert.equal(metrics.openWorldModelType, "PORTAL_DYNAMIC_VIDEO_STREAM_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "4");
});

test('Open Portal: zero or negative dimensions trigger overflow eviction', () => {
  const portal = new OmiOpenWorldPortal();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const zeroWidth = portal.processDroppedAsset(S, 0x49, 0, 1080, true);
  assert.equal(zeroWidth.accepted, false);
  assert.equal(zeroWidth.reason, "PORTAL_CANVAS_DIMENSION_OVERFLOW_EVICTION");

  const negativeHeight = portal.processDroppedAsset(S, 0x49, 1920, -100, true);
  assert.equal(negativeHeight.accepted, false);
  assert.equal(negativeHeight.reason, "PORTAL_CANVAS_DIMENSION_OVERFLOW_EVICTION");
});
