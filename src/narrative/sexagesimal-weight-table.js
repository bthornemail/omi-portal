export const REGULAR_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 60];

export const SEXAGESIMAL_REGULAR_FRACTIONS = Object.freeze({
  2: '0;30',
  3: '0;20',
  4: '0;15',
  5: '0;12',
  6: '0;10',
  8: '0;7,30',
  10: '0;6',
  12: '0;5',
  15: '0;4',
  20: '0;3',
  24: '0;2,30',
  30: '0;2',
  60: '0;1'
});

export const REPEATING_DENOMINATORS = [7, 11, 13, 17, 19, 59, 61];

export const SEXAGESIMAL_REPEATING_FRACTIONS = Object.freeze({
  7: { pattern: '0;8,34,17,8,34,17...', usage: 'Fano replay cadence' },
  11: { pattern: '0;5,27,16,21,49...', usage: 'upper shell composite cadence' },
  13: { pattern: '0;4,36,55,23...', usage: 'meta-cycle drift' },
  17: { pattern: '0;3,31,45,52,56...', usage: 'long recurrence / world drift' },
  19: { pattern: '0;3,9,28,25...', usage: 'long recurrence / world drift' },
  59: { pattern: '0;1,1,1,1,1,1...', usage: 'Hellenistic boundary neighbor' },
  61: { pattern: '0;0,59,0,59...', usage: 'Hellenistic boundary neighbor' }
});

export function fractionToSexagesimal(numerator, denominator) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator <= 0) {
    return null;
  }
  if (numerator === 0) return '0;0';
  if (numerator === denominator) return '1;0';

  if (isRegularDenominator(denominator)) {
    const exact = SEXAGESIMAL_REGULAR_FRACTIONS[denominator];
    if (exact && numerator === 1) return exact;

    const exactMultiple = SEXAGESIMAL_REGULAR_FRACTIONS[denominator / numerator];
    if (exactMultiple && denominator % numerator === 0) return exactMultiple;
    const simplifiedNumerator = numerator / numerator;
    const simplifiedDenominator = denominator / numerator;
    const simplified = SEXAGESIMAL_REGULAR_FRACTIONS[simplifiedDenominator];
    if (simplified && denominator % numerator === 0) return simplified;
  }

  const decimal = numerator / denominator;
  const integerPart = Math.floor(decimal);
  const fractionalPart = Math.round((decimal - integerPart) * 60);
  if (fractionalPart === 60) {
    return `${integerPart + 1};0`;
  }
  return `${integerPart};${fractionalPart}`;
}

export function sexagesimalToFloat(sexagesimalStr) {
  if (typeof sexagesimalStr !== 'string') return null;
  const parts = sexagesimalStr.split(';');
  if (parts.length !== 2) return null;
  const integerPart = parseInt(parts[0], 10);
  if (isNaN(integerPart)) return null;
  const fractionalParts = parts[1].split(',');
  let fractionalValue = 0;
  for (const fp of fractionalParts) {
    const val = parseInt(fp, 10);
    if (isNaN(val)) return null;
    fractionalValue = fractionalValue * 60 + val;
  }
  const decimalFraction = fractionalValue / Math.pow(60, fractionalParts.length);
  return integerPart + decimalFraction;
}

export function isRegularDenominator(n) {
  if (typeof n !== 'number' || n <= 0) return false;
  let d = n;
  while (d % 2 === 0) d /= 2;
  while (d % 3 === 0) d /= 3;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

export function isRepeatingDenominator(n) {
  return REPEATING_DENOMINATORS.includes(n);
}

export function tetrahedralWeights() {
  return Object.freeze({
    narrative: '0;15',
    upos: '0;15',
    wordnet: '0;15',
    emoji: '0;15',
    sum: '1;0'
  });
}

export function fiveSourceWeights() {
  return Object.freeze({
    narrative: '0;12',
    upos: '0;12',
    wordnet: '0;12',
    emoji: '0;12',
    omi: '0;12',
    sum: '1;0'
  });
}

export function computeCentroidWeight(weights) {
  if (!weights) return null;
  const keys = Object.keys(weights);
  let total = 0;
  for (const key of keys) {
    const val = sexagesimalToFloat(weights[key]);
    if (val === null) return null;
    total += val;
  }
  const totalInt = Math.floor(total);
  const totalFrac = Math.round((total - totalInt) * 60);
  if (totalFrac === 60) {
    return `${totalInt + 1};0`;
  }
  return `${totalInt};${totalFrac}`;
}

export function sumWeightsCloseToOne(sumStr) {
  const val = sexagesimalToFloat(sumStr);
  if (val === null) return false;
  const diff = Math.abs(val - 1);
  return diff < 1 / 120;
}
