export const OMI_BIDI_CODES = Object.freeze({
  LRE: 0x202a,
  RLE: 0x202b,
  PDF: 0x202c,
  LRO: 0x202d,
  RLO: 0x202e
});

export const OMI_BIDI_PROFILE = Object.freeze({
  POSITIVE: "LRE-LRO",
  NEGATIVE: "RLE-RLO"
});

const DEFAULT_HISTORY_BYTES = 5040 * 8;

import { createPolytopeBuffer, registerTick, tickFactorials, OmiPolytopeFactorialBuffer, storeTickValue } from "../runtime/polytope-sab.js";
import { OmiBareMetalBootCompiler } from "../runtime/boot-compiler.js";

const BOOT_ADDR_RE = /^omi-ffff-127-0-0-1-0x7[cC]00-0x7[fF]00|^omi-ffff-127-0-0-1-0x7[fF]01-0x[aA][aA]55/;

export class OmiBiDiCM6CoreEngine {
  constructor(sharedBuffer, { polytopeBuffer, bootCompiler } = {}) {
    this.sab = sharedBuffer || new SharedArrayBuffer(DEFAULT_HISTORY_BYTES);
    this.view = new DataView(this.sab);
    this.f32View = new Float32Array(this.sab);
    this.BUFFER_LENGTH_BYTES = this.sab.byteLength;
    this.MASTER_TICK_REG_OFFSET = 0;
    this.polytopeClock = polytopeBuffer || createPolytopeBuffer({ shared: true });
    this.polytopeFactorial = new OmiPolytopeFactorialBuffer(this.polytopeClock.buffer);
    this.bootCompiler = bootCompiler || new OmiBareMetalBootCompiler(this.sab);
  }

  cons(carHeader, cdrPayload) {
    return Object.freeze({ car: carHeader, cdr: cdrPayload });
  }

  car(cell) {
    return cell.car;
  }

  cdr(cell) {
    return cell.cdr;
  }

  getUnaryCardinality(uint64Value) {
    let count = 0n;
    let temp = BigInt(uint64Value);
    while (temp > 0n) {
      count += temp & 1n;
      temp >>= 1n;
    }
    return Number(count);
  }

  processBiDiTransaction(rawTextChunk, cursorOffset = 0) {
    if (!rawTextChunk || !rawTextChunk.includes("omi-")) return null;

    const cleanToken = String(rawTextChunk).replace(/[;,"'[\]{}]/g, "");
    const controls = extractBiDiControls(cleanToken);
    if (!controls.chirality || !controls.polarity) return null;

    const isLittleEndian = controls.polarity === OMI_BIDI_CODES.LRO;
    const profileString = controls.chirality === OMI_BIDI_CODES.LRE
      ? OMI_BIDI_PROFILE.POSITIVE
      : OMI_BIDI_PROFILE.NEGATIVE;
    const currentTick = this.view.getBigUint64(this.MASTER_TICK_REG_OFFSET, true);
    const moduloTickSlot = Number(currentTick % 5040n);
    const byteIndexOffset = (moduloTickSlot > 0 ? moduloTickSlot : 1) * 8;
    const safeByteIndex = byteIndexOffset + 8 <= this.BUFFER_LENGTH_BYTES ? byteIndexOffset : 8;
    const bitstreamWord = this.view.getBigUint64(safeByteIndex, isLittleEndian);
    const mixedRadixWeight = this.getUnaryCardinality(bitstreamWord) || 1;
    const coefficients = this.decodeBase64Bits(lastPayloadToken(cleanToken));
    const scalar = evaluatePolynomial(coefficients, 2.5);
    const signedScalar = controls.chirality === OMI_BIDI_CODES.RLE ? scalar * -1.5 : scalar;

    const strippedToken = cleanToken.replace(/[\u202a-\u202e]/g, "").replace(/--+/g, "-");

    return this.cons(
      {
        textToken: cleanToken,
        profile: profileString,
        isLittleEndian,
        chiralityCode: controls.chirality,
        polarityCode: controls.polarity
      },
      {
        extrusionDepth: signedScalar * mixedRadixWeight,
        cursorOffset,
        polytope: tickFactorials(currentTick > 0n ? Number(currentTick) : 0),
        boot: BOOT_ADDR_RE.test(strippedToken) ? this.bootCompiler.parseBootAddress(strippedToken) : null,
        temporalSlot: storeTickValue(this.polytopeClock, moduloTickSlot, signedScalar * mixedRadixWeight)
      }
    );
  }

  decodeBase64Bits(b64) {
    const value = String(b64 || "");
    if (!value) return new Float32Array([0, 0, 0, 0]);
    let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = decodeBase64Binary(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.byteLength % 4 !== 0) return new Float32Array([0, 0, 0, 0]);
    return new Float32Array(bytes.buffer);
  }

  advanceClockTimeline() {
    let currentTick = this.view.getBigUint64(this.MASTER_TICK_REG_OFFSET, true);
    currentTick++;
    this.view.setBigUint64(this.MASTER_TICK_REG_OFFSET, currentTick, true);

    const moduloTickInt = Number(currentTick % 5040n);
    if (currentTick > 0n && currentTick % 5040n === 0n) {
      this.view.setBigUint64(this.MASTER_TICK_REG_OFFSET, 0n, true);
      for (let i = 8; i < this.BUFFER_LENGTH_BYTES; i++) this.view.setUint8(i, 0);
    }

    registerTick(this.polytopeClock, moduloTickInt);
    this.polytopeFactorial.evaluateGCLifecycle(moduloTickInt);

    return moduloTickInt;
  }
}

export function compileOmiBiDiExtension(sharedMemoryBuffer, { ViewPlugin, targetId = "omi-node-active-bidi-mesh", onEvaluation } = {}) {
  if (!ViewPlugin?.fromClass) {
    throw new TypeError("compileOmiBiDiExtension requires CodeMirror's ViewPlugin in options");
  }
  const engineCore = new OmiBiDiCM6CoreEngine(sharedMemoryBuffer);

  return [
    ViewPlugin.fromClass(class {
      update(update) {
        if (!update.docChanged) return;

        update.changes.iterChanges((_fromA, _toA, fromB, toB) => {
          const lineTransactionText = update.state.doc.sliceString(fromB, toB).trim();
          if (!lineTransactionText.includes("omi-")) return;

          const evaluationCell = engineCore.processBiDiTransaction(lineTransactionText, fromB);
          if (!evaluationCell) return;

          const header = engineCore.car(evaluationCell);
          const payload = engineCore.cdr(evaluationCell);
          const canvasNode = globalThis.document?.getElementById(targetId);
          if (canvasNode) {
            canvasNode.setAttribute("data-bidi-flow", header.profile);
            canvasNode.style.transform = `translateZ(${payload.extrusionDepth}px) rotateY(${header.isLittleEndian ? 15 : -15}deg)`;
          }
          const tick = engineCore.advanceClockTimeline();
          if (typeof onEvaluation === "function") {
            onEvaluation({ header, payload, cell: evaluationCell, engine: engineCore, tick });
          }
        });
      }
    })
  ];
}

function extractBiDiControls(value) {
  const codes = Array.from(String(value), (char) => char.charCodeAt(0));
  const chirality = codes.find((code) => code === OMI_BIDI_CODES.LRE || code === OMI_BIDI_CODES.RLE);
  const polarity = codes.find((code) => code === OMI_BIDI_CODES.LRO || code === OMI_BIDI_CODES.RLO);
  return { chirality, polarity };
}

function lastPayloadToken(value) {
  return String(value).replace(/\u202c/g, "").split("-").at(-1) || "";
}

function evaluatePolynomial(coefficients, x) {
  const c = coefficients?.length >= 4 ? coefficients : new Float32Array([0, 0, 0, 0]);
  return ((c[0] * x + c[1]) * x + c[2]) * x + c[3];
}

function decodeBase64Binary(value) {
  if (typeof atob === "function") return atob(value);
  if (typeof Buffer !== "undefined") return Buffer.from(value, "base64").toString("binary");
  throw new TypeError("No Base64 decoder is available in this runtime");
}
