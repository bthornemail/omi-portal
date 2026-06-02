import { parseOmiDocument } from '../omi/omi-parser.js';

export const KEYWORD_TO_IMO = Object.freeze({
  MUST: '!',
  FACT: '=',
  EQUALS: '=',
  CLOSE: ')',
  COMBINE: '+',
  CONS: '.'
});

export const IMO_OP_TO_KEYWORD = Object.freeze(
  Object.fromEntries(Object.entries(KEYWORD_TO_IMO).map(([k, v]) => [v, k]))
);

export const IMO_CONTROLS = Object.freeze({
  FS: '\x1c',
  GS: '\x1d',
  RS: '\x1e',
  US: '\x1f'
});

const LATIN_PLANE_RE = /[\x40-\x7e]/;

export const IMO_NATIVE_CHAR_PLANE_RE = /^[\x00-\x3f\u0080-\uD7FF\uE000-\uFFFF]*$/;

export function isNativeCharPlaneSafe(text) {
  if (!text || !text.length) return true;
  return !LATIN_PLANE_RE.test(text);
}

export function isNativeCharPlaneSafeStrict(text) {
  if (typeof text !== 'string') return false;
  for (let i = 0; i < text.length;) {
    const code = text.codePointAt(i);
    if (code === undefined) return false;
    if (code >= 0x40 && code <= 0x7e) return false;
    i += code > 0xffff ? 2 : 1;
  }
  return true;
}

export function segmentToNative(segValue) {
  return String(segValue);
}

export function nativeAddressFromRecord(record) {
  const segments = record.segments.map(segmentToNative);
  let addr = segments.join('-');
  if (record.suffix !== null && record.suffix !== undefined) {
    addr = `${addr}/${record.suffix}`;
  }
  addr = `${addr}/${record.prefixBits}`;
  return addr;
}

export function lowerRecordToImo(record) {
  const op = KEYWORD_TO_IMO[record.keyword];
  if (!op) return null;

  const addr = nativeAddressFromRecord(record);
  const line = `${op}/${addr}`;
  if (!isNativeCharPlaneSafe(line)) {
    throw new Error(`IMO native char plane violation in record ${record.address}: ${line}`);
  }
  return line;
}

export function* lowerOmiDocumentToImo(parsed) {
  for (const record of parsed.records) {
    const imoLine = lowerRecordToImo(record);
    if (imoLine !== null) {
      yield imoLine;
    }

    if (record.sourceBlock) {
      yield `\x1e${nativeAddressFromRecord(record)}\x1f`;
    }
  }
}

export function compileOmiParsed(parsed) {
  if (parsed.malformed && parsed.malformed.length > 0) {
    throw new Error(
      `Cannot compile source with ${parsed.malformed.length} malformed records: ` +
      parsed.malformed.map((m) => `${m.reason} line ${m.line}`).join('; ')
    );
  }
  const lines = Array.from(lowerOmiDocumentToImo(parsed));
  return { records: parsed.records, lines, imoText: lines.join('\n') };
}

export async function compileOmiFile(text, { source = 'unknown.omi' } = {}) {
  const parsed = parseOmiDocument(text, { source });
  return compileOmiParsed(parsed);
}
