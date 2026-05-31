import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';

export const JAB_LFSR_POLY_MASK = 0x3FFFF;

export class OmiJabScramblerKernel {
  processAndRouteJabStream(S, rawDataBuffer, symbolSeedState, targetNbdAxis) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_SURFACE_FAULT" };
    }

    const rowData = extractTruthRow(S);
    let lfsr = symbolSeedState & 0xFFFFFFFF;

    const scrambled = new Uint8Array(rawDataBuffer.length);
    let totalStructuralXorSum = 0;

    for (let i = 0; i < rawDataBuffer.length; i++) {
      let maskByte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const feedback = ((lfsr >> 0) ^ (lfsr >> 2) ^ (lfsr >> 3) ^ (lfsr >> 5)) & 1;
        lfsr = (lfsr >> 1) | (feedback << 15);
        maskByte |= (feedback << bit);
      }
      scrambled[i] = rawDataBuffer[i] ^ maskByte;
      totalStructuralXorSum ^= scrambled[i];
    }

    const nbdAxisId = targetNbdAxis & 0x0F;
    const isHighNibbleAxis = (nbdAxisId >= 8);

    let canvasPresetColorId = "5";
    let axisMappingModel = "LOW_NIBBLE_AXIS_0_7";

    if (isHighNibbleAxis) {
      axisMappingModel = "HIGH_NIBBLE_AXIS_8_F";
      canvasPresetColorId = "6";
    }

    if (totalStructuralXorSum === 0) {
      canvasPresetColorId = "1";
    }

    return {
      accepted: true,
      axisMappingModel,
      nbdAxisId,
      isHighNibbleAxis,
      totalStructuralXorSum,
      canvasPresetColorId,
      timelineSlot: Number(BigInt(rowData.NN) % 5040n)
    };
  }
}
