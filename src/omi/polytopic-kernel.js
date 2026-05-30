import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const GENESIS_REG_ANCHOR = 0x7C00;

export class OmiPolytopicOsiKernel {
  evaluateOsiManifold(S, boundaryByteValue) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const targetByte = boundaryByteValue & 0xFF;

    const isInsideNSphereShell = (targetByte >= 0x00 && targetByte <= 0x1F);

    const activeRegisterWord = rowData.NN & 0xFFFF;
    const isGenesisAligned = (activeRegisterWord === GENESIS_REG_ANCHOR);

    let canvasPresetColorId = "5";
    let continuumPhaseModel = "STANDARD_OSI_PLANE";

    if (isGenesisAligned && isInsideNSphereShell) {
      canvasPresetColorId = "6";
      continuumPhaseModel = "OMICRON_CORE_CONVERGENCE";
    } else if (!isInsideNSphereShell) {
      canvasPresetColorId = "1";
      continuumPhaseModel = "CIRCUMELOCUTION_DRIFT_FAULT";
    }

    const simulatedAdderResult = computeCla4Bit(targetByte & 0x0F, 0x0F, 1);

    return {
      accepted: isInsideNSphereShell,
      continuumPhaseModel,
      isInsideNSphereShell,
      isGenesisAligned,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: activeRegisterWord % 5040
    };
  }
}
