import { test } from "node:test";
import { strict as assert } from "node:assert";
import { packMultiplexAddress, unpackMultiplexAddress } from "../src/omilog/multiplex.js";

test("packMultiplexAddress produces canonical LL/MM/NN address", () => {
  const addr = packMultiplexAddress(0x04, 0x0003, 0x0002);
  assert.equal(addr, "omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128");
});

test("packMultiplexAddress preserves constants at S1 and S6", () => {
  const addr = packMultiplexAddress(0x04, 0x0003, 0x0002);
  const parts = addr.replace("omi-", "").split("/")[0].split("-");
  assert.equal(parts[1], "03bf");
  assert.equal(parts[6], "039f");
});

test("packMultiplexAddress repeats LL in S0, S3, S4, S7", () => {
  const addr = packMultiplexAddress(0x07, 0x0003, 0x0002);
  const parts = addr.replace("omi-", "").split("/")[0].split("-");
  const L0 = parseInt(parts[0], 16) >> 8;
  const L3 = parseInt(parts[3], 16) & 0xFF;
  const L4 = parseInt(parts[4], 16) & 0xFF;
  const L7 = parseInt(parts[7], 16) >> 8;
  assert.equal(L0, 0x07);
  assert.equal(L3, 0x07);
  assert.equal(L4, 0x07);
  assert.equal(L7, 0x07);
});

test("unpackMultiplexAddress round-trips through packMultiplexAddress", () => {
  const addr = packMultiplexAddress(0x04, 0x0003, 0x0002);
  const unpacked = unpackMultiplexAddress(addr);
  assert.equal(unpacked.laneLL, 0x04);
  assert.equal(unpacked.bodyNN, 0x0003);
  assert.equal(unpacked.carrierMM, 0x0002);
});

test("unpackMultiplexAddress works with various LL values", () => {
  for (const ll of [0x00, 0x01, 0xFF, 0xA5]) {
    const addr = packMultiplexAddress(ll, 0x0001, 0x0001);
    const unpacked = unpackMultiplexAddress(addr);
    assert.equal(unpacked.laneLL, ll);
  }
});

test("unpackMultiplexAddress works with various NN/MM values", () => {
  const addr = packMultiplexAddress(0x04, 0xFFFF, 0xFFFF);
  const unpacked = unpackMultiplexAddress(addr);
  assert.equal(unpacked.bodyNN, 0xFFFF);
  assert.equal(unpacked.carrierMM, 0xFFFF);
});

test("packMultiplexAddress enforces LL byte mask", () => {
  const addr = packMultiplexAddress(0x0104, 0x0003, 0x0002);
  const parts = addr.replace("omi-", "").split("/")[0].split("-");
  const L0 = parseInt(parts[0], 16) >> 8;
  assert.equal(L0, 0x04, "LL should be masked to low byte");
});

test("Q_frame(S) = 0 for valid packed address", () => {
  const addr = packMultiplexAddress(0x04, 0x0003, 0x0002);
  const parts = addr.replace("omi-", "").split("/")[0].split("-");
  const segments = parts.map(s => parseInt(s, 16));
  const L0 = segments[0] >> 8;
  const L3 = segments[3] & 0xFF;
  const L4 = segments[4] & 0xFF;
  const L7 = segments[7] >> 8;
  const E_var = (L0 - L3) ** 2 + (L3 - L4) ** 2 + (L4 - L7) ** 2;
  assert.equal(E_var, 0, "LL coherence error must be zero");
  const E_const =
    (segments[0] & 0xFF) ** 2 +
    (segments[1] - 0x03BF) ** 2 +
    ((segments[3] >> 8) - 0x2B) ** 2 +
    ((segments[4] >> 8) - 0x2F) ** 2 +
    (segments[6] - 0x039F) ** 2 +
    ((segments[7] & 0xFF) - 0xFF) ** 2;
  assert.equal(E_const, 0, "constant alignment error must be zero");
  assert.equal(E_var + E_const, 0, "Q_frame(S) must be zero");
});
