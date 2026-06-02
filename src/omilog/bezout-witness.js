import { commonGenerator } from './omi-gcd.js';

export function bezoutWitness(a, b, generator) {
  if (typeof a !== 'string' || typeof b !== 'string') return null;
  const gen = generator || commonGenerator(a, b);
  if (!gen) return null;
  return {
    generator: gen.generator,
    generatorType: gen.type,
    left: {
      pointer: a,
      witness: `${a}/CLOSURE/${gen.type}/${gen.value}`,
      role: 'left-arm'
    },
    right: {
      pointer: b,
      witness: `${b}/CLOSURE/${gen.type}/${gen.value}`,
      role: 'right-arm'
    },
    combined: `${gen.generator}/WITNESS/${gen.type}`
  };
}

export function verifyWitnessPath(witness) {
  if (!witness || !witness.generator || !witness.left || !witness.right) {
    return { valid: false, reason: 'malformed witness structure' };
  }
  if (!witness.left.witness || !witness.right.witness) {
    return { valid: false, reason: 'missing witness arm path' };
  }
  if (!witness.combined) {
    return { valid: false, reason: 'missing combined closure path' };
  }
  const leftBase = witness.left.pointer.split('/')[0];
  const rightBase = witness.right.pointer.split('/')[0];
  const genBase = witness.generator.split('/')[0];
  if (!leftBase || !rightBase || !genBase) {
    return { valid: false, reason: 'cannot resolve pointer bases' };
  }
  return {
    valid: true,
    resolved: {
      generator: genBase,
      left: leftBase,
      right: rightBase,
      closurePath: witness.combined
    }
  };
}

export function composeWitness(left, right) {
  if (!left || !right) return null;
  const lv = verifyWitnessPath(left);
  const rv = verifyWitnessPath(right);
  if (!lv.valid || !rv.valid) return null;
  if (lv.resolved.generator !== rv.resolved.generator) return null;
  return {
    generator: lv.resolved.generator,
    generatorType: left.generatorType,
    left,
    right,
    combined: `${lv.resolved.generator}/WITNESS/COMPOSED`
  };
}
