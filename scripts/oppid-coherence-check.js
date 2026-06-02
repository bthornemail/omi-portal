#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OMI_FILES = ['RULES.omi', 'FACTS.omi', 'CLOSURES.omi', 'COMBINATORS.omi', 'CONS.omi'];

import { parseOmiDocument } from '../src/omi/omi-parser.js';
import {
  factorOmiPointer,
  principalGenerator,
  generatedIdeal,
  isPrincipalRegion
} from '../src/omilog/principal-domain.js';
import { commonGenerator, commonLaneLL } from '../src/omilog/omi-gcd.js';

function collectRecords(filePath, label) {
  if (!existsSync(filePath)) {
    console.warn(`  [warn] ${filePath} not found — skipping`);
    return [];
  }
  const text = readFileSync(filePath, 'utf-8');
  const parsed = parseOmiDocument(text, { source: filePath });
  const records = (parsed.records || []).filter(r => r && r.address);

  for (const rec of records) {
    rec._file = label;
    rec._filePath = filePath;
  }
  return records;
}

function checkPrincipalCoherence(records, fileLabel) {
  const violations = [];

  const laneMap = new Map();
  for (const rec of records) {
    if (!rec.address) continue;
    const f = factorOmiPointer(rec.address);
    if (!f) continue;
    if (!laneMap.has(f.lane)) laneMap.set(f.lane, []);
    laneMap.get(f.lane).push(rec);
  }

  for (const [lane, laneRecords] of laneMap) {
    if (laneRecords.length < 2) continue;
    if (!isPrincipalRegion(laneRecords)) {
      violations.push({
        lane,
        file: fileLabel,
        count: laneRecords.length,
        addresses: laneRecords.map(r => r.address),
        reason: `lane 0x${lane.toString(16).padStart(2, '0')} has ${laneRecords.length} records but no single principal generator covers all`
      });
    }
  }

  return violations;
}

function checkPairedGenerators(records) {
  const violations = [];
  const addresses = records.filter(r => r.address).map(r => r.address);

  for (let i = 0; i < Math.min(addresses.length, 50); i++) {
    for (let j = i + 1; j < Math.min(addresses.length, 50); j++) {
      const a = addresses[i];
      const b = addresses[j];
      if (a === b) continue;
      const gen = commonGenerator(a, b);
      if (gen === null) {
        const fA = factorOmiPointer(a);
        const fB = factorOmiPointer(b);
        if (fA && fB && fA.lane === fB.lane) {
          violations.push({
            a,
            b,
            reason: 'same-lane pointers share no common generator (GCD failure)'
          });
        }
      }
    }
  }

  return violations;
}

let exitCode = 0;

console.log('=== OPPID Coherence Check ===\n');

const allRecords = [];
for (const file of OMI_FILES) {
  const filePath = join(ROOT, file);
  const records = collectRecords(filePath, file);
  allRecords.push(...records);
  console.log(`  ${file}: ${records.length} records`);
}

console.log(`\nTotal: ${allRecords.length} records across ${OMI_FILES.length} files\n`);

console.log('--- Principal Generator Coherence ---');
const principalViolations = [];
for (const file of OMI_FILES) {
  const filePath = join(ROOT, file);
  const records = collectRecords(filePath, file);
  const fileViolations = checkPrincipalCoherence(records, file);
  principalViolations.push(...fileViolations);
}

if (principalViolations.length === 0) {
  console.log('  ✓ All lanes have coherent principal generators');
} else {
  console.log(`  ✗ ${principalViolations.length} coherence violation(s):`);
  for (const v of principalViolations) {
    console.log(`    [${v.file}] lane 0x${v.lane.toString(16).padStart(2, '0')}: ${v.reason}`);
    exitCode = 1;
  }
}

console.log('\n--- Paired Generator GCD Check ---');
const pairedViolations = checkPairedGenerators(allRecords);
if (pairedViolations.length === 0) {
  console.log('  ✓ All sampled same-lane pointer pairs share a common generator');
} else {
  console.log(`  ✗ ${pairedViolations.length} GCD violation(s):`);
  for (const v of pairedViolations) {
    console.log(`    ${v.a} / ${v.b}: ${v.reason}`);
    exitCode = 1;
  }
}

console.log('\n--- OMI Canon Check ---');
const requiredRoot = ['RULES.omi', 'FACTS.omi', 'CLOSURES.omi', 'COMBINATORS.omi', 'CONS.omi'];
for (const file of requiredRoot) {
  const filePath = join(ROOT, file);
  if (!existsSync(filePath)) {
    console.log(`  ✗ Missing: ${file}`);
    exitCode = 1;
  } else {
    console.log(`  ✓ ${file} present`);
  }
}

const firstPrinciplePath = join(ROOT, 'docs', 'agreement-is-all-you-need.md');
if (existsSync(firstPrinciplePath)) {
  console.log('  ✓ docs/agreement-is-all-you-need.md present (First Principle)');
} else {
  console.log('  ✗ First Principle document missing');
  exitCode = 1;
}

console.log(`\n${exitCode === 0 ? '✓ OPPID coherence check PASSED' : '✗ OPPID coherence check FAILED'}`);
process.exit(exitCode);
