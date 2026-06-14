#!/usr/bin/env node
/**
 * omi-cidr-mcrsgsp-parser.mjs
 *
 * Historical CIDR-adapter parser for OMI truth files.
 *
 * Purpose:
 * - Read adapter rows such as:
 *     omi-0000-...-0000/48 FACT universal-pos-NOUN
 *     omi-ffff-...-0000/48 MUST chiral-origin
 *     omi-.../128 CONS omi-cons-combinator-field-schema
 *
 * - Preserve them as receiptable MCRSGSP projection records.
 * - Treat FACT/RULE rows as CAR/CDR cons candidates.
 * - Treat CONS/COMBINE/CLOSE bodies as carried CDR payloads.
 *
 * Boundary:
 * - This parser recognizes historical CIDR adapter notation.
 * - CIDR claim prefixes do not create native OMI identity.
 * - Output records are projection candidates until validation + receipt.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const KIND_TO_GATE = Object.freeze({
  FACT: "FACT",
  MUST: "RULE",
  CONS: "CONS",
  COMBINE: "COMBINATOR",
  CLOSE: "CLOSURE",
});

const KIND_TO_GAUGE = Object.freeze({
  FACT: "RS",
  MUST: "GS",
  CONS: "FS",
  COMBINE: "US",
  CLOSE: "RS",
});

const GAUGE_MASK = Object.freeze({
  FS: 0x0001,
  GS: 0x0010,
  RS: 0x0100,
  US: 0x1000,
});

const GAUGE_TOKEN = Object.freeze({
  FS: "o---o",
  GS: "/---/",
  RS: "?---?",
  US: "@---@",
});

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function base64url(input) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function toBase36(num) {
  let n = BigInt(num);
  if (n === 0n) return "0";
  let out = "";
  while (n > 0n) {
    const r = Number(n % 36n);
    out = BASE36[r] + out;
    n = n / 36n;
  }
  return out;
}

function base36FromHash(hash, width = 6) {
  const slice = BigInt("0x" + hash.slice(0, 16));
  const mod = 36n ** BigInt(width);
  return toBase36(slice % mod).padStart(width, "0");
}

function parseOmiAddress(address) {
  if (!address.startsWith("omi-")) {
    throw new Error(`invalid OMI address: ${address}`);
  }

  const body = address.slice(4);
  const segments = body.split("-");

  if (segments.length !== 8) {
    throw new Error(`expected 8 address segments, got ${segments.length}: ${address}`);
  }

  const words = segments.map((segment) => {
    if (!/^[0-9a-fA-F]{4}$/.test(segment)) {
      throw new Error(`invalid 16-bit segment "${segment}" in ${address}`);
    }
    return Number.parseInt(segment, 16);
  });

  return {
    address,
    segments,
    words,
    highWord: words[0],
    lowWord: words[7],
  };
}

function sealedGauge(gauge) {
  return ((GAUGE_MASK[gauge] << 16) | 0xaa55) >>> 0;
}

function hex(value, width) {
  return "0x" + value.toString(16).toUpperCase().padStart(width, "0");
}

function isHeaderLine(line) {
  return /^omi-[0-9a-fA-F]{4}(?:-[0-9a-fA-F]{4}){7}\/\d+\s+(FACT|MUST|CONS|COMBINE|CLOSE)\s+/.test(line);
}

function parseHeader(line) {
  const m = line.match(/^(omi-[0-9a-fA-F]{4}(?:-[0-9a-fA-F]{4}){7})\/(\d+)\s+(FACT|MUST|CONS|COMBINE|CLOSE)\s+(.+?)\s*$/);
  if (!m) return null;
  return {
    raw: line,
    address: m[1],
    claimPrefix: Number.parseInt(m[2], 10),
    op: m[3],
    value: m[4],
  };
}

function parseFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const records = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const header = parseHeader(line);

    if (!header) continue;

    const bodyLines = [];
    let j = i + 1;

    while (j < lines.length) {
      const lookaheadTrim = lines[j].trim();

      if (isHeaderLine(lookaheadTrim)) break;

      if (lookaheadTrim === "omi-" || bodyLines.length > 0) {
        bodyLines.push(lines[j]);
        if (lookaheadTrim === "-imo") {
          j++;
          break;
        }
      } else if (lookaheadTrim && !lookaheadTrim.startsWith("#")) {
        // Non-comment text after a header that is not a body is preserved as nearby text.
        // Stop before accidentally absorbing unrelated sections.
        break;
      }

      j++;
    }

    if (bodyLines.length) {
      i = j - 1;
    }

    records.push(buildRecord({
      filePath,
      lineNumber: i + 1,
      header,
      bodyText: bodyLines.join("\n").trim(),
    }));
  }

  return records;
}

function buildRecord({ filePath, lineNumber, header, bodyText }) {
  const parsedAddress = parseOmiAddress(header.address);
  const gate = KIND_TO_GATE[header.op];
  const gauge = KIND_TO_GAUGE[header.op];
  const gaugeWord = sealedGauge(gauge);
  const payload = {
    sourceFile: path.basename(filePath),
    sourceLine: lineNumber,
    adapter: "cidr",
    address: header.address,
    claimPrefix: header.claimPrefix,
    op: header.op,
    gate,
    gauge,
    value: header.value,
    bodyText,
    segments: parsedAddress.segments,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadHash = sha256Hex(payloadJson);
  const carBase36 = base36FromHash(payloadHash, 6);
  const cdrBase64 = base64url(payloadJson);
  const token = GAUGE_TOKEN[gauge];

  const dataOmi =
    `${token}/---/?v=${cdrBase64};l=${Buffer.byteLength(payloadJson, "utf8")};` +
    `h=${payloadHash};kind=${gate};op=${header.op};car=${carBase36}@${carBase36}@`;

  const dataImo =
    `${token}/---/?receipt=candidate;kind=${gate};op=${header.op};` +
    `gauge=${hex(gaugeWord, 8)};h=${payloadHash}@${carBase36}@`;

  const consCandidate = {
    car: {
      address: header.address,
      claimPrefix: header.claimPrefix,
      op: header.op,
      gate,
      gauge,
      sealedGauge: hex(gaugeWord, 8),
      ref: carBase36,
    },
    cdr: {
      value: header.value,
      bodyText,
      payloadBase64Url: cdrBase64,
      payloadHash,
    },
  };

  return {
    id: `mcrsgsp:${payloadHash.slice(0, 16)}`,
    sourceFile: path.basename(filePath),
    sourceLine: lineNumber,
    adapter: "cidr",
    nativeBoundary: "cidr-prefix-is-claim-boundary-not-native-identity",
    address: parsedAddress,
    claimPrefix: header.claimPrefix,
    op: header.op,
    gate,
    gauge,
    sealedGauge: hex(gaugeWord, 8),
    value: header.value,
    bodyText,
    consCandidate,
    dataOmi,
    dataImo,
    mcrsgsp: {
      fragmentId: payloadHash.slice(0, 32),
      payloadHash,
      monotoneKey: `${path.basename(filePath)}:${lineNumber}:${header.op}:${header.value}`,
      causalClass: gate,
      claimPrefix: header.claimPrefix,
      projectionOnly: true,
      receiptState: "candidate",
    },
  };
}

function summarize(records) {
  const byOp = {};
  const byGate = {};
  const byGauge = {};
  for (const record of records) {
    byOp[record.op] = (byOp[record.op] || 0) + 1;
    byGate[record.gate] = (byGate[record.gate] || 0) + 1;
    byGauge[record.gauge] = (byGauge[record.gauge] || 0) + 1;
  }
  return {
    records: records.length,
    byOp,
    byGate,
    byGauge,
  };
}

function main(argv) {
  const args = argv.slice(2);

  if (!args.length || args.includes("--help")) {
    console.error(`Usage:
  node omi-cidr-mcrsgsp-parser.mjs [--summary] <file.omi>...

Output:
  JSONL records by default.
  Summary JSON if --summary is passed.
`);
    process.exit(args.includes("--help") ? 0 : 1);
  }

  const summaryOnly = args.includes("--summary");
  const files = args.filter((arg) => arg !== "--summary");

  const records = files.flatMap(parseFile);

  if (summaryOnly) {
    console.log(JSON.stringify(summarize(records), null, 2));
    return;
  }

  for (const record of records) {
    console.log(JSON.stringify(record));
  }
}

main(process.argv);
