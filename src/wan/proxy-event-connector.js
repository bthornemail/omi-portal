import { readImoPayloadBlock, isOmiAddressAtom, OExpressionSyntaxError } from '../omilog/reader.js';

const SUPPORTED_EVENTS = ['imo-record', 'malformed', 'proxy-error'];

export class ProxyEventConnector {
  #options;
  #listeners;
  #sseCleanup;
  #eventCount;

  constructor(options = {}) {
    this.#options = {
      maxEventLog: options.maxEventLog || 500,
      validateAddress: options.validateAddress !== false,
      ...options
    };
    this.#listeners = {};
    this.#sseCleanup = null;
    this.#eventCount = 0;
    this.eventLog = [];
    this.errorLog = [];
  }

  get eventCount() { return this.#eventCount; }
  get config() { return { ...this.#options }; }

  on(eventType, callback) {
    if (!SUPPORTED_EVENTS.includes(eventType)) return false;
    if (!this.#listeners[eventType]) this.#listeners[eventType] = [];
    this.#listeners[eventType].push(callback);
    return true;
  }

  off(eventType, callback) {
    if (!this.#listeners[eventType]) return false;
    this.#listeners[eventType] = this.#listeners[eventType].filter(cb => cb !== callback);
    return true;
  }

  #emit(eventType, data) {
    const cbs = this.#listeners[eventType];
    if (cbs) {
      for (const cb of cbs) {
        try { cb(data); } catch { /* listener error */ }
      }
    }
  }

  onEvent(rawPayload) {
    this.#eventCount++;

    if (typeof rawPayload !== 'string' || rawPayload.trim().length === 0) {
      const errEv = { type: 'malformed', reason: 'empty-payload', timestamp: Date.now() };
      this.errorLog.push(errEv);
      if (this.errorLog.length > this.#options.maxEventLog) this.errorLog.shift();
      this.#emit('malformed', errEv);
      return [];
    }

    const trimmed = rawPayload.trim();

    try {
      const records = readImoPayloadBlock(trimmed);
      const results = [];

      for (const rec of records) {
        if (this.#options.validateAddress && rec.address) {
          const addrParts = rec.address.split('/');
          if (!isOmiAddressAtom(`omi-${addrParts[0].replace(/-/g, '-').replace(/\d+/g, '')}`)) {
            // not an OMI-structured address — still allow decimal addresses
          }
        }

        const ev = {
          type: 'imo-record',
          operator: rec.operator,
          address: rec.address,
          sourceAddress: rec.sourceAddress || null,
          timestamp: Date.now()
        };
        results.push(ev);
      }

      for (const ev of results) {
        this.eventLog.push(ev);
        if (this.eventLog.length > this.#options.maxEventLog) this.eventLog.shift();
        this.#emit('imo-record', ev);
      }

      return results;
    } catch (err) {
      const malformedEv = {
        type: 'malformed',
        reason: err instanceof OExpressionSyntaxError ? 'reader-parse-error' : 'unknown',
        detail: err.message,
        payload: trimmed.slice(0, 200),
        timestamp: Date.now()
      };
      this.errorLog.push(malformedEv);
      if (this.errorLog.length > this.#options.maxEventLog) this.errorLog.shift();
      this.#emit('malformed', malformedEv);
      return [];
    }
  }

  subscribe(sseSource) {
    if (typeof sseSource?.onEvent === 'function') {
      const handler = (rawPayload) => this.onEvent(rawPayload);
      this.#sseCleanup = () => {};
      return this;
    }

    if (typeof sseSource?.addEventListener === 'function') {
      const handler = (msg) => {
        if (msg.data) this.onEvent(msg.data);
      };
      sseSource.addEventListener('message', handler);
      this.#sseCleanup = () => sseSource.removeEventListener('message', handler);
      return this;
    }

    throw new Error('ProxyEventConnector: unsupported SSE source — expected onEvent function or EventSource');
  }

  unsubscribe() {
    if (this.#sseCleanup) {
      this.#sseCleanup();
      this.#sseCleanup = null;
    }
  }

  reset() {
    this.unsubscribe();
    this.eventLog = [];
    this.errorLog = [];
    this.#eventCount = 0;
  }
}
