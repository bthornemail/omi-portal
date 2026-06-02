import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CANONICAL_ORDER, classifyDocument, parseNarrativeDocument,
  loadNarrativeFromMap, loadNarrativeFromDisk
} from '../src/narrative/narrative-loader.js';
import {
  CANONICAL_ACTOR_ORDER, EMOJI_BY_ACTOR, EMOJI_BY_UPOS,
  lookupEmojiCarrier, resolveWorldEmoji, matchActorFromToken
} from '../src/narrative/emoji-notation-map.js';
import { PersistentWorldState } from '../src/world/persistent-world-state.js';

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

describe('Slice 1: Narrative World Model (0xA3)', () => {
  describe('narrative-loader', () => {
    it('CANONICAL_ORDER has 14 entries', () => {
      assert.strictEqual(CANONICAL_ORDER.length, 14);
    });

    it('starts with PRELUDE and ends with EPILOUGE', () => {
      assert.ok(CANONICAL_ORDER[0].startsWith('PRELUDE/'));
      assert.ok(CANONICAL_ORDER[CANONICAL_ORDER.length - 1].startsWith('EPILOUGE/'));
    });

    it('classifyDocument returns correct section types', () => {
      assert.strictEqual(classifyDocument('PRELUDE/foo.md'), 'prelude');
      assert.strictEqual(classifyDocument('ARTICLE I.md'), 'article');
      assert.strictEqual(classifyDocument('ASIDE.md'), 'aside');
      assert.strictEqual(classifyDocument('EPILOUGE/bar.md'), 'epilogue');
      assert.strictEqual(classifyDocument('unknown/file.md'), 'unknown');
    });

    it('parseNarrativeDocument extracts title, paragraphs, lines', () => {
      const doc = parseNarrativeDocument(SAMPLE_ARTICLE, 'ARTICLE I.md', 2);
      assert.ok(doc.title.includes('Article I'));
      assert.strictEqual(doc.documentId, 'ARTICLE I.md');
      assert.strictEqual(doc.narrativeOrder, 2);
      assert.strictEqual(doc.section, 'article');
      assert.ok(doc.lines.length > 0);
      assert.ok(doc.paragraphs.length > 0);
    });

    it('parseNarrativeDocument handles empty text', () => {
      const doc = parseNarrativeDocument('', 'empty.md', 99);
      assert.strictEqual(doc.paragraphs.length, 0);
      assert.strictEqual(doc.lines.length, 1);
    });

    it('loadNarrativeFromMap loads documents in canonical order', () => {
      const map = {};
      for (const [i, id] of CANONICAL_ORDER.entries()) {
        map[id] = `# Document ${i}\n\nContent of ${id}`;
      }
      const docs = loadNarrativeFromMap(map);
      assert.strictEqual(docs.length, 14);
      assert.strictEqual(docs[0].documentId, CANONICAL_ORDER[0]);
      assert.strictEqual(docs[13].documentId, CANONICAL_ORDER[13]);
    });

    it('loadNarrativeFromMap skips missing documents', () => {
      const docs = loadNarrativeFromMap({ 'ARTICLE I.md': '# Only one' });
      assert.strictEqual(docs.length, 1);
    });

    it('loadNarrativeFromMap returns empty array for empty map', () => {
      const docs = loadNarrativeFromMap({});
      assert.strictEqual(docs.length, 0);
    });

    it('loadNarrativeFromDisk loads actual narrative files', () => {
      const docs = loadNarrativeFromDisk(
        'dev-docs/_temp/narrative/When Wisdom, Law, and the Tribe Sat Down Together'
      );
      assert.ok(docs.length > 0);
      assert.ok(docs.some(d => d.section === 'prelude'));
      assert.ok(docs.some(d => d.section === 'article'));
      assert.ok(docs.some(d => d.section === 'aside'));
      assert.ok(docs.some(d => d.section === 'epilogue'));
    });
  });

  describe('emoji-notation-map', () => {
    it('CANONICAL_ACTOR_ORDER has 14 actors', () => {
      assert.strictEqual(CANONICAL_ACTOR_ORDER.length, 14);
    });

    it('EMOJI_BY_ACTOR has entries for all canonical actors', () => {
      for (const actor of CANONICAL_ACTOR_ORDER) {
        assert.ok(EMOJI_BY_ACTOR[actor], `Missing emoji for ${actor}`);
      }
    });

    it('EMOJI_BY_UPOS has entries for all core UPOS tags', () => {
      assert.ok(EMOJI_BY_UPOS['NOUN']);
      assert.ok(EMOJI_BY_UPOS['VERB']);
      assert.ok(EMOJI_BY_UPOS['PROPN']);
    });

    it('lookupEmojiCarrier returns correct emoji for Solomon', () => {
      const emoji = lookupEmojiCarrier('Solomon');
      assert.strictEqual(emoji, EMOJI_BY_ACTOR.Solomon);
    });

    it('lookupEmojiCarrier is case-insensitive', () => {
      assert.strictEqual(lookupEmojiCarrier('solomon'), EMOJI_BY_ACTOR.Solomon);
      assert.strictEqual(lookupEmojiCarrier('SOLOMON'), EMOJI_BY_ACTOR.Solomon);
    });

    it('lookupEmojiCarrier returns null for unknown name', () => {
      assert.strictEqual(lookupEmojiCarrier('UnknownEntity'), null);
    });

    it('resolveWorldEmoji uses actor name first', () => {
      const emoji = resolveWorldEmoji({ actor: 'Solomon', upos: 'NOUN' });
      assert.strictEqual(emoji, EMOJI_BY_ACTOR.Solomon);
    });

    it('resolveWorldEmoji falls back to UPOS emoji', () => {
      const emoji = resolveWorldEmoji({ upos: 'VERB' });
      assert.strictEqual(emoji, EMOJI_BY_UPOS.VERB);
    });

    it('resolveWorldEmoji returns null for empty input', () => {
      assert.strictEqual(resolveWorldEmoji(null), null);
      assert.strictEqual(resolveWorldEmoji({}), null);
    });

    it('matchActorFromToken matches Solomon', () => {
      assert.strictEqual(matchActorFromToken('Solomon'), 'Solomon');
    });

    it('matchActorFromToken matches by keyword', () => {
      assert.strictEqual(matchActorFromToken('wisdom'), 'Solomon');
      assert.strictEqual(matchActorFromToken('law'), 'Solon');
      assert.strictEqual(matchActorFromToken('tribe'), 'Asabiyyah');
    });

    it('matchActorFromToken returns null for no match', () => {
      assert.strictEqual(matchActorFromToken('quantum'), null);
    });
  });

  describe('persistent-world-state', () => {
    it('constructs with default state', () => {
      const world = new PersistentWorldState();
      assert.strictEqual(world.tick, 0);
      assert.strictEqual(world.epoch, 0);
      assert.strictEqual(world.actorCount, 0);
      assert.strictEqual(world.relationCount, 0);
    });

    it('advance increments the tick counter', () => {
      const world = new PersistentWorldState();
      assert.strictEqual(world.advance(), 1);
      assert.strictEqual(world.advance(), 2);
    });

    it('advance wraps at 5040 and increments epoch', () => {
      const world = new PersistentWorldState();
      for (let i = 0; i < 5040; i++) world.advance();
      assert.strictEqual(world.tick, 0);
      assert.strictEqual(world.epoch, 1);
    });

    it('addActor stores actor and tracks counts', () => {
      const world = new PersistentWorldState();
      const actor = world.addActor('Solomon', { upos: 'PROPN', emoji: '\u{1F451}' });
      assert.strictEqual(actor.key, 'Solomon');
      assert.strictEqual(actor.upos, 'PROPN');
      assert.strictEqual(world.actorCount, 1);
    });

    it('addActor updates existing actor', () => {
      const world = new PersistentWorldState();
      world.addActor('Solomon', { role: 'subject' });
      world.addActor('Solomon', { worldBehavior: 'discern' });
      assert.strictEqual(world.actorCount, 1);
      assert.strictEqual(world.getActor('Solomon').worldBehavior, 'discern');
    });

    it('hasActor checks existence', () => {
      const world = new PersistentWorldState();
      world.addActor('Solon');
      assert.ok(world.hasActor('Solon'));
      assert.ok(!world.hasActor('Unknown'));
    });

    it('getActor returns null for missing actor', () => {
      const world = new PersistentWorldState();
      assert.strictEqual(world.getActor('Ghost'), null);
    });

    it('removeActor deletes and returns true/false', () => {
      const world = new PersistentWorldState();
      world.addActor('Temp');
      assert.ok(world.removeActor('Temp'));
      assert.ok(!world.removeActor('Temp'));
    });

    it('setRelation stores S-P-O triple', () => {
      const world = new PersistentWorldState();
      world.addActor('Solomon');
      world.addActor('Wisdom');
      const rel = world.setRelation('Solomon', 'speaks-of', 'Wisdom');
      assert.strictEqual(rel.subject, 'Solomon');
      assert.strictEqual(world.relationCount, 1);
    });

    it('getRelation retrieves by S-P-O key', () => {
      const world = new PersistentWorldState();
      world.setRelation('Solon', 'binds-with', 'Law');
      const rel = world.getRelation('Solon', 'binds-with', 'Law');
      assert.ok(rel);
      assert.strictEqual(rel.predicate, 'binds-with');
    });

    it('hasRelation checks existence', () => {
      const world = new PersistentWorldState();
      world.setRelation('A', 'knows', 'B');
      assert.ok(world.hasRelation('A', 'knows', 'B'));
      assert.ok(!world.hasRelation('A', 'knows', 'C'));
    });

    it('removeRelation deletes S-P-O', () => {
      const world = new PersistentWorldState();
      world.setRelation('X', 'connects', 'Y');
      assert.ok(world.removeRelation('X', 'connects', 'Y'));
      assert.ok(!world.hasRelation('X', 'connects', 'Y'));
    });

    it('getRelationsBySubject returns matching relations', () => {
      const world = new PersistentWorldState();
      world.setRelation('Solomon', 'speaks-of', 'Wisdom');
      world.setRelation('Solomon', 'weighs', 'Justice');
      world.setRelation('Solon', 'writes', 'Law');
      const subjs = world.getRelationsBySubject('Solomon');
      assert.strictEqual(subjs.length, 2);
    });

    it('getRelationsByObject returns matching relations', () => {
      const world = new PersistentWorldState();
      world.setRelation('Solomon', 'seeks', 'Wisdom');
      world.setRelation('Solon', 'defines', 'Wisdom');
      const objs = world.getRelationsByObject('Wisdom');
      assert.strictEqual(objs.length, 2);
    });

    it('addTension and resolveTension lifecycle', () => {
      const world = new PersistentWorldState();
      const t = world.addTension('Number vs Meaning', { maxAge: 10 });
      assert.strictEqual(world.tensionCount, 1);
      assert.ok(world.resolveTension(t.id));
      assert.strictEqual(world.tensionCount, 0);
    });

    it('setGate and getGate', () => {
      const world = new PersistentWorldState();
      world.setGate('City Gate', 'open');
      const gate = world.getGate('City Gate');
      assert.strictEqual(gate.state, 'open');
    });

    it('voxel operations', () => {
      const world = new PersistentWorldState();
      world.setVoxel('0-0', { depth: 60, color: '#FF4444' });
      assert.strictEqual(world.voxelCount, 1);
      const v = world.getVoxel('0-0');
      assert.strictEqual(v.depth, 60);
      world.removeVoxel('0-0');
      assert.strictEqual(world.voxelCount, 0);
    });

    it('addReceipt stores and bounds the receipt log', () => {
      const world = new PersistentWorldState({ maxReceipts: 3 });
      world.addReceipt({ type: 'scene', scene: 'Prologue' });
      world.addReceipt({ type: 'scene', scene: 'Debate' });
      world.addReceipt({ type: 'scene', scene: 'Covenant' });
      world.addReceipt({ type: 'scene', scene: 'Departure' });
      assert.strictEqual(world.receiptCount, 3);
      assert.strictEqual(world.replayReceipts[0].scene, 'Debate');
    });

    it('getState returns a frozen snapshot', () => {
      const world = new PersistentWorldState();
      world.addActor('Metatron', { role: 'observer' });
      world.advance();
      const state = world.getState();
      assert.strictEqual(state.tick, 1);
      assert.ok(state.actors.Metatron);
    });

    it('reset clears all state', () => {
      const world = new PersistentWorldState();
      world.addActor('Solomon');
      world.setRelation('Solomon', 'speaks', 'Wisdom');
      world.advance();
      world.reset();
      assert.strictEqual(world.tick, 0);
      assert.strictEqual(world.actorCount, 0);
      assert.strictEqual(world.relationCount, 0);
    });
  });
});
