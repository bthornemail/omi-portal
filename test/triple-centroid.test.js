import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SEXAGESIMAL_REGULAR_FRACTIONS, SEXAGESIMAL_REPEATING_FRACTIONS,
  REGULAR_DENOMINATORS, REPEATING_DENOMINATORS,
  fractionToSexagesimal, sexagesimalToFloat,
  isRegularDenominator, isRepeatingDenominator,
  tetrahedralWeights, fiveSourceWeights,
  computeCentroidWeight, sumWeightsCloseToOne
} from '../src/narrative/sexagesimal-weight-table.js';
import {
  CanonicalTripleCentroid, TRIAD_COUNT, TRIAD_PARTITIONS,
  resolveTriad, triadCategory, routeTriadToOmiFile, triadToSpoRoute,
  emitOmiCentroidExpression
} from '../src/narrative/canonical-triple-centroid.js';

describe('Slice 2: Triple Centroid & Sexagesimal Weights (0xAA–0xAB)', () => {
  describe('sexagesimal-weight-table', () => {
    it('REGULAR_DENOMINATORS contains 13 values', () => {
      assert.strictEqual(REGULAR_DENOMINATORS.length, 13);
    });

    it('SEXAGESIMAL_REGULAR_FRACTIONS maps known denominators', () => {
      assert.strictEqual(SEXAGESIMAL_REGULAR_FRACTIONS[4], '0;15');
      assert.strictEqual(SEXAGESIMAL_REGULAR_FRACTIONS[5], '0;12');
      assert.strictEqual(SEXAGESIMAL_REGULAR_FRACTIONS[60], '0;1');
    });

    it('REPEATING_DENOMINATORS contains 7 values', () => {
      assert.strictEqual(REPEATING_DENOMINATORS.length, 7);
    });

    it('SEXAGESIMAL_REPEATING_FRACTIONS describes 1/7 as Fano replay cadence', () => {
      assert.ok(SEXAGESIMAL_REPEATING_FRACTIONS[7].usage.includes('Fano'));
    });

    it('fractionToSexagesimal: 1/4 = 0;15', () => {
      assert.strictEqual(fractionToSexagesimal(1, 4), '0;15');
    });

    it('fractionToSexagesimal: 1/5 = 0;12', () => {
      assert.strictEqual(fractionToSexagesimal(1, 5), '0;12');
    });

    it('fractionToSexagesimal: 1/3 = 0;20', () => {
      assert.strictEqual(fractionToSexagesimal(1, 3), '0;20');
    });

    it('fractionToSexagesimal: 0/n = 0;0', () => {
      assert.strictEqual(fractionToSexagesimal(0, 5), '0;0');
    });

    it('fractionToSexagesimal: 2/2 = 1;0', () => {
      assert.strictEqual(fractionToSexagesimal(2, 2), '1;0');
    });

    it('fractionToSexagesimal: returns null for invalid input', () => {
      assert.strictEqual(fractionToSexagesimal(1, 0), null);
      assert.strictEqual(fractionToSexagesimal('a', 2), null);
    });

    it('sexagesimalToFloat: 0;15 = 0.25', () => {
      assert.strictEqual(sexagesimalToFloat('0;15'), 0.25);
    });

    it('sexagesimalToFloat: 0;12 = 0.2', () => {
      assert.strictEqual(sexagesimalToFloat('0;12'), 0.2);
    });

    it('sexagesimalToFloat: 0;7,30 = 0.125', () => {
      assert.strictEqual(Math.abs(sexagesimalToFloat('0;7,30') - 0.125) < 0.001, true);
    });

    it('sexagesimalToFloat: 1;0 = 1', () => {
      assert.strictEqual(sexagesimalToFloat('1;0'), 1);
    });

    it('sexagesimalToFloat: returns null for invalid format', () => {
      assert.strictEqual(sexagesimalToFloat('invalid'), null);
      assert.strictEqual(sexagesimalToFloat(''), null);
    });

    it('isRegularDenominator: 4, 5, 6, 8, 12 are regular', () => {
      assert.ok(isRegularDenominator(4));
      assert.ok(isRegularDenominator(5));
      assert.ok(isRegularDenominator(6));
      assert.ok(isRegularDenominator(8));
      assert.ok(isRegularDenominator(12));
    });

    it('isRegularDenominator: 7, 11, 13 are not regular', () => {
      assert.ok(!isRegularDenominator(7));
      assert.ok(!isRegularDenominator(11));
      assert.ok(!isRegularDenominator(13));
    });

    it('isRepeatingDenominator: 7, 59, 61 are repeating', () => {
      assert.ok(isRepeatingDenominator(7));
      assert.ok(isRepeatingDenominator(59));
      assert.ok(isRepeatingDenominator(61));
    });

    it('tetrahedralWeights: four 0;15 sum to 1;0', () => {
      const w = tetrahedralWeights();
      assert.strictEqual(w.narrative, '0;15');
      assert.strictEqual(w.upos, '0;15');
      assert.strictEqual(w.wordnet, '0;15');
      assert.strictEqual(w.emoji, '0;15');
      assert.strictEqual(w.sum, '1;0');
    });

    it('fiveSourceWeights: five 0;12 sum to 1;0', () => {
      const w = fiveSourceWeights();
      assert.strictEqual(w.narrative, '0;12');
      assert.strictEqual(w.upos, '0;12');
      assert.strictEqual(w.wordnet, '0;12');
      assert.strictEqual(w.emoji, '0;12');
      assert.strictEqual(w.omi, '0;12');
      assert.strictEqual(w.sum, '1;0');
    });

    it('computeCentroidWeight sums weights', () => {
      const sum = computeCentroidWeight({ a: '0;15', b: '0;15', c: '0;15' });
      assert.strictEqual(sum, '0;45');
    });

    it('computeCentroidWeight returns null for invalid weight', () => {
      assert.strictEqual(computeCentroidWeight(null), null);
      assert.strictEqual(computeCentroidWeight({ a: 'invalid' }), null);
    });

    it('sumWeightsCloseToOne: 1;0 is close', () => {
      assert.ok(sumWeightsCloseToOne('1;0'));
    });

    it('sumWeightsCloseToOne: 0;30 is not close', () => {
      assert.ok(!sumWeightsCloseToOne('0;30'));
    });
  });

  describe('canonical-triple-centroid', () => {
    it('TRIAD_COUNT is 155', () => {
      assert.strictEqual(TRIAD_COUNT, 155);
    });

    it('TRIAD_PARTITIONS sum to 155', () => {
      const sum = Object.values(TRIAD_PARTITIONS).reduce((a, b) => a + b, 0);
      assert.strictEqual(sum, 155);
    });

    it('TRIAD_PARTITIONS breakdown is 45+20+15+60+15', () => {
      assert.strictEqual(TRIAD_PARTITIONS.rules, 45);
      assert.strictEqual(TRIAD_PARTITIONS.facts, 20);
      assert.strictEqual(TRIAD_PARTITIONS.closures, 15);
      assert.strictEqual(TRIAD_PARTITIONS.combinators, 60);
      assert.strictEqual(TRIAD_PARTITIONS.cons, 15);
    });

    it('resolveTriad maps index 0 to rules', () => {
      const r = resolveTriad(0);
      assert.strictEqual(r.category, 'rules');
      assert.strictEqual(r.localIndex, 0);
    });

    it('resolveTriad maps index 45 to facts', () => {
      const r = resolveTriad(45);
      assert.strictEqual(r.category, 'facts');
    });

    it('resolveTriad returns null out of range', () => {
      assert.strictEqual(resolveTriad(-1), null);
      assert.strictEqual(resolveTriad(155), null);
    });

    it('triadCategory classifies via sum mod 5', () => {
      // sum = 0+1+2=3 → categories[3] = 'facts'
      assert.strictEqual(triadCategory([0, 1, 2]), 'facts');
    });

    it('triadCategory returns null for non-array', () => {
      assert.strictEqual(triadCategory(null), null);
    });

    it('routeTriadToOmiFile routes to correct file', () => {
      const cat = triadCategory([0, 1, 2]);
      const file = routeTriadToOmiFile([0, 1, 2]);
      assert.strictEqual(file, 'facts.omi');
    });

    it('triadToSpoRoute produces S/P/O indices', () => {
      const route = triadToSpoRoute([3, 7, 15]);
      assert.strictEqual(route.subject.index, 3);
      assert.strictEqual(route.predicate.index, 7);
      assert.strictEqual(route.object.index, 15);
    });

    it('CanonicalTripleCentroid constructs with budget', () => {
      const c = new CanonicalTripleCentroid();
      assert.strictEqual(c.budget.total, 155);
      assert.strictEqual(c.allocatedCount, 0);
      assert.strictEqual(c.remainingBudget, 155);
    });

    it('makeCanonicalTriple requires subject/predicate/object', () => {
      const c = new CanonicalTripleCentroid();
      const result = c.makeCanonicalTriple({ subject: null, predicate: null, object: null });
      assert.ok(result.error);
    });

    it('makeCanonicalTriple requires at least one witness', () => {
      const c = new CanonicalTripleCentroid();
      const result = c.makeCanonicalTriple({ subject: 'A', predicate: 'B', object: 'C' });
      assert.ok(result.error);
    });

    it('makeCanonicalTriple creates a canonical triple', () => {
      const c = new CanonicalTripleCentroid();
      const triple = c.makeCanonicalTriple({
        subject: 'Logos',
        predicate: 'reclaims',
        object: 'Number',
        narrative: 'ARTICLE-IV',
        upos: ['PROPN', 'VERB', 'NOUN'],
        wordnet: { lemma: 'reclaim', synset: 'reclaim.v.01' },
        emoji: '\u{1F5E3}\uFE0F\u{1F501}\u{1F4CF}'
      });
      assert.ok(triple);
      assert.strictEqual(triple.triple.subject, 'Logos');
      assert.strictEqual(triple.triple.predicate, 'reclaims');
      assert.strictEqual(c.allocatedCount, 1);
    });

    it('makeCanonicalTriple assigns triad indices sequentially', () => {
      const c = new CanonicalTripleCentroid();
      const t1 = c.makeCanonicalTriple({
        subject: 'A', predicate: 'relates', object: 'B',
        narrative: 'S1', upos: 'NOUN', wordnet: 'a', emoji: '\u{1F4E6}'
      });
      const t2 = c.makeCanonicalTriple({
        subject: 'C', predicate: 'opposes', object: 'D',
        narrative: 'S2', upos: 'VERB', wordnet: 'b', emoji: '\u{1F525}'
      });
      assert.strictEqual(t1.centroid.triadIndex, 0);
      assert.strictEqual(t2.centroid.triadIndex, 1);
    });

    it('makeCanonicalTriple tracks budget', () => {
      const c = new CanonicalTripleCentroid();
      assert.strictEqual(c.remainingBudget, 155);
      c.makeCanonicalTriple({
        subject: 'X', predicate: 'tests', object: 'Budget',
        narrative: 'TEST', upos: 'NOUN', wordnet: 'test', emoji: '\u{2705}'
      });
      assert.strictEqual(c.remainingBudget, 154);
    });

    it('scoreTetrahedralAgreement returns 0 for missing triple', () => {
      const c = new CanonicalTripleCentroid();
      assert.strictEqual(c.scoreTetrahedralAgreement(null), 0);
    });

    it('scoreTetrahedralAgreement returns 1 for 4-witness triple', () => {
      const c = new CanonicalTripleCentroid();
      const triple = c.makeCanonicalTriple({
        subject: 'S', predicate: 'P', object: 'O',
        narrative: 'N', upos: 'U', wordnet: 'W', emoji: 'E'
      });
      assert.strictEqual(c.scoreTetrahedralAgreement(triple), 1);
    });

    it('scoreTetrahedralAgreement returns 0 for <3 witnesses', () => {
      const c = new CanonicalTripleCentroid();
      const triple = c.makeCanonicalTriple({
        subject: 'S', predicate: 'P', object: 'O',
        narrative: 'N', upos: 'U', wordnet: null, emoji: null
      });
      assert.strictEqual(c.scoreTetrahedralAgreement(triple), 0);
    });

    it('findTriplesByCategory filters by category', () => {
      const c = new CanonicalTripleCentroid();
      c.makeCanonicalTriple({
        subject: 'S', predicate: 'P', object: 'O',
        narrative: 'N', upos: 'U', wordnet: 'W', emoji: 'E', triadClass: 'rules'
      });
      const rules = c.findTriplesByCategory('rules');
      assert.strictEqual(rules.length, 1);
      assert.strictEqual(c.findTriplesByCategory('facts').length, 0);
    });

    it('findTriplesByActor filters by actor name', () => {
      const c = new CanonicalTripleCentroid();
      c.makeCanonicalTriple({
        subject: 'Solomon', predicate: 'speaks', object: 'Wisdom',
        narrative: 'N', upos: 'PROPN', wordnet: 'solomon', emoji: '\u{1F451}'
      });
      const matches = c.findTriplesByActor('Solomon');
      assert.strictEqual(matches.length, 1);
    });

    it('getCentroidAddress returns canonical OMI address', () => {
      const c = new CanonicalTripleCentroid();
      const triple = c.makeCanonicalTriple({
        subject: 'X', predicate: 'Y', object: 'Z',
        narrative: 'N', upos: 'NOUN', wordnet: 'x', emoji: '\u{2705}'
      });
      const addr = c.getCentroidAddress(triple);
      assert.ok(addr.includes('omi-'));
      assert.ok(addr.includes('/128'));
    });

    it('emitOmiCentroidExpression produces O-expression string', () => {
      const c = new CanonicalTripleCentroid();
      const triple = c.makeCanonicalTriple({
        subject: 'Logos', predicate: 'reclaims', object: 'Number',
        narrative: 'ARTICLE-IV', upos: 'PROPN', wordnet: 'logos', emoji: '\u{1F5E3}\uFE0F'
      });
      const expr = emitOmiCentroidExpression(triple);
      assert.ok(expr.includes('canonical triple'));
      assert.ok(expr.includes('triple'));
      assert.ok(expr.includes('weights'));
    });

    it('reset clears all allocated triples', () => {
      const c = new CanonicalTripleCentroid();
      c.makeCanonicalTriple({
        subject: 'A', predicate: 'B', object: 'C',
        narrative: 'N', upos: 'NOUN', wordnet: 'x', emoji: '\u{2705}'
      });
      assert.strictEqual(c.allocatedCount, 1);
      c.reset();
      assert.strictEqual(c.allocatedCount, 0);
    });
  });
});
