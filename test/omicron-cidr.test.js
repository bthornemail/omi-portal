import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { OmiOmicronCIDRKernel } from '../src/omi/omicron-kernel.js';

test('OmiOmicronCIDRKernel validates the OMI-CIDR-v0 structural standard', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiOmicronCIDRKernel(sab);

  const expandedCell = kernel.parseOmiCidr("Ο-ffff-127-0-0-1/48");
  const compressedCell = kernel.parseOmiCidr("Ο--1/48");
  const suffixCell = kernel.parseOmiCidr("-ffff-127-0-0-1/48-Ο");

  assert.equal(kernel.car(expandedCell).valid, true);
  assert.equal(kernel.car(expandedCell).operatorType, "CARDINAL");
  assert.equal(kernel.car(expandedCell).cidrBitwidth, 48);

  assert.equal(kernel.car(compressedCell).valid, true);
  assert.equal(kernel.car(compressedCell).operatorType, "CARDINAL");
  assert.equal(kernel.car(compressedCell).cidrBitwidth, 48);

  assert.equal(kernel.car(suffixCell).operatorType, "CARDINAL_SUFFIX");

  const slices = kernel.car(compressedCell).expandedRegisterSlices;
  assert.equal(slices.length, 8);
  assert.deepEqual(slices, ["0", "0", "0", "0", "0", "0", "0", "1"]);
});
