import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseOmiNotation, parseCoreAddress, parseClaimPrefix,
  parseReaderLenses, parseClaimBackoff, deriveCreationStep,
  applyReaderLens, applyReaderLensStack, OmiNotationParseError
} from '../src/omilog/omi-lens-parser.js';

const BASE_ADDR = 'omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff';

describe('OMI Lens Parser (0xAE) — One-Notation Doctrine', () => {
  describe('parseCoreAddress', () => {
    it('parses bare address without prefix', () => {
      const core = parseCoreAddress(BASE_ADDR);
      assert.ok(core);
      assert.strictEqual(core.raw, BASE_ADDR);
      assert.strictEqual(core.segments.length, 8);
    });

    it('parses address with /128 claim', () => {
      const core = parseCoreAddress(`${BASE_ADDR}/128`);
      assert.ok(core);
      assert.strictEqual(core.raw, BASE_ADDR);
    });

    it('parses address with /128/@60/@16/@4 lens stack', () => {
      const core = parseCoreAddress(`${BASE_ADDR}/128/@60/@16/@4`);
      assert.ok(core);
      assert.strictEqual(core.raw, BASE_ADDR);
    });

    it('parses address with claim backoff /128-4', () => {
      const core = parseCoreAddress(`${BASE_ADDR}/128-4`);
      assert.ok(core);
    });

    it('returns null for invalid hex segments', () => {
      assert.strictEqual(parseCoreAddress('omi-not-hex/128'), null);
    });

    it('returns null for non-string input', () => {
      assert.strictEqual(parseCoreAddress(null), null);
    });
  });

  describe('parseClaimPrefix', () => {
    it('/128 parses as exact claim', () => {
      assert.deepStrictEqual(parseClaimPrefix(`${BASE_ADDR}/128`), { bits: 128, backoff: null });
    });

    it('/64 parses as subnet claim', () => {
      assert.deepStrictEqual(parseClaimPrefix(`${BASE_ADDR}/64`), { bits: 64, backoff: null });
    });

    it('bare address returns null bits', () => {
      assert.deepStrictEqual(parseClaimPrefix(BASE_ADDR), { bits: null, backoff: null });
    });

    it('/128-4 parses with backoff', () => {
      assert.deepStrictEqual(parseClaimPrefix(`${BASE_ADDR}/128-4`), { bits: 128, backoff: 4 });
    });

    it('invalid prefix returns null', () => {
      assert.deepStrictEqual(parseClaimPrefix(`${BASE_ADDR}/999`), { bits: null, backoff: null });
    });
  });

  describe('parseReaderLenses', () => {
    it('/@60 parses as reader lens', () => {
      const lenses = parseReaderLenses(`${BASE_ADDR}/128/@60`);
      assert.strictEqual(lenses.length, 1);
      assert.strictEqual(lenses[0].type, 'lens');
      assert.strictEqual(lenses[0].value, 60);
    });

    it('/@360 parses as reader lens', () => {
      const lenses = parseReaderLenses(`${BASE_ADDR}/128/@360`);
      assert.strictEqual(lenses.length, 1);
      assert.strictEqual(lenses[0].value, 360);
    });

    it('/128/@60/@16/@4 parses claim plus lens stack', () => {
      const lenses = parseReaderLenses(`${BASE_ADDR}/128/@60/@16/@4`);
      assert.strictEqual(lenses.length, 3);
      assert.strictEqual(lenses[0].value, 60);
      assert.strictEqual(lenses[1].value, 16);
      assert.strictEqual(lenses[2].value, 4);
    });

    it('bare address returns empty lens list', () => {
      assert.deepStrictEqual(parseReaderLenses(BASE_ADDR), []);
    });

    it('plain /4 without @ does not parse as reader lens', () => {
      const lenses = parseReaderLenses(`${BASE_ADDR}/4`);
      assert.strictEqual(lenses.length, 0);
    });

    it('/@720 and /@5040 parse as reader lenses', () => {
      const lenses = parseReaderLenses(`${BASE_ADDR}/128/@720/@5040`);
      assert.strictEqual(lenses.length, 2);
      assert.strictEqual(lenses[0].value, 720);
      assert.strictEqual(lenses[1].value, 5040);
    });
  });

  describe('parseClaimBackoff', () => {
    it('/128-4 backoff = /124 effective', () => {
      const bo = parseClaimBackoff(`${BASE_ADDR}/128-4`);
      assert.ok(bo);
      assert.strictEqual(bo.original, 128);
      assert.strictEqual(bo.backoff, 4);
      assert.strictEqual(bo.effective, 124);
    });

    it('/128-5 backoff = /123 effective', () => {
      const bo = parseClaimBackoff(`${BASE_ADDR}/128-5`);
      assert.strictEqual(bo.effective, 123);
    });

    it('/128-4 is not equal to /128/@4', () => {
      const bo = parseClaimBackoff(`${BASE_ADDR}/128-4`);
      const lens = parseReaderLenses(`${BASE_ADDR}/128/@4`);
      assert.ok(bo);
      assert.strictEqual(lens.length, 1);
      assert.strictEqual(lens[0].value, 4);
      assert.notStrictEqual(bo.effective, lens[0].value);
    });

    it('bare address returns null backoff', () => {
      assert.strictEqual(parseClaimBackoff(BASE_ADDR), null);
    });
  });

  describe('deriveCreationStep', () => {
    it('derives step from core frame', () => {
      const core = parseCoreAddress(BASE_ADDR);
      const step = deriveCreationStep(core);
      assert.ok(step);
      assert.strictEqual(step.laneLL, 4);
      assert.strictEqual(step.bodyNN, 3);
      assert.strictEqual(step.carrierMM, 2);
    });

    it('slot5040 is derived from fano7 × 720 + role3 × 240 + local240', () => {
      const core = parseCoreAddress(BASE_ADDR);
      const step = deriveCreationStep(core);
      const expected = step.fano7 * 720 + step.role3 * 240 + step.local240;
      assert.strictEqual(step.slot5040, expected);
    });
  });

  describe('applyReaderLens', () => {
    it('lens 60 returns sexagesimal cadence', () => {
      const core = parseCoreAddress(BASE_ADDR);
      const step = deriveCreationStep(core);
      const view = applyReaderLens(core, step, { value: 60 });
      assert.strictEqual(view.lens, 'sexagesimal');
    });

    it('lens 4 returns tetrahedral source', () => {
      const view = applyReaderLens(null, null, { value: 4 });
      assert.strictEqual(view.lens, 'tetrahedral-source');
      assert.ok(view.vertices.includes('narrative'));
    });

    it('lens 5 returns five-source', () => {
      const view = applyReaderLens(null, null, { value: 5 });
      assert.strictEqual(view.lens, 'five-source');
    });

    it('unknown lens returns custom-N', () => {
      const view = applyReaderLens(null, null, { value: 99 });
      assert.strictEqual(view.lens, 'custom-99');
    });
  });

  describe('parseOmiNotation (integration)', () => {
    it('core address parses without prefix', () => {
      const result = parseOmiNotation(BASE_ADDR);
      assert.ok(result);
      assert.strictEqual(result.coreAddress, BASE_ADDR);
      assert.strictEqual(result.claimPrefix.bits, null);
    });

    it('/128 parses as exact claim', () => {
      const result = parseOmiNotation(`${BASE_ADDR}/128`);
      assert.strictEqual(result.claimPrefix.bits, 128);
    });

    it('/@60 parses as reader lens', () => {
      const result = parseOmiNotation(`${BASE_ADDR}/128/@60`);
      assert.strictEqual(result.readerLenses.length, 1);
      assert.strictEqual(result.readerLenses[0].value, 60);
    });

    it('/128/@60/@16/@4 parses as claim plus lens stack', () => {
      const result = parseOmiNotation(`${BASE_ADDR}/128/@60/@16/@4`);
      assert.strictEqual(result.claimPrefix.bits, 128);
      assert.strictEqual(result.readerLenses.length, 3);
      assert.strictEqual(result.readerLenses[0].value, 60);
      assert.strictEqual(result.readerLenses[1].value, 16);
      assert.strictEqual(result.readerLenses[2].value, 4);
    });

    it('/128-4 parses as claim backoff', () => {
      const result = parseOmiNotation(`${BASE_ADDR}/128-4`);
      assert.ok(result.claimBackoff);
      assert.strictEqual(result.claimBackoff.effective, 124);
    });

    it('/128-4 is not equal to /128/@4', () => {
      const a = parseOmiNotation(`${BASE_ADDR}/128-4`);
      const b = parseOmiNotation(`${BASE_ADDR}/128/@4`);
      assert.ok(a.claimBackoff);
      assert.strictEqual(b.readerLenses.length, 1);
      assert.strictEqual(b.readerLenses[0].value, 4);
    });

    it('throws on invalid core frame', () => {
      assert.throws(() => parseOmiNotation('not-an-address'), OmiNotationParseError);
    });

    it('creation step is derived before lenses are applied', () => {
      const result = parseOmiNotation(`${BASE_ADDR}/128/@60`);
      assert.ok(result.creationStep);
      assert.ok(result.creationStep.slot5040 >= 0);
      assert.ok(result.creationStep.slot5040 < 5040);
    });

    it('reader lenses cannot validate invalid core frame', () => {
      assert.throws(() => parseOmiNotation(''), OmiNotationParseError);
    });
  });

  describe('backoff is distinct from lens', () => {
    it('plain /4 is CIDR claim, not tetrahedral lens', () => {
      const result = parseOmiNotation(`${BASE_ADDR}/4`);
      assert.strictEqual(result.claimPrefix.bits, 4);
      assert.strictEqual(result.readerLenses.length, 0);
    });

    it('/@4 is tetrahedral lens, not CIDR claim', () => {
      const result = parseOmiNotation(`${BASE_ADDR}/128/@4`);
      assert.strictEqual(result.claimPrefix.bits, 128);
      assert.strictEqual(result.readerLenses.length, 1);
      assert.strictEqual(result.readerLenses[0].value, 4);
    });
  });
});
