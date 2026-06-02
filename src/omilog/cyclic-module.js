import { principalGenerator, generatedIdeal } from './principal-domain.js';

export function cyclicReplayComponent(generator, records) {
  if (!generator || !Array.isArray(records)) return null;
  const ideal = generatedIdeal(generator, records);
  if (ideal.length === 0) return null;
  const genBase = generator.split('/')[0];
  const replaySlot = [...genBase].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 5040;
  return {
    generator,
    recordCount: ideal.length,
    records: ideal,
    replaySlot
  };
}

export function decomposeReplayModule(records) {
  if (!Array.isArray(records) || records.length === 0) return [];
  const genMap = new Map();
  for (const rec of records) {
    const gen = principalGenerator([rec]);
    if (!gen) continue;
    if (!genMap.has(gen)) genMap.set(gen, []);
    genMap.get(gen).push(rec);
  }
  const components = [];
  for (const [generator, genRecords] of genMap) {
    const component = cyclicReplayComponent(generator, genRecords);
    if (component) components.push(component);
  }
  return components.sort((a, b) => a.replaySlot - b.replaySlot);
}

export function directSumComponents(components) {
  if (!Array.isArray(components)) return null;
  return {
    componentCount: components.length,
    totalRecords: components.reduce((sum, c) => sum + c.recordCount, 0),
    generators: components.map(c => c.generator),
    replaySlots: components.map(c => c.replaySlot),
    components
  };
}
