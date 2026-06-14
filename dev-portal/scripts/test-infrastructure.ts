import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { VisualLiterateCell } from '../src/narrative/narrativeTypes';
import { parseMakefile, summarizeTargets, PIPELINE_LABELS } from '../src/omi/makefileParser';
import { parseDockerfiles, summarizeDockerfileStages } from '../src/omi/dockerfileParser';
import { parseCompose, summarizeComposeServices } from '../src/omi/composeParser';
import { parseBake, summarizeBakeTargets } from '../src/omi/bakeParser';
import { parseNginx, summarizeNginxBlocks } from '../src/omi/nginxParser';
import { parseNetworkingDoc, NETWORKING_DOCS, summarizeNetworkingCells } from '../src/omi/networkingDocParser';

const ROOT = resolve(import.meta.dirname, '../../');

async function run() {
  let pass = true;

  // ── Makefile ──────────────────────────────────────────────────
  const makefileText = readFileSync(resolve(ROOT, 'Makefile'), 'utf-8');
  const makeTargets = parseMakefile(makefileText);
  const makeSummary = summarizeTargets(makeTargets);

  console.log(`\n=== Makefile ===`);
  console.log(`  ${makeSummary.total} targets`);
  console.log(`  by group: ${JSON.stringify(makeSummary.byGroup)}`);

  if (makeTargets.length < 50) {
    console.error(`FAIL: expected 50+ Makefile targets, got ${makeTargets.length}`);
    pass = false;
  }

  const gradeNames = makeTargets.filter((t) => t.group === 'grade').map((t) => t.name);
  const expectedGrades = ['dev', 'consumer', 'production', 'verify', 'verify-safe', 'pipeline', 'release'];
  for (const eg of expectedGrades) {
    if (!gradeNames.includes(eg)) {
      console.error(`FAIL: missing grade target "${eg}"`);
      pass = false;
    }
  }

  if (PIPELINE_LABELS.length !== 13) {
    console.error(`FAIL: expected 13 pipeline steps, got ${PIPELINE_LABELS.length}`);
    pass = false;
  }

  // ── Dockerfiles ──────────────────────────────────────────────────
  const dockerFiles = [
    { fileName: 'Dockerfile', text: '' },
    { fileName: 'Dockerfile.test', text: '' },
    { fileName: 'Dockerfile.stress', text: '' },
    { fileName: 'Dockerfile.qemu', text: '' }
  ];

  for (const df of dockerFiles) {
    df.text = readFileSync(resolve(ROOT, df.fileName), 'utf-8');
  }

  const dockerStages = parseDockerfiles(dockerFiles);
  const dockerSummary = summarizeDockerfileStages(dockerStages);

  console.log(`\n=== Dockerfiles ===`);
  console.log(`  ${dockerSummary.total} stages`);
  console.log(`  by file: ${JSON.stringify(dockerSummary.byFile)}`);

  if (dockerStages.length < 4) {
    console.error(`FAIL: expected 4+ Dockerfile stages, got ${dockerStages.length}`);
    pass = false;
  }

  const stageNames = dockerStages.map((s) => s.name);
  if (!stageNames.includes('base') || !stageNames.includes('runtime')) {
    console.error(`FAIL: missing base or runtime stage`);
    pass = false;
  }

  // ── Compose ──────────────────────────────────────────────────
  const composeText = readFileSync(resolve(ROOT, 'docker-compose.yml'), 'utf-8');
  const composeLoadText = readFileSync(resolve(ROOT, 'docker-compose.load.yml'), 'utf-8');

  const composeServices = [
    ...parseCompose(composeText, 'docker-compose.yml'),
    ...parseCompose(composeLoadText, 'docker-compose.load.yml')
  ];
  const composeSummary = summarizeComposeServices(composeServices);

  console.log(`\n=== Compose ===`);
  console.log(`  ${composeSummary.total} services`);
  console.log(`  by file: ${JSON.stringify(composeSummary.byFile)}`);

  const byFile = composeSummary.byFile;
  const svcMain = byFile['docker-compose.yml'] ?? 0;
  const svcLoad = byFile['docker-compose.load.yml'] ?? 0;

  if (svcMain !== 2) {
    console.error(`FAIL: expected 2 services in docker-compose.yml, got ${svcMain}`);
    pass = false;
  }
  if (svcLoad !== 5) {
    console.error(`FAIL: expected 5 services in docker-compose.load.yml, got ${svcLoad}`);
    pass = false;
  }

  const serviceNames = composeServices.map((s) => s.name);
  if (!serviceNames.includes('omi-portal')) {
    console.error(`FAIL: missing omi-portal service`);
    pass = false;
  }

  // ── Bake ──────────────────────────────────────────────────
  const bakeText = readFileSync(resolve(ROOT, 'docker-bake.hcl'), 'utf-8');
  const bakeTargets = parseBake(bakeText, 'docker-bake.hcl');
  const bakeSummary = summarizeBakeTargets(bakeTargets);

  console.log(`\n=== Bake ===`);
  console.log(`  ${bakeSummary.total} targets`);
  console.log(`  by group: ${JSON.stringify(bakeSummary.byGroup)}`);

  if (bakeTargets.length < 3) {
    console.error(`FAIL: expected 3+ bake targets, got ${bakeTargets.length}`);
    pass = false;
  }

  // ── Nginx ──────────────────────────────────────────────────
  const nginxText = readFileSync(resolve(ROOT, 'nginx.conf'), 'utf-8');
  const nginxBlocks = parseNginx(nginxText, 'nginx.conf');
  const nginxSummary = summarizeNginxBlocks(nginxBlocks);

  console.log(`\n=== Nginx ===`);
  console.log(`  ${nginxSummary.total} blocks`);
  console.log(`  by kind: ${JSON.stringify(nginxSummary.byKind)}`);

  if (nginxBlocks.length < 2) {
    console.error(`FAIL: expected 2+ nginx blocks, got ${nginxBlocks.length}`);
    pass = false;
  }

  const blockKinds = nginxBlocks.map((b) => b.kind);
  if (!blockKinds.includes('http')) {
    console.error(`FAIL: missing http block`);
    pass = false;
  }
  if (!blockKinds.includes('events')) {
    console.error(`FAIL: missing events block`);
    pass = false;
  }

  // ── Networking Docs ──────────────────────────────────────
  const allNetworkingCells: VisualLiterateCell[] = [];
  for (const doc of NETWORKING_DOCS) {
    const text = readFileSync(resolve(ROOT, doc.path), 'utf-8');
    allNetworkingCells.push(...parseNetworkingDoc(text, doc.path));
  }
  const netSummary = summarizeNetworkingCells(allNetworkingCells);

  console.log(`\n=== Networking Docs ===`);
  console.log(`  ${netSummary.total} sections across ${NETWORKING_DOCS.length} files`);
  console.log(`  by grade: ${JSON.stringify(netSummary.byGrade)}`);

  if (allNetworkingCells.length < 20) {
    console.error(`FAIL: expected 20+ networking cells, got ${allNetworkingCells.length}`);
    pass = false;
  }

  const netGrades = new Set(allNetworkingCells.map((c) => c.grade));
  if (!netGrades.has('production') && !netGrades.has('pipeline')) {
    console.error(`FAIL: expected production or pipeline grade in networking cells`);
    pass = false;
  }

  console.log(`\n────────────────────────────────────────`);
  if (pass) {
    console.log('PASS: infrastructure parser');
    process.exit(0);
  } else {
    console.error('FAIL: infrastructure parser');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
