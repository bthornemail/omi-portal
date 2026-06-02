import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ipv4ToBytes,
  ipv4ToOmiAddress,
  ipv4ToFfffAddress,
  createNat64Event,
  createNat64SourceEvent,
  Nat64VirtualAdapter
} from '../src/wan/nat64-virtual-adapter.js';
import { isOmiAddressAtom, readImoRecord } from '../src/omilog/reader.js';

describe('OMI Portal: NAT64 Virtual Adapter (0xA0)', () => {

  describe('ipv4ToBytes', () => {
    it('converts a valid IPv4 address to 4 bytes', () => {
      const bytes = ipv4ToBytes('192.0.2.1');
      assert.deepEqual(bytes, [192, 0, 2, 1]);
    });

    it('returns null for malformed input', () => {
      assert.strictEqual(ipv4ToBytes('not-an-ip'), null);
      assert.strictEqual(ipv4ToBytes('256.0.0.1'), null);
      assert.strictEqual(ipv4ToBytes('1.2.3'), null);
    });
  });

  describe('ipv4ToOmiAddress', () => {
    it('maps 192.0.2.1 to an omi- address with NAT64 prefix', () => {
      const addr = ipv4ToOmiAddress('192.0.2.1');
      assert.ok(addr.startsWith('omi-64ff9b00'));
      assert.ok(addr.endsWith('/128'));
      assert.ok(isOmiAddressAtom(addr));
    });

    it('maps 10.0.0.1 correctly', () => {
      const addr = ipv4ToOmiAddress('10.0.0.1');
      assert.ok(addr.startsWith('omi-64ff9b00'));
      assert.ok(addr.includes('0a00'));
      assert.ok(addr.includes('0001'));
    });

    it('returns null for invalid IPv4', () => {
      assert.strictEqual(ipv4ToOmiAddress('bad'), null);
    });
  });

  describe('ipv4ToFfffAddress', () => {
    it('converts 192.0.2.1 to ffff format', () => {
      assert.strictEqual(ipv4ToFfffAddress('192.0.2.1'), '192-0-2-1');
    });

    it('converts 10.20.30.40', () => {
      assert.strictEqual(ipv4ToFfffAddress('10.20.30.40'), '10-20-30-40');
    });
  });

  describe('createNat64Event', () => {
    it('creates a valid event from an IPv4 address', () => {
      const ev = createNat64Event('192.0.2.1');
      assert.ok(ev);
      assert.strictEqual(ev.source, 'nat64-virtual');
      assert.strictEqual(ev.ipv4, '192.0.2.1');
      assert.ok(ev.omiAddress.startsWith('omi-'));
      assert.strictEqual(ev.ffffAddress, 'ffff-192-0-2-1/48');
      assert.strictEqual(ev.operator, '!');
      assert.ok(ev.timestamp > 0);
    });

    it('uses the specified operator', () => {
      const ev = createNat64Event('10.0.0.1', '=');
      assert.strictEqual(ev.operator, '=');
    });

    it('returns null for invalid IPv4', () => {
      assert.strictEqual(createNat64Event('bad'), null);
    });

    it('imoLine is parseable by readImoRecord', () => {
      const ev = createNat64Event('192.0.2.1');
      const parsed = readImoRecord(ev.imoLine);
      assert.strictEqual(parsed.operator, '!');
      assert.ok(parsed.address);
    });
  });

  describe('createNat64SourceEvent', () => {
    it('creates a source event block', () => {
      const ev = createNat64SourceEvent('192.0.2.1');
      assert.ok(ev);
      assert.strictEqual(ev.source, 'nat64-virtual');
      assert.ok(ev.imoBlock.includes('\x1e'));
      assert.ok(ev.imoBlock.includes('\x1f'));
    });

    it('includes two lines in the block', () => {
      const ev = createNat64SourceEvent('10.0.0.1', 'test-data');
      const lines = ev.imoBlock.split('\n').filter(l => l.trim());
      assert.strictEqual(lines.length, 2);
    });
  });

  describe('Nat64VirtualAdapter', () => {
    it('emits and records events', () => {
      const adapter = new Nat64VirtualAdapter();
      const ev1 = adapter.emit('192.0.2.1');
      const ev2 = adapter.emit('10.0.0.1', '=');
      assert.ok(ev1);
      assert.ok(ev2);
      assert.strictEqual(adapter.history.length, 2);
      assert.strictEqual(adapter.history[0].ipv4, '192.0.2.1');
      assert.strictEqual(adapter.history[1].ipv4, '10.0.0.1');
    });

    it('emits source events', () => {
      const adapter = new Nat64VirtualAdapter();
      const ev = adapter.emitSource('192.0.2.1', 'custom-payload');
      assert.ok(ev);
      assert.strictEqual(ev.sourceData, 'custom-payload');
    });

    it('reset clears history', () => {
      const adapter = new Nat64VirtualAdapter();
      adapter.emit('192.0.2.1');
      adapter.emit('10.0.0.1');
      assert.strictEqual(adapter.history.length, 2);
      adapter.reset();
      assert.strictEqual(adapter.history.length, 0);
    });

    it('respects maxLog limit', () => {
      const adapter = new Nat64VirtualAdapter({ maxLog: 3 });
      for (let i = 0; i < 10; i++) {
        adapter.emit(`192.0.2.${i}`);
      }
      assert.strictEqual(adapter.history.length, 3);
    });
  });
});
