export const TRIAD_COUNT = 155;

export const TRIAD_PARTITIONS = Object.freeze({
  rules: 45,
  facts: 20,
  closures: 15,
  combinators: 60,
  cons: 15
});

const TRIAD_PREFIX = Object.freeze({
  rules: 'RULES',
  facts: 'FACTS',
  closures: 'CLOSURES',
  combinators: 'COMBINATORS',
  cons: 'CONS'
});

function partitionOffset(category) {
  const keys = Object.keys(TRIAD_PARTITIONS);
  let offset = 0;
  for (const key of keys) {
    if (key === category) return offset;
    offset += TRIAD_PARTITIONS[key];
  }
  return -1;
}

export function resolveTriad(index) {
  if (index < 0 || index >= 155) return null;
  const keys = Object.keys(TRIAD_PARTITIONS);
  let offset = 0;
  for (const key of keys) {
    const count = TRIAD_PARTITIONS[key];
    if (index < offset + count) {
      return {
        category: key,
        localIndex: index - offset,
        globalIndex: index
      };
    }
    offset += count;
  }
  return null;
}

export function triadCategory(triad) {
  if (!Array.isArray(triad) || triad.length !== 3) return null;
  const sum = (triad[0] + triad[1] + triad[2]) % 5;
  const categories = ['cons', 'combinator', 'rules', 'facts', 'closures'];
  return categories[sum];
}

export function routeTriadToOmiFile(triad) {
  const cat = triadCategory(triad);
  if (!cat) return null;
  const prefix = TRIAD_PREFIX[cat];
  if (!prefix) return null;
  return `${prefix.toLowerCase()}.omi`;
}

export function triadToSpoRoute(triad) {
  if (!Array.isArray(triad) || triad.length !== 3) return null;
  return {
    subject: { index: triad[0], role: 'S' },
    predicate: { index: triad[1], role: 'P' },
    object: { index: triad[2], role: 'O' }
  };
}
