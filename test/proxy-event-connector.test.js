import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ProxyEventConnector
} from '../src/wan/proxy-event-connector.js';
import { readImoRecord, readImoPayloadBlock } from '../src/omilog/reader.js';

describe('OMI Portal: Proxy Event Connector (0xA0)', () => {

  describe('constructor and config', () => {
    it('creates a connector with default config', () => {
      const conn = new ProxyEventConnector();
      assert.ok(conn.config.maxEventLog >= 100);
      assert.strictEqual(conn.eventCount, 0);
    });

    it('accepts custom config', () => {
      const conn = new ProxyEventConnector({ maxEventLog: 10, validateAddress: false });
      assert.strictEqual(conn.config.maxEventLog, 10);
      assert.strictEqual(conn.config.validateAddress, false);
    });
  });

  describe('onEvent with valid .imo payload', () => {
    it('parses a single record', () => {
      const conn = new ProxyEventConnector();
      const results = conn.onEvent('ο !/65535-0-0-0-0-0-0-0/48 Ο');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].operator, '!');
      assert.strictEqual(results[0].address, '65535-0-0-0-0-0-0-0/48');
      assert.strictEqual(conn.eventCount, 1);
    });

    it('parses multiple records', () => {
      const conn = new ProxyEventConnector();
      const block = [
        'ο !/65535-0-0-0-0-0-0-0/48 Ο',
        'ο =/0-0-0-1-0-0-0-0/48 Ο',
        'ο )/0-0-0-0-0-0-121-49153/128 Ο'
      ].join('\n');
      const results = conn.onEvent(block);
      assert.strictEqual(results.length, 3);
      assert.strictEqual(conn.eventCount, 1);
    });

    it('attaches source address when present', () => {
      const conn = new ProxyEventConnector();
      const block = [
        'ο )/0-0-0-0-0-0-121-49153/128 Ο',
        'ο \x1e0-0-0-0-0-0-121-49153/128\x1f Ο'
      ].join('\n');
      const results = conn.onEvent(block);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].sourceAddress, '0-0-0-0-0-0-121-49153/128');
    });
  });

  describe('onEvent with malformed input', () => {
    it('handles empty payload gracefully', () => {
      const conn = new ProxyEventConnector();
      const results = conn.onEvent('');
      assert.deepEqual(results, []);
      assert.strictEqual(conn.errorLog.length, 1);
      assert.strictEqual(conn.errorLog[0].reason, 'empty-payload');
    });

    it('handles whitespace-only payload', () => {
      const conn = new ProxyEventConnector();
      const results = conn.onEvent('   \n  ');
      assert.deepEqual(results, []);
    });

    it('handles invalid .imo format', () => {
      const conn = new ProxyEventConnector();
      const results = conn.onEvent('this is not imo');
      assert.deepEqual(results, []);
      assert.strictEqual(conn.errorLog.length, 1);
      assert.strictEqual(conn.errorLog[0].type, 'malformed');
    });
  });

  describe('event listener system', () => {
    it('emits imo-record events', () => {
      const conn = new ProxyEventConnector();
      const events = [];
      conn.on('imo-record', (ev) => events.push(ev));
      conn.onEvent('ο !/0-0-0-0-0-0-0-0/48 Ο');
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].operator, '!');
    });

    it('emits malformed events on bad input', () => {
      const conn = new ProxyEventConnector();
      const malformed = [];
      conn.on('malformed', (ev) => malformed.push(ev));
      conn.onEvent('bad input');
      assert.strictEqual(malformed.length, 1);
    });

    it('can remove event listeners', () => {
      const conn = new ProxyEventConnector();
      const events = [];
      const cb = (ev) => events.push(ev);
      conn.on('imo-record', cb);
      conn.off('imo-record', cb);
      conn.onEvent('ο !/0-0-0-0-0-0-0-0/48 Ο');
      assert.strictEqual(events.length, 0);
    });

    it('rejects unsupported event types', () => {
      const conn = new ProxyEventConnector();
      assert.strictEqual(conn.on('unknown-event', () => {}), false);
    });
  });

  describe('SSE subscription', () => {
    it('subscribes to an object with onEvent method', () => {
      const conn = new ProxyEventConnector();
      const source = { onEvent: () => {} };
      assert.doesNotThrow(() => conn.subscribe(source));
      conn.unsubscribe();
    });

    it('subscribes to an EventSource-like object', () => {
      const conn = new ProxyEventConnector();
      const listeners = {};
      const source = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type, handler) => { delete listeners[type]; }
      };
      assert.doesNotThrow(() => conn.subscribe(source));
      assert.ok(listeners.message);
      conn.unsubscribe();
      assert.ok(!listeners.message);
    });

    it('throws for unknown source type', () => {
      const conn = new ProxyEventConnector();
      assert.throws(() => conn.subscribe('not-a-source'), /unsupported SSE source/);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      const conn = new ProxyEventConnector();
      conn.onEvent('ο !/0-0-0-0-0-0-0-0/48 Ο');
      conn.onEvent('bad');
      assert.strictEqual(conn.eventCount, 2);
      assert.strictEqual(conn.eventLog.length, 1);
      assert.strictEqual(conn.errorLog.length, 1);
      conn.reset();
      assert.strictEqual(conn.eventCount, 0);
      assert.strictEqual(conn.eventLog.length, 0);
      assert.strictEqual(conn.errorLog.length, 0);
    });
  });

  describe('integration with reader', () => {
    it('reads actual .imo file content', () => {
      const conn = new ProxyEventConnector();
      const block = [
        'ο !/65535-0-0-0-0-0-0-0/48 Ο',
        'ο !/927-0-0-0-0-0-0-0/48 Ο',
        'ο =/0-0-0-1-0-0-0-0/48 Ο'
      ].join('\n');
      const results = conn.onEvent(block);
      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].operator, '!');
      assert.strictEqual(results[1].operator, '!');
      assert.strictEqual(results[2].operator, '=');
    });
  });
});
