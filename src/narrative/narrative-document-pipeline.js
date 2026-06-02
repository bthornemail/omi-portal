import { loadNarrativeFromDisk, loadNarrativeFromMap, CANONICAL_ORDER } from './narrative-loader.js';
import { lookupEmojiCarrier, matchActorFromToken, EMOJI_BY_ACTOR } from './emoji-notation-map.js';
import { PersistentWorldState } from '../world/persistent-world-state.js';

const MOTIF_EMOJI = {
  Gate: '\u{1F6AA}',
  Logos: '\u{1F4DD}\u{2728}\u{1F54A}\uFE0F',
  Number: '\u{1F522}\u{1F4CA}\u{1F4CF}',
  Covenant: '\u{1F91D}\u{1F4DC}',
  Beast: '\u{1F409}',
  Watcher: '\u{1F441}\uFE0F\u{270D}\uFE0F',
  Law: '\u{2696}\uFE0F\u{1F4CF}',
  Wisdom: '\u{1F451}\u{1F4DC}\u{1F56D}\uFE0F',
  Tribe: '\u{1F9EC}\u{1F525}\u{1F91D}'
};

const MOTIF_KEYWORDS = {
  Gate: ['gate', 'entrance', 'passage', 'city gate'],
  Logos: ['logos', 'word', 'meaning', 'the word'],
  Number: ['number', 'measure', 'idol of measure', 'count', 'rank'],
  Covenant: ['covenant', 'boundary', 'promise', 'not be crossed'],
  Beast: ['beast', 'mark', 'comparison'],
  Watcher: ['watcher', 'scribe', 'witness', 'metatron'],
  Law: ['law', 'solon', 'statute', 'justice'],
  Wisdom: ['wisdom', 'solomon', 'discern'],
  Tribe: ['tribe', 'asabiyyah', 'cohesion', 'belonging']
};

export function extractMotifsFromText(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = [];
  for (const [motif, keywords] of Object.entries(MOTIF_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        found.push(motif);
        break;
      }
    }
  }
  return found;
}

export function extractMotifsFromDocument(doc) {
  const text = doc.paragraphs.join('\n') + '\n' + doc.lines.join('\n');
  return extractMotifsFromText(text);
}

export function assignEmojiToMotif(motif) {
  return MOTIF_EMOJI[motif] || '\u{2753}';
}

export function insertNarrativeIntoWorld(documents, world) {
  if (!world) world = new PersistentWorldState();
  const allMotifs = new Set();
  const seenDocIds = new Set();

  for (const doc of documents) {
    if (seenDocIds.has(doc.documentId)) continue;
    seenDocIds.add(doc.documentId);

    world.addReceipt({
      type: 'narrative-document',
      documentId: doc.documentId,
      title: doc.title,
      section: doc.section,
      narrativeOrder: doc.narrativeOrder,
      paragraphCount: doc.paragraphs.length,
      sourcePath: doc.sourcePath
    });

    const motifs = extractMotifsFromDocument(doc);
    for (const motif of motifs) {
      allMotifs.add(motif);
      if (!world.hasActor(motif)) {
        world.addActor(motif, {
          role: 'motif',
          emoji: assignEmojiToMotif(motif),
          worldBehavior: 'narrative',
          tickCreated: world.tick
        });
      }
    }
  }

  world.setGate('Narrative Gate', 'open');
  world.addTension('Number vs Meaning', { maxAge: 5040 });

  const sortedMotifs = [...allMotifs].sort();
  for (let i = 0; i < sortedMotifs.length - 1; i++) {
    const s = sortedMotifs[i];
    const o = sortedMotifs[i + 1];
    if (!world.hasRelation(s, 'precedes', o)) {
      world.setRelation(s, 'precedes', o);
    }
  }

  return { world, motifCount: allMotifs.size, documentCount: seenDocIds.size };
}

export function loadAndInsertNarrative(narrativeDir, world) {
  const documents = loadNarrativeFromDisk(narrativeDir);
  if (documents.length === 0) return { world, motifCount: 0, documentCount: 0 };
  return insertNarrativeIntoWorld(documents, world || new PersistentWorldState());
}
