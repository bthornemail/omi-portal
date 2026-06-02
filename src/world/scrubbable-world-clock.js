export const MAX_TICK = 5040;

export class ScrubbableWorldClock {
  #tick;
  #epoch;
  #paused;
  #scrubbing;
  #listeners;
  #world;

  constructor(world, options = {}) {
    this.#tick = options.tick ?? 0;
    this.#epoch = options.epoch ?? 0;
    this.#paused = false;
    this.#scrubbing = false;
    this.#listeners = { tick: [], scrub: [], pause: [], resume: [] };
    this.#world = world || null;
  }

  get tick() { return this.#tick; }
  get epoch() { return this.#epoch; }
  get isPaused() { return this.#paused; }
  get isScrubbing() { return this.#scrubbing; }

  advance() {
    if (this.#paused) return this.#tick;
    this.#tick++;
    if (this.#tick >= MAX_TICK) {
      this.#tick = 0;
      this.#epoch++;
    }
    if (this.#world && typeof this.#world.advance === 'function') {
      this.#world.advance();
    }
    this._emit('tick', { tick: this.#tick, epoch: this.#epoch });
    return this.#tick;
  }

  pause() {
    if (this.#paused) return;
    this.#paused = true;
    this.#scrubbing = false;
    this._emit('pause', { tick: this.#tick, epoch: this.#epoch });
  }

  resume() {
    if (!this.#paused) return;
    this.#paused = false;
    this.#scrubbing = false;
    this._emit('resume', { tick: this.#tick, epoch: this.#epoch });
  }

  scrubToTick(targetTick, targetEpoch) {
    const t = targetEpoch ?? this.#epoch;
    const clampedTick = Math.max(0, Math.min(MAX_TICK - 1, targetTick));
    this.#scrubbing = true;
    this.#tick = clampedTick;
    this.#epoch = t;
    this._emit('scrub', { tick: this.#tick, epoch: this.#epoch, target: 'tick' });
  }

  scrubToReceipt(receiptIndex, world) {
    const w = world || this.#world;
    if (!w || !w.replayReceipts) return;
    const receipts = w.replayReceipts;
    if (receiptIndex < 0 || receiptIndex >= receipts.length) return;
    const r = receipts[receiptIndex];
    this.#scrubbing = true;
    if (r.tick != null) this.#tick = r.tick;
    if (r.epoch != null) this.#epoch = r.epoch;
    this._emit('scrub', {
      tick: this.#tick, epoch: this.#epoch,
      target: 'receipt', receiptIndex, receipt: r
    });
  }

  scrubToMotif(motifName, world) {
    const w = world || this.#world;
    if (!w || !w.replayReceipts) return;
    for (let i = 0; i < w.replayReceipts.length; i++) {
      const r = w.replayReceipts[i];
      const text = JSON.stringify(r).toLowerCase();
      if (text.includes(motifName.toLowerCase())) {
        this.scrubToReceipt(i, w);
        return;
      }
    }
  }

  on(event, callback) {
    if (this.#listeners[event]) {
      this.#listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (!this.#listeners[event]) return;
    this.#listeners[event] = this.#listeners[event].filter(cb => cb !== callback);
  }

  _emit(event, data) {
    for (const cb of (this.#listeners[event] || [])) {
      cb(data);
    }
  }
}
