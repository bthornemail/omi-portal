const HEADER_BYTES = 4;
const URL_SAFE_BASE64_RE = /^[A-Za-z0-9_-]+$/;

export const OMI_FILE_HEADER = Object.freeze({
  LITTLE_LEFT: 0x01,
  BIG_RIGHT: 0x02,
  POSITIVE_LTR: 0x0a,
  INVERSE_RTL: 0x0b,
  FLOAT32: 0x20,
  FLOAT64: 0x3f,
  HYPHEN: 0x2d,
  DOT: 0x2e
});

export const OMI_FILE_UPOS_PORTS = Object.freeze([
  "NOUN",
  "VERB",
  "ADJ",
  "ADV",
  "PROPN",
  "AUX",
  "ADP",
  "CCONJ",
  "NUM",
  "DET",
  "PART",
  "INTJ",
  "PRON",
  "SCONJ",
  "PUNCT",
  "SYM",
  "X"
]);

const UPOS_PORT_SET = new Set(OMI_FILE_UPOS_PORTS);

export class OmiFileSpecificationCompiler {
  constructor(sabMemoryBuffer = new ArrayBuffer(128)) {
    this.sab = sabMemoryBuffer;
    this.localView = new DataView(this.sab);
    this.UPOS_PORTS = new Set(OMI_FILE_UPOS_PORTS);
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

  compileFileStream(arrayBuffer) {
    const bytes = toUint8Array(arrayBuffer);
    if (bytes.byteLength < HEADER_BYTES + 1) throw new RangeError("OMI file stream requires a 4-byte header and printable CDR body");
    const header = parseOmiFileHeader(bytes.slice(0, HEADER_BYTES));
    const bodyText = decodeAscii(bytes.slice(HEADER_BYTES));
    const cdr = parseOmiDotNotationBody(bodyText, header);
    return this.cons(header, cdr);
  }
}

export function parseOmiFileHeader(headerLike) {
  const bytes = toUint8Array(headerLike);
  if (bytes.byteLength < HEADER_BYTES) throw new RangeError("OMI file header must contain 4 bytes");
  const chiralityByte = boundedControl(bytes[0], "chirality");
  const polarityByte = boundedControl(bytes[1], "polarity");
  const alignmentByte = boundedControl(bytes[2], "alignment");
  const delimiterByte = bytes[3];

  if (![OMI_FILE_HEADER.LITTLE_LEFT, OMI_FILE_HEADER.BIG_RIGHT].includes(chiralityByte)) {
    throw new TypeError(`Unsupported OMI chirality/BOM byte: 0x${hex(chiralityByte)}`);
  }
  if (![OMI_FILE_HEADER.POSITIVE_LTR, OMI_FILE_HEADER.INVERSE_RTL].includes(polarityByte)) {
    throw new TypeError(`Unsupported OMI polarity/BiDi byte: 0x${hex(polarityByte)}`);
  }
  if (![OMI_FILE_HEADER.FLOAT32, OMI_FILE_HEADER.FLOAT64].includes(alignmentByte)) {
    throw new TypeError(`Unsupported OMI alignment byte: 0x${hex(alignmentByte)}`);
  }
  if (delimiterByte !== OMI_FILE_HEADER.HYPHEN) {
    throw new TypeError(`Unsupported OMI delimiter bridge byte: 0x${hex(delimiterByte)}`);
  }

  return {
    v: "omi.file.car.v0",
    bytes: Array.from(bytes.slice(0, HEADER_BYTES)),
    chiralityByte,
    endian: chiralityByte === OMI_FILE_HEADER.LITTLE_LEFT ? "little" : "big",
    chirality: chiralityByte === OMI_FILE_HEADER.LITTLE_LEFT ? "left" : "right",
    polarityByte,
    polarity: polarityByte === OMI_FILE_HEADER.POSITIVE_LTR ? "positive" : "inverse",
    bidiFlow: polarityByte === OMI_FILE_HEADER.POSITIVE_LTR ? "ltr" : "rtl",
    alignmentByte,
    alignment: alignmentByte === OMI_FILE_HEADER.FLOAT32 ? "float32" : "float64",
    bytesPerElement: alignmentByte === OMI_FILE_HEADER.FLOAT32 ? 4 : 8,
    delimiterByte,
    delimiter: "-"
  };
}

export function parseOmiDotNotationBody(body, header = parseOmiFileHeader(defaultOmiFileHeader())) {
  const text = String(body || "").trim();
  const parts = text.split(".");
  if (parts.length !== 3) throw new TypeError("OMI file CDR body must have content.context.payload dot notation");
  const [content, context, payloadToken] = parts;
  if (!content.startsWith("omi-")) throw new TypeError(`OMI file content route must start with omi-: ${content}`);
  const contextPorts = context.split("-").filter(Boolean);
  if (!contextPorts.length) throw new TypeError("OMI file context port block cannot be empty");
  for (const port of contextPorts) {
    if (!UPOS_PORT_SET.has(port)) throw new TypeError(`Unsupported OMI file UPOS context port: ${port}`);
  }
  const payload = decodeOmiFilePayload(payloadToken, header);
  return {
    v: "omi.file.cdr.v0",
    raw: text,
    content,
    contentTokens: content.split("-"),
    context,
    contextPorts,
    payloadToken,
    payload,
    lambdaCube: {
      content,
      contextPorts,
      payloadKind: payload.kind
    },
    dataAttributes: {
      "data-omi": content,
      "data-omi-type": "lambda-cube-port",
      "data-omi-context-ports": contextPorts.join(" "),
      "data-omi-payload-kind": payload.kind
    }
  };
}

export function encodeOmiFile({ header = {}, content, contextPorts = [], payload } = {}) {
  const headerBytes = header instanceof Uint8Array || header instanceof ArrayBuffer
    ? toUint8Array(header)
    : defaultOmiFileHeader(header);
  const contentRoute = String(content || "");
  if (!contentRoute.startsWith("omi-")) throw new TypeError(`OMI file content route must start with omi-: ${content}`);
  const ports = contextPorts.length ? contextPorts : ["NOUN", "VERB"];
  for (const port of ports) {
    if (!UPOS_PORT_SET.has(port)) throw new TypeError(`Unsupported OMI file UPOS context port: ${port}`);
  }
  const payloadToken = typeof payload === "string" ? payload : encodePayloadBytes(payload);
  const body = `${contentRoute}.${ports.join("-")}.${payloadToken}`;
  const bodyBytes = new TextEncoder().encode(body);
  const out = new Uint8Array(HEADER_BYTES + bodyBytes.byteLength);
  out.set(headerBytes.slice(0, HEADER_BYTES), 0);
  out.set(bodyBytes, HEADER_BYTES);
  return out.buffer;
}

export function defaultOmiFileHeader({
  endian = "little",
  chirality,
  polarity = "positive",
  alignment = "float32",
  delimiter = "-"
} = {}) {
  if (delimiter !== "-") throw new TypeError("OMI file v0 supports only hyphen delimiter bridge");
  return new Uint8Array([
    endian === "big" || chirality === "right" ? OMI_FILE_HEADER.BIG_RIGHT : OMI_FILE_HEADER.LITTLE_LEFT,
    polarity === "inverse" || polarity === "rtl" ? OMI_FILE_HEADER.INVERSE_RTL : OMI_FILE_HEADER.POSITIVE_LTR,
    alignment === "float64" ? OMI_FILE_HEADER.FLOAT64 : OMI_FILE_HEADER.FLOAT32,
    OMI_FILE_HEADER.HYPHEN
  ]);
}

export function decodeOmiFilePayload(payloadToken, header = parseOmiFileHeader(defaultOmiFileHeader())) {
  const token = String(payloadToken || "");
  if (!token) throw new TypeError("OMI file payload cannot be empty");
  const encoded = URL_SAFE_BASE64_RE.test(token);
  const bytes = encoded ? decodeBase64UrlBytes(token) : new TextEncoder().encode(token);
  const bytesPerElement = header.bytesPerElement || 4;
  if (encoded && bytes.byteLength && bytes.byteLength % bytesPerElement === 0) {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const vector = header.alignment === "float64" ? new Float64Array(buffer) : new Float32Array(buffer);
    return {
      kind: header.alignment,
      bytes,
      vector,
      values: Array.from(vector)
    };
  }
  return {
    kind: "utf8-clamped",
    bytes,
    vector: new Uint8ClampedArray(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)),
    text: new TextDecoder().decode(bytes)
  };
}

function boundedControl(value, label) {
  if (value < 0x00 || value > 0x3f) throw new RangeError(`OMI file ${label} byte exceeds 0x3f: 0x${hex(value)}`);
  return value;
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer || value instanceof SharedArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  throw new TypeError("Expected ArrayBuffer, SharedArrayBuffer, or typed array");
}

function decodeAscii(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function encodePayloadBytes(value) {
  if (value instanceof Float32Array || value instanceof Float64Array || value instanceof Uint8Array || value instanceof Uint8ClampedArray) {
    return encodeBase64Url(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  }
  if (Array.isArray(value)) return encodeBase64Url(new Uint8Array(new Float32Array(value).buffer));
  return encodeBase64Url(new TextEncoder().encode(String(value ?? "")));
}

function decodeBase64UrlBytes(value) {
  let normalized = String(value).replaceAll("-", "+").replaceAll("_", "/");
  while (normalized.length % 4) normalized += "=";
  const binary = decodeBase64Binary(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBase64Url(bytes) {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64url");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function decodeBase64Binary(value) {
  if (typeof atob === "function") return atob(value);
  if (typeof Buffer !== "undefined") return Buffer.from(value, "base64").toString("binary");
  throw new TypeError("No Base64 decoder is available in this runtime");
}

function hex(value) {
  return Number(value).toString(16).padStart(2, "0");
}
