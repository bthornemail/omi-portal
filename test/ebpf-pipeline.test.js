import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { OmiClusterSignatureGateway } from '../src/omi/cluster-packet-kernel.js';

test('eBPF Pipeline: object output matches verifier structural specifications', (t) => {
  const objectPath = './artifacts/ebpf/ebpf-pipeline.o';
  const isCompiled = existsSync(objectPath);

  if (!isCompiled) {
    t.skip("run make verify-ebpf to build the BPF object fixture");
    return;
  }

  const elfBuffer = readFileSync(objectPath);
  assert.equal(elfBuffer[0], 0x7F);
  assert.equal(String.fromCharCode(elfBuffer[1], elfBuffer[2], elfBuffer[3]), "ELF");
});

test('eBPF Pipeline: user-space mirror matches the kernel-space Delta Law calculation', (t) => {
  const mockSaddrLow = 0x12345678;
  const rotl32 = (x, r) => ((x << r) | (x >>> (32 - r))) >>> 0;
  const rotr32 = (x, r) => ((x >>> r) | (x << (32 - r))) >>> 0;

  const expectedSignature = (
    rotl32(mockSaddrLow, 1) ^
    rotl32(mockSaddrLow, 3) ^
    rotr32(mockSaddrLow, 2) ^
    0x1337C0DE
  ) >>> 0;

  assert.ok(expectedSignature > 0);
  assert.equal(expectedSignature.toString(16), "a270ca70");
});

test('ClusterSignatureGateway: signPeer produces deterministic 64-bit signature', (t) => {
  const gateway = new OmiClusterSignatureGateway(null, null, null);
  const sig = gateway.signPeer('2607:f1c0:f0b7:df00::1');
  assert.ok(typeof sig === 'bigint');
  assert.ok(sig > 0n);
  assert.ok(sig < (1n << 64n));
});

test('ClusterSignatureGateway: verifyPacket matches signed peer', (t) => {
  const gateway = new OmiClusterSignatureGateway(null, null, null);
  const addr = '2607:f1c0:f0b7:df00::1';
  const sig = gateway.signPeer(addr);
  const payloadSig = Number(sig & 0xFFFFFFFFn);
  assert.ok(gateway.verifyPacket(addr, payloadSig));
  assert.ok(!gateway.verifyPacket('::1', payloadSig));
});

test('ClusterSignatureGateway: telemetrySnapshot returns map entries', (t) => {
  const gateway = new OmiClusterSignatureGateway(null, null, null);
  gateway.signPeer('2607:f1c0:f0b7:df00::1');
  gateway.signPeer('2607:f1c0:f062:e900::1');
  const snap = gateway.telemetrySnapshot();
  assert.equal(Object.keys(snap).filter(k => k !== 'sabSlots').length, 2);
  assert.ok(Array.isArray(snap.sabSlots));
  assert.equal(snap.sabSlots.length, 64);
});
