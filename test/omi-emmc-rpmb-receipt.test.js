import test from "node:test";
import assert from "node:assert/strict";
import {
  compareRpmbReceipts,
  createRpmbReceipt,
  verifyRpmbReceipt,
} from "../src/qemu/omi-emmc-rpmb-receipt.js";

const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);

test("RPMB receipt verifies its stable hash", () => {
  const receipt = createRpmbReceipt({
    counter: 1,
    acceptedRootHash: A,
    causalFrontierHash: B,
    governor: "FACTS",
    offsetLane: "FS",
    clock: "atomic",
  });

  assert.equal(verifyRpmbReceipt(receipt).accepted, true);
  assert.equal(receipt.governor, "FACTS");
  assert.equal(receipt.exponent, -1);
  assert.equal(receipt.offsetMask, 0x0001);
});

test("RPMB receipt counter never decreases", () => {
  const previous = createRpmbReceipt({ counter: 2, acceptedRootHash: A, causalFrontierHash: B });
  const next = createRpmbReceipt({ counter: 1, acceptedRootHash: A, causalFrontierHash: B });

  const comparison = compareRpmbReceipts(previous, next);
  assert.equal(comparison.accepted, false);
  assert.equal(comparison.reason, "RPMB_COUNTER_DECREASED");
});

test("same RPMB input replay gives the same receipt", () => {
  const left = createRpmbReceipt({
    counter: 7,
    acceptedRootHash: A,
    causalFrontierHash: B,
    governor: "RULES",
    offsetLane: "GS",
    clock: "cosmic",
  });
  const right = createRpmbReceipt({
    counter: 7,
    acceptedRootHash: A,
    causalFrontierHash: B,
    governor: "RULES",
    offsetLane: "GS",
    clock: "cosmic",
  });

  assert.equal(left.receiptHash, right.receiptHash);
  assert.equal(compareRpmbReceipts(left, right).accepted, true);
});

test("changed source governor or offset changes the RPMB receipt", () => {
  const base = createRpmbReceipt({ counter: 1, acceptedRootHash: A, causalFrontierHash: B });
  const changedSource = createRpmbReceipt({ counter: 1, acceptedRootHash: C, causalFrontierHash: B });
  const changedGovernor = createRpmbReceipt({
    counter: 1,
    acceptedRootHash: A,
    causalFrontierHash: B,
    governor: "CONS",
  });
  const changedOffset = createRpmbReceipt({
    counter: 1,
    acceptedRootHash: A,
    causalFrontierHash: B,
    offsetLane: "US",
  });

  assert.notEqual(base.acceptedRootHash, changedSource.acceptedRootHash);
  assert.notEqual(base.receiptHash, changedSource.receiptHash);
  assert.notEqual(base.receiptHash, changedGovernor.receiptHash);
  assert.notEqual(base.receiptHash, changedOffset.receiptHash);
});
