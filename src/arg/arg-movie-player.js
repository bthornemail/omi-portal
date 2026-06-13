import { PersistentWorldState } from "../world/persistent-world-state.js";
import { ScrubbableWorldClock } from "../world/scrubbable-world-clock.js";
import { WorldInteractionGate } from "../world/world-interaction-gate.js";
import { buildRenderFrame } from "../canvas/movie-world-renderer.js";
import { compileBeatToTopology } from "./narrative-scene-compiler.js";
import { createAcceptReceipt, createRejectReceipt, importReceipt } from "./arg-receipts.js";

const DEFAULT_TICK_RATE_MS = 250;
const DEFAULT_TICKS_PER_BEAT = 16;

export class ArgMoviePlayer {
  #world;
  #clock;
  #gate;
  #timeline;
  #beatIndex;
  #elapsedTicks;
  #beatStartTicks;
  #playing;
  #currentTopology;
  #intervalId;
  #tickRateMs;
  #onFrame;
  #onBeatChange;
  #onPlayStateChange;
  #onGateChange;

  constructor(options = {}) {
    this.#world = options.world || new PersistentWorldState();
    this.#clock = options.clock || new ScrubbableWorldClock(this.#world);
    this.#gate = options.gate || new WorldInteractionGate(this.#clock, {
      timeoutDuration: options.gateTimeout ?? 120
    });
    this.#timeline = null;
    this.#beatIndex = 0;
    this.#elapsedTicks = 0;
    this.#beatStartTicks = 0;
    this.#playing = false;
    this.#currentTopology = null;
    this.#intervalId = null;
    this.#tickRateMs = options.tickRateMs ?? DEFAULT_TICK_RATE_MS;
    this.#onFrame = options.onFrame || null;
    this.#onBeatChange = options.onBeatChange || null;
    this.#onPlayStateChange = options.onPlayStateChange || null;
    this.#onGateChange = options.onGateChange || null;

    if (this.#gate) {
      this.#gate.on("open", () => {
        if (this.#onGateChange) this.#onGateChange("open");
      });
      this.#gate.on("close", () => {
        if (this.#onGateChange) this.#onGateChange("idle");
      });
      this.#gate.on("timeout", () => {
        if (this.#onGateChange) this.#onGateChange("idle");
      });
    }
  }

  get world() { return this.#world; }
  get clock() { return this.#clock; }
  get gate() { return this.#gate; }
  get timeline() { return this.#timeline; }
  get beatIndex() { return this.#beatIndex; }
  get playing() { return this.#playing; }
  get gateState() { return this.#gate.state; }
  get isGateOpen() { return this.#gate.isOpen; }
  get currentTopology() { return this.#currentTopology; }
  get elapsedTicks() { return this.#elapsedTicks; }

  get currentBeat() {
    return this.#timeline ? this.#timeline.allBeats[this.#beatIndex] || null : null;
  }

  get progress() {
    if (!this.#timeline || this.#timeline.beatCount === 0) return 0;
    return this.#beatIndex / this.#timeline.beatCount;
  }

  loadTimeline(timeline) {
    this.#timeline = timeline;
    this.#beatIndex = 0;
    this.#elapsedTicks = 0;
    this.#beatStartTicks = 0;
    this.#compileCurrentBeat();
  }

  play() {
    if (this.#playing || !this.#timeline) return;
    this.#playing = true;
    if (this.#clock.isPaused) this.#clock.resume();
    if (this.#intervalId === null) {
      this.#intervalId = setInterval(() => this.#tick(), this.#tickRateMs);
    }
    if (this.#onPlayStateChange) this.#onPlayStateChange(true);
  }

  pause() {
    if (!this.#playing) return;
    this.#playing = false;
    this.#clearTick();
    this.#clock.pause();
    if (this.#onPlayStateChange) this.#onPlayStateChange(false);
  }

  nextBeat() {
    const next = this.#beatIndex + 1;
    if (next >= this.#beatCount()) {
      this.pause();
      return;
    }
    this.#seekToBeat(next);
  }

  previousBeat() {
    this.#seekToBeat(Math.max(0, this.#beatIndex - 1));
  }

  scrubToBeat(index) {
    this.#seekToBeat(Math.max(0, Math.min(index, this.#beatCount() - 1)));
  }

  scrubToReceipt(receiptIndex) {
    if (this.#world && typeof this.#world.replayReceipts !== "undefined") {
      this.#clock.scrubToReceipt(receiptIndex, this.#world);
    }
    this.#compileCurrentBeat();
    this.#emitFrame();
  }

  scrubToMotif(motif) {
    if (!this.#timeline || !motif) return;
    const hits = this.#findBeatsByMotif(motif);
    if (hits.length > 0) {
      this.#seekToBeat(hits[0].beatIndex);
    }
  }

  openInteraction() {
    this.#gate.open();
  }

  closeInteraction() {
    this.#gate.close();
  }

  acceptCurrentBeat() {
    const beat = this.currentBeat;
    if (!beat) return null;
    const result = compileBeatToTopology(beat);
    if (!result.topology) return null;
    const receipts = [];
    for (const [id, node] of result.topology.nodes) {
      const receipt = createAcceptReceipt({ id }, result.topology);
      if (receipt) {
        importReceipt(receipt, this.#world);
        receipts.push(receipt);
      }
    }
    beat.receipt = { action: "accept", receipts, count: receipts.length };
    this.#gate.close();
    return receipts;
  }

  rejectCurrentBeat() {
    const beat = this.currentBeat;
    if (!beat) return null;
    const result = compileBeatToTopology(beat);
    if (!result.topology) return null;
    const receipts = [];
    for (const [id, node] of result.topology.nodes) {
      const receipt = createRejectReceipt({ id }, result.topology);
      if (receipt) {
        importReceipt(receipt, this.#world);
        receipts.push(receipt);
      }
    }
    beat.receipt = { action: "reject", receipts, count: receipts.length };
    this.#gate.close();
    return receipts;
  }

  getCurrentFrame() {
    return buildRenderFrame(
      this.#world.getState ? this.#world.getState() : this.#world,
      {}
    );
  }

  advanceTick() {
    this.#tick();
  }

  destroy() {
    this.pause();
    if (typeof this.#world.reset === "function") this.#world.reset();
    this.#timeline = null;
    this.#currentTopology = null;
    this.#onFrame = null;
    this.#onBeatChange = null;
    this.#onPlayStateChange = null;
    this.#onGateChange = null;
  }

  #tick() {
    if (!this.#timeline) return;

    this.#elapsedTicks++;

    this.#gate.tick();

    if (!this.#gate.isOpen) {
      const beat = this.currentBeat;
      if (beat) {
        const durTicks = beat.durationTicks || DEFAULT_TICKS_PER_BEAT;
        const ticksOnBeat = this.#elapsedTicks - this.#beatStartTicks;
        if (ticksOnBeat >= durTicks) {
          this.nextBeat();
        }
      }
    }

    this.#emitFrame();
  }

  #seekToBeat(index) {
    if (!this.#timeline) return;
    const old = this.#beatIndex;
    this.#beatIndex = Math.max(0, Math.min(index, this.#beatCount() - 1));

    let cumulative = 0;
    for (let i = 0; i < this.#beatIndex; i++) {
      const b = this.#timeline.allBeats[i];
      cumulative += b.durationTicks || DEFAULT_TICKS_PER_BEAT;
    }
    this.#beatStartTicks = cumulative;
    this.#elapsedTicks = cumulative;

    this.#compileCurrentBeat();
    if (this.#onBeatChange && old !== this.#beatIndex) {
      this.#onBeatChange(this.currentBeat, this.#beatIndex);
    }
    this.#emitFrame();
  }

  #compileCurrentBeat() {
    const beat = this.currentBeat;
    if (beat) {
      const result = compileBeatToTopology(beat);
      this.#currentTopology = result.topology;
    } else {
      this.#currentTopology = null;
    }
  }

  #emitFrame() {
    if (this.#onFrame) {
      this.#onFrame({
        frame: this.getCurrentFrame(),
        beat: this.currentBeat,
        beatIndex: this.#beatIndex,
        topology: this.#currentTopology
      });
    }
  }

  #beatCount() {
    return this.#timeline ? this.#timeline.allBeats.length : 0;
  }

  #findBeatsByMotif(motif) {
    if (!this.#timeline) return [];
    const results = [];
    for (let i = 0; i < this.#timeline.allBeats.length; i++) {
      const b = this.#timeline.allBeats[i];
      if (b.motifs && b.motifs.includes(motif)) {
        results.push({ ...b, beatIndex: i });
      }
    }
    return results;
  }

  #clearTick() {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }
}
