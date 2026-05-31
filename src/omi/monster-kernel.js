import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const SUPERSINGULAR_PRIMES = Object.freeze([
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 41, 47, 59, 71
]);

export const SEVENTY_THREE_BLOCK_B = Object.freeze([0, 1, 3, 6, 9, 8, 6, 3]);
export const SEQUENCE_SUM_W = 36;

export class OmiMonsterMegatronKernel {
  evaluateMonsterPrime(S, targetPrimeOperand, inputX) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const prime = Number(targetPrimeOperand);

    const isSupersingular = SUPERSINGULAR_PRIMES.includes(prime);
    if (!isSupersingular) {
      return { accepted: false, reason: "PARIAH_NON_SUPERSINGULAR_PRIME_EVICTION" };
    }

    const x = BigInt(inputX);
    const rotl1 = ((x << 1n) | (x >> 63n)) & 0xFFFFFFFFFFFFFFFFn;
    const rotl3 = ((x << 3n) | (x >> 61n)) & 0xFFFFFFFFFFFFFFFFn;
    const rotr2 = ((x >> 2n) | (x << 62n)) & 0xFFFFFFFFFFFFFFFFn;
    const constantC = BigInt(rowData.MM);

    const deltaLawResult = rotl1 ^ rotl3 ^ rotr2 ^ constantC;

    const positionIndex = Number(deltaLawResult & 0xFFFFn);
    const orbitOffset = positionIndex % SEQUENCE_SUM_W;
    const derivedDigitB = SEVENTY_THREE_BLOCK_B[orbitOffset % 8];

    let canvasPresetColorId = "5";
    let monsterSubquotientModel = "HAPPY_FAMILY_DIVISOR";

    if (prime === 59 || prime === 71) {
      canvasPresetColorId = "6";
      monsterSubquotientModel = "MONSTER_TAIL_CONVERGENCE";
    } else if (prime === 2 || prime === 3) {
      canvasPresetColorId = "4";
      monsterSubquotientModel = "BASE_MONADIC_PRIME";
    }

    if (derivedDigitB === 9) {
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(prime & 0x0F, derivedDigitB & 0x0F, 1);

    return {
      accepted: true,
      monsterSubquotientModel,
      prime,
      orbitOffset,
      derivedDigitB,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}
