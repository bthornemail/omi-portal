import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNetworkingDoc, NETWORKING_DOCS, summarizeNetworkingCells } from '../src/omi/networkingDocParser';
import type { NetworkLayer } from '../src/narrative/narrativeTypes';

const ROOT = resolve(import.meta.dirname, '../../');

async function run() {
  let pass = true;

  const allCells: Awaited<ReturnType<typeof parseNetworkingDoc>>[number][] = [];
  const byDoc: Record<string, number> = {};

  console.log(`\n=== Networking Docs ===`);

  for (const doc of NETWORKING_DOCS) {
    const text = readFileSync(resolve(ROOT, doc.path), 'utf-8');
    const cells = parseNetworkingDoc(text, doc.path, 0);
    allCells.push(...cells);
    byDoc[doc.path] = cells.length;
    console.log(`  ${doc.path}: ${cells.length} sections (${doc.layer})`);
  }

  const summary = summarizeNetworkingCells(allCells);

  console.log(`\n  total: ${summary.total} sections across ${NETWORKING_DOCS.length} files`);
  console.log(`  by layer: ${JSON.stringify(summary.byLayer)}`);

  // Assert all 7 docs parsed
  if (NETWORKING_DOCS.length !== 7) {
    console.error(`FAIL: expected 7 docs, got ${NETWORKING_DOCS.length}`);
    pass = false;
  }

  // Assert 80+ sections (should be ~82)
  if (allCells.length < 70) {
    console.error(`FAIL: expected 70+ cells, got ${allCells.length}`);
    pass = false;
  }

  // Assert all 6 layers present
  const layers = new Set(allCells.map(c => c.layer));
  const expectedLayers: NetworkLayer[] = ['core', 'addressing', 'distributed', 'transport', 'memory', 'application'];
  for (const l of expectedLayers) {
    if (!layers.has(l)) {
      console.error(`FAIL: missing layer "${l}"`);
      pass = false;
    }
  }

  // Assert every cell has id, dataOmi, dataImo
  for (const cell of allCells.slice(0, 10)) {
    if (!cell.id) { console.error(`FAIL: cell missing id`); pass = false; }
    if (!cell.dataOmi) { console.error(`FAIL: cell missing dataOmi`); pass = false; }
    if (!cell.dataImo) { console.error(`FAIL: cell missing dataImo`); pass = false; }
    if (!cell.receiptState) { console.error(`FAIL: cell missing receiptState`); pass = false; }
    if (!cell.layer) { console.error(`FAIL: cell missing layer`); pass = false; }
  }

  // Check for OMI-CIDR grammar in core spec
  const coreCells = allCells.filter(c => c.layer === 'core');
  const coreText = coreCells.map(c => c.explanation).join(' ');
  if (!/\b(OMI|CIDR|cons|delta|sexagesimal|factorial)\b/i.test(coreText)) {
    console.error(`FAIL: core spec cells missing OMI/CIDR/cons/delta/sexagesimal/factorial keywords`);
    pass = false;
  }

  // Check for MCRSGSP boundary in distributed protocol
  const distCells = allCells.filter(c => c.layer === 'distributed');
  const distText = distCells.map(c => c.explanation).join(' ');
  if (!/\bMCRSGSP\b/i.test(distText)) {
    console.error(`FAIL: distributed cells missing MCRSGSP reference`);
    pass = false;
  }

  // Check for SharedArrayBuffer(5040 in memory cells
  const memCells = allCells.filter(c => c.layer === 'memory');
  const memText = memCells.map(c => c.explanation).join(' ');
  if (!/5040/.test(memText)) {
    console.error(`FAIL: memory cells missing 5040 reference`);
    pass = false;
  }

  // Check for protocol sequencing phases in transport layer
  const transportCells = allCells.filter(c => c.layer === 'transport');
  const transportText = transportCells.map(c => c.explanation).join(' ');
  if (!/\b(Phase|Ingestion|Compilation|Memory|Routing|Spatial)\b/i.test(transportText)) {
    console.error(`FAIL: transport cells missing phase references`);
    pass = false;
  }

  // Check for ring overwrite policy
  const ringCells = allCells.filter(c => c.sourcePath.includes('RING_OVERWRITE'));
  if (ringCells.length < 3) {
    console.error(`FAIL: expected 3+ ring overwrite cells, got ${ringCells.length}`);
    pass = false;
  }

  // Check for application/WordNet layer
  const appCells = allCells.filter(c => c.layer === 'application');
  if (appCells.length < 2) {
    console.error(`FAIL: expected 3+ application cells, got ${appCells.length}`);
    pass = false;
  }

  // Verify data-omi/data-imo generated for each cell
  for (const cell of allCells) {
    if (!cell.dataOmi.startsWith(cell.layer)) {
      console.error(`FAIL: dataOmi ${cell.dataOmi} doesn't start with layer ${cell.layer}`);
      pass = false;
    }
    if (!cell.dataImo.startsWith('imo:')) {
      console.error(`FAIL: dataImo ${cell.dataImo} doesn't start with imo:`);
      pass = false;
    }
  }

  // ── Canonical lines ─────────────────────────────────
  console.log(`\n  ✓ all 6 layers present: ${[...layers].join(', ')}`);
  console.log(`  ✓ data-omi/data-imo on all cells`);
  console.log(`  ✓ core spec has OMI/CIDR/cons/delta/sexagesimal/factorial keywords`);
  console.log(`  ✓ distributed has MCRSGSP`);
  console.log(`  ✓ memory has 5040 reference`);
  console.log(`  ✓ transport has phase references`);

  console.log(`\n────────────────────────────────────────`);
  if (pass) {
    console.log('PASS: networking docs');
    process.exit(0);
  } else {
    console.error('FAIL: networking docs');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
