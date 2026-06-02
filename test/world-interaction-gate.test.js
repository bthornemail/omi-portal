import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WorldInteractionGate, GATE_STATES } from '../src/world/world-interaction-gate.js';
import { ScrubbableWorldClock } from '../src/world/scrubbable-world-clock.js';

describe('Slice 3: World Interaction Gate (0xA6)', () => {
  it('constructs in IDLE state', () => {
    const gate = new WorldInteractionGate();
    assert.strictEqual(gate.state, GATE_STATES.IDLE);
    assert.strictEqual(gate.isOpen, false);
  });

  it('open transitions to INTERACTIVE and pauses clock', () => {
    const clock = new ScrubbableWorldClock();
    const gate = new WorldInteractionGate(clock);
    gate.open();
    assert.strictEqual(gate.state, GATE_STATES.INTERACTIVE);
    assert.strictEqual(gate.isOpen, true);
    assert.strictEqual(clock.isPaused, true);
  });

  it('close transitions back to IDLE and resumes clock', () => {
    const clock = new ScrubbableWorldClock();
    const gate = new WorldInteractionGate(clock);
    gate.open();
    gate.close();
    assert.strictEqual(gate.state, GATE_STATES.IDLE);
    assert.strictEqual(gate.isOpen, false);
    assert.strictEqual(clock.isPaused, false);
  });

  it('touch opens gate if IDLE', () => {
    const gate = new WorldInteractionGate();
    gate.touch();
    assert.strictEqual(gate.state, GATE_STATES.INTERACTIVE);
  });

  it('touch resets timeout', () => {
    const gate = new WorldInteractionGate(null, { timeoutDuration: 10 });
    gate.open();
    for (let i = 0; i < 5; i++) gate.tick();
    assert.strictEqual(gate.timeRemaining, 5);
    gate.touch();
    assert.strictEqual(gate.timeRemaining, 10);
  });

  it('tick decrements timeout and auto-closes at 0', () => {
    const clock = new ScrubbableWorldClock();
    const gate = new WorldInteractionGate(clock, { timeoutDuration: 3 });
    gate.open();
    assert.strictEqual(gate.tick(), GATE_STATES.INTERACTIVE); // 3→2
    assert.strictEqual(gate.tick(), GATE_STATES.INTERACTIVE); // 2→1
    assert.strictEqual(gate.tick(), GATE_STATES.IDLE);        // 1→0 close
    assert.strictEqual(gate.state, GATE_STATES.IDLE);
  });

  it('tick advances clock when IDLE', () => {
    const clock = new ScrubbableWorldClock();
    const gate = new WorldInteractionGate(clock);
    gate.tick();
    assert.strictEqual(clock.tick, 1);
    gate.tick();
    assert.strictEqual(clock.tick, 2);
  });

  it('enterScrubMode transitions to SCRUBBING', () => {
    const clock = new ScrubbableWorldClock();
    const gate = new WorldInteractionGate(clock);
    gate.enterScrubMode();
    assert.strictEqual(gate.state, GATE_STATES.SCRUBBING);
    assert.strictEqual(clock.isPaused, true);
  });

  it('emits open/close/timeout events', () => {
    const gate = new WorldInteractionGate(null, { timeoutDuration: 2 });
    const opens = [];
    const closes = [];
    const timeouts = [];
    gate.on('open', d => opens.push(d));
    gate.on('close', d => closes.push(d));
    gate.on('timeout', d => timeouts.push(d));
    gate.open();
    gate.tick();
    gate.tick();
    assert.strictEqual(opens.length, 1);
    assert.strictEqual(closes.length, 1);
    assert.strictEqual(timeouts.length, 1);
  });

  it('emits touch event', () => {
    const gate = new WorldInteractionGate();
    const touches = [];
    gate.on('touch', d => touches.push(d));
    gate.touch();
    assert.strictEqual(touches.length, 1);
  });

  it('configurable timeout duration', () => {
    const gate = new WorldInteractionGate(null, { timeoutDuration: 200 });
    gate.open();
    assert.strictEqual(gate.timeRemaining, 200);
    gate.setTimeout(300);
    gate.touch();
    assert.strictEqual(gate.timeRemaining, 300);
  });
});
