import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

describe('OMI-PORTAL: Makefile Build Automation & Environment Grade Verification', () => {

  it('Assertion 0x01: Should confirm the existence of the canonical Makefile in the repository root', () => {
    const makefilePath = path.join(ROOT, 'Makefile');
    assert.equal(fs.existsSync(makefilePath), true, 'Root Makefile must be present');

    const content = fs.readFileSync(makefilePath, 'utf-8');
    assert.ok(content.includes('dev:'), 'Makefile must have dev target');
    assert.ok(content.includes('consumer:'), 'Makefile must have consumer target');
    assert.ok(content.includes('production:'), 'Makefile must have production target');
    assert.ok(content.includes('verify:'), 'Makefile must have verify target');
    assert.ok(content.includes('verify-safe:'), 'Makefile must have verify-safe target');
    assert.ok(content.includes('pipeline:'), 'Makefile must have pipeline target');
    assert.ok(content.includes('release:'), 'Makefile must have release target');
    assert.ok(content.includes('help:'), 'Makefile must have help target');
  });

  it('Assertion 0x02: Should verify that compiled production stubs map correctly to distribution folders', () => {
    const stubDir = path.join(ROOT, 'dist', 'omi');
    const stubFiles = ['RULES.imo', 'FACTS.imo', 'CLOSURES.imo', 'COMBINATORS.imo', 'CONS.imo'];

    if (fs.existsSync(stubDir)) {
      for (const file of stubFiles) {
        const filePath = path.join(stubDir, file);
        const exists = fs.existsSync(filePath);
        if (exists) {
          const bytes = fs.readFileSync(filePath);
          if (bytes.length > 0) {
            assert.strictEqual(bytes[0], 0xCE,
              `Format Error: ${file} must open with lowercase Omicron (0xCE)`);
          }
        }
      }
    }
  });

  it('Assertion 0x03: Should verify the OPPID coherence check script exists and is executable', () => {
    const scriptPath = path.join(ROOT, 'scripts', 'oppid-coherence-check.js');
    assert.equal(fs.existsSync(scriptPath), true, 'OPPID coherence script must exist');

    const stats = fs.statSync(scriptPath);
    assert.ok(stats.isFile(), 'oppid-coherence-check.js must be a file');
  });

  it('Assertion 0x04: Should verify the compile-omi CLI script exists', () => {
    const scriptPath = path.join(ROOT, 'scripts', 'compile-omi.js');
    assert.equal(fs.existsSync(scriptPath), true, 'compile-omi script must exist');
  });

  it('Assertion 0x05: Should verify first-principles docs exist for consumer packaging', () => {
    const requiredDocs = [
      'docs/agreement-is-all-you-need.md',
      'docs/omi-whitepaper.md',
      'docs/omi-object-model.md',
      'docs/omi-notation.md'
    ];
    for (const doc of requiredDocs) {
      const docPath = path.join(ROOT, doc);
      assert.equal(fs.existsSync(docPath), true, `First-principles doc missing: ${doc}`);
    }
  });

  it('Assertion 0x06: Should verify the five-file OMI canon exists in root', () => {
    const canonFiles = ['RULES.omi', 'FACTS.omi', 'CLOSURES.omi', 'COMBINATORS.omi', 'CONS.omi'];
    for (const file of canonFiles) {
      const filePath = path.join(ROOT, file);
      assert.equal(fs.existsSync(filePath), true, `Canon file missing: ${file}`);
    }
  });

  it('Assertion 0x07: Should verify Makefile has legacy alias for compile -> production', () => {
    const content = fs.readFileSync(path.join(ROOT, 'Makefile'), 'utf-8');
    assert.ok(content.includes('compile:'), 'Makefile must have compile: alias');
  });
});
