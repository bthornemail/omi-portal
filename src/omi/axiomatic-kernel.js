import { parsePrologFacts } from "../wordnet/prolog-broker.js";

export class OmiAxiomaticKernel {
  constructor() {
    this.rulesRegistry = new Map();
    this.factsRegistry = new Map();
    this.segmentMasks = [
      0xFFFF0000000000000000000000000000n,
      0x0000FFFF000000000000000000000000n,
      0x00000000FFFF00000000000000000000n,
      0x000000000000FFFF0000000000000000n,
      0x0000000000000000FFFF000000000000n,
      0x00000000000000000000FFFF00000000n,
      0x000000000000000000000000FFFF0000n,
      0x0000000000000000000000000000FFFFn
    ];
    this.posHexMap = {
      0x0001: "NOUN", 0x0002: "VERB", 0x0003: "ADJ", 0x0004: "PRON",
      0x0005: "PROPN", 0x0006: "ADV", 0x0007: "ADP", 0x0008: "CCONJ",
      0x0009: "NUM", 0x000a: "DET", 0x000b: "PART", 0x000c: "SCONJ",
      0x000d: "INTJ", 0x000e: "PUNCT", 0x000f: "SYM", 0x0010: "X",
      0x0017: "AUX"
    };
    this.mandatoryInversion = 0x5A3C;
    this.mandatoryNilTerminator = 0x0001;
    this.canStrideValues = new Set([0x0078, 0x02D0, 0x13B0]);
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell ? cell.car : null; }
  cdr(cell) { return cell ? cell.cdr : null; }

  async loadOmiFile(filePath, registryTarget) {
    const { readFile } = await import("node:fs/promises");
    const rawContent = await readFile(filePath, "utf8");
    const lines = rawContent.split("\n");

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue;

      const parts = line.split(/\s+/);
      if (parts.length < 3) continue;

      const omiAddress = parts[0];
      const keyword = parts[1];
      const assignment = parts.slice(2).join(" ");

      if (omiAddress.startsWith("omi-") && /\/\d+(?:\/[^\s]+)?$/.test(omiAddress)) {
        registryTarget.set(omiAddress, { keyword, assignment });
      }
    }
  }

  async loadPrologFile(filePath) {
    const { readFile } = await import("node:fs/promises");
    const rawContent = await readFile(filePath, "utf8");
    const facts = parsePrologFacts(rawContent);
    for (const fact of facts) {
      const key = `${fact.name}(${fact.args.join(",")})`;
      this.factsRegistry.set(key, {
        keyword: "FACT",
        assignment: `prolog-${fact.name}`,
        args: fact.args,
        source: "prolog"
      });
    }
    return facts;
  }

  async loadAxiomaticFile(filePath, registryTarget) {
    if (filePath.endsWith(".pl") || filePath.endsWith(".prolog")) {
      return this.loadPrologFile(filePath);
    }
    return this.loadOmiFile(filePath, registryTarget);
  }

  tokenToSegments(omiString) {
    if (!omiString || !omiString.startsWith("omi-")) return null;
    const withoutPrefix = omiString.startsWith("omi-") ? omiString.slice(4) : omiString;
    const addressBody = withoutPrefix.split("/")[0];
    const segments = addressBody.split("-");
    if (segments.length !== 8) return null;
    return segments.map(s => parseInt(s, 16));
  }

  tokenToBigInt(omiString) {
    const parts = omiString.split("/");
    const addressBody = parts[0];
    if (!addressBody.startsWith("omi-")) return null;
    const hex = addressBody.slice(4).replaceAll("-", "");
    if (hex.length !== 32) return null;
    return BigInt(`0x${hex}`);
  }

  resolveFactForToken(omiString) {
    const segments = this.tokenToSegments(omiString);
    if (!segments) return this.cons({ valid: false, error: "Malformed token" }, null);

    const posValue = segments[3];
    const strideValue = segments[4];
    const slotValue = segments[5];
    const layerValue = segments[6];

    const posTag = this.posHexMap[posValue] || null;

    const resolved = {
      chiralPhase: segments[0] === 0xFFFF ? "left" : segments[0] === 0x039F ? "right" : "unknown",
      busId: segments[1],
      inversionGate: segments[2] === this.mandatoryInversion,
      posHex: posValue,
      posTag,
      stride: strideValue,
      slot: slotValue,
      factorialLayer: layerValue,
      nilTerminator: segments[7] === this.mandatoryNilTerminator,
      segmentValues: segments
    };
    return this.cons(resolved, segments);
  }

  verifyPacketCompliance(liveToken) {
    if (!liveToken || !liveToken.startsWith("omi-")) return false;

    const parts = liveToken.split("/");
    const addressBody = parts[0];
    const segments = addressBody.slice(4).split("-");
    if (segments.length !== 8) return false;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!/^[0-9a-f]{4}$/i.test(seg)) return false;
    }

    const numeric = segments.map(s => parseInt(s, 16));

    if (numeric[2] !== 0x0000 && numeric[2] !== this.mandatoryInversion) return false;
    if (numeric[5] > 0x0036) return false;
    if (numeric[6] > 0x0007) return false;
    if (numeric[7] > 0x0001) return false;

    if (numeric[4] !== 0x0000 && !this.canStrideValues.has(numeric[4])) return false;

    const inversionHex = segments[2];
    if (inversionHex === "5a3c") {
      const canonicalKey = "omi-0000-0000-5a3c-0000-0000-0000-0000-0000/48";
      const rule = this.rulesRegistry.get(canonicalKey);
      if (!rule || rule.assignment !== "central-inversion-mirror") {
        return false;
      }
    }

    return true;
  }

  decodeRadixSuffix(omiTokenString) {
    if (!this.verifyPacketCompliance(omiTokenString)) {
      return this.cons({ valid: false, error: "Base Address Failed Compliance" }, null);
    }

    const pieces = omiTokenString.split("/");
    if (pieces.length < 3) {
      return this.cons({ valid: false, error: "Missing Radix Suffix" }, null);
    }
    if (pieces.length > 3) {
      return this.cons({ valid: false, error: "Malformed Base64URL Payload" }, null);
    }

    const tailPayloadBlock = pieces[2] || "";
    const delimiter = tailPayloadBlock.charAt(0);
    let profile = null;

    if (delimiter === "\u03bf") {
      profile = "CHIRON_STREAM_OPENER";
    } else if (delimiter === "\u039f") {
      profile = "CARDINAL_RECORD_TERMINATOR";
    } else {
      return this.cons({ valid: false, error: "Missing Omicron Radix Delimiter" }, null);
    }

    const cleanBase64Payload = tailPayloadBlock.slice(1);
    if (!cleanBase64Payload || /[+/]/.test(cleanBase64Payload) || !/^[A-Za-z0-9_-]+$/.test(cleanBase64Payload)) {
      return this.cons({ valid: false, error: "Malformed Base64URL Payload" }, null);
    }

    return this.cons(
      {
        valid: true,
        token: omiTokenString,
        profile,
        delimiter,
        cleanBase64Payload,
        isUrlSafeCompliant: true
      },
      pieces
    );
  }

  queryRulesBySegment(segmentIndex, value) {
    const results = [];
    const hex = value.toString(16).padStart(4, "0");
    const partial = `-${hex}-`;

    for (const [key, rule] of this.rulesRegistry) {
      const segments = key.slice(4).split("/")[0].split("-");
      if (segments.length === 8 && segments[segmentIndex] === hex) {
        results.push({ address: key, ...rule });
      }
    }
    return results;
  }

  queryFactsBySegment(segmentIndex, value) {
    const results = [];
    const hex = value.toString(16).padStart(4, "0");

    for (const [key, fact] of this.factsRegistry) {
      if (fact.source === "prolog") continue;
      const segments = key.slice(4).split("/")[0].split("-");
      if (segments.length === 8 && segments[segmentIndex] === hex) {
        results.push({ address: key, ...fact });
      }
    }
    return results;
  }

  checkExact(tokenAddress, canonicalKey) {
    const tokenNormalized = tokenAddress.split("/")[0].replaceAll(/^0+/g, "0");
    const canonicalNormalized = canonicalKey.split("/")[0].replaceAll(/^0+/g, "0");
    return tokenNormalized === canonicalNormalized;
  }

  matchMask(omiToken, ruleAddress) {
    const tokenBig = this.tokenToBigInt(omiToken);
    const ruleBig = this.tokenToBigInt(ruleAddress);
    if (tokenBig === null || ruleBig === null) return false;

    const ruleParts = ruleAddress.slice(4).split("/")[0].split("-");
    const tokenParts = omiToken.slice(4).split("/")[0].split("-");
    if (ruleParts.length !== 8 || tokenParts.length !== 8) return false;

    for (let i = 0; i < 8; i++) {
      if (ruleParts[i] !== "0000" && ruleParts[i] !== tokenParts[i]) return false;
    }
    return true;
  }
}
