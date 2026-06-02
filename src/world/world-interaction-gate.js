export const GATE_STATES = Object.freeze({
  IDLE: 'idle',
  INTERACTIVE: 'interactive',
  SCRUBBING: 'scrubbing'
});

export class WorldInteractionGate {
  #state;
  #clock;
  #timeoutDuration;
  #timeRemaining;
  #listeners;
  #idleTickInterval;

  constructor(clock, options = {}) {
    this.#state = GATE_STATES.IDLE;
    this.#clock = clock || null;
    this.#timeoutDuration = options.timeoutDuration ?? 120;
    this.#timeRemaining = 0;
    this.#idleTickInterval = options.idleTickInterval ?? 1;
    this.#listeners = { open: [], close: [], touch: [], timeout: [] };
  }

  get state() { return this.#state; }
  get isOpen() { return this.#state !== GATE_STATES.IDLE; }
  get timeRemaining() { return this.#timeRemaining; }
  get timeoutDuration() { return this.#timeoutDuration; }

  open() {
    if (this.#state === GATE_STATES.INTERACTIVE) return;
    this.#state = GATE_STATES.INTERACTIVE;
    this.#timeRemaining = this.#timeoutDuration;
    if (this.#clock && typeof this.#clock.pause === 'function') {
      this.#clock.pause();
    }
    this._emit('open', { state: this.#state, timeRemaining: this.#timeRemaining });
  }

  close() {
    if (this.#state === GATE_STATES.IDLE) return;
    const prevState = this.#state;
    this.#state = GATE_STATES.IDLE;
    this.#timeRemaining = 0;
    if (this.#clock && typeof this.#clock.resume === 'function') {
      this.#clock.resume();
    }
    this._emit('close', { previousState: prevState });
  }

  touch() {
    if (this.#state === GATE_STATES.IDLE) {
      this.open();
    }
    this.#timeRemaining = this.#timeoutDuration;
    this._emit('touch', { timeRemaining: this.#timeRemaining });
  }

  tick() {
    if (this.#state === GATE_STATES.IDLE) {
      if (this.#clock && typeof this.#clock.advance === 'function') {
        this.#clock.advance();
      }
      return GATE_STATES.IDLE;
    }

    this.#timeRemaining--;
    if (this.#timeRemaining <= 0) {
      this._emit('timeout', { state: this.#state });
      this.close();
      return GATE_STATES.IDLE;
    }
    return this.#state;
  }

  enterScrubMode() {
    if (this.#state === GATE_STATES.IDLE) {
      this.#state = GATE_STATES.SCRUBBING;
      if (this.#clock && typeof this.#clock.pause === 'function') {
        this.#clock.pause();
      }
    } else {
      this.#state = GATE_STATES.SCRUBBING;
    }
    this.#timeRemaining = this.#timeoutDuration;
    this._emit('open', { state: this.#state, timeRemaining: this.#timeRemaining });
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

  setTimeout(duration) {
    this.#timeoutDuration = duration;
  }

  _emit(event, data) {
    for (const cb of (this.#listeners[event] || [])) {
      cb(data);
    }
  }
}
