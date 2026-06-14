import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  LiveVoxelStream,
  operatorToColor,
  addressToQxy,
  VOXEL_EVENTS
} from '../src/canvas/live-voxel-stream.js';
import { readImoPayloadBlock } from '../src/omilog/reader.js';

describe('OMI Portal: Live Voxel Stream (0xA1)', () => {

  describe('operatorToColor', () => {
    it('returns colors for all operators', () => {
      assert.strictEqual(operatorToColor('!'), '#FF4444');
      assert.strictEqual(operatorToColor('='), '#44AAFF');
      assert.strictEqual(operatorToColor(')'), '#FFAA00');
      assert.strictEqual(operatorToColor('+'), '#44DD44');
      assert.strictEqual(operatorToColor('.'), '#AA66FF');
      assert.strictEqual(operatorToColor('source'), '#666666');
    });

    it('returns default color for unknown operators', () => {
      assert.strictEqual(operatorToColor('?'), '#888888');
    });
  });

  describe('addressToQxy', () => {
    it('extracts x,y from an omi- address', () => {
      const result = addressToQxy('omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48');
      assert.ok(result);
      assert.ok(result.x >= 0);
      assert.ok(result.y >= 0);
    });

    it('extracts x,y from a decimal address', () => {
      const result = addressToQxy('65535-0-0-0-0-0-0-0/48');
      assert.ok(result);
      assert.strictEqual(typeof result.x, 'number');
      assert.strictEqual(typeof result.y, 'number');
    });

    it('returns null for invalid address', () => {
      assert.strictEqual(addressToQxy(null), null);
      assert.strictEqual(addressToQxy(''), null);
    });
  });

  describe('LiveVoxelStream — basic operations', () => {
    it('ingests parsed records and produces voxel state', () => {
      const records = readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο');
      const stream = new LiveVoxelStream();
      const batch = stream.ingest(records);
      assert.ok(batch.updates.length > 0);
      assert.strictEqual(stream.voxelCount, batch.updates.length);
    });

    it('ingest returns batch with updates and removals', () => {
      const stream = new LiveVoxelStream();
      const records = readImoPayloadBlock([
        'ο !/65535-0-0-0-0-0-0-0/48 Ο',
        'ο =/0-0-0-1-0-0-0-0/48 Ο'
      ].join('\n'));
      const batch = stream.ingest(records);
      assert.strictEqual(batch.updates.length, 2);
      assert.strictEqual(batch.removals.length, 0);
      assert.ok(batch.ingestCount > 0);
    });

    it('getVoxel returns specific voxel by coordinates', () => {
      const stream = new LiveVoxelStream();
      stream.ingest(readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο'));
      const voxel = stream.getVoxel(0, 0);
      assert.ok(voxel);
      assert.strictEqual(voxel.x, 0);
      assert.strictEqual(voxel.y, 0);
    });

    it('getVoxel returns null for nonexistent coordinate', () => {
      const stream = new LiveVoxelStream();
      assert.strictEqual(stream.getVoxel(99, 99), null);
    });

    it('getState returns sorted voxels', () => {
      const stream = new LiveVoxelStream();
      stream.ingest(readImoPayloadBlock([
        'ο !/0-0-0-0-0-0-0-0/48 Ο',
        'ο =/1-0-0-1-0-0-0-0/48 Ο'
      ].join('\n')));
      const state = stream.getState();
      assert.strictEqual(state.length, 2);
      assert.ok(state[0].x <= state[1].x);
    });

    it('ingests Tetragrammatron backend events through route coordinates', () => {
      const stream = new LiveVoxelStream();
      const event = {
        type: 'tetragrammatron-backend-event',
        slot: 241,
        receipt: '123456789',
        receiptState: 'accepted',
        status: 'passed',
        route: {
          baseQ: 2,
          fiberQ: 3,
          local240: 44,
          slot5040: 241,
          chart11: 5,
          fano7: 0,
          role3: 1,
        },
      };

      const batch = stream.ingest([event]);
      const voxel = stream.getVoxel(2, 3);

      assert.strictEqual(batch.updates.length, 1);
      assert.ok(voxel);
      assert.strictEqual(voxel.operator, '=');
      assert.strictEqual(voxel.address, 'tetragrammatron-241-44-3/48');
      assert.strictEqual(voxel.backendEvent, event);
    });
  });

  describe('LiveVoxelStream — event system', () => {
    it('emits voxel:batch on ingest', () => {
      const stream = new LiveVoxelStream();
      const batches = [];
      stream.on('voxel:batch', (b) => batches.push(b));
      stream.ingest(readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο'));
      assert.strictEqual(batches.length, 1);
      assert.ok(batches[0].updates.length > 0);
    });

    it('can remove event listeners', () => {
      const stream = new LiveVoxelStream();
      const events = [];
      const cb = (b) => events.push(b);
      stream.on('voxel:batch', cb);
      stream.off('voxel:batch', cb);
      stream.ingest(readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο'));
      assert.strictEqual(events.length, 0);
    });

    it('rejects unsupported event types', () => {
      const stream = new LiveVoxelStream();
      assert.strictEqual(stream.on('unknown', () => {}), false);
    });
  });

  describe('LiveVoxelStream — voxel updates and TTL', () => {
    it('updates existing voxel on re-ingest', () => {
      const stream = new LiveVoxelStream();
      stream.ingest(readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο'));
      const before = stream.getVoxel(0, 0);
      stream.ingest(readImoPayloadBlock('ο =/0-0-0-0-0-0-0-0/48 Ο'));
      const after = stream.getVoxel(0, 0);
      assert.strictEqual(after.operator, '=');
      assert.strictEqual(stream.voxelCount, 1);
    });

    it('applies TTL to expire old voxels', () => {
      const stream = new LiveVoxelStream({ ttl: -1 });
      stream.ingest(readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο'));
      stream.ingest(readImoPayloadBlock('ο !/1-0-1-1-0-0-0-0/48 Ο'));
      assert.strictEqual(stream.voxelCount, 1);
      assert.strictEqual(stream.getVoxel(0, 0), null);
      assert.ok(stream.getVoxel(1, 1));
    });

    it('respects maxVoxels limit', () => {
      const stream = new LiveVoxelStream({ maxVoxels: 2 });
      stream.ingest(readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο'));
      stream.ingest(readImoPayloadBlock('ο !/1-0-1-0-0-0-0-0/48 Ο'));
      stream.ingest(readImoPayloadBlock('ο !/2-0-2-0-0-0-0-0/48 Ο'));
      assert.strictEqual(stream.voxelCount, 2);
    });
  });

  describe('LiveVoxelStream — full pipeline integration', () => {
    it('processes records with source addresses', () => {
      const block = [
        'ο )/0-0-0-0-0-0-121-49153/128 Ο',
        'ο \x1e0-0-0-0-0-0-121-49153/128\x1f Ο'
      ].join('\n');
      const records = readImoPayloadBlock(block);
      const stream = new LiveVoxelStream();
      const batch = stream.ingest(records);
      assert.ok(batch.updates.length > 0);
      for (const v of batch.updates) {
        assert.ok(v.depth >= 0);
        assert.ok(v.local240 >= 0);
        assert.ok(v.q >= 0);
      }
    });

    it('reset clears all voxel state', () => {
      const stream = new LiveVoxelStream();
      stream.ingest(readImoPayloadBlock('ο !/0-0-0-0-0-0-0-0/48 Ο'));
      assert.strictEqual(stream.voxelCount, 1);
      stream.reset();
      assert.strictEqual(stream.voxelCount, 0);
      assert.strictEqual(stream.ingestCount, 0);
    });
  });
});
