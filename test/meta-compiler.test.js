import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiMetaCircularCompiler } from '../src/omi/meta-compiler.js';

test('Compiler Core: method-of-loci index map with genesis anchor', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiMetaCircularCompiler(ringSAB);
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = compiler.compileMetaInstruction(S, 0x02B2);

  assert.ok(metrics.accepted);
  assert.equal(metrics.semanticLayerModel, "GENESIS_LOCI_MANIFOLD");
  assert.equal(metrics.objectPresetColorId, "6");
  assert.equal(metrics.targetLocusSlot, 1504);
});

test('Compiler Core: evicts invalid object language structures', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiMetaCircularCompiler(ringSAB);
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = compiler.compileMetaInstruction(S, 0x01A3);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.semanticLayerModel, "REJECTED_CIRCUMELOCATION");
  assert.equal(metrics.objectPresetColorId, "1");
});
