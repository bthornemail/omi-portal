import { safeBase64 } from './omiCarrier';

const BASE36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const KIND_TO_GATE = {
  FACT: 'FACT',
  MUST: 'RULE',
  CONS: 'CONS',
  COMBINE: 'COMBINATOR',
  CLOSE: 'CLOSURE'
} as const;

const KIND_TO_GAUGE = {
  FACT: 'RS',
  MUST: 'GS',
  CONS: 'FS',
  COMBINE: 'US',
  CLOSE: 'RS'
} as const;

const GAUGE_MASK = {
  FS: 0x0001,
  GS: 0x0010,
  RS: 0x0100,
  US: 0x1000
} as const;

const GAUGE_TOKEN = {
  FS: 'o---o',
  GS: '/---/',
  RS: '?---?',
  US: '@---@'
} as const;

export type CidrOp = keyof typeof KIND_TO_GATE;
export type McrsgspGate = typeof KIND_TO_GATE[CidrOp];
export type McrsgspGauge = typeof KIND_TO_GAUGE[CidrOp];

export type ParsedOmiAddress = {
  address: string;
  segments: string[];
  words: number[];
  highWord: number;
  lowWord: number;
};

export type CidrMcrsgspRecord = {
  id: string;
  sourceFile: string;
  sourceLine: number;
  adapter: 'cidr';
  nativeBoundary: 'cidr-prefix-is-claim-boundary-not-native-identity';
  address: ParsedOmiAddress;
  claimPrefix: number;
  op: CidrOp;
  gate: McrsgspGate;
  gauge: McrsgspGauge;
  sealedGauge: string;
  value: string;
  bodyText: string;
  consCandidate: {
    car: {
      address: string;
      claimPrefix: number;
      op: CidrOp;
      gate: McrsgspGate;
      gauge: McrsgspGauge;
      sealedGauge: string;
      ref: string;
    };
    cdr: {
      value: string;
      bodyText: string;
      payloadBase64Url: string;
      payloadHash: string;
    };
  };
  dataOmi: string;
  dataImo: string;
  mcrsgsp: {
    fragmentId: string;
    payloadHash: string;
    monotoneKey: string;
    causalClass: McrsgspGate;
    claimPrefix: number;
    projectionOnly: true;
    receiptState: 'candidate';
  };
};

export type CidrMcrsgspInput = {
  fileName: string;
  text: string;
};

export type CidrMcrsgspSummary = {
  records: number;
  byOp: Record<string, number>;
  byGate: Record<string, number>;
  byGauge: Record<string, number>;
};

type ParsedHeader = {
  raw: string;
  address: string;
  claimPrefix: number;
  op: CidrOp;
  value: string;
};

export async function parseCidrMcrsgspFiles(inputs: CidrMcrsgspInput[]) {
  const groups = await Promise.all(inputs.map((input) => parseCidrMcrsgspText(input.text, input.fileName)));
  return groups.flat();
}

export async function parseCidrMcrsgspText(text: string, sourceFile = 'inline.omi') {
  const lines = text.split(/\r?\n/);
  const records: CidrMcrsgspRecord[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const header = parseHeader(line);
    if (!header) continue;

    const bodyLines: string[] = [];
    let j = i + 1;

    while (j < lines.length) {
      const lookaheadTrim = lines[j].trim();

      if (isHeaderLine(lookaheadTrim)) break;

      if (lookaheadTrim === 'omi-' || bodyLines.length > 0) {
        bodyLines.push(lines[j]);
        if (lookaheadTrim === '-imo') {
          j += 1;
          break;
        }
      } else if (lookaheadTrim && !lookaheadTrim.startsWith('#')) {
        break;
      }

      j += 1;
    }

    const sourceLine = i + 1;
    if (bodyLines.length) i = j - 1;

    records.push(await buildRecord({
      sourceFile,
      sourceLine,
      header,
      bodyText: bodyLines.join('\n').trim()
    }));
  }

  return records;
}

export function summarizeCidrMcrsgspRecords(records: CidrMcrsgspRecord[]): CidrMcrsgspSummary {
  const byOp: Record<string, number> = {};
  const byGate: Record<string, number> = {};
  const byGauge: Record<string, number> = {};

  for (const record of records) {
    byOp[record.op] = (byOp[record.op] || 0) + 1;
    byGate[record.gate] = (byGate[record.gate] || 0) + 1;
    byGauge[record.gauge] = (byGauge[record.gauge] || 0) + 1;
  }

  return { records: records.length, byOp, byGate, byGauge };
}

function parseHeader(line: string): ParsedHeader | null {
  const match = line.match(/^(omi-[0-9a-fA-F]{4}(?:-[0-9a-fA-F]{4}){7})\/(\d+)\s+(FACT|MUST|CONS|COMBINE|CLOSE)\s+(.+?)\s*$/);
  if (!match) return null;
  return {
    raw: line,
    address: match[1],
    claimPrefix: Number.parseInt(match[2], 10),
    op: match[3] as CidrOp,
    value: match[4]
  };
}

function isHeaderLine(line: string) {
  return /^omi-[0-9a-fA-F]{4}(?:-[0-9a-fA-F]{4}){7}\/\d+\s+(FACT|MUST|CONS|COMBINE|CLOSE)\s+/.test(line);
}

function parseOmiAddress(address: string): ParsedOmiAddress {
  if (!address.startsWith('omi-')) {
    throw new Error(`invalid OMI address: ${address}`);
  }

  const body = address.slice(4);
  const segments = body.split('-');
  if (segments.length !== 8) {
    throw new Error(`expected 8 address segments, got ${segments.length}: ${address}`);
  }

  const words = segments.map((segment) => {
    if (!/^[0-9a-fA-F]{4}$/.test(segment)) {
      throw new Error(`invalid 16-bit segment "${segment}" in ${address}`);
    }
    return Number.parseInt(segment, 16);
  });

  return { address, segments, words, highWord: words[0], lowWord: words[7] };
}

async function buildRecord(options: {
  sourceFile: string;
  sourceLine: number;
  header: ParsedHeader;
  bodyText: string;
}): Promise<CidrMcrsgspRecord> {
  const { sourceFile, sourceLine, header, bodyText } = options;
  const address = parseOmiAddress(header.address);
  const gate = KIND_TO_GATE[header.op];
  const gauge = KIND_TO_GAUGE[header.op];
  const gaugeWord = sealedGauge(gauge);
  const payload = {
    sourceFile,
    sourceLine,
    adapter: 'cidr',
    address: header.address,
    claimPrefix: header.claimPrefix,
    op: header.op,
    gate,
    gauge,
    value: header.value,
    bodyText,
    segments: address.segments
  };
  const payloadJson = JSON.stringify(payload);
  const payloadHash = await sha256Hex(payloadJson);
  const carBase36 = base36FromHash(payloadHash, 6);
  const cdrBase64 = base64url(payloadJson);
  const token = GAUGE_TOKEN[gauge];
  const sealedGaugeHex = hex(gaugeWord, 8);

  const dataOmi =
    `${token}/---/?v=${cdrBase64};l=${byteLength(payloadJson)};` +
    `h=${payloadHash};kind=${gate};op=${header.op};car=${carBase36}@${carBase36}@`;

  const dataImo =
    `${token}/---/?receipt=candidate;kind=${gate};op=${header.op};` +
    `gauge=${sealedGaugeHex};h=${payloadHash}@${carBase36}@`;

  return {
    id: `mcrsgsp:${payloadHash.slice(0, 16)}`,
    sourceFile,
    sourceLine,
    adapter: 'cidr',
    nativeBoundary: 'cidr-prefix-is-claim-boundary-not-native-identity',
    address,
    claimPrefix: header.claimPrefix,
    op: header.op,
    gate,
    gauge,
    sealedGauge: sealedGaugeHex,
    value: header.value,
    bodyText,
    consCandidate: {
      car: {
        address: header.address,
        claimPrefix: header.claimPrefix,
        op: header.op,
        gate,
        gauge,
        sealedGauge: sealedGaugeHex,
        ref: carBase36
      },
      cdr: {
        value: header.value,
        bodyText,
        payloadBase64Url: cdrBase64,
        payloadHash
      }
    },
    dataOmi,
    dataImo,
    mcrsgsp: {
      fragmentId: payloadHash.slice(0, 32),
      payloadHash,
      monotoneKey: `${sourceFile}:${sourceLine}:${header.op}:${header.value}`,
      causalClass: gate,
      claimPrefix: header.claimPrefix,
      projectionOnly: true,
      receiptState: 'candidate'
    }
  };
}

function sealedGauge(gauge: McrsgspGauge) {
  return ((GAUGE_MASK[gauge] << 16) | 0xaa55) >>> 0;
}

function hex(value: number, width: number) {
  return `0x${value.toString(16).toUpperCase().padStart(width, '0')}`;
}

function base64url(input: string) {
  return safeBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function toBase36(value: bigint | number) {
  let n = BigInt(value);
  if (n === 0n) return '0';
  let out = '';
  while (n > 0n) {
    const r = Number(n % 36n);
    out = BASE36[r] + out;
    n /= 36n;
  }
  return out;
}

function base36FromHash(hash: string, width = 6) {
  const slice = BigInt(`0x${hash.slice(0, 16)}`);
  const mod = 36n ** BigInt(width);
  return toBase36(slice % mod).padStart(width, '0');
}

function byteLength(value: string) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).byteLength;
  return Buffer.byteLength(value, 'utf8');
}

async function sha256Hex(input: string) {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('SHA-256 Web Crypto support is required for CIDR MCRSGSP parsing.');
}
