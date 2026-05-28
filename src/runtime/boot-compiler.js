import { POLYTOPE_SLOTS } from "./polytope-sab.js";

const CANONICAL_ROOT = "omi-ffff-127-0-0-1";
const MBR_BYTE_LENGTH = 512;
const BOOT_SIGNATURE = 0xaa55;
const CLOCK_OFFSET = 64;

const BOOT_TABLE_START = 0x7c00;
const BOOT_TABLE_END = 0x7f00;
const EXECUTION_SURFACE_START = 0x7f01;
const EXECUTION_SURFACE_END = 0xaa55;

export class OmiBareMetalBootCompiler {
  constructor(sharedArrayBuffer) {
    if (!sharedArrayBuffer || sharedArrayBuffer.byteLength < POLYTOPE_SLOTS * 8) {
      throw new TypeError(`OmiBareMetalBootCompiler requires a SharedArrayBuffer of at least ${POLYTOPE_SLOTS * 8} bytes`);
    }
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);
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

  compileBootSector(arrayBuffer) {
    if (arrayBuffer.byteLength !== MBR_BYTE_LENGTH) {
      throw new Error(`Omi Boot Engine: Boot Sector must be exactly ${MBR_BYTE_LENGTH} bytes.`);
    }

    const sectorView = new DataView(arrayBuffer);
    const magicSignature = sectorView.getUint16(MBR_BYTE_LENGTH - 2, true);
    if (magicSignature !== BOOT_SIGNATURE) {
      throw new Error("Omi Boot Engine: Invalid Boot Signature 0xAA55. Device is not bootable.");
    }

    const u8Source = new Uint8Array(arrayBuffer);
    const u8Target = new Uint8Array(this.sab);
    u8Target.set(u8Source, CLOCK_OFFSET);

    return true;
  }

  readBootSector() {
    const u8Target = new Uint8Array(this.sab);
    return new Uint8Array(u8Target.slice(CLOCK_OFFSET, CLOCK_OFFSET + MBR_BYTE_LENGTH));
  }

  parseBootAddress(idString) {
    if (!idString || !idString.startsWith(CANONICAL_ROOT)) {
      return idString?.startsWith("omi-")
        ? { valid: false, error: "External or Un-Authorized Network Domain Path" }
        : null;
    }

    const subPath = idString.substring(CANONICAL_ROOT.length + 1);
    const tokens = subPath.split("-");

    const startRangeHex = tokens[0];
    const endRangeHex = tokens[1];
    const contextPort = tokens[2];
    const trailingB64 = tokens[tokens.length - 1];

    const startAddress = parseInt(startRangeHex, 16);
    const endAddress = parseInt(endRangeHex, 16);

    let structuralTier = "UNCLASSIFIED_VOLATILE_MEMORY";
    if (startAddress === BOOT_TABLE_START && endAddress === BOOT_TABLE_END) {
      structuralTier = "BOOT_SECTOR_LOOKUP_TABLE";
    } else if (startAddress === EXECUTION_SURFACE_START && endAddress === EXECUTION_SURFACE_END) {
      structuralTier = "EXTENDED_EXECUTION_SURFACE";
    }

    return {
      valid: startAddress >= BOOT_TABLE_START && endAddress <= EXECUTION_SURFACE_END,
      tier: structuralTier,
      contextRoot: CANONICAL_ROOT,
      bounds: { startAddress: startAddress, endAddress: endAddress },
      startRangeHex,
      endRangeHex,
      contextPort: contextPort,
      coefficients: trailingB64 && trailingB64.length > 10 ? this.decodePayloadBits(trailingB64) : null
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
}
