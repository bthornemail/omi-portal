import { POLYTOPE_SLOTS, tickFactorials } from "../runtime/polytope-sab.js";

export const CENTROID_COEFFICIENTS = Object.freeze({
  tetrahedron: Math.sin(Math.PI / 3),
  simplex5Cell: Math.cos(Math.PI / 5),
  octaplex24Cell: Math.tan(Math.PI / 6)
});

export const CONTROL_CODES = Object.freeze({
  TETRAHEDRON: "0x05",
  _5CELL: "0x05",
  _24CELL: "0x24"
});

export class OmiTriplicateProjectionEngine {
  constructor(sharedArrayBuffer) {
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);
    this.CENTROID_COEFFICIENTS = CENTROID_COEFFICIENTS;
  }

  cons(car, cdr) {
    return Object.freeze({ car, cdr });
  }

  car(cell) {
    return cell.car;
  }

  cdr(cell) {
    return cell.cdr;
  }

  parseTriplicateAddress(omiIdStr) {
    if (!omiIdStr || !omiIdStr.startsWith("omi-")) return null;

    const cleanStr = omiIdStr.substring(4);
    const tokens = cleanStr.split("-");

    const fsToken = tokens[0];
    const gsMatrix = tokens.slice(1, 6).join("-");
    const rsControlHex = tokens[6];
    const trailingB64 = tokens[tokens.length - 1];

    const is48BitSubnetValid = fsToken === "8" && gsMatrix === "ffff-127-0-0-1";

    return {
      isSubnetValid: is48BitSubnetValid,
      subnetMask: "::/48",
      controlCode: rsControlHex,
      coefficients: trailingB64 && trailingB64.length > 10
        ? this.decodePayloadBits(trailingB64) : null
    };
  }

  decodePayloadBits(b64) {
    let normalized = String(b64).replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = typeof atob === "function"
      ? atob(normalized)
      : Buffer.from(normalized, "base64").toString("binary");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  calculateTriplicateProjection(omiIdStr, currentTimelineTick) {
    const specs = this.parseTriplicateAddress(omiIdStr);
    if (!specs || !specs.isSubnetValid || !specs.coefficients) return 0;

    const t = (Number(currentTimelineTick) % POLYTOPE_SLOTS) / POLYTOPE_SLOTS;
    const coeffs = specs.coefficients;
    const baseScalar = ((coeffs[0] * t + coeffs[1]) * t + coeffs[2]) * t + coeffs[3];

    let geometricModifier = 1.0;
    if (specs.controlCode === CONTROL_CODES._5CELL) {
      geometricModifier = this.CENTROID_COEFFICIENTS.simplex5Cell;
    } else if (specs.controlCode === CONTROL_CODES._24CELL) {
      geometricModifier = this.CENTROID_COEFFICIENTS.octaplex24Cell;
    } else {
      geometricModifier = this.CENTROID_COEFFICIENTS.tetrahedron;
    }

    return baseScalar * geometricModifier;
  }
}