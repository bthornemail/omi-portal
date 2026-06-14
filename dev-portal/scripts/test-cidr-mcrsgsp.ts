import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCidrMcrsgspFiles, summarizeCidrMcrsgspRecords } from '../src/omi/cidrMcrsgspParser';
import { CIDR_MCRSGSP_SOURCE_NAMES } from '../src/omi/cidrMcrsgspSources';

const root = resolve(import.meta.dirname, '../..');
const inputs = CIDR_MCRSGSP_SOURCE_NAMES.map((fileName) => ({
  fileName,
  text: readFileSync(resolve(root, fileName), 'utf8')
}));

const records = await parseCidrMcrsgspFiles(inputs);
const summary = summarizeCidrMcrsgspRecords(records);

if (summary.records !== 427) {
  throw new Error(`Expected 427 CIDR MCRSGSP records, got ${summary.records}.`);
}

const expected = {
  FACT: 211,
  RULE: 186,
  CONS: 15,
  COMBINATOR: 8,
  CLOSURE: 7
};

for (const [gate, count] of Object.entries(expected)) {
  if (summary.byGate[gate] !== count) {
    throw new Error(`Expected ${count} ${gate} records, got ${summary.byGate[gate] ?? 0}.`);
  }
}

for (const record of records) {
  if (record.nativeBoundary !== 'cidr-prefix-is-claim-boundary-not-native-identity') {
    throw new Error(`Record ${record.id} does not preserve CIDR boundary language.`);
  }
  if (!record.consCandidate.car.ref || !record.consCandidate.cdr.payloadBase64Url) {
    throw new Error(`Record ${record.id} is missing CAR/CDR candidate material.`);
  }
  if (record.mcrsgsp.receiptState !== 'candidate' || !record.mcrsgsp.projectionOnly) {
    throw new Error(`Record ${record.id} is not projection-only candidate state.`);
  }
  if (!record.dataOmi.includes(`;car=${record.consCandidate.car.ref}@${record.consCandidate.car.ref}@`)) {
    throw new Error(`Record ${record.id} does not close with CAR Base36 socket.`);
  }
}

console.log(`cidr mcrsgsp ok: ${summary.records} records, ${JSON.stringify(summary.byGate)}`);
