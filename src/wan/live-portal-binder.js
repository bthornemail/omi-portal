import { ProxyEventConnector } from './proxy-event-connector.js';
import { LiveVoxelStream } from '../canvas/live-voxel-stream.js';

export const DEFAULT_SSE_ENDPOINT = '/stream';
export const VOXEL_BATCH_EVENT = 'voxel:batch';
export const VOXEL_UPDATE_EVENT = 'voxel:update';
export const VOXEL_REMOVE_EVENT = 'voxel:remove';

export class OmiLivePortalBinder {
  #connector;
  #voxelStream;
  #sseSource;
  #sseListener;

  constructor(options = {}) {
    this.#connector = new ProxyEventConnector(options.connector || {});
    this.#voxelStream = new LiveVoxelStream(options.voxelStream || {});
    this.#sseSource = null;
    this.#sseListener = null;
    this.connected = false;
    this.domTarget = options.domTarget || null;
    // Always pipe connector events through the voxel stream
    this.#connector.on('imo-record', (ev) => {
      this.#voxelStream.ingest([ev]);
    });
  }

  get connector() { return this.#connector; }
  get voxelStream() { return this.#voxelStream; }
  get eventCount() { return this.#connector.eventCount; }
  get voxelCount() { return this.#voxelStream.voxelCount; }

  initializeLiveBinding(sseEndpointUrl) {
    if (this.connected) return;
    const url = sseEndpointUrl || DEFAULT_SSE_ENDPOINT;

    this.#voxelStream.on('voxel:batch', (batch) => {
      this.#dispatchDomEvent(VOXEL_BATCH_EVENT, batch);
      for (const update of batch.updates) {
        this.#dispatchDomEvent(VOXEL_UPDATE_EVENT, update);
      }
      for (const removal of batch.removals) {
        this.#dispatchDomEvent(VOXEL_REMOVE_EVENT, removal);
      }
    });

    if (typeof EventSource !== 'undefined') {
      try {
        this.#sseSource = new EventSource(url);
        this.#sseSource.onmessage = (msg) => {
          if (msg.data) this.#connector.onEvent(msg.data);
        };
        this.#sseSource.onerror = () => {
          this.#dispatchDomEvent('proxy-error', {
            type: 'proxy-error',
            reason: 'sse-connection-error',
            timestamp: Date.now()
          });
        };
        this.connected = true;
      } catch (err) {
        this.#dispatchDomEvent('proxy-error', {
          type: 'proxy-error',
          reason: 'sse-init-failed',
          detail: err.message,
          timestamp: Date.now()
        });
      }
    }

    return this;
  }

  #dispatchDomEvent(eventType, detail) {
    try {
      const ev = new CustomEvent(eventType, { detail });
      const target = this.domTarget || (typeof document !== 'undefined' ? document : null);
      if (target) target.dispatchEvent(ev);
    } catch { /* silent */ }
  }

  disconnect() {
    if (this.#sseSource) {
      this.#sseSource.close();
      this.#sseSource = null;
    }
    this.connected = false;
  }

  reset() {
    this.disconnect();
    this.#connector.reset();
    this.#voxelStream.reset();
  }
}
