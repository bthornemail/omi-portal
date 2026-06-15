import test from "node:test";
import assert from "node:assert/strict";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import {
  OmiQemuClockGovernor,
  evaluateQemuClockGovernor,
} from "../src/qemu/omi-qemu-clock-governor.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

function genesisSegments() {
  return parseOmiAddressToSegments(GENESIS_TOKEN);
}

test("QEMU clock governor maps Atomic Logic Clock to boot1 / 4y²", () => {
  const result = evaluateQemuClockGovernor(genesisSegments(), 4294967296, 1, {
    clock: "atomic",
    governor: "FACTS",
    offsetLane: "FS",
  });

  assert.equal(result.accepted, true);
  assert.equal(result.clock, "atomic");
  assert.equal(result.partition, "boot1");
  assert.equal(result.polynomial, "4y²");
});

test("QEMU clock governor maps Spectral Observer Clock to bridge / 16xy", () => {
  const result = evaluateQemuClockGovernor(genesisSegments(), 4294967296, 1, {
    clock: "spectral",
    governor: "COMBINATORS",
    offsetLane: "GS",
  });

  assert.equal(result.clock, "spectral");
  assert.equal(result.partition, "bridge");
  assert.equal(result.polynomial, "16xy");
});

test("QEMU clock governor maps Cosmic Orbit Clock to boot0 / 60x²", () => {
  const governor = new OmiQemuClockGovernor();
  const result = governor.evaluate(genesisSegments(), 4294967296, 0, {
    clock: "cosmic",
    governor: "RULES",
    offsetLane: "FS",
  });

  assert.equal(result.clock, "cosmic");
  assert.equal(result.partition, "boot0");
  assert.equal(result.polynomial, "60x²");
  assert.equal(result.clockSlot60, 0x7c00 % 60);
  assert.equal(result.local240, 16);
  assert.equal(result.slot5040, 736);
});

test("QEMU clock governor rejects gated main-machine receipt acceptance", () => {
  const result = evaluateQemuClockGovernor(genesisSegments(), 0, 0, {
    clock: "cosmic",
    governor: "RULES",
  });

  assert.equal(result.accepted, false);
  assert.equal(result.isClockGated, true);
  assert.equal(result.reason, "GATED_MAIN_CLOCK_CANNOT_ACCEPT_RECEIPT");
});
