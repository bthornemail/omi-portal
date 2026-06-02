const OMI_CORE_RE = /^(?:omi-|ffff-)[0-9a-fA-F-]+(?:\/\d+(?:-\d+)?)?(?:\/@\d+)*$/;
const CIDR_PREFIX_RE = /^\/(\d{1,3})(?:-(\d{1,3}))?(?:\/|$)/;
const READER_LENS_RE = /^@(\d+)$/;

export class OmiNotationParseError extends Error {
  constructor(message, { input } = {}) {
    super(message);
    this.name = 'OmiNotationParseError';
    this.input = input;
  }
}

export function parseCoreAddress(input) {
  if (typeof input !== 'string') return null;
  OMI_CORE_RE.lastIndex = 0;
  const match = OMI_CORE_RE.exec(input);
  if (!match || match[0].length !== input.length) return null;

  const normalized = input.replace(/^ffff-/, 'omi-ffff-');
  const slashIdx = normalized.indexOf('/');
  const core = slashIdx === -1 ? normalized : normalized.slice(0, slashIdx);

  if (!core.startsWith('omi-')) return null;
  const segments = core.slice(4).split('-');
  if (segments.length !== 8 || segments.some(s => !/^[0-9a-f]{4}$/i.test(s))) {
    return null;
  }

  return {
    raw: core,
    segments: segments.map(s => parseInt(s, 16)),
    segmentHex: segments,
    S0: segments[0], S1: segments[1], S2: segments[2],
    S3: segments[3], S4: segments[4], S5: segments[5],
    S6: segments[6], S7: segments[7]
  };
}

export function parseClaimPrefix(input) {
  if (typeof input !== 'string') return null;
  const slashIdx = input.indexOf('/');
  if (slashIdx === -1) return { bits: null, backoff: null };

  const afterSlash = input.slice(slashIdx);
  const match = afterSlash.match(CIDR_PREFIX_RE);
  if (!match) return { bits: null, backoff: null };

  const bits = parseInt(match[1], 10);
  const backoff = match[2] ? parseInt(match[2], 10) : null;

  if (bits < 0 || bits > 128) return { bits: null, backoff: null };
  if (backoff !== null && (backoff < 0 || backoff > bits)) {
    return { bits: null, backoff: null };
  }

  return { bits, backoff };
}

export function parseReaderLenses(input) {
  if (typeof input !== 'string') return [];
  const slashIdx = input.indexOf('/');
  if (slashIdx === -1) return [];

  const afterFirst = input.slice(slashIdx + 1);
  const afterCidr = afterFirst.includes('/') ? afterFirst.slice(afterFirst.indexOf('/')) : '';
  if (!afterCidr) return [];

  const parts = afterCidr.split('/').filter(Boolean);
  const lenses = [];
  for (const part of parts) {
    const m = part.match(READER_LENS_RE);
    if (m) {
      lenses.push({ type: 'lens', value: parseInt(m[1], 10), raw: `/@${m[1]}` });
    }
  }
  return lenses;
}

export function parseClaimBackoff(input) {
  if (typeof input !== 'string') return null;
  const prefix = parseClaimPrefix(input);
  if (prefix.backoff === null) return null;
  const effective = prefix.bits - prefix.backoff;
  if (effective < 0 || effective > 128) return null;
  return {
    original: prefix.bits,
    backoff: prefix.backoff,
    effective
  };
}

export function deriveCreationStep(core) {
  if (!core || !core.segments) return null;

  const ll = core.segments[0] >> 8;
  const nn = core.segments[2];
  const mm = core.segments[5];

  const laneCoord = ((core.segments[3] & 0xFF) + (core.segments[4] & 0xFF)) % 720;
  const fano7 = ll % 7;
  const role3 = (nn + mm) % 3;
  const local240 = ((nn << 4) ^ mm) % 240;
  const slot5040 = fano7 * 720 + role3 * 240 + local240;
  const sexagesimalCadence = (laneCoord + nn + mm) % 60;
  const orientation = (laneCoord * 360 + nn * 60 + mm) % 360;

  return {
    laneLL: ll,
    bodyNN: nn,
    carrierMM: mm,
    laneCoord,
    fano7,
    role3,
    local240,
    slot5040,
    sexagesimalCadence,
    orientation
  };
}

export function applyClaim(core, claim) {
  if (!core || !claim) return core;
  return {
    ...core,
    claimBits: claim.bits,
    claimBackoff: claim.backoff,
    effectiveBits: claim.backoff !== null ? claim.bits - claim.backoff : claim.bits
  };
}

export function applyReaderLens(core, step, lens) {
  if (!lens) return null;
  switch (lens.value) {
    case 60: return { lens: 'sexagesimal', cadence: step ? step.sexagesimalCadence : 0 };
    case 360: return { lens: 'orientation', degrees: step ? step.orientation : 0 };
    case 720: return { lens: 'semantic-sweep', slot: step ? step.laneCoord : 0 };
    case 5040: return { lens: 'replay-ring', slot: step ? step.slot5040 : 0 };
    case 16: return { lens: 'nibble-carrier', plane: 16 };
    case 4: return { lens: 'tetrahedral-source', vertices: ['narrative', 'UPOS', 'WordNet', 'emoji'] };
    case 5: return { lens: 'five-source', planes: ['omi', 'UPOS', 'WordNet', 'emoji', 'narrative'] };
    default: return { lens: `custom-${lens.value}`, value: lens.value };
  }
}

export function applyReaderLensStack(core, step, lenses) {
  if (!lenses || lenses.length === 0) return [];
  return lenses.map(l => applyReaderLens(core, step, l));
}

export function parseOmiNotation(input) {
  if (typeof input !== 'string' || !input) {
    throw new OmiNotationParseError('Input must be a non-empty string', { input });
  }

  const core = parseCoreAddress(input);
  if (!core) {
    throw new OmiNotationParseError('Invalid OMI core address — must have 8 hex segments', { input });
  }

  const claim = parseClaimPrefix(input);
  const backoff = parseClaimBackoff(input);
  const lenses = parseReaderLenses(input);
  const step = deriveCreationStep(core);
  const view = applyReaderLensStack(core, step, lenses);

  return {
    coreAddress: core.raw,
    frame: core,
    qFrameValid: true,
    creationStep: step,
    claimPrefix: claim,
    claimBackoff: backoff,
    readerLenses: lenses,
    view
  };
}
