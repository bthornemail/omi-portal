import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ScrubbableWorldClock, MAX_TICK } from '../src/world/scrubbable-world-clock.js';
import { PersistentWorldState } from '../src/world/persistent-world-state.js';

describe('Slice 3: Scrubbable World Clock (0xA5)', () => {
  it('constructs with tick 0 epoch 0', () => {
    const clock = new ScrubbableWorldClock();
    assert.strictEqual(clock.tick, 0);
    assert.strictEqual(clock.epoch, 0);
    assert.strictEqual(clock.isPaused, false);
    assert.strictEqual(clock.isScrubbing, false);
  });

  it('advance increments tick', () => {
    const clock = new ScrubbableWorldClock();
    assert.strictEqual(clock.advance(), 1);
    assert.strictEqual(clock.advance(), 2);
  });

  it('advance wraps at 5040 and increments epoch', () => {
    const clock = new ScrubbableWorldClock(null, { tick: MAX_TICK - 1 });
    assert.strictEqual(clock.advance(), 0);
    assert.strictEqual(clock.epoch, 1);
  });

  it('pause stops tick advancement', () => {
    const clock = new ScrubbableWorldClock();
    clock.pause();
    assert.strictEqual(clock.isPaused, true);
    assert.strictEqual(clock.advance(), 0);
    assert.strictEqual(clock.tick, 0);
  });

  it('resume restarts tick advancement', () => {
    const clock = new ScrubbableWorldClock();
    clock.pause();
    assert.strictEqual(clock.advance(), 0);
    clock.resume();
    assert.strictEqual(clock.advance(), 1);
  });

  it('scrubToTick jumps to target tick', () => {
    const clock = new ScrubbableWorldClock();
    clock.scrubToTick(42);
    assert.strictEqual(clock.tick, 42);
    assert.strictEqual(clock.isScrubbing, true);
  });

  it('scrubToTick clamps to valid range', () => {
    const clock = new ScrubbableWorldClock();
    clock.scrubToTick(-5);
    assert.strictEqual(clock.tick, 0);
    clock.scrubToTick(9999);
    assert.strictEqual(clock.tick, MAX_TICK - 1);
  });

  it('scrubToReceipt jumps to receipt epoch tick', () => {
    const world = new PersistentWorldState();
    world.addReceipt({ type: 'scene', scene: 'Prologue' });
    world.advance(); world.advance();
    world.addReceipt({ type: 'scene', scene: 'Debate' });
    for (let i = 0; i < 58; i++) world.advance();
    world.addReceipt({ type: 'scene', scene: 'Covenant' });
    const clock = new ScrubbableWorldClock(world);
    clock.scrubToReceipt(0, world);
    assert.strictEqual(clock.tick, 0);
    clock.scrubToReceipt(2, world);
    assert.strictEqual(clock.tick, 60);
    assert.strictEqual(clock.isScrubbing, true);
  });

  it('scrubToReceipt ignores out-of-range index', () => {
    const world = new PersistentWorldState();
    world.addReceipt({ type: 'scene', scene: 'Prologue' });
    const clock = new ScrubbableWorldClock(null, { tick: 10 });
    clock.scrubToReceipt(99, world);
    assert.strictEqual(clock.tick, 10);
  });

  it('scrubToMotif finds receipt by motif name', () => {
    const world = new PersistentWorldState();
    world.addReceipt({ type: 'scene', scene: 'Prologue' });
    world.addReceipt({ type: 'scene', scene: 'Debate', motif: 'Wisdom' });
    world.addReceipt({ type: 'scene', scene: 'Covenant' });
    const clock = new ScrubbableWorldClock(world);
    clock.scrubToMotif('Wisdom', world);
    assert.strictEqual(clock.isScrubbing, true);
  });

  it('advances linked PersistentWorldState', () => {
    const world = new PersistentWorldState();
    const clock = new ScrubbableWorldClock(world);
    world.addActor('TestActor');
    clock.advance();
    assert.strictEqual(world.tick, 1);
    assert.strictEqual(clock.tick, 1);
  });

  it('emits tick event on advance', () => {
    const clock = new ScrubbableWorldClock();
    const events = [];
    clock.on('tick', data => events.push(data));
    clock.advance();
    clock.advance();
    clock.advance();
    assert.strictEqual(events.length, 3);
    assert.strictEqual(events[0].tick, 1);
  });

  it('emits scrub event on scrubToTick', () => {
    const clock = new ScrubbableWorldClock();
    const events = [];
    clock.on('scrub', data => events.push(data));
    clock.scrubToTick(99);
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].tick, 99);
  });

  it('emits pause/resume events', () => {
    const clock = new ScrubbableWorldClock();
    const pauses = [];
    const resumes = [];
    clock.on('pause', data => pauses.push(data));
    clock.on('resume', data => resumes.push(data));
    clock.pause();
    clock.resume();
    assert.strictEqual(pauses.length, 1);
    assert.strictEqual(resumes.length, 1);
  });
});
