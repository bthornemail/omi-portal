declare module '../../../src/narrative/narrative-base.js' {
  export const CANONICAL_ORDER: string[];
}

declare module '../../../src/arg/narrative-series-loader.js' {
  export function loadNarrativeSeries(contentMap: Record<string, string>): Array<Record<string, unknown>>;
  export function createSeriesContentMap(rawTexts: string[]): Record<string, string>;
}

declare module '../../../src/arg/narrative-movie-timeline.js' {
  export function buildTimeline(documents: Array<Record<string, unknown>>): {
    scenes: Array<Record<string, unknown>>;
    allBeats: Array<Record<string, unknown>>;
    sceneCount: number;
    beatCount: number;
    totalDurationMs: number;
    totalDurationTicks: number;
  };
}

declare module '../../../src/arg/narrative-scene-compiler.js' {
  export function compileBeatToTopology(beat: Record<string, unknown>): {
    topology: { nodes?: Map<string, unknown> } | null;
    scene: unknown;
    nodeCount: number;
  };
}

declare module '../../../src/arg/arg-movie-player.js' {
  export class ArgMoviePlayer {
    constructor(options?: Record<string, unknown>);
    readonly world: unknown;
    readonly clock: unknown;
    readonly gate: unknown;
    readonly timeline: { beatCount: number; allBeats: Array<Record<string, unknown>> } | null;
    readonly beatIndex: number;
    readonly playing: boolean;
    readonly gateState: string;
    readonly currentBeat: Record<string, unknown> | null;
    readonly progress: number;
    loadTimeline(timeline: unknown): void;
    play(): void;
    pause(): void;
    nextBeat(): void;
    previousBeat(): void;
    scrubToBeat(index: number): void;
    scrubToMotif(motif: string): void;
    openInteraction(): void;
    closeInteraction(): void;
    advanceTick(): void;
    destroy(): void;
  }
}

declare module '../../../src/world/persistent-world-state.js' {
  export class PersistentWorldState {
    readonly tick: number;
    readonly epoch: number;
    readonly receiptCount: number;
  }
}

declare module '../../../src/world/scrubbable-world-clock.js' {
  export class ScrubbableWorldClock {
    constructor(world?: unknown, options?: Record<string, unknown>);
    readonly tick: number;
    readonly epoch: number;
    scrubToTick(targetTick: number, targetEpoch?: number): void;
  }
}

declare module '../../../src/world/world-interaction-gate.js' {
  export class WorldInteractionGate {
    constructor(clock: unknown, options?: Record<string, unknown>);
  }
}

declare module '../../../src/narrative/narrative-document-pipeline.js' {
  export function insertNarrativeIntoWorld(documents: Array<Record<string, unknown>>, world: unknown): unknown;
}


