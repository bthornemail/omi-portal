import type { NetworkingDocCell, NetworkLayer } from '../narrative/narrativeTypes';

type RawSection = {
  heading: string;
  level: number;
  content: string;
  lineNumber: number;
};

function parseMarkdownSections(text: string): RawSection[] {
  const lines = text.split(/\r?\n/);
  const sections: RawSection[] = [];
  let current: { heading: string; level: number; content: string[]; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      if (current) {
        sections.push({ heading: current.heading, level: current.level, content: current.content.join('\n').trim(), lineNumber: current.startLine });
      }
      current = { heading: m[2], level: m[1].length, content: [], startLine: i + 1 };
    } else if (current) {
      current.content.push(line);
    }
  }

  if (current) {
    sections.push({ heading: current.heading, level: current.level, content: current.content.join('\n').trim(), lineNumber: current.startLine });
  }

  return sections;
}

function extractJsRefs(content: string): { path: string; kind: 'js' | 'test' }[] {
  const refs: { path: string; kind: 'js' | 'test' }[] = [];
  for (const m of content.match(/`(?:src\/[a-z./-]+\.js|test\/[a-z./-]+\.test\.js)`/gi) || []) {
    const p = m.replace(/`/g, '');
    refs.push({ path: p, kind: p.startsWith('test/') ? 'test' : 'js' });
  }
  return refs;
}

function docIdFromPath(path: string): string {
  return path.replace(/^docs\//, '').replace(/\.md$/, '').replace(/\//g, '-');
}

function classifyLayer(path: string): NetworkLayer {
  if (path.includes('omi-core-spec')) return 'core';
  if (path.includes('canonical-addressing')) return 'addressing';
  if (path.includes('omi-distributed-protocol')) return 'distributed';
  if (path.includes('omi-protocol-sequencing')) return 'transport';
  if (path.includes('memory-layout') || path.includes('RING_OVERWRITE')) return 'memory';
  if (path.includes('prolog-wordnet-aframe')) return 'application';
  return 'core';
}

function makeDataOmi(docId: string, heading: string, layer: NetworkLayer): string {
  const tag = heading.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 24) || 'section';
  return `${layer}/${docId}/${tag}`;
}

function makeDataImo(docId: string, sectionIdx: number): string {
  return `imo:${docId}@${sectionIdx}`;
}

export function parseNetworkingDoc(text: string, path: string, index: number): NetworkingDocCell[] {
  const sections = parseMarkdownSections(text);
  const title = sections.length > 0 ? sections[0].heading : path;
  const docId = docIdFromPath(path);
  const layer = classifyLayer(path);
  const cells: NetworkingDocCell[] = [];
  let sectionIdx = 0;

  for (const section of sections) {
    if (section.level === 1) continue;
    sectionIdx++;

    const refs = extractJsRefs(section.content);
    const excerpt = section.content.slice(0, 240) + (section.content.length > 240 ? '…' : '');

    cells.push({
      id: `net:${docId}:${sectionIdx}`,
      title: section.heading,
      sourcePath: path,
      section: section.heading,
      layer,
      explanation: excerpt,
      sourceRefs: refs.length > 0 ? refs : [{ path, kind: 'md' }],
      dataOmi: makeDataOmi(docId, section.heading, layer),
      dataImo: makeDataImo(docId, sectionIdx),
      receiptState: 'candidate'
    });
  }

  return cells;
}

export interface DocDesc {
  path: string;
  title: string;
  layer: NetworkLayer;
}

export const NETWORKING_DOCS: DocDesc[] = [
  { path: 'docs/03-network/omi-core-spec.md', title: 'OMI-CORE-v0 Specification', layer: 'core' },
  { path: 'docs/03-network/canonical-addressing.md', title: 'Canonical Addressing', layer: 'addressing' },
  { path: 'docs/03-network/omi-distributed-protocol.md', title: 'Distributed Protocol', layer: 'distributed' },
  { path: 'docs/04-transport/omi-protocol-sequencing.md', title: 'Protocol Sequencing', layer: 'transport' },
  { path: 'docs/05-session/memory-layout.md', title: 'Memory Layout', layer: 'memory' },
  { path: 'docs/05-session/RING_OVERWRITE_POLICY_v0.md', title: 'Ring Overwrite Policy v0', layer: 'memory' },
  { path: 'docs/07-application/prolog-wordnet-aframe.md', title: 'WordNet / A-Frame Application', layer: 'application' }
];

export function summarizeNetworkingCells(cells: NetworkingDocCell[]) {
  const byLayer: Record<string, number> = {};
  const byDoc: Record<string, number> = {};
  for (const c of cells) {
    byLayer[c.layer] = (byLayer[c.layer] || 0) + 1;
    byDoc[c.sourcePath] = (byDoc[c.sourcePath] || 0) + 1;
  }
  return { total: cells.length, byLayer, byDoc };
}
