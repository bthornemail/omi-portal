import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const UNIVERSAL_RELATION_SLOT = 1;
export const MAX_REWRITING_STEPS = 60;

export class OmiMonoidAutomatonKernel {
  evaluateMonoidTransition(S, targetElementP, hasUniversalCollapse, irreducibleFactorCount) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const p = Number(targetElementP) & 0xFF;
    const isCollapsed = !!hasUniversalCollapse;
    const factors = Number(irreducibleFactorCount) & 0xFF;

    const isPrimeGenerator = (
      p === 2 || p === 3 || p === 5 || p === 7 || p === 11 || p === 13 ||
      p === 17 || p === 19 || p === 23 || p === 29 || p === 31 ||
      p === 41 || p === 47 || p === 59 || p === 71
    );

    if (!isPrimeGenerator && factors > 0) {
      return { accepted: false, reason: "NON_PRIME_PRINCIPAL_IDEAL_EVICTION" };
    }

    const isPseudoGeneratorValid = isCollapsed && (factors < MAX_REWRITING_STEPS);

    let canvasPresetColorId = "5";
    let monoidAutomatonModel = "STANDARD_FACTORIAL_MONOID";

    if (isPrimeGenerator && isPseudoGeneratorValid) {
      monoidAutomatonModel = "PRIME_IDEAL_PSEUDO_GENERATOR_ACTIVE";
      canvasPresetColorId = "6";
    } else if (isPrimeGenerator) {
      monoidAutomatonModel = "PRINCIPAL_PRIME_IDEAL_LOCKED";
      canvasPresetColorId = "4";
    } else if (factors === 0) {
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit(p & 0x0F, factors & 0x0F, 1);

    return {
      accepted: isPrimeGenerator,
      monoidAutomatonModel,
      generatorPrime: p,
      isPseudoGeneratorValid,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(rowData.NN) % MAX_REWRITING_STEPS
    };
  }
}
