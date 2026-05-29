import { test } from "node:test";
import { strict as assert } from "node:assert";
import { OmiOmicronCIDRKernel } from "../src/omi/omicron-kernel.js";

test("OmiOmicronCIDRKernel validates the 128-bit 8-hextet OMI-CIDR-v0 standard", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiOmicronCIDRKernel(sab);

  const expandedLocalCell = kernel.parseOmiCidr("Ο-ffff-127--/48");
  const header = kernel.car(expandedLocalCell);

  assert.equal(header.valid, true);
  assert.equal(header.operatorType, "CARDINAL");
  assert.equal(header.cidrBitwidth, 48);
  assert.equal(header.prefixData.fullSegments, 3);
  assert.equal(header.prefixData.partialBits, 0);

  assert.deepEqual(header.expandedRegisterSlices, ["ffff", "127", "0", "0", "0", "0", "0", "0"]);

  const endpointCell = kernel.parseOmiCidr("ο-ffff-127-0-0-1-0x02-mask3-slot720/128");
  const endpointHeader = kernel.car(endpointCell);

  assert.equal(endpointHeader.valid, true);
  assert.equal(endpointHeader.operatorType, "CHIRAL");
  assert.equal(endpointHeader.cidrBitwidth, 128);
  assert.deepEqual(endpointHeader.expandedRegisterSlices, ["ffff", "127", "0", "0", "1", "0x02", "mask3", "slot720"]);

  const malformedCell = kernel.parseOmiCidr("Ο-1-2-3-4-5-6-7-8-9--/48");
  assert.equal(kernel.car(malformedCell).valid, false);
});
