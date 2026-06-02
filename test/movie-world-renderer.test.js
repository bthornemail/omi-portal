import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computeActorPositions, computeVoxelProjections,
  buildRenderFrame, MOTIF_COLORS, DEFAULT_GRID_DIM
} from '../src/canvas/movie-world-renderer.js';
import { PersistentWorldState } from '../src/world/persistent-world-state.js';

const SAMPLE_STATE = {
  tick: 42,
  epoch: 1,
  actors: {
    Wisdom: { key: 'Wisdom', role: 'motif', emoji: '\u{1F451}\u{1F4DC}\u{1F56D}\uFE0F', tickCreated: 0 },
    Number: { key: 'Number', role: 'motif', emoji: '\u{1F522}\u{1F4CA}\u{1F4CF}', tickCreated: 5 }
  },
  gates: { 'Narrative Gate': { state: 'open' } },
  unresolvedTensions: [{ description: 'Number vs Meaning' }],
  visibleVoxels: { '0-0': { depth: 60, color: '#00FF00', tick: 10 } },
  replayReceipts: [{ type: 'scene', scene: 'Prologue' }]
};

describe('Slice 3: Movie World Renderer (0xA7)', () => {
  describe('computeActorPositions', () => {
    it('returns positions for each actor', () => {
      const positions = computeActorPositions(SAMPLE_STATE);
      assert.strictEqual(positions.length, 2);
      assert.strictEqual(positions[0].name, 'Wisdom');
      assert.strictEqual(positions[1].name, 'Number');
    });

    it('assigns 2D grid coordinates', () => {
      const positions = computeActorPositions(SAMPLE_STATE, 4);
      assert.strictEqual(positions[0].x, 0);
      assert.strictEqual(positions[0].y, 0);
      assert.strictEqual(positions[1].x, 1);
      assert.strictEqual(positions[1].y, 0);
    });

    it('assigns motif color', () => {
      const positions = computeActorPositions(SAMPLE_STATE);
      const w = positions.find(p => p.name === 'Wisdom');
      assert.strictEqual(w.color, MOTIF_COLORS.Wisdom);
    });
  });

  describe('computeVoxelProjections', () => {
    it('returns voxel array from world state', () => {
      const voxels = computeVoxelProjections(SAMPLE_STATE);
      assert.strictEqual(voxels.length, 1);
      assert.strictEqual(voxels[0].key, '0-0');
      assert.strictEqual(voxels[0].depth, 60);
    });

    it('handles empty voxel map', () => {
      const voxels = computeVoxelProjections({ visibleVoxels: {} });
      assert.strictEqual(voxels.length, 0);
    });
  });

  describe('buildRenderFrame', () => {
    it('produces a complete render frame', () => {
      const frame = buildRenderFrame(SAMPLE_STATE);
      assert.strictEqual(frame.tick, 42);
      assert.strictEqual(frame.epoch, 1);
      assert.strictEqual(frame.actorCount, 2);
      assert.strictEqual(frame.voxelCount, 1);
      assert.strictEqual(frame.receiptCount, 1);
      assert.strictEqual(frame.tensionCount, 1);
    });

    it('includes gate states', () => {
      const frame = buildRenderFrame(SAMPLE_STATE);
      assert.strictEqual(frame.gateStates['Narrative Gate'], 'open');
    });

    it('renders actors with emoji carriers', () => {
      const frame = buildRenderFrame(SAMPLE_STATE);
      const w = frame.actors.find(a => a.name === 'Wisdom');
      assert.ok(w.emoji);
      assert.ok(w.emoji.length > 0);
    });
  });

  describe('integration with PersistentWorldState', () => {
    it('renders from a real world state with narrative inserts', () => {
      const world = new PersistentWorldState();
      world.addActor('Wisdom', { role: 'motif', emoji: '\u{1F451}\u{1F4DC}\u{1F56D}\uFE0F', tickCreated: 0 });
      world.addActor('Number', { role: 'motif', emoji: '\u{1F522}\u{1F4CA}\u{1F4CF}', tickCreated: 5 });
      world.setGate('Narrative Gate', 'open');
      world.setVoxel('0-0', { depth: 60, color: '#00FF00' });
      world.addReceipt({ type: 'scene', scene: 'Prologue' });
      world.advance();

      const state = world.getState();
      const frame = buildRenderFrame(state);
      assert.strictEqual(frame.tick, 1);
      assert.strictEqual(frame.actorCount, 2);
      assert.strictEqual(frame.voxelCount, 1);
      assert.strictEqual(frame.receiptCount, 1);
      assert.strictEqual(frame.gateStates['Narrative Gate'], 'open');
    });
  });
});
