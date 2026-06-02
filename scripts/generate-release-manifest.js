#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function countImoRecords(filePath) {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, 'utf-8');
  const lines = text.split('\n').filter(l => l.trim());
  const records = lines.filter(l => l.trim().startsWith('\u03BF'));
  return records.length;
}

function countTestFiles(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter(f => f.endsWith('.test.js') && !f.startsWith('_')).length;
}

function checkEbpfArtifact() {
  const objPath = join(ROOT, 'dist', 'ebpf', 'ebpf-pipeline.o');
  if (existsSync(objPath)) {
    return { present: true, size: readFileSync(objPath).length };
  }
  return { present: false };
}

function runTestCounts() {
  try {
    const output = execSync('node --test test/*.test.js 2>&1; true', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 120000
    });
    const passMatch = output.match(/^(?:✔|✓).+$/gm);
    const failMatch = output.match(/^✖.+/gm);
    const testsLine = output.match(/^ℹ tests (\d+)$/m);
    const passLine = output.match(/^ℹ pass (\d+)$/m);
    const failLine = output.match(/^ℹ fail (\d+)$/m);
    const tests = testsLine ? parseInt(testsLine[1]) : (passMatch?.length || 0) + (failMatch?.length || 0);
    const pass = passLine ? parseInt(passLine[1]) : (passMatch?.length || 0);
    const fail = failLine ? parseInt(failLine[1]) : (failMatch?.length || 0);
    const failures = [];
    if (failMatch) {
      for (const line of failMatch) {
        const name = line.replace(/^✖ /, '').trim();
        failures.push({ name });
      }
    }
    return { totalTests: tests, passed: pass, failed: fail, failures };
  } catch (err) {
    return { totalTests: 0, passed: 0, failed: 0, failures: [], error: err.message };
  }
}

function gradeTargets() {
  const makefile = readFileSync(join(ROOT, 'Makefile'), 'utf-8');
  const gradeTargets = ['dev', 'consumer', 'production', 'verify', 'verify-safe', 'pipeline', 'release'];
  const found = gradeTargets.filter(t => makefile.includes(`${t}:`));
  return found;
}

function firstPrinciplesDocs() {
  const docsDir = join(ROOT, 'docs');
  const expected = ['agreement-is-all-you-need.md', 'omi-whitepaper.md', 'omi-object-model.md', 'omi-notation.md'];
  return expected.filter(f => existsSync(join(docsDir, f)));
}

function collectImoRecords() {
  const imoDir = join(ROOT, 'dist', 'omi');
  if (!existsSync(imoDir)) return null;
  return readdirSync(imoDir)
    .filter(f => f.endsWith('.imo'))
    .map(f => ({
      file: f,
      records: countImoRecords(join(imoDir, f))
    }));
}

const commitHash = git('rev-parse HEAD');
const commitMessage = git('log --oneline -1');
const commitAuthor = git('log -1 --format="%an <%ae>"');
const commitDate = git('log -1 --format="%aI"');
const branch = git('rev-parse --abbrev-ref HEAD');
const tag = git('describe --tags --exact-match 2>/dev/null') || null;

const testCounts = runTestCounts();
const imoFiles = collectImoRecords();
const ebpf = checkEbpfArtifact();
const grades = gradeTargets();
const docs = firstPrinciplesDocs();
const testFileCount = countTestFiles(join(ROOT, 'test'));

const manifest = {
  $schema: './release-manifest.schema.json',
  release: {
    timestamp: new Date().toISOString(),
    commit: commitHash,
    message: commitMessage,
    author: commitAuthor,
    date: commitDate,
    branch,
    tag
  },
  verification: {
    testFiles: testFileCount,
    totalTests: testCounts.totalTests || testCounts.passed + testCounts.failed,
    passed: testCounts.passed,
    failed: testCounts.failed,
    failures: [...new Set(testCounts.failures?.filter(f => f.name !== 'failing tests:')?.map(f => f.name) || [])],
    knownEbpfFailure: testCounts.failures?.some(f =>
      f.name?.includes('eBPF') || f.name?.includes('ebpf')
    ) ?? false
  },
  artifacts: {
    imoFiles,
    compiledRecordTotal: imoFiles?.reduce((s, f) => s + (f.records || 0), 0) ?? 0,
    ebpf: {
      compiled: ebpf.present,
      sizeBytes: ebpf.present ? ebpf.size : null
    }
  },
  docs: {
    firstPrinciples: docs
  },
  grades: {
    available: grades
  },
  pipeline: [
    'source', 'validate', 'generate', 'mirror', 'enter', 'read',
    'compose', 'route', 'scope', 'timing', 'naming', 'project', 'replay'
  ]
};

const outDir = join(ROOT, 'dist', 'release');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'manifest.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

console.log(JSON.stringify(manifest, null, 2));
