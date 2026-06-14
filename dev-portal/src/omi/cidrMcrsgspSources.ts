export const CIDR_MCRSGSP_SOURCE_NAMES = [
  'FACTS.omi',
  'RULES.omi',
  'CONS.omi',
  'COMBINATORS.omi',
  'CLOSURES.omi'
] as const;

function getSourceModules() {
  const glob = (import.meta as ImportMeta & {
    glob?: (pattern: string, options: Record<string, unknown>) => Record<string, string>;
  }).glob;
  if (typeof glob !== 'function') return {};
  return glob('../../../*.omi', {
    query: '?raw',
    import: 'default',
    eager: true
  });
}

export function loadCidrMcrsgspSources(modules = getSourceModules()) {
  return CIDR_MCRSGSP_SOURCE_NAMES.map((fileName) => {
    const text = modules[`../../../${fileName}`];
    if (typeof text !== 'string') {
      throw new Error(`Missing OMI source file: ${fileName}`);
    }
    return { fileName, text };
  });
}
