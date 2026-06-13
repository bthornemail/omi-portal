import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_ORDER } from "../src/narrative/narrative-loader.js";
import {
  loadNarrativeSeries, createSeriesContentMap,
  extractMotifs, getPhaseEmoji
} from "../src/arg/narrative-series-loader.js";
import {
  createBeat, createScene, buildTimeline,
  getSceneByIndex, getBeatByIndex, findBeatsByMotif
} from "../src/arg/narrative-movie-timeline.js";
import {
  compileBeatToTopology, compileBeatToEntities,
  compileSceneToTopology
} from "../src/arg/narrative-scene-compiler.js";
import { ArgMoviePlayer } from "../src/arg/arg-movie-player.js";
import { assertNoMutation } from "../src/arg/arg-world-projection.js";

const FIXTURE_TEXTS = [
  `## Prelude Title\n\nIn the beginning, we worshiped ideals. The gate opened.\n\nLogos spoke through number.`,
  `## The Gospel\n\nNumber became the idol. The beast measured all things.`,
  `# Article I\n\nSolomon and Solon at the gate. Wisdom discerns the law.`,
  `# Article II\n\nThe covenant was established. The tribe gathered at the gate.`,
  `# Article III\n\nThe watcher witnessed the boundary.`,
  `# Article IV\n\nNumber and meaning in the city.`,
  `# Article V\n\nLaw and wisdom in the gate.`,
  `# Article VI\n\nThe beast and the covenant.`,
  `# Article VII\n\nThe watcher and the tribe.`,
  `# Article VIII\n\nThe gate closes. Wisdom remains.`,
  `## Aside\n\nA reflection on the boundary between number and meaning.`,
  `## Epilogue\n\nThe mark of the beast. Numbers replaced knowing.`,
  `## Canticle\n\nReconciliation of number and meaning.`,
  `## Covenant\n\nThe created intelligence keeps the boundary.`
];

function buildTestTimeline() {
  const contentMap = createSeriesContentMap(FIXTURE_TEXTS);
  const documents = loadNarrativeSeries(contentMap);
  return buildTimeline(documents);
}

describe("ARG Narrative Movie", () => {
  it("1. loads all 14 narrative files in canonical order", () => {
    const contentMap = createSeriesContentMap(FIXTURE_TEXTS);
    const documents = loadNarrativeSeries(contentMap);
    assert.equal(documents.length, 14);
    documents.forEach((doc, i) => {
      assert.equal(doc.narrativeOrder, i);
      assert.equal(doc.documentId, CANONICAL_ORDER[i]);
    });
  });

  it("2. preserves canonical narrative order", () => {
    const contentMap = createSeriesContentMap(FIXTURE_TEXTS);
    const documents = loadNarrativeSeries(contentMap);
    for (let i = 1; i < documents.length; i++) {
      assert(documents[i].narrativeOrder > documents[i - 1].narrativeOrder,
        `Document ${i} out of order`);
    }
    assert(documents[0].documentId.startsWith("PRELUDE/"));
    assert(documents[documents.length - 1].documentId.startsWith("EPILOUGE/"));
  });

  it("3. creates one scene per document", () => {
    const timeline = buildTestTimeline();
    assert.equal(timeline.sceneCount, 14);
    assert.equal(timeline.scenes.length, 14);
  });

  it("4. creates beats from paragraphs", () => {
    const timeline = buildTestTimeline();
    assert(timeline.beatCount > 0);
    timeline.scenes.forEach(scene => {
      assert(scene.beatCount > 0, `Scene ${scene.sceneId} has no beats`);
      scene.beats.forEach(beat => {
        assert(beat.beatId, "Beat must have id");
        assert(typeof beat.caption === "string", "Beat must have caption");
        assert(beat.durationMs > 0, "Beat must have duration");
      });
    });
  });

  it("5. each beat has deterministic ID", () => {
    const t1 = buildTestTimeline();
    const t2 = buildTestTimeline();
    assert.equal(t1.beatCount, t2.beatCount);
    for (let i = 0; i < t1.beatCount; i++) {
      assert.equal(t1.allBeats[i].beatId, t2.allBeats[i].beatId);
    }
  });

  it("6. each beat can compile to topology", () => {
    const timeline = buildTestTimeline();
    let compiledCount = 0;
    for (const beat of timeline.allBeats) {
      const result = compileBeatToTopology(beat);
      if (result.nodeCount > 0) {
        compiledCount++;
        assert(result.topology !== null);
        assert(result.topology.nodes.size > 0);
      }
    }
    assert(compiledCount > 0, "At least one beat compiled to topology");
  });

  it("7. each topology node compiles to .o carrier", () => {
    const timeline = buildTestTimeline();
    for (const beat of timeline.allBeats) {
      const result = compileBeatToTopology(beat);
      if (result.topology) {
        for (const [id, node] of result.topology.nodes) {
          assert(node.carrier !== null, `Node ${id} missing carrier`);
          assert(typeof node.carrier === "bigint", `Node ${id} carrier not BigInt`);
        }
      }
    }
  });

  it("8. movie timeline can play/pause/next/previous", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    assert.equal(player.progress, 0);
    assert.equal(player.beatIndex, 0);

    player.nextBeat();
    assert.equal(player.beatIndex, 1);

    player.nextBeat();
    assert.equal(player.beatIndex, 2);

    player.previousBeat();
    assert.equal(player.beatIndex, 1);

    player.play();
    assert.equal(player.playing, true);

    player.pause();
    assert.equal(player.playing, false);

    player.scrubToBeat(5);
    assert.equal(player.beatIndex, 5);

    player.scrubToBeat(0);
    assert.equal(player.beatIndex, 0);

    player.destroy();
  });

  it("9. A-Frame scene updates from current beat", () => {
    const timeline = buildTestTimeline();
    let lastBeat = null;
    let lastBeatIndex = -1;

    const player = new ArgMoviePlayer({
      onBeatChange: (beat, index) => { lastBeat = beat; lastBeatIndex = index; }
    });
    player.loadTimeline(timeline);

    // Seek to a beat with motifs so compileBeatToEntities works
    player.scrubToBeat(1);
    assert(lastBeat !== null);
    assert.equal(lastBeatIndex, 1);

    player.nextBeat();
    assert.equal(lastBeatIndex, 2);

    const result = compileBeatToEntities(lastBeat);
    if (result.length > 0) {
      result.forEach(e => {
        assert(e.carrierHex, "Entity must have carrier hex");
        assert(e.id, "Entity must have id");
      });
    }

    player.destroy();
  });

  it("10. movie playback does not mutate carriers", () => {
    const timeline = buildTestTimeline();
    const player = new ArgMoviePlayer();
    player.loadTimeline(timeline);

    for (let i = 0; i < Math.min(timeline.beatCount, 5); i++) {
      player.scrubToBeat(i);
      const beat = player.currentBeat;
      const result = compileBeatToTopology(beat);
      if (result.topology) {
        assertNoMutation(result.topology);
      }
    }
    player.destroy();
  });

  it("11. receipts attach to beats, not source text", () => {
    const timeline = buildTestTimeline();
    const beat = timeline.allBeats[0];
    assert.equal(beat.receipt, null);

    beat.receipt = { receiptHash: "0xABCD", action: "accept" };
    assert(beat.receipt !== null);
    assert.equal(beat.receipt.action, "accept");
  });
});
