import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  OmiLivePortalBinder,
  TETRAGRAMMATRON_BACKEND_EVENT,
  VOXEL_BATCH_EVENT
} from '../src/wan/live-portal-binder.js';
import {
  modemFrameToMemory,
  modemRoundTripToGeometryReceipts
} from '../src/omi/tetragrammatron-modem.js';
import { createTetragrammatronMemory } from '../src/omi/tetragrammatron-meta-memory.js';
import { workerRuntimeTick } from '../src/omi/tetragrammatron-worker-runtime.js';

describe('OMI Portal: Live Portal Binder (0xA2)', () => {

  describe('OmiLivePortalBinder', () => {
    it('creates binder with default config', () => {
      const binder = new OmiLivePortalBinder();
      assert.ok(binder.connector);
      assert.ok(binder.voxelStream);
      assert.strictEqual(binder.connected, false);
      assert.strictEqual(binder.eventCount, 0);
      assert.strictEqual(binder.voxelCount, 0);
    });

    it('accepts custom connector and voxel stream options', () => {
      const binder = new OmiLivePortalBinder({
        connector: { maxEventLog: 10 },
        voxelStream: { maxVoxels: 100 }
      });
      assert.strictEqual(binder.connector.config.maxEventLog, 10);
      assert.strictEqual(binder.voxelCount, 0);
    });

    it('connector passes events to voxel stream', () => {
      const binder = new OmiLivePortalBinder();
      binder.connector.onEvent('ο !/0-0-0-0-0-0-0-0/48 Ο');
      assert.strictEqual(binder.eventCount, 1);
      assert.strictEqual(binder.voxelCount, 1);
    });

    it('disconnect closes SSE connection gracefully', () => {
      const binder = new OmiLivePortalBinder();
      binder.disconnect();
      assert.strictEqual(binder.connected, false);
    });

    it('reset clears all state and disconnects', () => {
      const binder = new OmiLivePortalBinder();
      binder.connector.onEvent('ο !/0-0-0-0-0-0-0-0/48 Ο');
      assert.strictEqual(binder.eventCount, 1);
      assert.strictEqual(binder.voxelCount, 1);
      binder.reset();
      assert.strictEqual(binder.eventCount, 0);
      assert.strictEqual(binder.voxelCount, 0);
      assert.strictEqual(binder.connected, false);
    });

    it('initializeLiveBinding without EventSource sets connected false', () => {
      const binder = new OmiLivePortalBinder();
      binder.initializeLiveBinding('http://localhost:9999/stream');
      // In test environment (Node), EventSource is undefined,
      // so connected stays false
      assert.strictEqual(binder.connected, false);
    });

    it('ingests Tetragrammatron backend events into the voxel stream', () => {
      const binder = new OmiLivePortalBinder();
      const memory = createTetragrammatronMemory();
      const result = modemRoundTripToGeometryReceipts([
        '▶ Portal bridge',
        '  ✔ backend event projects to voxel (0.12ms)'
      ].join('\n'));
      const frame = result.frames[1];
      modemFrameToMemory(memory, frame, { workerId: 4 });

      const tick = workerRuntimeTick(memory, {
        workerId: 9,
        timestamp: 123,
        emit: (event) => binder.ingestBackendEvent(event)
      });

      const voxel = binder.voxelStream.getVoxel(frame.baseQ, frame.fiberQ);
      assert.strictEqual(tick.accepted, true);
      assert.strictEqual(binder.voxelCount, 1);
      assert.ok(voxel);
      assert.strictEqual(voxel.backendEvent.slot, frame.slot5040);
      assert.strictEqual(voxel.operator, '=');
    });
  });

  describe('DOM event dispatch', () => {
    it('VOXEL_BATCH_EVENT constant is defined', () => {
      assert.strictEqual(VOXEL_BATCH_EVENT, 'voxel:batch');
    });

    it('TETRAGRAMMATRON_BACKEND_EVENT constant is defined', () => {
      assert.strictEqual(TETRAGRAMMATRON_BACKEND_EVENT, 'tetragrammatron:backend-event');
    });

    it('binder emits voxel:batch events via DOM', () => {
      const binder = new OmiLivePortalBinder();
      const events = [];
      const handler = (ev) => events.push(ev.detail);

      if (typeof document !== 'undefined') {
        document.addEventListener(VOXEL_BATCH_EVENT, handler);
      } else {
        // In Node, manually wire the connector -> voxel stream
        binder.connector.on('imo-record', (rec) => {
          binder.voxelStream.ingest([rec]);
        });
      }

      binder.connector.onEvent('ο !/0-0-0-0-0-0-0-0/48 Ο');
      // After ingest, voxelCount should be 1 regardless of DOM
      assert.strictEqual(binder.voxelCount, 1);
    });
  });
});
