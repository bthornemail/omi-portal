import { fanoResolutionSteps, unpackSlot } from './delta-orbital-lexer.js';

export const WORDNET_RELATIONS = Object.freeze({
  HYPERNYM_IS_A:     1,
  HYPONYM_INCLUDES:   2,
  HOLONYM_PART_OF:    3,
  MERONYM_HAS_PART:   4,
  ANTONYM_INVERSE:    5,
  ENTAILMENT:         6,
  TROPONYM:           7
});

export const FANO_POINT_LABELS = Object.freeze({
  1: 'HYPERNYM_IS_A',
  2: 'HYPONYM_INCLUDES',
  3: 'HOLONYM_PART_OF',
  4: 'MERONYM_HAS_PART',
  5: 'ANTONYM_INVERSE',
  6: 'ENTAILMENT',
  7: 'TROPONYM'
});

export class OmiPrologInferenceEngine {
  constructor(ringSAB) {
    if (!ringSAB) throw new Error("[Omi Inference] Missing SharedArrayBuffer context.");
    this.bigIntRingArray = new BigInt64Array(ringSAB);
    this.ringLength = this.bigIntRingArray.length;
  }

  unifySymbolicQuery(queryLL, queryNN, queryMM) {
    if (queryLL < 1 || queryLL > 7) return false;

    for (let slotIndex = 0; slotIndex < this.ringLength; slotIndex++) {
      const row = Atomics.load(this.bigIntRingArray, slotIndex);
      if (row === 0n) continue;

      const { LL, NN, MM } = unpackSlot(row);

      if (LL === queryLL && NN === queryNN && MM === queryMM) {
        return {
          unified: true,
          type: "DIRECT_IDENTITY_PROVEN",
          steps: 1,
          slotIndex,
          LL, NN, MM
        };
      }
    }

    for (let slotIndex = 0; slotIndex < this.ringLength; slotIndex++) {
      const row = Atomics.load(this.bigIntRingArray, slotIndex);
      if (row === 0n) continue;

      const { LL: slotLL, NN: slotNN, MM: slotMM } = unpackSlot(row);
      if (slotLL !== queryLL) continue;

      const structuralBridgeMM = slotMM;
      const bridgeSteps = fanoResolutionSteps(queryLL, slotLL);
      if (bridgeSteps >= 0 && structuralBridgeMM === queryNN) {
        return {
          unified: true,
          type: "TRANSITIVE_HORN_CLAUSE_PROVEN",
          steps: bridgeSteps + 1,
          slotIndex,
          bridgeEntityId: structuralBridgeMM
        };
      }
    }

    return { unified: false, type: "NON_UNIFIABLE_VACUOUS_MANIFOLD" };
  }
}
