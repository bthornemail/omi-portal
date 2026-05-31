import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';
import { computeCla4Bit } from '../omi/cla-adder.js';

export const SUPERIOR_COMPOSITE_LCM = 60;
export const VALID_SEXAGESIMAL_DIVISORS = Object.freeze([
  1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60
]);

export class OmiSexagesimalRouterKernel {
  routeSexagesimalData(S, targetFactorOperand, canonicalFrameId) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const factor = Number(targetFactorOperand);
    const frameId = Number(canonicalFrameId) & 0x03;

    const isDivisorValid = VALID_SEXAGESIMAL_DIVISORS.includes(factor);
    if (!isDivisorValid) {
      return { accepted: false, reason: "NON_REGULAR_SEXAGESIMAL_FACTOR_EVICTION" };
    }

    const derivedSectionMinutes = SUPERIOR_COMPOSITE_LCM / factor;

    let canvasPresetColorId = "5";
    let sexagesimalRoutingModel = "COMPOSITE_FRACTIONAL_RAIL";

    if (factor === 2 || factor === 3 || factor === 5) {
      sexagesimalRoutingModel = "PRIME_CLOCK_THREAD_SOURCE";
      canvasPresetColorId = "4";
    } else if (factor === SUPERIOR_COMPOSITE_LCM) {
      sexagesimalRoutingModel = "TERMINAL_LCM_HORIZON_LOCK";
      canvasPresetColorId = "6";
    } else if (frameId === 0) {
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(factor & 0x0F, derivedSectionMinutes & 0x0F, 1);

    return {
      accepted: true,
      sexagesimalRoutingModel,
      factor,
      derivedSectionMinutes,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 60
    };
  }
}
