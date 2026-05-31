import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const BASE_COMPOSITE_60 = 60;

export class OmiBrahmaguptaKernel {
  evaluateQuadraticComposition(S, valA, valB, valC, valD, targetDenominator) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const a = Number(valA) & 0xFF;
    const b = Number(valB) & 0xFF;
    const c = Number(valC) & 0xFF;
    const d = Number(valD) & 0xFF;
    const denom = Number(targetDenominator) & 0xFF;

    let tempDenom = denom;
    if (tempDenom > 0) {
      while (tempDenom % 2 === 0) tempDenom /= 2;
      while (tempDenom % 3 === 0) tempDenom /= 3;
      while (tempDenom % 5 === 0) tempDenom /= 5;
    }
    const isRegularNumber = (tempDenom === 1);

    if (denom > 0 && !isRegularNumber) {
      return { accepted: false, reason: "NON_REGULAR_DENOMINATOR_EXCLUSION" };
    }

    const form1X = (a * c) - (b * d);
    const form1Y = (a * d) + (b * c);
    const productSumSquare1 = (form1X * form1X) + (form1Y * form1Y);

    const form2X = (a * c) + (b * d);
    const form2Y = (a * d) - (b * c);
    const productSumSquare2 = (form2X * form2X) + (form2Y * form2Y);

    const isIdentityValid = (productSumSquare1 === productSumSquare2);

    let canvasPresetColorId = "5";
    let quadraticClosureModel = "STANDARD_COMMUTATIVE_COMPOSITION";

    if (isIdentityValid && isRegularNumber && denom > 0) {
      quadraticClosureModel = "EXACT_SEXAGESIMAL_CLOSURE_ACTIVE";
      canvasPresetColorId = "5";
    } else if (!isIdentityValid) {
      quadraticClosureModel = "ALGEBRAIC_IDENTITY_DISCREPANCY_FAULT";
      canvasPresetColorId = "1";
    } else if (denom === 0) {
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(a & 0x0F, c & 0x0F, 1);

    return {
      accepted: isIdentityValid,
      quadraticClosureModel,
      form1: { x: form1X, y: form1Y },
      form2: { x: form2X, y: form2Y },
      productSumSquare: productSumSquare1,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(rowData.NN) % BASE_COMPOSITE_60
    };
  }
}
