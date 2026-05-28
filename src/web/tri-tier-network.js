import { createPolytopeBuffer } from "../runtime/polytope-sab.js";

const CANONICAL_ROOT = "omi-ffff-127-0-0-1";

export class OmiTriTierNetworkEngine {
  constructor(sab) {
    const AB = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : ArrayBuffer;
    if (sab instanceof AB || sab instanceof ArrayBuffer) {
      this.sab = sab;
    } else if (sab?.buffer instanceof AB || sab?.buffer instanceof ArrayBuffer) {
      this.sab = sab.buffer;
    } else {
      this.sab = createPolytopeBuffer({ shared: true }).buffer;
    }
    this.view = new DataView(this.sab);
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

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

  parseTriTierAddress(idString) {
    if (!idString || !idString.startsWith(CANONICAL_ROOT)) {
      return idString?.startsWith("omi-")
        ? { valid: false, error: "External or Un-Authorized Network Domain Path" }
        : null;
    }
    const subPath = idString.substring(CANONICAL_ROOT.length + 1);
    const tokens = subPath.split("-");

    const asciiOpcode = tokens[0];
    const hardwareBus = tokens[1];
    const uniqueDevice = tokens[2];
    const timelineSlot = tokens[3];
    const trailingB64 = tokens[tokens.length - 1];

    let operationalTier = "UNCLASSIFIED_VOLATILE_SPACE";
    if (hardwareBus === "esp32")  operationalTier = "TIER_1_PHYSICAL_HARDWARE";
    if (hardwareBus === "adapter") operationalTier = "TIER_2_LOCAL_EDGE_NODE";
    if (hardwareBus === "vps")     operationalTier = "TIER_3_CLOUD_ROUTING_LEDGER";

    return {
      valid: true,
      tier: operationalTier,
      hardware: { opcode: asciiOpcode, device: uniqueDevice },
      clockTick: parseInt((timelineSlot || "").replace("slot", ""), 10) || 0,
      coefficients: trailingB64 && trailingB64.length > 10 ? this.decodePayloadBits(trailingB64) : null
    };
  }

  compileTransitFrame(targetElementId) {
    const specs = this.parseTriTierAddress(targetElementId);
    if (!specs || !specs.valid || !specs.coefficients) return null;

    const rawBuffer = new ArrayBuffer(16);
    const packetView = new DataView(rawBuffer);
    const coeffs = specs.coefficients;

    packetView.setUint8(0, parseInt(specs.hardware.opcode.replace("0x", ""), 16) || 0x01);
    packetView.setUint8(1, specs.tier === "TIER_3_CLOUD_ROUTING_LEDGER" ? 3 : 1);
    packetView.setUint32(2, specs.clockTick, true);
    packetView.setFloat32(6, coeffs[0] || 0, true);
    packetView.setFloat32(10, coeffs[1] || 0, true);
    packetView.setUint16(14, 0xAA55, true);

    return rawBuffer;
  }

  slotFromTier(tier) {
    if (tier === "TIER_1_PHYSICAL_HARDWARE") return 720;
    if (tier === "TIER_2_LOCAL_EDGE_NODE") return 1440;
    if (tier === "TIER_3_CLOUD_ROUTING_LEDGER") return 5040;
    return 0;
  }
}
