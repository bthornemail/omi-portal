import test from "node:test";
import assert from "node:assert/strict";
import {
  EMMC_BLOCK_BYTES,
  EMMC_O_WORD_BYTES,
  EMMC_PLANE_ALIGNED_BYTES,
  EMMC_PLANE_DESCRIPTOR_BYTES,
  EMMC_PLANE_PADDING_BYTES,
  EMMC_PLANE_PAYLOAD_BYTES,
  EMMC_PLANE_RECORD_BYTES,
  EMMC_PLANE_RESERVED_BYTES,
  createEmmcLayout,
  projectEmmcSlot,
} from "../src/qemu/omi-emmc-layout.js";
import {
  buildEmmcStateImage,
  readEmmcStateInputs,
  verifyEmmcStateImage,
} from "../src/qemu/omi-emmc-image.js";

test("eMMC layout declares boot0 boot1 RPMB and userdata partitions", () => {
  const layout = createEmmcLayout();

  assert.equal(layout.blockBytes, EMMC_BLOCK_BYTES);
  assert.equal(layout.planePayloadBytes, 5040 * 8);
  assert.equal(layout.oWordBytes, 32);
  assert.equal(layout.planeReservedBytes, 5040 * 8 - 32);
  assert.equal(layout.planeDescriptorBytes, 128);
  assert.equal(layout.planeRecordBytes, 128 + 5040 * 8);
  assert.equal(EMMC_O_WORD_BYTES, 32);
  assert.equal(EMMC_PLANE_PAYLOAD_BYTES, 40320);
  assert.equal(EMMC_PLANE_RESERVED_BYTES, 40288);
  assert.equal(EMMC_PLANE_DESCRIPTOR_BYTES, 128);
  assert.equal(EMMC_PLANE_RECORD_BYTES, 40448);
  assert.equal(EMMC_PLANE_PADDING_BYTES, 0);
  assert.equal(EMMC_PLANE_ALIGNED_BYTES % EMMC_BLOCK_BYTES, 0);
  assert.equal(layout.totalBytes, 3 * 512 + 5 * (128 + 5040 * 8));
  assert.equal(layout.totalBytes, 203776);

  assert.equal(layout.partitions.boot0.clock, "cosmic");
  assert.equal(layout.partitions.boot0.polynomial, "60x²");
  assert.equal(layout.partitions.boot1.clock, "atomic");
  assert.equal(layout.partitions.boot1.polynomial, "4y²");
  assert.equal(layout.partitions.rpmb.role, "monotone receipt plane");
  assert.equal(layout.partitions.userdata.role, "compiled .o governor planes");
});

test("eMMC layout stores five aligned userdata .o governor planes", () => {
  const layout = createEmmcLayout();

  assert.deepEqual(layout.planes.map((plane) => plane.governor), [
    "FACTS",
    "RULES",
    "CLOSURES",
    "COMBINATORS",
    "CONS",
  ]);
  for (const plane of layout.planes) {
    assert.equal(plane.descriptorBytes, 128);
    assert.equal(plane.payloadBytes, 5040 * 8);
    assert.equal(plane.activePayloadBytes, 32);
    assert.equal(plane.reservedPayloadBytes, 5040 * 8 - 32);
    assert.equal(plane.recordBytes, 128 + 5040 * 8);
    assert.equal(plane.paddingBytes, 0);
    assert.equal(plane.byteLength % 512, 0);
    assert.ok(plane.oPlane.endsWith(".o"));
  }
});

test("eMMC slot projection combines governor band offset and clock slot", () => {
  const projection = projectEmmcSlot({
    governor: "RULES",
    band: "runtime",
    offsetLane: "RS",
    clockSlot60: 4,
  });

  assert.equal(projection.local240, 18);
  assert.equal(projection.slot5040, 978);
  assert.equal(projection.offsetMask, 0x0100);
});

test("eMMC image builder emits parseable boot headers RPMB receipt and five planes", async () => {
  const inputs = await readEmmcStateInputs();
  const state = await buildEmmcStateImage(inputs);
  const proof = verifyEmmcStateImage(state.image, state.layout);

  assert.equal(state.image.byteLength, state.layout.totalBytes);
  assert.equal(state.image.byteLength, 203776);
  assert.equal(proof.accepted, true, proof.errors.join("; "));
  assert.equal(proof.parsed.headers.boot0.cl, "cosmic");
  assert.equal(proof.parsed.headers.boot1.cl, "atomic");
  assert.equal(proof.parsed.planes.length, 5);
  assert.equal(proof.parsed.rpmb.acceptedRootHash, state.acceptedRootHash);
});

test("eMMC proof rejects plane descriptor and payload mismatch", async () => {
  const inputs = await readEmmcStateInputs();
  const state = await buildEmmcStateImage(inputs);
  const tampered = Buffer.from(state.image);
  const facts = state.layout.planes.find((plane) => plane.governor === "FACTS");

  tampered[facts.oRecordOffset + 31] ^= 0xff;
  const proof = verifyEmmcStateImage(tampered, state.layout);

  assert.equal(proof.accepted, false);
  assert.ok(proof.errors.some((error) => error.includes("FACTS .o record hash")));
});

test("eMMC proof rejects non-zero reserved payload bytes", async () => {
  const inputs = await readEmmcStateInputs();
  const state = await buildEmmcStateImage(inputs);
  const tampered = Buffer.from(state.image);
  const facts = state.layout.planes.find((plane) => plane.governor === "FACTS");

  tampered[facts.oRecordOffset + EMMC_O_WORD_BYTES] = 0x7f;
  const proof = verifyEmmcStateImage(tampered, state.layout);

  assert.equal(proof.accepted, false);
  assert.ok(proof.errors.some((error) => error.includes("FACTS reserved payload padding is not zero")));
});
