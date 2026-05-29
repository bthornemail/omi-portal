import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { OmiSexagesimalSlideRuleKernel } from '../src/omi/sliderule-kernel.js';

function loadFloat64FromSAB(sab, slot) {
  const big = Atomics.load(new BigInt64Array(sab), slot);
  const dv = new DataView(new ArrayBuffer(8));
  dv.setBigInt64(0, big, true);
  return dv.getFloat64(0, true);
}

test('Slide Rule Kernel processes 5-track tokens and verifies 2-of-5 combinatorial constraints', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const compliantToken = "omi-ffff-0002-0000-0000-02d0-0000-0000-0000/48";
  const resultCell = kernel.evaluateCircularSlideRule(compliantToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.accepted, true);
  assert.equal(meta.activeTrackCount, 2);
  assert.equal(meta.track3, 0x02D0);
});

test('Slide Rule Kernel accurately computes mechanical cross-join angles down to shared memory slots', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const activeToken = "omi-ffff-0000-0000-0000-02d0-0036-0000-0000/48";
  const resultCell = kernel.evaluateCircularSlideRule(activeToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.computedSlideAngle, 3600);
  assert.equal(meta.targetMemorySlot, 0x0036 % 5040);

  const storedData = loadFloat64FromSAB(sab, meta.targetMemorySlot);
  assert.equal(storedData, 3600);
});

test('Slide Rule Kernel rejects malformed tokens', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const resultCell = kernel.evaluateCircularSlideRule("not-an-omi-token");
  const meta = kernel.car(resultCell);
  assert.equal(meta.accepted, false);
});

test('Slide Rule Kernel detects terminal fractal depth at 0x0007', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const terminalToken = "omi-ffff-0002-0000-0000-0000-0000-0007-0000/48";
  const resultCell = kernel.evaluateCircularSlideRule(terminalToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.isTerminalFractalDepth, true);
  assert.equal(meta.accepted, true);
  assert.equal(meta.activeTrackCount, 2);
});

test('Slide Rule Kernel accepts IPv4-mapped ::ffff:0:0/96 prefix as default active pair', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const v4mappedToken = "omi-0000-0000-0000-0000-0000-ffff-0000-0000/48";
  const resultCell = kernel.evaluateCircularSlideRule(v4mappedToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.accepted, true);
  assert.equal(meta.isIPv4MappedPair, true);
  assert.equal(meta.track4, 0xFFFF);
  assert.equal(meta.activeTrackCount, 1);

  const storedData = loadFloat64FromSAB(sab, meta.targetMemorySlot);
  assert.equal(storedData, 1.0);
});

test('Slide Rule Kernel accepts embedded IPv4 addr in ::ffff:c0a8:0101 mapping', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const v4mappedToken = "omi-0000-0000-0000-0000-0000-ffff-c0a8-0101/48";
  const resultCell = kernel.evaluateCircularSlideRule(v4mappedToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.accepted, true);
  assert.equal(meta.isIPv4MappedPair, true);
  assert.equal(meta.track4, 0xFFFF);
  assert.equal(meta.track5, 0xC0A8);
  assert.equal(meta.activeTrackCount, 2);
});

test('Slide Rule Kernel evaluates RFC 4193 ULA fc00::/7 compliance', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const ulaToken = "omi-fc00-0000-0000-0000-0000-0000-0000-0000/7";
  const resultCell = kernel.evaluateCircularSlideRule(ulaToken);
  const meta = kernel.car(resultCell);

  assert.ok(meta.projective);
  assert.equal(meta.projective.isUlaCompliant, true);
  assert.equal(meta.projective.isIPv4Mapped, false);
  assert.equal(meta.projective.isDefaultLanFrame, false);
  assert.equal(meta.projective.isLocalhostPivot, false);

  const nonUlaToken = "omi-2001-0000-0000-0000-0000-0000-0000-0000/3";
  const nonResult = kernel.evaluateCircularSlideRule(nonUlaToken);
  assert.equal(kernel.car(nonResult).projective.isUlaCompliant, false);
});

test('Slide Rule Kernel detects default LAN 192.168.1.0/24 frame', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const lanToken = "omi-0000-0000-0000-0000-0000-ffff-c0a8-0101/48";
  const resultCell = kernel.evaluateCircularSlideRule(lanToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.projective.isDefaultLanFrame, true);
  assert.equal(meta.projective.isIPv4Mapped, true);
});

test('Slide Rule Kernel detects ::ffff:127.0.0.1 localhost pivot', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const localhostToken = "omi-0000-0000-0000-0000-0000-ffff-7f00-0001/128";
  const resultCell = kernel.evaluateCircularSlideRule(localhostToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.projective.isLocalhostPivot, true);
  assert.equal(meta.projective.isIPv4Mapped, true);
});

test('Slide Rule Kernel detects terminal bus ::8 loopback axis', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const loopbackToken = "omi-0000-0000-0000-0000-0000-0000-0000-0008/128";
  const resultCell = kernel.evaluateCircularSlideRule(loopbackToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.projective.isLocalhostPivot, true);
});

test('Slide Rule Kernel detects 0x7C00 boot execution entry point', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const bootToken = "omi-0000-7c00-0000-0000-0000-0000-0000-0000/32";
  const resultCell = kernel.evaluateCircularSlideRule(bootToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.boot.isBootEntryReached, true);
  assert.equal(meta.boot.isUlaCompliant, false);
  assert.equal(meta.boot.isSignatureValidated, false);
  assert.equal(meta.boot.isMonolithicBootActive, false);
});

test('Slide Rule Kernel detects 0xAA55 boot signature', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const sigToken = "omi-0000-0000-0000-0000-0000-0000-0000-aa55/128";
  const resultCell = kernel.evaluateCircularSlideRule(sigToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.boot.isSignatureValidated, true);
  assert.equal(meta.boot.isBootEntryReached, false);
});

test('Slide Rule Kernel validates monolithic hardware boot (fc00 + 7c00 + aa55)', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const monoToken = "omi-fc00-7c00-0000-0000-0000-0000-0000-aa55/128";
  const resultCell = kernel.evaluateCircularSlideRule(monoToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.boot.isUlaCompliant, true);
  assert.equal(meta.boot.isBootEntryReached, true);
  assert.equal(meta.boot.isSignatureValidated, true);
  assert.equal(meta.boot.isMonolithicBootActive, true);
  assert.equal(meta.boot.targetBootSlotOffset, 0x7C00 % 5040);
});

test('Slide Rule Kernel rejects boot when any invariant is missing', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const partialToken = "omi-fc00-7c00-0000-0000-0000-0000-0000-0000/128";
  const resultCell = kernel.evaluateCircularSlideRule(partialToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.boot.isUlaCompliant, true);
  assert.equal(meta.boot.isBootEntryReached, true);
  assert.equal(meta.boot.isSignatureValidated, false);
  assert.equal(meta.boot.isMonolithicBootActive, false);
});

test('Slide Rule Kernel matches decodetree instruction pattern', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const insn = 0x039F5A3C;
  const segs = [0x039F, 0x5A3C, 0, 0, 0, 0, 0, 0];
  const result = kernel.evaluateQemuSubstrate(segs, insn, 60);

  assert.equal(result.isDecodetreeMatch, true);
  assert.equal(result.isParallelMttcgActive, false);
  assert.equal(result.isClockTreeSynchronized, false);
  assert.equal(result.isHardwareSubstrateSecure, false);
});

test('Slide Rule Kernel validates MTTCG parallel lane sync', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const mttcgToken = "omi-0000-0000-5a3c-0001-0000-0000-0000-0000/48";
  const resultCell = kernel.evaluateCircularSlideRule(mttcgToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.qemu.isParallelMttcgActive, true);
});

test('Slide Rule Kernel validates QOM clock tree synchronization', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const clockToken = "omi-0000-0000-0000-0000-0000-0000-0000-003c/128";
  const resultCell = kernel.evaluateCircularSlideRule(clockToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.qemu.isClockTreeSynchronized, true);
});

test('Slide Rule Kernel validates full hardware substrate security', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const segs = [0x039F, 0x5A3C, 0x5A3C, 0, 0, 0, 0, 0x003C];
  const insn = 0x039F5A3C;
  const result = kernel.evaluateQemuSubstrate(segs, insn, 60);

  assert.equal(result.isDecodetreeMatch, true);
  assert.equal(result.isParallelMttcgActive, true);
  assert.equal(result.isClockTreeSynchronized, true);
  assert.equal(result.isHardwareSubstrateSecure, true);
});

test('Slide Rule Kernel detects atomic acquire memory fence', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const fenceToken = "omi-ffff-0000-0000-0000-0000-0000-0000-00a0/128";
  const resultCell = kernel.evaluateCircularSlideRule(fenceToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.atomic.isAcquireFenceActive, true);
});

test('Slide Rule Kernel enforces QemuLockCnt reader protection', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const segs = [0, 0, 0, 0, 3, 0, 0, 0];
  const locked = kernel.evaluateAtomicSubstrate(segs, 3, 0, 0);
  assert.equal(locked.isLockCntMemoryLocked, true);
  assert.equal(locked.isSafeToMutateMemory, false);

  const segsZero = [0, 0, 0, 0, 0, 0, 0, 0];
  const unlocked = kernel.evaluateAtomicSubstrate(segsZero, 0, 0, 0);
  assert.equal(unlocked.isLockCntMemoryLocked, false);
  assert.equal(unlocked.isSafeToMutateMemory, true);
});

test('Slide Rule Kernel validates virt-ctrl MMIO register mapping', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const ctrlToken = "omi-0000-0000-0000-0000-0000-0c00-0000-0000/96";
  const resultCell = kernel.evaluateCircularSlideRule(ctrlToken);
  const meta = kernel.car(resultCell);

  assert.equal(meta.atomic.isVirtCtrlMapped, true);
});

test('Slide Rule Kernel catches hardware panic eviction command', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const segs = [0, 0, 0, 0, 0, 0x0C00, 0x0004, 3];
  const panic = kernel.evaluateAtomicSubstrate(segs, 0, 0x0004, 3);

  assert.equal(panic.executedHypervisorAction, "HARDWARE_CRITICAL_PANIC_EVICTION");
  assert.equal(panic.isSystemFaultDetected, true);
  assert.equal(panic.isAtomicFabricSecure, false);
});

test('Slide Rule Kernel rejects empty and null inputs', (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalSlideRuleKernel(sab);

  const nullResult = kernel.evaluateCircularSlideRule(null);
  assert.equal(kernel.car(nullResult).accepted, false);

  const emptyResult = kernel.evaluateCircularSlideRule("");
  assert.equal(kernel.car(emptyResult).accepted, false);
});
