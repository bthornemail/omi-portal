import { OmiChiralFifoEngine } from "../runtime/chiral-fifo-engine.js";

export class OmiSymmetricalChiralLexer {
  constructor(sharedArrayBuffer) {
    this.fifo = new OmiChiralFifoEngine(sharedArrayBuffer);
    this.CANONICAL_ROOT = "ffff-127-0-0-1";
    this.UNICODE_OMICRON = "\u03bf";
    this.MIRROR_TAIL = "1-0-0-721-ffff-imo";
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  evaluateChiralTapeStream(rawInputBufferString) {
    if (!rawInputBufferString) {
      return this.cons({ valid: false, error: "Empty input" }, null);
    }

    const hasOmiPrefix = rawInputBufferString.startsWith("omi-");
    const hasOmicronPrefix = rawInputBufferString.startsWith(this.UNICODE_OMICRON);
    if (!hasOmiPrefix && !hasOmicronPrefix) {
      return this.cons({ valid: false, error: "Missing Start-of-Tape Prefix Code" }, null);
    }

    if (!rawInputBufferString.endsWith("imo")) {
      return this.cons({ valid: false, error: "Missing End-of-Tape Chiral Mirror" }, null);
    }

    const raw = rawInputBufferString;
    const tokens = raw.split("-");
    const endFlag = tokens[tokens.length - 1];

    const controlHexReg = hasOmiPrefix ? tokens[1] : tokens[1];
    const opcodeInt = parseInt(controlHexReg, 16);
    const isFExpressionDeclaration = (opcodeInt >= 0x00 && opcodeInt <= 0x3F);

    const slotIdx = tokens.findIndex((t) => t.startsWith("slot"));
    if (slotIdx < 0) {
      return this.cons({ valid: false, error: "Missing timeline slot marker" }, null);
    }
    const addressSubnet = tokens.slice(2, slotIdx).join("-");
    const timelineSlot = tokens[slotIdx];

    const mirrorLen = 6;
    const b64End = tokens.length - mirrorLen;
    const base64Parts = [];
    for (let i = slotIdx + 1; i < b64End; i++) {
      base64Parts.push(tokens[i]);
    }
    const base64CdrData = base64Parts.length > 0 ? base64Parts.join("-") : null;

    const isLocalSecureContext = (addressSubnet === this.CANONICAL_ROOT);
    const isSymmetricalTapeValid = isFExpressionDeclaration && isLocalSecureContext && endFlag === "imo";

    return this.cons(
      {
        valid: isSymmetricalTapeValid,
        chiralityPolarity: (opcodeInt % 2 === 0) ? "LEFT_SNUB_CHIRAL" : "RIGHT_ASYMMETRIC_DUAL",
        metadata: { opcodeInt, addressSubnet, timelineSlot }
      },
      base64CdrData ? this.decodePayloadBits(base64CdrData) : null
    );
  }

  decodePayloadBits(b64) {
    let normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pad = bytes.length % 4;
    return new Float32Array(bytes.buffer, 0, Math.floor(bytes.length / 4));
  }
}
