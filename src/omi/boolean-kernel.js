export class OmiBooleanKernelEngine {
  constructor(sharedArrayBuffer) {
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);
    this.UNICODE_OMICRON = "\u03bf";
    this.CANONICAL_ROOT = "ffff-127-0-0-1";
    this.CONSTANT_C = 0x5A3C;
    this.BYTE_TRUE = 0x03;
    this.BYTE_FALSE = 0xBF;
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  evaluateBooleanTapeStream(rawInputBufferString) {
    if (!rawInputBufferString || !rawInputBufferString.startsWith(this.UNICODE_OMICRON)) {
      return this.cons({ valid: false, error: "Missing U+03BF Invariant Prefix Code" }, null);
    }

    if (!rawInputBufferString.endsWith("imo")) {
      return this.cons({ valid: false, error: "Missing -ο-imo mirror suffix" }, null);
    }

    const characterCode = rawInputBufferString.charCodeAt(0);
    const extractedHighByte = (characterCode >> 8) & 0xFF;
    const extractedLowByte = characterCode & 0xFF;

    const tokens = rawInputBufferString.split("-");
    const opcodeStr = tokens[1];
    const opcodeInt = parseInt(opcodeStr, 16);

    const slotIdx = tokens.findIndex((t) => t.startsWith("slot"));
    const addressSubnet = slotIdx > 2 ? tokens.slice(2, slotIdx).join("-") : tokens.slice(2, 6).join("-");

    const subPathText = slotIdx > 2 ? tokens.slice(slotIdx).join("-") : tokens.slice(6).join("-");
    const trigraphTallyCount = subPathText.split("??-").length - 1;

    const timelineSlot = slotIdx >= 0 ? tokens[slotIdx] : null;

    const base64Idx = tokens.findIndex((t, i) => i > 0 && t === this.UNICODE_OMICRON && tokens[i + 1] === "imo");
    const base64End = base64Idx > 0 ? base64Idx : tokens.length - 1;
    const b64Tokens = [];
    const startIdx = slotIdx >= 0 ? slotIdx + 1 : 7;
    for (let i = startIdx; i < base64End; i++) {
      const t = tokens[i];
      if (t && t.length > 4 && /^[A-Za-z0-9\-_]+$/.test(t) && t !== "??") {
        b64Tokens.push(t);
      }
    }
    const base64CdrData = b64Tokens.length > 0 ? b64Tokens.join("") : null;

    const isLocalSecureContext = (addressSubnet === this.CANONICAL_ROOT);
    const isHighByteTrue = (extractedHighByte === this.BYTE_TRUE);
    const isLowByteFalse = (extractedLowByte === this.BYTE_FALSE);
    const isFExpression = (opcodeInt >= 0x00 && opcodeInt <= 0x3F);
    const isSymmetricalTapeValid = isLocalSecureContext && isHighByteTrue && isLowByteFalse && isFExpression;

    return this.cons(
      {
        valid: isSymmetricalTapeValid,
        truthTable: { extractedHighByte, extractedLowByte, isHighByteTrue, isLowByteFalse },
        evaluation: {
          opcodeInt,
          polynomialOrderDegree: trigraphTallyCount,
          hasPhaseInversion: (trigraphTallyCount > 0)
        },
        metadata: { addressSubnet, timelineSlot }
      },
      base64CdrData ? this.decodePayloadBits(base64CdrData) : null
    );
  }

  executeDeltaLawStep(currentValue) {
    const x = currentValue & 0xFFFF;
    const rotl1 = ((x << 1) | (x >> 15)) & 0xFFFF;
    const rotl3 = ((x << 3) | (x >> 13)) & 0xFFFF;
    const rotr2 = ((x >> 2) | (x << 14)) & 0xFFFF;
    return (rotl1 ^ rotl3 ^ rotr2 ^ this.CONSTANT_C) & 0xFFFF;
  }

  decodePayloadBits(b64) {
    let normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }
}
