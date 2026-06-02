const DEFAULT_GRID_DIM = 4;
const MOTIF_COLORS = {
  Gate: '#44AA44',
  Logos: '#FFD700',
  Number: '#4488FF',
  Covenant: '#AA88FF',
  Beast: '#FF4444',
  Watcher: '#88CCFF',
  Law: '#FF8844',
  Wisdom: '#FFCC44',
  Tribe: '#44DD88'
};

const DEFAULT_COLOR = '#888888';

export function computeActorPositions(worldState, gridDim) {
  const dim = gridDim || DEFAULT_GRID_DIM;
  const actors = worldState.actors || {};
  const entries = Object.entries(actors).filter(([k]) => k !== 'Narrative Gate');
  const positions = [];

  for (let i = 0; i < entries.length; i++) {
    const [name, actor] = entries[i];
    const x = i % dim;
    const y = Math.floor(i / dim) % dim;
    const color = MOTIF_COLORS[name] || DEFAULT_COLOR;
    positions.push({
      name,
      emoji: actor.emoji || '',
      role: actor.role || 'subject',
      x,
      y,
      color,
      tickCreated: actor.tickCreated ?? 0,
      tickUpdated: actor.tickUpdated ?? 0
    });
  }
  return positions;
}

export function computeVoxelProjections(worldState, gridDim) {
  const dim = gridDim || DEFAULT_GRID_DIM;
  const voxels = worldState.visibleVoxels || {};
  return Object.entries(voxels).map(([key, v]) => {
    const coords = key.split('-').map(Number);
    return {
      key,
      x: coords[0] ?? 0,
      y: coords[1] ?? 0,
      depth: v.depth ?? 0,
      color: v.color || '#888888',
      tick: v.tick ?? 0
    };
  });
}

export function buildRenderFrame(worldState, options = {}) {
  const dim = options.gridDim || DEFAULT_GRID_DIM;
  const actors = computeActorPositions(worldState, dim);
  const voxels = computeVoxelProjections(worldState, dim);

  const gates = worldState.gates || {};
  const tensionCount = (worldState.unresolvedTensions || []).length;

  return {
    tick: worldState.tick ?? 0,
    epoch: worldState.epoch ?? 0,
    gateStates: Object.fromEntries(
      Object.entries(gates).map(([k, v]) => [k, v.state || 'unknown'])
    ),
    tensionCount,
    actorCount: actors.length,
    voxelCount: voxels.length,
    receiptCount: (worldState.replayReceipts || []).length,
    actors,
    voxels
  };
}

export { MOTIF_COLORS, DEFAULT_GRID_DIM };
