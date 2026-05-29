const POLYNOMIAL_MAP = Object.freeze([
  "CONSTANT_US",
  "LINEAR_RS",
  "QUADRATIC_GS",
  "CUBIC_FS"
]);

export class OmiPlaceValueInterpreter {
  constructor(sharedArrayBuffer) {
    if (!sharedArrayBuffer || sharedArrayBuffer.byteLength < 5040 * 8) {
      throw new TypeError("OmiPlaceValueInterpreter requires a SharedArrayBuffer of at least 40320 bytes");
    }
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);
    this.CANONICAL_ROOT = "ffff-127-0-0-1";
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  evaluateMaskDegree(omiTokenString) {
    if (!omiTokenString) {
      return this.cons({ valid: false, error: "Root Boundary Infraction" }, null);
    }

    const rootIdx = omiTokenString.indexOf(this.CANONICAL_ROOT);
    if (rootIdx < 0) {
      return this.cons({ valid: false, error: "Root Boundary Infraction" }, null);
    }

    const subPath = omiTokenString.substring(rootIdx + this.CANONICAL_ROOT.length + 1);
    const trigraphTallyCount = subPath.split("??-").length - 1;

    if (trigraphTallyCount > 3) {
      return this.cons({ valid: false, error: "Trigraph tally exceeds maximum degree 3" }, null);
    }

    const activeMaskTerm = POLYNOMIAL_MAP[trigraphTallyCount];

    const tokens = omiTokenString.split("-");
    const slotToken = tokens.find((t) => t.startsWith("slot"));
    const absoluteSlotIndex = slotToken ? parseInt(slotToken.replace("slot", ""), 10) : 0;

    const byteOffset = absoluteSlotIndex * 8;
    const registeredCoefficientWeight = this.view.getFloat64(byteOffset, true);

    return this.cons(
      {
        valid: true,
        token: omiTokenString,
        algebraicMetric: {
          trigraphTallyCount,
          polynomialOrderDegree: trigraphTallyCount,
          activeMaskTerm
        },
        memoryTarget: { absoluteSlotIndex, byteOffset }
      },
      new Float64Array([registeredCoefficientWeight])
    );
  }
}
