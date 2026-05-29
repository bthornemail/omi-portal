import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OmiRingIndexer, createRingIndexer,
  packReceipt, unpackSlot,
  BOOT_SLOT, MAX_VALID_STEPS,
  SLOT_DIVIDEND_MASK, SLOT_STEPS_MASK
} from '../src/omi/ring-indexer.js';

describe('RingIndexer: slot packing', () => {
  it('packReceipt encodes truth row with steps and provenance', () => {
    const truthRow = (1n << 32n) | (0x7C00n << 16n) | 0x1434n;
    const packed = packReceipt(truthRow, 1, 0xABCDn);
    const unpacked = unpackSlot(packed);
    assert.equal(unpacked.provenance, 0xABCD);
    assert.equal(unpacked.steps, 1);
    assert.equal(unpacked.LL, 1);
    assert.equal(unpacked.NN, 0x7C00);
    assert.equal(unpacked.MM, 0x1434);
  });

  it('packReceipt clamps steps to MAX_VALID_STEPS', () => {
    const truthRow = (2n << 32n) | 0x1234n;
    const packed = packReceipt(truthRow, 99, 0n);
    assert.equal(unpackSlot(packed).steps, MAX_VALID_STEPS);
  });

  it('unpackSlot extracts zero-provenance receipt', () => {
    const truthRow = (5n << 32n) | (0xDEADn << 16n) | 0xBEEFn;
    const packed = packReceipt(truthRow, 7, 0n);
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
    const ring = new OmiRingIndexer();
    const truthRow = (1n << 32n) | (0x7C00n << 16n) | 0x1434n;
    const packed = packReceipt(truthRow, 1, 0xA5A5n);
    ring.writeSlot(0, packed);
    const slot = ring.readSlot(0);
    const extracted = Number((slot >> 48n) & 0xFFFFn);
    assert.equal(extracted, 0xA5A5);
  });

  it('steps occupies bits 47-40, leaving 24-bit dividend total', () => {
    const truthRow = (1n << 32n) | (0x7C00n << 16n) | 0x1434n;
    const packed = packReceipt(truthRow, 3, 0xABn);
    const steps = Number((packed >> 40n) & 0xFFn);
    const provenance = Number((packed >> 48n) & 0xFFFFn);
    assert.equal(steps, 3);
    assert.equal(provenance, 0xAB);
  });
});
