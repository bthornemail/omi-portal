export class OmiFactorialLatticeKernel {
  constructor(sharedArrayBuffer) {
    if (!sharedArrayBuffer) throw new Error("[Omi Lattice] Missing SharedArrayBuffer memory pool.");
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);
    this.LATTICE_WEIGHTS = {
      "0!": 1,
      "1!": 1,
      "2!": 2,
      "3!": 6,
      "4!": 24,
      "5!": 120,
      "6!": 720,
      "7!": 5040
    };
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell ? cell.car : null; }
  cdr(cell) { return cell ? cell.cdr : null; }

  resolveLatticeToken(omiIdString) {
    if (!omiIdString || !omiIdString.startsWith("omi-")) {
      return this.cons({ valid: false, error: "Malformed Identity" }, null);
    }

    const tokens = omiIdString.split("-");
    const factorialKey = tokens[1];

    const assignedWeight = this.LATTICE_WEIGHTS[factorialKey] || 0;
    const isFixedPointZeroFrame = (factorialKey === "0!" || omiIdString.includes("nil"));

    const headerContext = {
      token: omiIdString,
      factorialLayer: factorialKey,
      allocatedWeight: assignedWeight,
      isFixedPointZeroFrame,
      shouldBypassProcessing: isFixedPointZeroFrame
    };

    return this.cons(headerContext, isFixedPointZeroFrame ? null : tokens.slice(2));
  }

  evaluateLatticeTransformation(omiIdString, float32Coefficients) {
    const evaluationCell = this.resolveLatticeToken(omiIdString);
    const meta = this.car(evaluationCell);

    if (meta.isFixedPointZeroFrame) {
      return this.cons(omiIdString, new Float32Array([0.0, 0.0, 0.0, 0.0]));
    }

    const t = 2.5;
    const c = float32Coefficients;
    const computedOffset = ((c[0] * t + c[1]) * t + c[2]) * t + c[3];

    return this.cons(omiIdString, new Float32Array([computedOffset, computedOffset, meta.allocatedWeight]));
  }
}
