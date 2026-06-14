import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCidrMcrsgspFiles, summarizeCidrMcrsgspRecords } from '../src/omi/cidrMcrsgspParser';
import {
  assembleFactRuleCons,
  summarizeConsAssembly
} from '../src/omi/consAssembly';

const ROOT = resolve(import.meta.dirname, '../../');

const FILES: { fileName: string; relativePath: string }[] = [
  { fileName: 'FACTS.omi', relativePath: 'FACTS.omi' },
  { fileName: 'RULES.omi', relativePath: 'RULES.omi' },
  { fileName: 'CONS.omi', relativePath: 'CONS.omi' },
  { fileName: 'COMBINATORS.omi', relativePath: 'COMBINATORS.omi' },
  { fileName: 'CLOSURES.omi', relativePath: 'CLOSURES.omi' },
];

async function run() {
  const inputs = FILES.map((f) => {
    const text = readFileSync(resolve(ROOT, f.relativePath), 'utf-8');
    return { fileName: f.fileName, text };
  });

  const records = await parseCidrMcrsgspFiles(inputs);
  const parsedSummary = summarizeCidrMcrsgspRecords(records);

  const assemblies = assembleFactRuleCons(records);
  const assemblySummary = summarizeConsAssembly(assemblies);

  let pass = true;

  if (parsedSummary.records === 0) {
    console.error('FAIL: no CIDR records parsed');
    pass = false;
  } else {
    console.log(`  parsed ${parsedSummary.records} records`);
    console.log(`  by gate: ${JSON.stringify(parsedSummary.byGate)}`);
  }

  if (assemblies.length === 0) {
    console.error('FAIL: no cons assemblies produced');
    pass = false;
  } else {
    console.log(`  ${assemblySummary.total} FACT→CAR / RULE→CDR pairs`);
    console.log(`  with CONS reducer: ${assemblySummary.withCons}`);
    console.log(`  with COMBINATOR composer: ${assemblySummary.withCombinator}`);
    console.log(`  with CLOSURE seal: ${assemblySummary.withClosure}`);
  }

  for (const pair of assemblies.slice(0, 3)) {
    if (!pair.dataOmi.includes('car=')) {
      console.error(`FAIL: pair ${pair.id} missing car= in dataOmi`);
      pass = false;
    }
    if (!pair.dataImo.includes('receipt=candidate')) {
      console.error(`FAIL: pair ${pair.id} missing receipt=candidate in dataImo`);
      pass = false;
    }
    if (pair.receiptState !== 'candidate') {
      console.error(`FAIL: pair ${pair.id} receiptState should be candidate`);
      pass = false;
    }
  }

  console.log(`  query-plane metadata verified on ${Math.min(3, assemblies.length)} samples`);

  if (pass) {
    console.log('\nPASS: cons assembly');
    process.exit(0);
  } else {
    console.error('\nFAIL: cons assembly');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
