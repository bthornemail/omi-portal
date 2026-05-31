import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export class OmiHopfFibrationKernel {
  project3SphereTo2Sphere(S, x1, x2, x3, x4) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);

    const r1 = x1 & 0xFF;
    const r2 = x2 & 0xFF;
    const r3 = x3 & 0xFF;
    const r4 = x4 & 0xFF;

    const normSq = (r1 * r1 + r2 * r2 + r3 * r3 + r4 * r4) >>> 0;
    const TARGET_RADIUS_SQ = 255 * 255;
    const TOLERANCE = 20000;
    const isUnitSphere = Math.abs(normSq - TARGET_RADIUS_SQ) <= TOLERANCE;

    if (!isUnitSphere) {
      return { accepted: false, reason: "OUTSIDE_UNIT_3SPHERE_MANIFOLD_EVICTION" };
    }

    const complexRealPart = 2 * (r1 * r3 + r2 * r4);
    const complexImagPart = 2 * (r2 * r3 - r1 * r4);

    const z0MagSq = r1 * r1 + r2 * r2;
    const z1MagSq = r3 * r3 + r4 * r4;
    const baseRealComponent = z0MagSq - z1MagSq;

    let canvasPresetColorId = "5";
    let fibrationPhaseModel = "STANDARD_FIBER_PLANE";

    if (baseRealComponent > 0x7FFF) {
      canvasPresetColorId = "3";
      fibrationPhaseModel = "NORTH_POLE_Z0_DOMINANT";
    } else if (baseRealComponent < -0x7FFF) {
      canvasPresetColorId = "6";
      fibrationPhaseModel = "SOUTH_POLE_Z1_DOMINANT";
    } else if ((complexImagPart >>> 1) > 0x7FFF) {
      canvasPresetColorId = "1";
      fibrationPhaseModel = "EQUATORIAL_ORBIT_DRIFT";
    }

    const d = (complexRealPart !== 0 || complexImagPart !== 0)
      ? Math.round((Math.atan2(complexImagPart, complexRealPart) * 180) / Math.PI) + 180
      : 0;

    const hueAngleDegrees = d >>> 0;

    const simulatedAdderResult = computeCla4Bit(r1 & 0x0F, r3 & 0x0F, 1);

    return {
      accepted: true,
      fibrationPhaseModel,
      complexRealPart: complexRealPart >>> 0,
      complexImagPart: complexImagPart >>> 0,
      baseRealComponent: baseRealComponent | 0,
      hueAngleDegrees,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: rowData.NN % 5040
    };
  }

  hopfParametricTorus(eta, xi1, xi2) {
    const sinEta = Math.sin(eta);
    const cosEta = Math.cos(eta);
    const cosP = Math.cos((xi1 + xi2) / 2);
    const sinP = Math.sin((xi1 + xi2) / 2);
    const cosM = Math.cos((xi2 - xi1) / 2);
    const sinM = Math.sin((xi2 - xi1) / 2);

    return {
      x1: cosP * sinEta,
      x2: sinP * sinEta,
      x3: cosM * cosEta,
      x4: sinM * cosEta,
      z: Math.cos(2 * eta),
      x: Math.sin(2 * eta) * Math.cos(xi1),
      y: Math.sin(2 * eta) * Math.sin(xi1)
    };
  }
}
