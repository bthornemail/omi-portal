import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

export const NAT64_WELL_KNOWN_PREFIX_HIGH = 0x0064;
export const NAT64_WELL_KNOWN_PREFIX_LOW = 0xFF9B;

export class OmiNonogramNat64Resolver {
  resolveNonogramLayer(S, totalCells = 10, clueBlock = 8) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const isNat64Valid = (S[0] === 0x0100 && S[1] === 0x03BF);

    const step2Difference = totalCells - clueBlock;
    const blocksToBackfill = clueBlock - step2Difference;

    const isLineValid = blocksToBackfill > 0;
    if (!isLineValid) {
      return { accepted: false, reason: "NONOGRAM_CONTRADICTION_EVICTION" };
    }

    const isNegativeResistance = (rowData.NN & 0x8000) !== 0;
    const reflectionColorHex = isNegativeResistance ? "#7000FF" : "#00FFCC";

    const timelineSlot = rowData.NN % 5040;
    const orbitIndex = (timelineSlot / 36) | 0;
    const offsetIndex = timelineSlot % 36;
    const hueAngleDegrees = (timelineSlot * 360) / 5040;

    return {
      accepted: true,
      isNat64Valid,
      isNegativeResistance,
      reflectionColorHex,
      blocksToBackfill,
      step2Difference,
      timelineSlot,
      orbitIndex,
      offsetIndex,
      hueAngleDegrees,
      canvasColorTarget: `hsl(${hueAngleDegrees}, 100%, 50%)`
    };
  }
}
