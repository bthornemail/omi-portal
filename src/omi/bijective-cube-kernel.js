import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

export const TWO_CUBE_BUFFER_SIZE_BYTES = 128 * 8;

export class OmiBijectiveCubeKernel {
  constructor(timelineSAB) {
    if (!timelineSAB) throw new Error("[Omi Bijective] Missing global timeline SAB.");
    this.timelineRingArray = new BigInt64Array(timelineSAB);
  }

  executeBijectiveTransition(S, inputStateBits, outTransitionBuffer) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    if (!outTransitionBuffer || outTransitionBuffer.byteLength !== TWO_CUBE_BUFFER_SIZE_BYTES) {
      return { accepted: false, reason: "INVALID_TWO_CUBE_WORKSPACE_CAPACITY" };
    }

    const cubeDataView = new BigInt64Array(outTransitionBuffer);
    const rowData = extractTruthRow(S);
    const targetRingSlot = rowData.NN % 5040;

    const packedReceipt = Atomics.load(this.timelineRingArray, targetRingSlot);

    const stateMask = BigInt(inputStateBits & 0x7F);
    const invertedStateMask = BigInt((~inputStateBits) & 0x7F);

    cubeDataView[Number(stateMask)] = packedReceipt ^ (1024n);
    cubeDataView[Number(invertedStateMask)] = packedReceipt ^ (2048n);

    const isRedundancySafe = (cubeDataView[Number(stateMask)] !== 0n);

    return {
      accepted: isRedundancySafe,
      targetRingSlot,
      activeStateIndex: Number(stateMask),
      opposingStateIndex: Number(invertedStateMask),
      canvasColorPresetId: isRedundancySafe ? "5" : "6"
    };
  }
}
