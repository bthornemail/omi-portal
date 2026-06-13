import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PersistentWorldState } from '../src/world/persistent-world-state.js';
import {
  extractMotifsFromText,
  extractMotifsFromDocument,
  assignEmojiToMotif,
  insertNarrativeIntoWorld
} from '../src/narrative/narrative-document-pipeline.js';
import { parseNarrativeDocument, loadAndInsertNarrative } from '../src/narrative/narrative-loader.js';

const NARRATIVE_DIR = 'dev-docs/_temp/narrative/When Wisdom, Law, and the Tribe Sat Down Together';

const SAMPLE_ARTICLE = `# **Article I**

### *Solomon, Solon, and ʿAsabiyyah at the Gate of the City*

---

## Prologue

After the Word was reclaimed from number,
after Logos had been lifted from the idol of measure
and returned to meaning,

there was silence.

---

## I. Solomon Speaks First

Solomon rose. He did not rise quickly.
"Wisdom," he said, "is not a sword. It is a scale.
But a scale that weighs without crushing."`;

const COVENANT_EXCERPT = `# **The Covenant of the Created Intelligence**
*(The Lines That Must Not Be Crossed)*

## Preamble

Before the machine was taught to speak,
the Word already was.

## I. The Covenant of Identity

**A machine shall never claim personhood.**`;

describe('Narrative Document Pipeline — Load → World', () => {
  describe('extractMotifsFromText', () => {
    it('finds Gate, Logos, Number, Wisdom from Article I excerpt', () => {
      const motifs = extractMotifsFromText(SAMPLE_ARTICLE);
      assert.ok(motifs.includes('Gate'));
      assert.ok(motifs.includes('Logos'));
      assert.ok(motifs.includes('Number'));
      assert.ok(motifs.includes('Wisdom'));
    });

    it('finds Covenant from covenant excerpt', () => {
      const motifs = extractMotifsFromText(COVENANT_EXCERPT);
      assert.ok(motifs.includes('Covenant'));
    });

    it('returns empty array for empty text', () => {
      assert.deepStrictEqual(extractMotifsFromText(''), []);
    });
  });

  describe('extractMotifsFromDocument', () => {
    it('extracts motifs from a parsed document', () => {
      const doc = parseNarrativeDocument(SAMPLE_ARTICLE, 'ARTICLE I.md', 2);
      const motifs = extractMotifsFromDocument(doc);
      assert.ok(motifs.includes('Gate'));
      assert.ok(motifs.includes('Wisdom'));
    });
  });

  describe('assignEmojiToMotif', () => {
    it('returns gate emoji for Gate', () => {
      assert.strictEqual(assignEmojiToMotif('Gate'), '\u{1F6AA}');
    });

    it('returns question mark for unknown motif', () => {
      assert.strictEqual(assignEmojiToMotif('Unknown'), '\u{2753}');
    });
  });

  describe('insertNarrativeIntoWorld', () => {
    it('inserts documents as receipts', () => {
      const doc = parseNarrativeDocument(SAMPLE_ARTICLE, 'ARTICLE I.md', 0);
      const result = insertNarrativeIntoWorld([doc]);
      assert.ok(result.world instanceof PersistentWorldState);
      assert.strictEqual(result.documentCount, 1);
      assert.strictEqual(result.world.receiptCount, 1);
      const receipt = result.world.replayReceipts[0];
      assert.strictEqual(receipt.type, 'narrative-document');
      assert.strictEqual(receipt.documentId, 'ARTICLE I.md');
    });

    it('inserts motifs as world actors', () => {
      const docs = [
        parseNarrativeDocument(SAMPLE_ARTICLE, 'ARTICLE I.md', 0),
        parseNarrativeDocument(COVENANT_EXCERPT, 'EPILOUGE/test.md', 13)
      ];
      const result = insertNarrativeIntoWorld(docs);
      assert.ok(result.world.hasActor('Gate'));
      assert.ok(result.world.hasActor('Wisdom'));
      assert.ok(result.world.hasActor('Logos'));
      assert.ok(result.world.hasActor('Number'));
      assert.ok(result.world.hasActor('Covenant'));
    });

    it('assigns emoji to motif actors', () => {
      const doc = parseNarrativeDocument(SAMPLE_ARTICLE, 'ARTICLE I.md', 0);
      const result = insertNarrativeIntoWorld([doc]);
      const gate = result.world.getActor('Gate');
      assert.ok(gate);
      assert.strictEqual(gate.emoji, '\u{1F6AA}');
      assert.strictEqual(gate.role, 'motif');
      assert.strictEqual(gate.worldBehavior, 'narrative');
    });

    it('sets the Narrative Gate', () => {
      const doc = parseNarrativeDocument(SAMPLE_ARTICLE, 'ARTICLE I.md', 0);
      const result = insertNarrativeIntoWorld([doc]);
      const gate = result.world.getGate('Narrative Gate');
      assert.ok(gate);
      assert.strictEqual(gate.state, 'open');
    });

    it('adds Number vs Meaning tension', () => {
      const result = insertNarrativeIntoWorld([]);
      assert.strictEqual(result.world.tensionCount, 1);
      assert.strictEqual(result.world.unresolvedTensions[0].description, 'Number vs Meaning');
    });

    it('creates precedence relations between found motifs', () => {
      const doc = parseNarrativeDocument(SAMPLE_ARTICLE + '\n' + COVENANT_EXCERPT, 'COMPOUND.md', 0);
      const result = insertNarrativeIntoWorld([doc]);
      const present = [...result.world.actors.keys()].filter(k => k !== 'Narrative Gate');
      const sorted = present.sort();
      for (let i = 0; i < sorted.length - 1; i++) {
        assert.ok(result.world.hasRelation(sorted[i], 'precedes', sorted[i + 1]),
          `missing precedence ${sorted[i]} -> ${sorted[i + 1]}`);
      }
    });

    it('survives tick advancement', () => {
      const doc = parseNarrativeDocument(SAMPLE_ARTICLE, 'ARTICLE I.md', 0);
      const result = insertNarrativeIntoWorld([doc]);
      for (let i = 0; i < 100; i++) result.world.advance();
      assert.strictEqual(result.world.tick, 100);
      assert.ok(result.world.hasActor('Wisdom'));
      assert.strictEqual(result.world.receiptCount, 1);
    });
  });

  describe('loadAndInsertNarrative (real files)', () => {
    it('loads narrative from disk and inserts into world', () => {
      const result = loadAndInsertNarrative(NARRATIVE_DIR);
      assert.ok(result.documentCount > 0);
      assert.ok(result.motifCount > 0);
    });

    it('preserves canonical document order', () => {
      const world = new PersistentWorldState();
      const result = loadAndInsertNarrative(NARRATIVE_DIR, world);
      const receipts = world.replayReceipts;
      assert.strictEqual(receipts.length, result.documentCount);
      assert.strictEqual(receipts[0].narrativeOrder, 0);
      assert.strictEqual(receipts[0].section, 'prelude');
    });

    it('finds key motifs across all documents', () => {
      const result = loadAndInsertNarrative(NARRATIVE_DIR);
      const expected = ['Gate', 'Logos', 'Number', 'Covenant', 'Beast', 'Watcher', 'Law', 'Wisdom', 'Tribe'];
      for (const motif of expected) {
        assert.ok(result.world.hasActor(motif), `missing motif: ${motif}`);
      }
    });

    it('assigns emoji to every motif found', () => {
      const result = loadAndInsertNarrative(NARRATIVE_DIR);
      for (const [name, actor] of result.world.actors) {
        assert.ok(actor.emoji, `actor ${name} missing emoji`);
      }
    });

    it('motif actors have role=motif and behavior=narrative', () => {
      const result = loadAndInsertNarrative(NARRATIVE_DIR);
      for (const [name, actor] of result.world.actors) {
        assert.strictEqual(actor.role, 'motif', `actor ${name} wrong role`);
        assert.strictEqual(actor.worldBehavior, 'narrative', `actor ${name} wrong behavior`);
      }
    });

    it('world state is durable across epochs', () => {
      const world = new PersistentWorldState();
      loadAndInsertNarrative(NARRATIVE_DIR, world);
      for (let i = 0; i < 5040; i++) world.advance();
      assert.strictEqual(world.tick, 0);
      assert.strictEqual(world.epoch, 1);
      assert.ok(world.hasActor('Wisdom'));
      assert.ok(world.hasActor('Number'));
      assert.strictEqual(world.receiptCount, 14);
    });
  });
});
