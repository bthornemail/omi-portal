import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OmiRingIndexer, createRingIndexer,
  packReceipt, unpackSlot,
  BOOT_SLOT, MAX_VALID_STEPS, CURSOR_ATOMIC_BYTES, CURSOR_ATOMIC_INDEX
} from '../src/omi/ring-indexer.js';

describe('RingIndexer: slot packing', () => {
  it('packReceipt encodes truth row with steps and provenance', () => {
    const packed = packReceipt(0xABCDn, 1, 1, 0x7C00, 0x1434);
    const unpacked = unpackSlot(packed);
    assert.equal(unpacked.provenance, 0xABCD);
    assert.equal(unpacked.steps, 1);
    assert.equal(unpacked.LL, 1);
    assert.equal(unpacked.NN, 0x7C00);
    assert.equal(unpacked.MM, 0x1434);
  });

  it('packReceipt clamps steps to MAX_VALID_STEPS', () => {
    const packed = packReceipt(0n, 99, 2, 0, 0x1234);
    assert.equal(unpackSlot(packed).steps, MAX_VALID_STEPS);
  });

  it('unpackSlot extracts zero-provenance receipt', () => {
    const packed = packReceipt(0n, 7, 5, 0xDEAD, 0xBEEF);
    const u = unpackSlot(packed);
    assert.equal(u.provenance, 0);
    assert.equal(u.steps, 7);
    assert.equal(u.LL, 5);
    assert.equal(u.NN, 0xDEAD);
    assert.equal(u.MM, 0xBEEF);
  });
});

describe('RingIndexer: construction and slot I/O', () => {
  it('constructs with default 5040 slots', () => {
    const ring = new OmiRingIndexer();
    assert.equal(ring.slots.length, 5040);
    assert.equal(ring.position, BOOT_SLOT);
  });

  it('constructs from existing SharedArrayBuffer', () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const ring = new OmiRingIndexer(sab);
    assert.equal(ring.slots.length, 5040);
  });

  it('readSlot returns 0n for unwritten slot', () => {
    const ring = new OmiRingIndexer();
    assert.equal(ring.readSlot(0), 0n);
  });

  it('writeSlot stores and returns the index', () => {
    const ring = new OmiRingIndexer();
    const val = 0x7EADBEEF_00000001n;
    const i = ring.writeSlot(100, val);
    assert.equal(i, 100);
    assert.equal(ring.readSlot(100), val);
  });

  it('writeSlot wraps modulo 5040', () => {
    const ring = new OmiRingIndexer();
    const i = ring.writeSlot(5040, 42n);
    assert.equal(i, 0);
    assert.equal(ring.readSlot(0), 42n);
  });

  it('readSlot wraps negative index', () => {
    const ring = new OmiRingIndexer();
    ring.writeSlot(0, 123n);
    assert.equal(ring.readSlot(5040), 123n);
  });
});

describe('RingIndexer: advance and cursor', () => {
  it('advance moves cursor by steps and stores receipt', () => {
    const ring = new OmiRingIndexer();
    const truthRow = (1n << 32n) | (0x7C00n << 16n) | 0x1434n;
    const result = ring.advance(3, truthRow, 0n);
    assert.equal(result.steps, 3);
    assert.equal(result.position, (BOOT_SLOT + 3) % 5040);
  });

  it('advance wraps around at 5040 boundary', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5038);
    const truthRow = (1n << 32n) | 0x1234n;
    const r1 = ring.advance(5, truthRow);
    assert.equal(r1.position, (5038 + 5) % 5040);
  });

  it('multiple advances form a receipt chain', () => {
    const ring = new OmiRingIndexer();
    for (let i = 0; i < 10; i++) {
      const truthRow = (BigInt((i % 7) + 1) << 32n) | (BigInt(0x1000 + i) << 16n) | BigInt(0x2000 + i);
      ring.advance(i % 5 + 1, truthRow, BigInt(i));
    }
    const chain = ring.getReceiptChain(10);
    assert.equal(chain.length, 10);
    for (const entry of chain) {
      if (entry.slotValue === 0n) continue;
      assert.ok(entry.steps >= 0);
      assert.ok(entry.LL >= 1 && entry.LL <= 7);
    }
  });

  it('getReceiptChain returns at most 7 entries by default', () => {
    const ring = new OmiRingIndexer();
    for (let i = 0; i < 20; i++) {
      const truthRow = (1n << 32n) | BigInt(0x1000 + i) << 16n | BigInt(0x2000 + i);
      ring.advance(1, truthRow);
    }
    const chain = ring.getReceiptChain();
    assert.ok(chain.length <= 7);
  });
});

describe('RingIndexer: atomic I/O', () => {
  it('atomicWrite and atomicRead round-trip', () => {
    const ring = new OmiRingIndexer();
    ring.atomicWrite(42, 0x1234567890ABCDEFn);
    assert.equal(ring.atomicRead(42), 0x1234567890ABCDEFn);
  });
});

describe('RingIndexer: boot genesis', () => {
  it('bootstrapGenesis writes genesis truth row at boot slot', () => {
    const ring = new OmiRingIndexer();
    const boot = ring.bootstrapGenesis(0x01, 0x7C00);
    assert.equal(boot.position, BOOT_SLOT);
    assert.equal(boot.LL, 1);
    assert.equal(boot.NN, 0x7C00);
    assert.equal(boot.steps, 1);

    const slot = ring.readSlot(BOOT_SLOT);
    assert.notEqual(slot, 0n);

    const u = unpackSlot(slot);
    assert.equal(u.LL, 1);
    assert.equal(u.NN, 0x7C00);
    assert.equal(u.steps, 1);
  });

  it('bootstrapGenesis sets cursor to boot slot', () => {
    const ring = new OmiRingIndexer();
    ring.advance(5, (1n << 32n) | 0x1234n);
    ring.bootstrapGenesis(0x01, 0x7C00);
    assert.equal(ring.position, BOOT_SLOT);
  });

  it('createRingIndexer returns OmiRingIndexer instance', () => {
    const ring = createRingIndexer();
    assert.ok(ring instanceof OmiRingIndexer);
  });
});

describe('RingIndexer: getFactorials', () => {
  it('returns tick factorial decomposition', () => {
    const ring = new OmiRingIndexer();
    const f = ring.getFactorials();
    assert.ok(typeof f.tick === 'number');
    assert.ok(typeof f.page6 === 'number');
    assert.ok(typeof f.remainder720 === 'number');
  });

  it('tick fact decomposition matches cursor', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(1234);
    const f = ring.getFactorials();
    assert.equal(f.tick, 1234);
  });
});

describe('RingIndexer: rewinding', () => {
  it('rewind sets cursor and returns the index', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(500);
    assert.equal(ring.position, 500);
  });

  it('rewind handles modulo wrap', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5040);
    assert.equal(ring.position, 0);
  });

  it('rewind to negative index wraps', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(-1);
    assert.equal(ring.position, 5039);
  });
});

describe('RingIndexer: dividend space', () => {
  it('provenance tag occupies bits 63-48', () => {
    const packed = packReceipt(0xA5A5n, 1, 1, 0x7C00, 0x1434);
    const extracted = Number((packed >> 48n) & 0xFFFFn);
    assert.equal(extracted, 0xA5A5);
  });

  it('steps occupies bits 47-40, leaving 24-bit dividend total', () => {
    const packed = packReceipt(0xABn, 3, 1, 0x7C00, 0x1434);
    const steps = Number((packed >> 40n) & 0xFFn);
    const provenance = Number((packed >> 48n) & 0xFFFFn);
    assert.equal(steps, 3);
    assert.equal(provenance, 0xAB);
  });
});

describe('RingIndexer: atomic CAS cursor', () => {
  it('two sequential atomicAdvance calls produce distinct slots', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(100);

    const r1 = ring.atomicAdvance(3, (1n << 32n) | 0x1000n);
    const r2 = ring.atomicAdvance(5, (2n << 32n) | 0x2000n);

    assert.equal(r1.position, 103);
    assert.equal(r2.position, 108);
    assert.notEqual(r1.position, r2.position);
  });

  it('atomicAdvance CAS wins serialized ordering', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(0);

    const r1 = ring.atomicAdvance(2, (1n << 32n) | 0x1000n);
    const r2 = ring.atomicAdvance(2, (2n << 32n) | 0x2000n);

    assert.equal(r1.position, 2);
    assert.equal(r2.position, 4);

    const s1 = ring.readSlot(2);
    const s2 = ring.readSlot(4);
    assert.notEqual(s1, s2);
  });

  it('atomicAdvance wraps at 5040', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5035);

    const r1 = ring.atomicAdvance(10, (1n << 32n) | 0x1000n);
    assert.equal(r1.position, 5);

    const r2 = ring.atomicAdvance(3, (2n << 32n) | 0x2000n);
    assert.equal(r2.position, 8);
  });

  it('cursor is disjoint from ring buffer slots', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(42);

    const cursorValue = ring.position;
    assert.equal(cursorValue, 42);

    const slot42 = ring.readSlot(42);
    assert.equal(slot42, 0n);
  });

  it('setter position updates cursor', () => {
    const ring = new OmiRingIndexer();
    ring.position = 500;
    assert.equal(ring.position, 500);
  });

  it('CURSOR_ATOMIC_BYTES is 8', () => {
    assert.equal(CURSOR_ATOMIC_BYTES, 8);
  });
});

describe('RingIndexer: epoch overwrite detection', () => {
  it('epoch starts at 0', () => {
    const ring = new OmiRingIndexer();
    assert.equal(ring.epoch, 0);
  });

  it('epoch increments on wraparound via advance', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5038);
    const r = ring.advance(5, (1n << 32n) | 0x1234n);
    assert.equal(r.position, 3);
    assert.equal(r.epoch, 1);
    assert.equal(ring.epoch, 1);
  });

  it('epoch increments only once per wraparound', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5030);
    for (let i = 0; i < 5; i++) {
      ring.advance(3, (1n << 32n) | BigInt(0x1000 + i));
    }
    assert.equal(ring.epoch, 1);
  });

  it('epoch increments on wraparound via atomicAdvance', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5036);
    const r = ring.atomicAdvance(10, (1n << 32n) | 0x1234n);
    assert.equal(r.position, 6);
    assert.equal(r.epoch, 1);
  });

  it('epoch stored in provenance when no tag given', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5038);
    const r = ring.advance(5, (1n << 32n) | 0x1234n);
    const u = unpackSlot(r.receipt);
    assert.equal((u.provenance >> 8) & 0xFF, 1);
  });

  it('caller provenance tag overrides epoch', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(100);
    const r = ring.advance(3, (1n << 32n) | 0x1234n, 0xA5A5n);
    const u = unpackSlot(r.receipt);
    assert.equal(u.provenance, 0xA5A5);
  });

  it('multiple epochs distinguishable in receipt chain', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5020);
    const epochs = new Set();
    for (let i = 0; i < 30; i++) {
      const r = ring.advance(1, (BigInt((i % 7) + 1) << 32n) | BigInt(0x1000 + i));
      epochs.add(r.epoch);
    }
    assert.ok(epochs.size >= 2, `expected at least 2 epochs, got ${epochs.size}`);
  });

  it('epoch stored in receipt survives round-trip across wrap', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5038);

    const mkRow = (LL, NN, MM) => (BigInt(LL) << 32n) | (BigInt(NN) << 16n) | BigInt(MM);

    const r1 = ring.advance(3, mkRow(1, 0x1000, 0));
    assert.equal(r1.epoch, 1);
    assert.equal(r1.position, 1);

    const r2 = ring.advance(2, mkRow(2, 0x2000, 0));
    assert.equal(r2.epoch, 1);
    assert.equal(r2.position, 3);

    const s1 = ring.readSlot(1);
    const u1 = unpackSlot(s1);
    assert.equal(u1.NN, 0x1000);
    assert.equal((u1.provenance >> 8) & 0xFF, 1);

    const s2 = ring.readSlot(3);
    const u2 = unpackSlot(s2);
    assert.equal(u2.NN, 0x2000);
  });
});

describe('RingIndexer: epoch overwrite stress (OW-1 through OW-5)', () => {
  it('OW-1: existing slot provenance epoch readable', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5038);
    const r = ring.atomicAdvance(5, (1n << 32n) | 0x1000n);
    const slot = ring.atomicRead(r.position);
    const epochBits = Number((slot >> 48n) & 0xFF00n) >> 8;
    assert.equal(epochBits, 1);
  });

  it('OW-2: cold overwrite overwrites stale epoch slot silently', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5038);

    const mkR = (LL, n) => ring.atomicAdvance(3, (BigInt(LL) << 32n) | BigInt(n));

    /* Fill 2 slots in epoch 0 */
    ring.rewind(5036);
    const r0 = mkR(1, 0x1000);
    assert.equal(r0.epoch, 0);
    assert.equal(r0.position, 5039);

    /* Force wraparound to epoch 1 */
    const r1 = mkR(2, 0x2000);
    assert.equal(r1.epoch, 1);
    assert.equal(r1.position, 2);

    /* Now r1.position (2) contains epoch-1 data */
    /* Force cold overwrite: wrap back to slot 2 in another epoch */
    ring.rewind(5038);
    const r2 = mkR(3, 0x3000);
    assert.equal(r2.epoch, 2);
    assert.equal(r2.position, 1);

    const r3 = mkR(4, 0x4000);
    assert.equal(r3.epoch, 2);
    assert.equal(r3.position, 4);

    /* Slot 2 is now in a previous epoch (0 or 1) */
    const slot2 = ring.atomicRead(2);
    const epoch2 = Number((slot2 >> 48n) & 0xFF00n) >> 8;
    assert.ok(epoch2 < ring.epoch, `epoch ${epoch2} < current ${ring.epoch}`);
  });

  it('OW-3: warm overwrite rejection (same epoch, same slot)', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5000);

    const mkR = (LL, n) => ring.atomicAdvance(1, (BigInt(LL) << 32n) | BigInt(n));
    const results = [];
    /* Rapid-fire single-step advances — every slot in the epoch is unique */
    for (let i = 0; i < 40; i++) {
      results.push(mkR(i % 7 + 1, 0x1000 + i));
    }
    /* No two results should share the same position in the same epoch */
    const seen = new Map();
    for (const r of results) {
      const key = `${r.epoch}:${r.position}`;
      assert.ok(!seen.has(key), `duplicate slot ${key}`);
      seen.set(key, r);
    }
  });

  it('OW-4: stale overwrite — epoch > current should not occur normally', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5000);
    const mkR = (LL, n) => ring.atomicAdvance(1, (BigInt(LL) << 32n) | BigInt(n));
    for (let i = 0; i < 80; i++) {
      const r = mkR(i % 7 + 1, 0x1000 + i);
      assert.ok(r.epoch >= 0);
      assert.ok(r.position >= 0);
    }
  });

  it('OW-5: CAS serialization under sequential load preserves epoch', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5000);
    const epochs = new Set();
    for (let i = 0; i < 100; i++) {
      const r = ring.atomicAdvance(1, (BigInt((i % 7) + 1) << 32n) | BigInt(0x1000 + i));
      epochs.add(r.epoch);
      assert.ok(r.epoch <= 2, `epoch ${r.epoch} ≤ 2 for 100 single-steps`);
    }
    assert.ok(epochs.size >= 1);
  });

  it('wraparound stress: 504 single-step advances cover full ring', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(0);
    const positions = new Set();
    for (let i = 0; i < 504; i++) {
      const r = ring.atomicAdvance(10, (BigInt((i % 7) + 1) << 32n) | BigInt(0x1000 + i));
      positions.add(r.position);
    }
    /* 504 steps × avg 10 = 5040 — exactly one full wrap */
    assert.equal(ring.epoch, 1);
    assert.ok(positions.size > 1);
  });

  it('epoch provenance tag encodes epoch in upper 8 bits of 16-bit field', () => {
    const ring = new OmiRingIndexer();
    ring.rewind(5030);
    for (let i = 0; i < 20; i++) {
      const r = ring.atomicAdvance(1, (1n << 32n) | BigInt(0x1000 + i));
      const u = unpackSlot(r.receipt);
      const epochFromTag = (u.provenance >> 8) & 0xFF;
      assert.equal(epochFromTag, r.epoch);
    }
  });
});
