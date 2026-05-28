import { fnv1a32 } from "../addressing/cidr.js";
import { CHANNEL_META, normalizePosTag, POS_INDEX } from "../pos-tags.js";

export const DEFAULT_OMI_FS = "8";
export const DEFAULT_OMI_GS = "ffff-127-0-0-1";
export const DEPRECATED_OMI_GS_SHORTHAND = "127-0-0-1";

const URL_SAFE_BASE64_RE = /^[A-Za-z0-9_-]+$/;
const HEX_RE = /^0x[0-9a-f]{2}$/;

const UPOS_PORT_SCHEMA = Object.freeze({
  FS: Object.freeze(["NOUN", "PROPN", "VERB", "ADJ"]),
  GS: Object.freeze(["ADP", "AUX", "CCONJ", "NUM", "DET", "PART"]),
  RS: Object.freeze(["ADV", "INTJ", "PRON", "SCONJ"]),
  US: Object.freeze(["PUNCT", "SYM", "X"])
});

export const UPOS_TO_OMI_PORT_CHANNEL = Object.freeze(
  Object.fromEntries(Object.entries(UPOS_PORT_SCHEMA).flatMap(([channel, tags]) => tags.map((tag) => [tag, channel])))
);

function hexByte(value) {
  return `0x${Number(value).toString(16).padStart(2, "0")}`;
}

function parseHexByte(input, max, label) {
  const hex = String(input || "").toLowerCase();
  if (!HEX_RE.test(hex)) throw new TypeError(`Invalid OMI ${label}: ${input}`);
  const value = parseInt(hex.slice(2), 16);
  if (value > max) throw new RangeError(`OMI ${label} ${hex} exceeds ${hexByte(max)}`);
  return { hex, value };
}

function normalizeFs(fs = DEFAULT_OMI_FS) {
  const value = String(fs || DEFAULT_OMI_FS).toLowerCase();
  if (!/^[0-9a-f]{1,4}$/.test(value)) throw new TypeError(`Invalid OMI FS frame: ${fs}`);
  return value;
}

function normalizeGs(gs = DEFAULT_OMI_GS) {
  const parts = Array.isArray(gs) ? gs : String(gs || DEFAULT_OMI_GS).split(/[.-]/);
  const hasMappedPrefix = parts.length === 5 && String(parts[0]).toLowerCase() === "ffff";
  const isDeprecatedShorthand = parts.length === 4;
  if (!hasMappedPrefix && !isDeprecatedShorthand) throw new TypeError(`Invalid OMI GS frame: ${gs}`);
  const octets = parts.slice(hasMappedPrefix ? 1 : 0).map((part) => {
    if (!/^\d{1,3}$/.test(String(part))) throw new TypeError(`Invalid OMI GS octet: ${part}`);
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) throw new RangeError(`OMI GS octet out of range: ${part}`);
    return String(n);
  });
  return `ffff-${octets.join("-")}`;
}

function normalizePayload(payload) {
  if (payload === undefined || payload === null || payload === "") return undefined;
  const value = String(payload);
  if (!URL_SAFE_BASE64_RE.test(value)) throw new TypeError(`Invalid OMI payload: ${payload}`);
  return value;
}

export function parseOmiAddress(input) {
  const raw = String(input || "");
  if (!raw.startsWith("omi-")) throw new TypeError(`Invalid OMI prefix: ${input}`);
  const tokens = raw.split("-");
  if (tokens.length < 8) throw new TypeError(`Incomplete OMI address: ${input}`);
  if (tokens[0] !== "omi") throw new TypeError(`Invalid OMI prefix: ${input}`);

  const fs = normalizeFs(tokens[1]);
  const hasMappedPrefix = String(tokens[2]).toLowerCase() === "ffff";
  const gsEnd = hasMappedPrefix ? 7 : 6;
  const deprecatedShorthand = !hasMappedPrefix;
  const gs = normalizeGs(tokens.slice(2, gsEnd));
  const rs = parseHexByte(tokens[gsEnd], 0x3f, "RS control");
  const us = parseHexByte(tokens[gsEnd + 1], 0x7f, "US unit");
  const payload = normalizePayload(tokens.slice(gsEnd + 2).join("-"));

  return {
    raw,
    address: formatOmiAddress({ fs, gs, rs: rs.hex, us: us.hex, payload }),
    deprecatedShorthand,
    fs,
    gs,
    gsIPv4: gs.split("-").slice(1).join("."),
    ipv6Mapped: `::ffff:${gs.split("-").slice(1).join(".")}`,
    rs: rs.hex,
    rsValue: rs.value,
    us: us.hex,
    usValue: us.value,
    payload
  };
}

export function formatOmiAddress(parts = {}) {
  const fs = normalizeFs(parts.fs);
  const gs = normalizeGs(parts.gs);
  const rs = parseHexByte(parts.rs ?? parts.controlCode ?? "0x00", 0x3f, "RS control").hex;
  const us = parseHexByte(parts.us ?? parts.unit ?? "0x00", 0x7f, "US unit").hex;
  const payload = normalizePayload(parts.payload);
  return ["omi", fs, ...gs.split("-"), rs, us, payload].filter(Boolean).join("-");
}

export function projectUPOSPort(posTag) {
  const pos = normalizePosTag(posTag);
  const posIndex = POS_INDEX[pos] ?? POS_INDEX.X;
  const posHex = hexByte(posIndex);
  const portChannel = UPOS_TO_OMI_PORT_CHANNEL[pos] || "US";
  return {
    pos,
    posHex,
    posIndex,
    portChannel,
    literalAlias: pos,
    base64Alias: encodeBase64Url(pos),
    schema: "dev-docs/Omi Porting.md"
  };
}

export function makeOmiAddressForAtom(atom = {}, options = {}) {
  const pos = atom.feature?.pos || atom.pos || parsePosFromLabel(atom.label);
  const projected = projectUPOSPort(pos);
  const seed = JSON.stringify({
    v: "omi.atom.address.v0",
    id: atom.id,
    term: atom.term || atom.label || atom.text,
    pos: projected.pos,
    centroid: atom.centroid,
    cidr: atom.cidr || atom.address
  });
  const usValue = options.us ?? (fnv1a32(seed) & 0x7f);
  const payload = options.payload === false ? undefined : options.payload || encodeBase64Url(atom.id || atom.term || atom.label || seed);
  const address = formatOmiAddress({
    fs: options.fs || DEFAULT_OMI_FS,
    gs: options.gs || DEFAULT_OMI_GS,
    rs: options.rs || projected.posHex,
    us: hexByte(usValue),
    payload
  });
  const parsed = parseOmiAddress(address);
  const selector = `[data-omi^="${parsed.address}"]`;
  const dataAttributes = {
    "data-omi": parsed.address,
    "data-omi-port-channel": projected.portChannel,
    "data-omi-pos": projected.pos,
    "data-omi-pos-hex": projected.posHex,
    "data-omi-rs": parsed.rs,
    "data-omi-us": parsed.us
  };

  return {
    address: parsed.address,
    portChannel: projected.portChannel,
    pos: projected.pos,
    posHex: projected.posHex,
    controlCode: parsed.rs,
    unit: parsed.us,
    selector,
    dataAttributes,
    parts: parsed,
    aliases: {
      literal: projected.literalAlias,
      base64: projected.base64Alias
    }
  };
}

export function buildOmiIndex(compiled = {}, options = {}) {
  const atoms = sourceAtoms(compiled).map((atom) => enrichAtom(atom, options));
  const byAddress = new Map();
  const byCIDR = new Map();
  const byCentroid = new Map();
  const byGraphChannel = new Map();
  const byOmiPortChannel = new Map();
  const byPOSHex = new Map();
  const byControlCode = new Map();
  const bySynsetCell = new Map();

  for (const atom of atoms) {
    addOne(byAddress, atom.omi.address, atom);
    addOne(byCIDR, atom.cidr || atom.address, atom);
    addOne(byCentroid, atom.centroid, atom);
    addOne(byGraphChannel, atom.channel, atom);
    addOne(byOmiPortChannel, atom.omi.portChannel, atom);
    addOne(byPOSHex, atom.omi.posHex, atom);
    addOne(byControlCode, atom.omi.controlCode, atom);
    for (const cellId of activeSynsetCells(atom)) addOne(bySynsetCell, cellId, atom);
  }

  return {
    atoms,
    byAddress,
    byCIDR,
    byCentroid,
    byGraphChannel,
    byOmiPortChannel,
    byPOSHex,
    byControlCode,
    bySynsetCell,
    queryPrefix(prefix) {
      const value = String(prefix || "");
      return atoms.filter((atom) => atom.omi.address.startsWith(value));
    },
    toDataAttributes(atom) {
      return (atom?.omi || makeOmiAddressForAtom(atom, options)).dataAttributes;
    }
  };
}

function sourceAtoms(compiled) {
  if (Array.isArray(compiled)) return compiled;
  if (Array.isArray(compiled.atoms)) return compiled.atoms;
  if (Array.isArray(compiled.nodes)) return compiled.nodes;
  return [];
}

function enrichAtom(atom, options) {
  const omi = atom.omi || makeOmiAddressForAtom(atom, options);
  return { ...atom, omi };
}

function addOne(map, key, atom) {
  if (key === undefined || key === null || key === "") return;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(atom);
}

function activeSynsetCells(atom) {
  const cells = atom.synsetCells || atom.wordnet?.cells;
  return [
    ...(cells?.fiveCell?.active || []),
    ...(cells?.twentyFourCell?.active || [])
  ];
}

function parsePosFromLabel(label) {
  const match = String(label || "").match(/^([A-Z]+):/);
  return match ? match[1] : "X";
}

function encodeBase64Url(value) {
  const input = String(value ?? "");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}
