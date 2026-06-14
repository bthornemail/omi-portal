// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { CANONICAL_ORDER } from '../../../src/narrative/narrative-base.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { loadNarrativeSeries, createSeriesContentMap } from '../../../src/arg/narrative-series-loader.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { buildTimeline } from '../../../src/arg/narrative-movie-timeline.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { compileBeatToTopology as compileBeatToTopologyRoot } from '../../../src/arg/narrative-scene-compiler.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { ArgMoviePlayer } from '../../../src/arg/arg-movie-player.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { PersistentWorldState } from '../../../src/world/persistent-world-state.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { ScrubbableWorldClock } from '../../../src/world/scrubbable-world-clock.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { WorldInteractionGate } from '../../../src/world/world-interaction-gate.js';
// @ts-expect-error Root OMI modules are canonical browser-safe JavaScript.
import { insertNarrativeIntoWorld } from '../../../src/narrative/narrative-document-pipeline.js';
import type { DesignId, NarrativeBeat, NarrativeProjectionState } from './narrativeTypes';

export type NarrativePipeline = {
  player: ArgMoviePlayer;
  world: PersistentWorldState;
  clock: ScrubbableWorldClock;
  gate: WorldInteractionGate;
  timeline: ReturnType<typeof buildTimeline>;
  documents: ReturnType<typeof loadNarrativeSeries>;
};

export const CANONICAL_NARRATIVE_ORDER = CANONICAL_ORDER as string[];
export const compileBeatToTopology = compileBeatToTopologyRoot;

function getRawNarrativeModules() {
  const glob = (import.meta as ImportMeta & {
    glob?: (pattern: string, options: Record<string, unknown>) => Record<string, string>;
  }).glob;

  if (typeof glob !== 'function') return {};

  return glob('../../../vendor/narrative-series/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  });
}

function indexModulesByDocId(modules: Record<string, unknown>) {
  const index: Record<string, string> = {};
  for (const [key, value] of Object.entries(modules)) {
    const match = key.match(/(?:^|\/)((?:PRELUDE\/|EPILOUGE\/)?[^/]+\.md)$/);
    if (match && typeof value === 'string') index[match[1]] = value;
  }
  return index;
}

export function loadCanonicalNarrativeRawTexts(modules: Record<string, unknown> = getRawNarrativeModules()) {
  const byDocId = indexModulesByDocId(modules);
  return CANONICAL_NARRATIVE_ORDER.map((docId) => {
    const text = byDocId[docId];
    if (typeof text !== 'string') {
      throw new Error(`Missing canonical narrative document: ${docId}`);
    }
    return text;
  });
}

export function createNarrativePipeline(rawTexts = loadCanonicalNarrativeRawTexts()): NarrativePipeline {
  const documents = loadNarrativeSeries(createSeriesContentMap(rawTexts));
  const world = new PersistentWorldState();
  insertNarrativeIntoWorld(documents, world);
  const clock = new ScrubbableWorldClock(world);
  const gate = new WorldInteractionGate(clock, { timeoutDuration: 120 });
  const timeline = buildTimeline(documents);
  const player = new ArgMoviePlayer({
    world,
    clock,
    gate,
    tickRateMs: 250,
    gateTimeout: 120
  });
  player.loadTimeline(timeline);
  return { player, world, clock, gate, timeline, documents };
}

export function designForNarrative(beat: NarrativeBeat | null): DesignId {
  if (!beat) return 'tuscan';
  const motifs = new Set(beat.motifs ?? []);
  if (motifs.has('Gate') || beat.phase === 'prelude') return 'fano';
  if (motifs.has('Law') || motifs.has('Tribe')) return 'sbibd';
  if (motifs.has('Number') || beat.phase === 'article') return 'latin';
  if (motifs.has('Wisdom') || motifs.has('Logos')) return 'hadamard';
  if (motifs.has('Covenant') || beat.phase === 'epilogue') return 'diffset';
  return 'tuscan';
}

export function snapshotNarrativeProjection(pipeline: NarrativePipeline | null, playing = false): NarrativeProjectionState {
  if (!pipeline) {
    return {
      ready: false,
      playing: false,
      beat: null,
      beatIndex: 0,
      beatCount: 0,
      tick: 0,
      epoch: 0,
      gateState: 'idle',
      receiptCount: 0,
      topologyNodeCount: 0,
      activeDesign: 'tuscan'
    };
  }

  const beat = pipeline.player.currentBeat as NarrativeBeat | null;
  const topology = beat ? compileBeatToTopologyRoot(beat).topology : null;
  return {
    ready: true,
    playing,
    beat,
    beatIndex: pipeline.player.beatIndex,
    beatCount: pipeline.timeline.beatCount,
    tick: pipeline.clock.tick,
    epoch: pipeline.clock.epoch,
    gateState: pipeline.player.gateState ?? 'idle',
    receiptCount: pipeline.world.receiptCount,
    topologyNodeCount: topology?.nodes?.size ?? 0,
    activeDesign: designForNarrative(beat)
  };
}
