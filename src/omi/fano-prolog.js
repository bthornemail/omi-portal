import { PROLOG_WORDNET_OPERATORS } from "../wordnet/prolog-broker.js";

const OPERATOR_SET = new Set(PROLOG_WORDNET_OPERATORS);
const URL_SAFE_BASE64_RE = /^[A-Za-z0-9_-]+$/;

export const OMI_SEMANTIC_SERVICE_BUSES = Object.freeze({
  "::1": "loopback-ipc",
  "::2": "lisp-signaler",
  "::3": "prolog-wordnet-broker",
  "::4": "coturn-turn-synset-proxy",
  "::5": "hnsw-memory-indexer",
  "::6": "cm6-transaction-bridge",
  "::7": "fano-clock-guard",
  "::8": "master-canvas-surface"
});

export const OMI_ROUTING_ROOTS = Object.freeze({
  content: "::1..::8",
  context: "::ffff:127.0.0.1",
  remoteCodepoint: "::/128"
});

export function parseOmiFanoPrologToken(input) {
  const raw = String(input || "").trim();
  const tokens = raw.split("-");
  if (tokens.length < 9 || tokens[0] !== "omi" || tokens[1] !== "fano") {
    throw new TypeError(`Invalid OMI Fano Prolog token: ${input}`);
  }

  const fanoPoint = parseFanoPoint(tokens[2]);
  const transport = parseTransport(tokens[3]);
  const operator = parseOperator(tokens[4]);
  const sourceId = parseSynsetId(tokens[5], "source");
  const targetId = parseSynsetId(tokens[6], "target");
  const slotIndex = tokens.findIndex((token, index) => index > 6 && /^slot\d+$/.test(token));
  if (slotIndex < 0 || slotIndex !== tokens.length - 2) throw new TypeError(`Invalid OMI Fano slot/payload frame: ${input}`);
  const featureTokens = tokens.slice(7, slotIndex);
  if (!featureTokens.length) throw new TypeError(`Missing OMI Fano feature mask: ${input}`);
  const slot = Number(tokens[slotIndex].slice(4));
  if (!Number.isInteger(slot) || slot < 0 || slot > 5040) throw new RangeError(`OMI Fano slot out of range: ${tokens[slotIndex]}`);
  const payload = parsePayload(tokens.at(-1));

  return {
    raw,
    token: formatOmiFanoPrologToken({ fanoPoint, transport, operator, sourceId, targetId, featureTokens, slot, payload }),
    fanoPoint,
    pointIndex: Number(fanoPoint.slice(1)),
    transport,
    operator,
    sourceId,
    sourceCategory: Number(sourceId[0]),
    sourceOffset: Number(sourceId.slice(1)),
    targetId,
    targetCategory: Number(targetId[0]),
    targetOffset: Number(targetId.slice(1)),
    featureTokens,
    featureMask: featureTokens.join("-"),
    slot,
    payload
  };
}

export function formatOmiFanoPrologToken(parts = {}) {
  const fanoPoint = parseFanoPoint(parts.fanoPoint || parts.point || "p1");
  const transport = parseTransport(parts.transport || "local");
  const operator = parseOperator(parts.operator || "hyp");
  const sourceId = parseSynsetId(parts.sourceId, "source");
  const targetId = parseSynsetId(parts.targetId, "target");
  const featureTokens = Array.isArray(parts.featureTokens)
    ? parts.featureTokens
    : String(parts.featureMask || "Mood_Ind-Tense_Pres").split("-").filter(Boolean);
  if (!featureTokens.length) throw new TypeError("Missing OMI Fano feature mask");
  const slot = Number(parts.slot ?? 720);
  if (!Number.isInteger(slot) || slot < 0 || slot > 5040) throw new RangeError(`OMI Fano slot out of range: ${parts.slot}`);
  const payload = parsePayload(parts.payload || "AAAAAAAAAAAAAAAAAAAAAA");
  return ["omi", "fano", fanoPoint, transport, operator, sourceId, targetId, ...featureTokens, `slot${slot}`, payload].join("-");
}

export function serializePrologWordNetPacket(tokenOrParts) {
  const parsed = typeof tokenOrParts === "string" ? parseOmiFanoPrologToken(tokenOrParts) : parseOmiFanoPrologToken(formatOmiFanoPrologToken(tokenOrParts));
  const coefficients = decodeBase64Float32(parsed.payload);
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setUint8(0, parsed.pointIndex);
  view.setUint8(1, parsed.sourceCategory);
  view.setUint32(2, parsed.sourceOffset, true);
  view.setFloat32(6, coefficients[0] || 0, true);
  view.setFloat32(10, coefficients[1] || 0, true);
  view.setUint16(14, parsed.slot, true);
  return buffer;
}

export function makeOmiSynsetRoutingFrame(tokenOrParts, { upos = "X", universalFeatures = [] } = {}) {
  const token = typeof tokenOrParts === "string" ? tokenOrParts : formatOmiFanoPrologToken(tokenOrParts);
  const parsed = parseOmiFanoPrologToken(token);
  const featureList = universalFeatures.length ? universalFeatures : parsed.featureTokens;
  return {
    v: "omi.synset.routing-frame.v0",
    token: parsed.token,
    serviceBus: "::3",
    serviceName: OMI_SEMANTIC_SERVICE_BUSES["::3"],
    transportBus: parsed.transport === "turn" ? "::4" : "::1",
    transportName: parsed.transport === "turn" ? OMI_SEMANTIC_SERVICE_BUSES["::4"] : OMI_SEMANTIC_SERVICE_BUSES["::1"],
    roots: OMI_ROUTING_ROOTS,
    upos,
    universalFeatures: featureList,
    operator: parsed.operator,
    sourceId: parsed.sourceId,
    targetId: parsed.targetId,
    dataAttributes: {
      "data-omi": parsed.token,
      "data-omi-service-bus": "3",
      "data-omi-service": "prolog-wndb",
      "data-omi-transport-bus": parsed.transport === "turn" ? "4" : "1",
      "data-omi-transport": parsed.transport,
      "data-omi-context-root": OMI_ROUTING_ROOTS.context,
      "data-omi-remote-root": OMI_ROUTING_ROOTS.remoteCodepoint,
      "data-upos": upos,
      "data-ufeatures": featureList.join(" ")
    }
  };
}

export function decodeBase64Float32(payload) {
  let normalized = parsePayload(payload).replaceAll("-", "+").replaceAll("_", "/");
  while (normalized.length % 4) normalized += "=";
  const binary = decodeBase64Binary(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (bytes.byteLength % 4 !== 0) throw new TypeError("OMI Fano payload does not decode to Float32-aligned bytes");
  return new Float32Array(bytes.buffer);
}

function parseFanoPoint(value) {
  const point = String(value || "").toLowerCase();
  if (!/^p[1-7]$/.test(point)) throw new RangeError(`Invalid OMI Fano point: ${value}`);
  return point;
}

function parseTransport(value) {
  const transport = String(value || "").toLowerCase();
  if (!["local", "turn"].includes(transport)) throw new TypeError(`Invalid OMI Fano transport: ${value}`);
  return transport;
}

function parseOperator(value) {
  const operator = String(value || "").toLowerCase();
  if (!OPERATOR_SET.has(operator) || ["s", "g", "sk", "syntax"].includes(operator)) {
    throw new TypeError(`Invalid OMI Fano WordNet operator: ${value}`);
  }
  return operator;
}

function parseSynsetId(value, label) {
  const id = String(value || "");
  if (!/^[1-4]\d{8}$/.test(id)) throw new TypeError(`Invalid OMI Fano ${label} synset id: ${value}`);
  return id;
}

function parsePayload(value) {
  const payload = String(value || "");
  if (!payload || !URL_SAFE_BASE64_RE.test(payload)) throw new TypeError(`Invalid OMI Fano payload: ${value}`);
  return payload;
}

function decodeBase64Binary(value) {
  if (typeof atob === "function") return atob(value);
  if (typeof Buffer !== "undefined") return Buffer.from(value, "base64").toString("binary");
  throw new TypeError("No Base64 decoder is available in this runtime");
}

export function routeToDistributedBus(parsedToken) {
  const transport = parsedToken.transport || "local";
  if (transport === "turn") return "::4";
  if (parsedToken.sourceCategory === 5) return "::5";
  return "::1";
}
