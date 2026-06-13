import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_ORDER } from "../src/narrative/narrative-loader.js";
import { PersistentWorldState } from "../src/world/persistent-world-state.js";
import { ScrubbableWorldClock } from "../src/world/scrubbable-world-clock.js";
import { WorldInteractionGate } from "../src/world/world-interaction-gate.js";
import { buildRenderFrame } from "../src/canvas/movie-world-renderer.js";
import {
  loadNarrativeSeries, createSeriesContentMap
} from "../src/arg/narrative-series-loader.js";
import { buildTimeline } from "../src/arg/narrative-movie-timeline.js";
import { ArgMoviePlayer } from "../src/arg/arg-movie-player.js";
import { assertNoMutation } from "../src/arg/arg-world-projection.js";

const FIXTURE_TEXTS = [
  "## Prelude Title\n\nIn the beginning, we worshiped ideals. The gate opened.\n\nLogos spoke through number.",
  "## The Gospel\n\nNumber became the idol. The beast measured all things.",
  "# Article I\n\nSolomon and Solon at the gate. Wisdom discerns the law.",
  "# Article II\n\nThe covenant was established. The tribe gathered at the gate.",
  "# Article III\n\nThe watcher witnessed the boundary.",
  "# Article IV\n\nNumber and meaning in the city.",
  "# Article V\n\nLaw and wisdom in the gate.",
  "# Article VI\n\nThe beast and the covenant.",
  "# Article VII\n\nThe watcher and the tribe.",
  "# Article VIII\n\nThe gate closes. Wisdom remains.",
  "## Aside\n\nA reflection on the boundary between number and meaning.",
  "## Epilogue\n\nThe mark of the beast. Numbers replaced knowing.",
  "## Canticle\n\nReconciliation of number and meaning.",
  "## Covenant\n\nThe created intelligence keeps the boundary."
];

function buildTestTimeline() {
  const contentMap = createSeriesContentMap(FIXTURE_TEXTS);
  const documents = loadNarrativeSeries(contentMap);
  return buildTimeline(documents);
}

describe("ARG Movie Player (world/clock/gate)", () => {
  it("1. creates world/clock/gate on construction", () => {
    const player = new ArgMoviePlayer();
    assert(player.world instanceof PersistentWorldState);
    assert(player.clock instanceof ScrubbableWorldClock);
    assert(player.gate instanceof WorldInteractionGate);
    assert.equal(player.playing, false);
    assert.equal(player.gateState, "idle");
    assert.equal(player.beatIndex, 0);
    player.destroy();
  });

  it("2. accepts injected world/clock/gate", () => {
    const world = new PersistentWorldState();
    const clock = new ScrubbableWorldClock(world);
    const gate = new WorldInteractionGate(clock);
    const player = new ArgMoviePlayer({ world, clock, gate });
    assert.equal(player.world, world);
    assert.equal(player.clock, clock);
    assert.equal(player.gate, gate);
    player.destroy();
  });

  it("3. loadTimeline sets up timeline and currentBeat", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    assert.equal(player.currentBeat, null);

    player.loadTimeline(timeline);
    assert.equal(player.timeline, timeline);
    assert(player.currentBeat !== null);
    assert.equal(player.currentBeat.beatId, timeline.allBeats[0].beatId);
    assert.equal(player.beatIndex, 0);
    player.destroy();
  });

  it("4. play sets playing flag and resumes clock", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer({ tickRateMs: 50 });
    player.loadTimeline(timeline);
    assert.equal(player.playing, false);
    assert.equal(player.clock.isPaused, false);

    player.play();
    assert.equal(player.playing, true);

    player.pause();
    assert.equal(player.playing, false);
    player.destroy();
  });

  it("5. nextBeat advances to next beat", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);
    assert.equal(player.beatIndex, 0);

    player.nextBeat();
    assert.equal(player.beatIndex, 1);

    player.nextBeat();
    assert.equal(player.beatIndex, 2);
    player.destroy();
  });

  it("6. previousBeat moves back", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    player.nextBeat();
    player.nextBeat();
    assert.equal(player.beatIndex, 2);

    player.previousBeat();
    assert.equal(player.beatIndex, 1);
    player.destroy();
  });

  it("7. previousBeat at index 0 stays at 0", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);
    assert.equal(player.beatIndex, 0);

    player.previousBeat();
    assert.equal(player.beatIndex, 0);
    player.destroy();
  });

  it("8. nextBeat past end pauses", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    // Seek to the last beat
    player.scrubToBeat(timeline.beatCount - 1);
    assert.equal(player.beatIndex, timeline.beatCount - 1);

    player.play();
    player.nextBeat();
    assert.equal(player.playing, false);
    player.destroy();
  });

  it("9. scrubToBeat jumps to correct index", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    player.scrubToBeat(5);
    assert.equal(player.beatIndex, 5);
    assert.equal(player.currentBeat.beatId, timeline.allBeats[5].beatId);
    player.destroy();
  });

  it("10. scrubToBeat clamps out-of-range index", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    player.scrubToBeat(-1);
    assert.equal(player.beatIndex, 0);

    player.scrubToBeat(9999);
    assert.equal(player.beatIndex, timeline.beatCount - 1);
    player.destroy();
  });

  it("11. progress returns 0 at start", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);
    assert.equal(player.progress, 0);
    player.destroy();
  });

  it("12. progress reflects current beat fraction", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    player.scrubToBeat(Math.floor(timeline.beatCount / 2));
    assert(player.progress > 0);
    assert(player.progress < 1);
    player.destroy();
  });

  it("13. getCurrentFrame returns frame from world state", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    const frame = player.getCurrentFrame();
    assert(frame !== null);
    assert.equal(typeof frame.tick, "number");
    assert.equal(typeof frame.epoch, "number");
    assert.equal(typeof frame.actorCount, "number");
    assert.equal(typeof frame.receiptCount, "number");
    assert(Array.isArray(frame.actors));
    assert(Array.isArray(frame.voxels));
    player.destroy();
  });

  it("14. advanceTick increments elapsed ticks and advances beat when threshold exceeded", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    const durTicks = timeline.allBeats[0].durationTicks || 16;
    assert.equal(player.beatIndex, 0);

    // Advance ticks up to the threshold
    for (let i = 0; i < durTicks; i++) {
      player.advanceTick();
    }
    // After durTicks ticks, should have advanced to beat 1
    assert.equal(player.beatIndex, 1);
    player.destroy();
  });

  it("15. acceptCurrentBeat creates receipts and imports to world", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);
    // Seek to a beat with motifs (beat 1 = "Gate")
    player.scrubToBeat(1);

    const beat = player.currentBeat;
    assert.equal(beat.receipt, null);

    const receipts = player.acceptCurrentBeat();
    assert(receipts !== null);
    assert(Array.isArray(receipts));
    assert(receipts.length > 0);
    assert.equal(receipts[0].action, "accept");

    // Beat now has receipt metadata
    assert(beat.receipt !== null);
    assert.equal(beat.receipt.action, "accept");

    // World has receipts
    assert(player.world.receiptCount > 0);

    // Gate closed after accept
    assert.equal(player.gate.isOpen, false);
    player.destroy();
  });

  it("16. rejectCurrentBeat creates rejection receipts with different action", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);
    // Seek to beat with motifs
    player.scrubToBeat(1);

    const receipts = player.rejectCurrentBeat();
    assert(receipts !== null);
    assert(receipts.length > 0);
    assert.equal(receipts[0].action, "reject");
    assert.equal(player.currentBeat.receipt.action, "reject");
    player.destroy();
  });

  it("17. openInteraction pauses clock, closeInteraction resumes it", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    assert.equal(player.gate.isOpen, false);
    assert.equal(player.clock.isPaused, false);

    player.openInteraction();
    assert(player.gate.isOpen, true);
    assert(player.clock.isPaused, true);

    player.closeInteraction();
    assert.equal(player.gate.isOpen, false);
    assert.equal(player.clock.isPaused, false);
    player.destroy();
  });

  it("18. scrubToMotif finds beat by motif", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    player.scrubToMotif("Gate");
    const beat = player.currentBeat;
    assert(beat !== null, "currentBeat should not be null after scrubToMotif");
    assert(beat.motifs.includes("Gate"), `expected "Gate" in motifs, got ${JSON.stringify(beat.motifs)}`);
    player.destroy();
  });

  it("19. onBeatChange fires on beat transition", () => {
    const timeline = buildTestTimeline();
    let changedIndex = -1;
    let changedBeat = null;
    const player = new ArgMoviePlayer({
      onBeatChange: (beat, index) => { changedBeat = beat; changedIndex = index; }
    });
    player.loadTimeline(timeline);

    player.nextBeat();
    assert.equal(changedIndex, 1);
    assert(changedBeat !== null);
    assert.equal(changedBeat.beatId, timeline.allBeats[1].beatId);
    player.destroy();
  });

  it("20. onPlayStateChange fires on play/pause", () => {
    const timeline = buildTestTimeline();
    let state = null;
    const player = new ArgMoviePlayer({
      onPlayStateChange: (playing) => { state = playing; }
    });
    player.loadTimeline(timeline);

    player.play();
    assert.equal(state, true);
    player.pause();
    assert.equal(state, false);
    player.destroy();
  });

  it("21. topology compiles without carrier mutation after accept", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    player.acceptCurrentBeat();
    if (player.currentTopology) {
      assertNoMutation(player.currentTopology);
    }
    player.destroy();
  });

  it("22. destroy cleans up all state", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);
    player.play();
    const worldRef = player.world;

    player.destroy();
    assert.equal(player.playing, false);
    assert.equal(player.timeline, null);
    assert.equal(player.currentTopology, null);
    assert.equal(worldRef.actorCount, 0);
    assert.equal(worldRef.receiptCount, 0);
  });
});
