import { getPhaseEmoji, getPhaseColor, extractMotifs } from "./narrative-series-loader.js";

const DEFAULT_TICKS_PER_BEAT = 16;

export function createBeat(document, paragraphIndex, caption) {
  const docId = document.documentId || document.id || `doc-${document.narrativeOrder}`;
  const motifs = extractMotifs(caption);

  return {
    beatId: `${docId}::beat-${paragraphIndex}`,
    documentId: docId,
    phase: document.section || "unknown",
    narrativeOrder: document.narrativeOrder || 0,
    paragraphIndex,
    caption,
    durationMs: DEFAULT_TICKS_PER_BEAT * 250,
    durationTicks: DEFAULT_TICKS_PER_BEAT,
    motifs,
    emojiCandidates: motifs.map(m => ({ motif: m, emoji: getPhaseEmoji(document.section) })),
    receipt: null,
    routeState: "unactivated",
    phaseEmoji: getPhaseEmoji(document.section),
    phaseColor: getPhaseColor(document.section)
  };
}

export function createScene(document) {
  const paragraphs = document.paragraphs || [];
  const beats = paragraphs.map((p, i) => createBeat(document, i, p));

  return {
    sceneId: document.documentId || `scene-${document.narrativeOrder}`,
    title: document.title || "",
    phase: document.section || "unknown",
    narrativeOrder: document.narrativeOrder || 0,
    phaseEmoji: getPhaseEmoji(document.section),
    phaseColor: getPhaseColor(document.section),
    beats,
    beatCount: beats.length,
    totalDurationMs: beats.reduce((s, b) => s + b.durationMs, 0),
    totalDurationTicks: beats.reduce((s, b) => s + (b.durationTicks || 16), 0)
  };
}

export function buildTimeline(documents) {
  const scenes = documents.map(d => createScene(d));
  const allBeats = scenes.flatMap(s => s.beats);

  return {
    scenes,
    allBeats,
    sceneCount: scenes.length,
    beatCount: allBeats.length,
    totalDurationMs: allBeats.reduce((s, b) => s + b.durationMs, 0),
    totalDurationTicks: allBeats.reduce((s, b) => s + (b.durationTicks || 16), 0)
  };
}

export function getSceneByIndex(timeline, index) {
  return (index >= 0 && index < timeline.scenes.length) ? timeline.scenes[index] : null;
}

export function getBeatByIndex(timeline, index) {
  return (index >= 0 && index < timeline.allBeats.length) ? timeline.allBeats[index] : null;
}

export function findBeatsByMotif(timeline, motif) {
  return timeline.allBeats.filter(b => b.motifs.includes(motif));
}

export function findScenesByPhase(timeline, phase) {
  return timeline.scenes.filter(s => s.phase === phase);
}
