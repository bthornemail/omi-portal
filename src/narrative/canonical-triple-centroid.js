import {
  tetrahedralWeights, fiveSourceWeights,
  computeCentroidWeight, sexagesimalToFloat
} from './sexagesimal-weight-table.js';
import {
  TRIAD_COUNT, TRIAD_PARTITIONS, resolveTriad,
  triadCategory, routeTriadToOmiFile, triadToSpoRoute
} from '../omilog/triad-router155.js';

export { TRIAD_COUNT, TRIAD_PARTITIONS, resolveTriad, triadCategory, routeTriadToOmiFile, triadToSpoRoute };

export const CANONICAL_TRIPLE_FIELDS = Object.freeze([
  'subject', 'predicate', 'object',
  'narrative', 'upos', 'wordnet', 'emoji',
  'triadClass'
]);

export class CanonicalTripleCentroid {
  constructor(options = {}) {
    this.triads = [];
    this.resolved = [];
    this.useFiveSource = options.useFiveSource || false;
  }

  get budget() {
    return {
      total: TRIAD_COUNT,
      partitions: { ...TRIAD_PARTITIONS }
    };
  }

  get allocatedCount() {
    return this.triads.length;
  }

  get remainingBudget() {
    return TRIAD_COUNT - this.triads.length;
  }

  makeCanonicalTriple({ subject, predicate, object, narrative, upos, wordnet, emoji, triadClass }) {
    if (!subject || !predicate || !object) {
      return { error: 'subject, predicate, and object are required' };
    }
    if (!narrative && !upos && !wordnet && !emoji) {
      return { error: 'at least one source witness is required' };
    }
    if (this.triads.length >= TRIAD_COUNT) {
      return { error: 'triad budget exhausted (155/155 allocated)' };
    }

    const weights = this.useFiveSource ? fiveSourceWeights() : tetrahedralWeights();
    const witnessMap = { narrative: !!narrative, upos: !!upos, wordnet: !!wordnet, emoji: !!emoji };
    const presentWeights = {};
    let presentCount = 0;
    for (const key of Object.keys(witnessMap)) {
      if (witnessMap[key]) {
        presentWeights[key] = weights[key] || '0;15';
        presentCount++;
      } else {
        presentWeights[key] = '0;0';
      }
    }

    if (presentCount < 3) {
      return { error: `insufficient witnesses: need ≥3, got ${presentCount}` };
    }

    const sumStr = computeCentroidWeight(presentWeights);
    if (!sumStr) {
      return { error: 'centroid weight computation failed' };
    }

    const triadIndex = this.triads.length;
    const resolved = resolveTriad(triadIndex);
    const cat = triadClass || (resolved ? resolved.category : 'combinators');
    const spo = triadToSpoRoute([triadIndex, (triadIndex + 1) % 32, (triadIndex + 2) % 32]);

    const triple = {
      triple: { subject, predicate, object },
      witnesses: {
        narrative: narrative || null,
        upos: upos || null,
        wordnet: wordnet || null,
        emoji: emoji || null
      },
      weights: { ...presentWeights, sum: sumStr },
      centroid: { triadIndex, category: cat, ...resolved, ...spo },
      omiFile: routeTriadToOmiFile([triadIndex, (triadIndex + 1) % 32, (triadIndex + 2) % 32]),
      timestamp: Date.now()
    };

    this.triads.push(triple);
    return triple;
  }

  scoreTetrahedralAgreement(triple) {
    if (!triple || !triple.witnesses) return 0;
    const present = ['narrative', 'upos', 'wordnet', 'emoji']
      .filter(k => !!triple.witnesses[k]);
    if (present.length < 3) return 0;
    if (present.length === 4) return 1;

    const sumFloat = triple.weights ? sexagesimalToFloat(triple.weights.sum) : 0;
    if (sumFloat === null) return 0;

    const maxWeight = this.useFiveSource ? 0.2 : 0.25;
    const ratio = sumFloat / (present.length * maxWeight);
    return Math.min(1, ratio);
  }

  findTriplesByCategory(category) {
    return this.triads.filter(t => t.centroid.category === category);
  }

  findTriplesByNarrative(narrativeId) {
    return this.triads.filter(t =>
      t.witnesses.narrative && t.witnesses.narrative.includes(narrativeId)
    );
  }

  findTriplesByActor(actorName) {
    const lower = actorName.toLowerCase();
    return this.triads.filter(t =>
      (t.triple.subject && t.triple.subject.toLowerCase().includes(lower)) ||
      (t.triple.predicate && t.triple.predicate.toLowerCase().includes(lower)) ||
      (t.triple.object && t.triple.object.toLowerCase().includes(lower))
    );
  }

  exportAsOExpression(triple) {
    if (!triple) return null;
    return {
      type: 'omi-expression',
      body: [
        { key: 'triple', value: [triple.triple.subject, triple.triple.predicate, triple.triple.object] },
        { key: 'narrative', value: triple.witnesses.narrative },
        { key: 'upos', value: triple.witnesses.upos },
        { key: 'wordnet', value: triple.witnesses.wordnet },
        { key: 'emoji', value: triple.witnesses.emoji },
        { key: 'weights', value: triple.weights },
        { key: 'triad-class', value: triple.centroid.category },
        { key: 'centroid', value: `omi-0000-0000-0000-0000-0000-0000-00${String(triple.centroid.triadIndex).padStart(2, '0')}-0001/128` }
      ]
    };
  }

  getCentroidAddress(triple) {
    if (!triple) return null;
    return `omi-0000-0000-0000-0000-0000-0000-00${String(triple.centroid.triadIndex).padStart(2, '0')}-0001/128`;
  }

  reset() {
    this.triads = [];
  }
}

export function emitOmiCentroidExpression(triple) {
  if (!triple) return null;
  const centroid = triple.centroid || {};
  const file = triple.omiFile || 'unknown.omi';
  return [
    `# canonical triple ${centroid.triadIndex} / ${centroid.category}`,
    `omi-0000-0000-0000-0000-0000-0000-00${String(centroid.triadIndex).padStart(2, '0')}-0001/128 CONS canonical-narrative-triple`,
    `-imo`,
    `  (`,
    `    (triple . (${triple.triple.subject} . ${triple.triple.predicate} . ${triple.triple.object}))`,
    `    (narrative . ${triple.witnesses.narrative || 'nil'})`,
    `    (upos . ${triple.witnesses.upos || 'nil'})`,
    `    (wordnet . ${triple.witnesses.wordnet || 'nil'})`,
    `    (emoji . ${triple.witnesses.emoji || 'nil'})`,
    `    (weights . ((${Object.entries(triple.weights || {}).map(([k, v]) => `${k} . ${v}`).join(') (')})))`,
    `    (triad-class . ${centroid.category || 'unknown'})`,
    `  )`,
    `.`
  ].join('\n');
}
