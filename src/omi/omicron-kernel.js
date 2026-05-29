export class OmiOmicronCIDRKernel {
  constructor(sharedArrayBuffer) {
    if (!sharedArrayBuffer || sharedArrayBuffer.byteLength < 40320) {
      throw new Error("[Omi Kernel] SharedArrayBuffer must be at least 40320 bytes.");
    }
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);

    this.OP_CARDINAL = "\u039f";
    this.OP_CHIRAL = "\u03bf";

    this.OMI_REGISTER_WIDTH = 8;
    this.OMI_BITS_PER_SEGMENT = 16;
    this.OMI_TOTAL_BITS = 128;

    this.CANONICAL_EXPANDED = ["ffff", "127", "0", "0", "0", "0", "0", "0"];
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  normalizeMnemonicString(inputString) {
    if (!inputString) return "";
    let normalized = inputString.trim();
    if (normalized.startsWith("omi-")) {
      normalized = this.OP_CHIRAL + normalized.substring(4);
    } else if (normalized.startsWith("OMI-")) {
      normalized = this.OP_CARDINAL + normalized.substring(4);
    }
    if (normalized.endsWith("-imo")) {
      normalized = normalized.substring(0, normalized.length - 4);
    } else if (normalized.endsWith("-IMO")) {
      normalized = normalized.substring(0, normalized.length - 4);
    }
    return normalized;
  }

  expandZeroCompression(addressBody, width) {
    if (width == null) width = this.OMI_REGISTER_WIDTH;
    if (!addressBody.includes("--")) {
      return addressBody.split("-").filter(Boolean);
    }
    const segments = addressBody.split("--");
    const leftRaw = segments[0] || "";
    const rightRaw = segments[1] || "";
    const left = leftRaw.split("-").filter(Boolean);
    const right = rightRaw.split("-").filter(Boolean);
    const zeroCount = width - left.length - right.length;
    if (zeroCount < 0) {
      throw new Error("[Omi Kernel] Critical Error: Too many OMI-CIDR segments encountered.");
    }
    return [...left, ...new Array(zeroCount).fill("0"), ...right];
  }

  prefixSegments(prefixLength) {
    const pLength = Number(prefixLength);
    if (!Number.isInteger(pLength) || pLength < 0 || pLength > this.OMI_TOTAL_BITS) {
      throw new Error("[Omi Kernel] CIDR prefix width boundary must be an integer 0..128");
    }
    return {
      fullSegments: Math.floor(pLength / this.OMI_BITS_PER_SEGMENT),
      partialBits: pLength % this.OMI_BITS_PER_SEGMENT
    };
  }

  parseOmiCidr(inputAddressTokenString) {
    if (!inputAddressTokenString) return this.cons({ valid: false, error: "Empty Token" }, null);

    let operatorType = null;
    if (inputAddressTokenString.startsWith(this.OP_CARDINAL)) {
      operatorType = "CARDINAL";
    } else if (inputAddressTokenString.startsWith(this.OP_CHIRAL)) {
      operatorType = "CHIRAL";
    } else if (inputAddressTokenString.endsWith(this.OP_CARDINAL)) {
      operatorType = "CARDINAL_SUFFIX";
    } else if (inputAddressTokenString.endsWith(this.OP_CHIRAL)) {
      operatorType = "CHIRAL_SUFFIX";
    }

    if (!operatorType) {
      return this.cons({ valid: false, error: "Missing Invariant Omicron Operator" }, null);
    }

    const cleanedBody = inputAddressTokenString
      .replace(/^Ο/, "").replace(/^ο/, "")
      .replace(/Ο$/, "").replace(/ο$/, "");

    const urlSegments = cleanedBody.split("/");
    const mainAddressCore = urlSegments[0] || "";
    const cidrRaw = urlSegments[1] || "";

    const trailingSubTokens = mainAddressCore.split("-");
    const timelineSlotToken = trailingSubTokens.find((t) => t.startsWith("slot"));
    const base64DataPayload = trailingSubTokens[trailingSubTokens.length - 1];

    let parsedCidr;
    try {
      parsedCidr = this._parseCidrAddress(mainAddressCore);
    } catch (e) {
      return this.cons({ valid: false, error: e.message }, null);
    }
    const expandedRegisterSlices = parsedCidr.segments;

    const cidrBitwidth = cidrRaw ? parseInt(cidrRaw, 10) : null;
    let prefixData = null;
    if (cidrBitwidth !== null) {
      try {
        prefixData = this.prefixSegments(cidrBitwidth);
      } catch (e) {
        return this.cons({ valid: false, error: e.message }, null);
      }
    }

    return this.cons(
      {
        valid: (expandedRegisterSlices.length === this.OMI_REGISTER_WIDTH),
        operatorType,
        cidrBitwidth,
        prefixData,
        expandedRegisterSlices,
        timelineSlotToken,
        truthTable: { operatorWholeCodePoint: 0x039F, activeTruthGate: 0x03, boundaryConstraintField: 0x009F }
      },
      (base64DataPayload && base64DataPayload.length > 10) ? this.decodePayloadBits(base64DataPayload) : null
    );
  }

  evaluateOmicronTape(rawInputString) {
    const targetString = this.normalizeMnemonicString(rawInputString);
    if (!targetString) return this.cons({ valid: false, error: "Empty Token Stream" }, null);

    const opChar = targetString.charAt(0);
    let operator;
    let codepoint;
    if (opChar === this.OP_CHIRAL) {
      operator = "CHIRAL_CBOS";
      codepoint = "U+03BF";
    } else if (opChar === this.OP_CARDINAL) {
      operator = "CARDINAL_CBOS";
      codepoint = "U+039F";
    } else {
      return this.cons({ valid: false, error: "Missing Canonical Code-Point Operator" }, null);
    }

    const body = targetString.slice(1);

    const opcodeRegex = /(?:^|-)0x([0-9a-fA-F]+)/;
    const opcodeMatch = body.match(opcodeRegex);
    if (!opcodeMatch) return this.cons({ valid: false, error: "Missing opcode" }, null);

    const opcode = parseInt(opcodeMatch[1], 16);
    const rawAddress = body.slice(0, opcodeMatch.index);
    const cidrInfo = this._parseCidrAddress(rawAddress);

    const afterAddress = body.slice(opcodeMatch.index + opcodeMatch[0].length);
    const maskMatch = afterAddress.match(/^-mask(\d+)/);
    const maskOrder = maskMatch ? parseInt(maskMatch[1], 10) : 0;

    const afterMask = afterAddress.slice(maskMatch ? maskMatch[0].length : 0);
    const slotMatch = afterMask.match(/^-slot(\d+)/);
    const slot = slotMatch ? parseInt(slotMatch[1], 10) : null;

    const payload = afterMask.slice(slotMatch ? slotMatch[0].length : 0).replace(/^-/, "") || null;

    const isLocalSecureContext =
      cidrInfo.segments.length === this.CANONICAL_EXPANDED.length &&
      cidrInfo.segments.every((s, i) => {
        const c = this.CANONICAL_EXPANDED[i];
        return s === c || (parseInt(s, 16) === parseInt(c, 16));
      });

    const valid = isLocalSecureContext && !isNaN(opcode) && (opcode <= 0x3F) && (maskOrder <= 3);

    return this.cons(
      {
        valid,
        operator,
        codepoint,
        algebraic: { polynomialOrderDegree: maskOrder, isPhaseInverted: maskOrder > 0 },
        metadata: { opcode, cidr: cidrInfo.cidr, slot }
      },
      (valid && payload) ? this.decodePayloadBits(payload) : null
    );
  }

  validateBootMemoryAddress(addressHexStr) {
    const addressInt = parseInt(addressHexStr, 16);
    if (isNaN(addressInt)) return "INVALID_ADDRESS";
    if (addressInt >= 0x7C00 && addressInt <= 0x7F00) return "BOOT_SECTOR_LOOKUP_TABLE";
    if (addressInt >= 0x7F01 && addressInt <= 0xAA55) return "EXTENDED_EXECUTION_SURFACE";
    return "OUT_OF_BOUNDS_VOLATILE_SPACE";
  }

  executeDeltaLawStep(currentValue) {
    const x = currentValue & 0xFFFF;
    const rotl1 = ((x << 1) | (x >> 15)) & 0xFFFF;
    const rotl3 = ((x << 3) | (x >> 13)) & 0xFFFF;
    const rotr2 = ((x >> 2) | (x << 14)) & 0xFFFF;
    return (rotl1 ^ rotl3 ^ rotr2 ^ 0x5A3C) & 0xFFFF;
  }

  decodePayloadBits(b64) {
    let normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  _parseCidrAddress(raw) {
    const [fullAddr, prefixStr] = raw.split("/");
    const prefixLen = prefixStr ? parseInt(prefixStr, 10) : null;

    if (fullAddr.includes("--")) {
      const segments = this.expandZeroCompression(fullAddr, this.OMI_REGISTER_WIDTH);
      return { cidr: `${segments.join("-")}/${prefixLen}`, segments, prefixLen };
    }

    const segments = fullAddr.split("-").filter(Boolean);
    if (segments.length < this.OMI_REGISTER_WIDTH) {
      const padded = [...segments, ...Array(this.OMI_REGISTER_WIDTH - segments.length).fill("0")];
      const cidr = prefixLen != null ? `${padded.join("-")}/${prefixLen}` : padded.join("-");
      return { cidr, segments: padded, prefixLen };
    }

    const cidr = prefixLen != null ? `${segments.join("-")}/${prefixLen}` : segments.join("-");
    return { cidr, segments, prefixLen };
  }
}

export class OmiOmicronKernel extends OmiOmicronCIDRKernel {
  constructor(sharedArrayBuffer) {
    super(sharedArrayBuffer);
  }
}
