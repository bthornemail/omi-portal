import { buildOmiIndex } from "../omi/index.js";

export function buildDOMCSSOMRegistry(compiled = {}, options = {}) {
  const index = buildOmiIndex(compiled, options.omi || {});
  const atoms = index.atoms;
  const tetrahedron = compiled.tetrahedron;
  const metrics = {
    totalAtoms: atoms.length,
    visibleAtoms: atoms.length,
    stableAtoms: atoms.filter((atom) => atom.stable).length,
    tetrahedronCentroid: tetrahedron?.centroid?.ipv6,
    tetrahedronVertices: tetrahedron?.vertices?.length || 0,
    addressPrefixMatches: atoms.length
  };

  return {
    atoms,
    index,
    metrics,
    filters: {},
    tetrahedron,
    queryPrefix(prefix) {
      return index.queryPrefix(prefix);
    },
    toDetails(atomOrId) {
      const atom = typeof atomOrId === "string"
        ? atoms.find((candidate) => candidate.id === atomOrId || candidate.omi?.address === atomOrId)
        : atomOrId;
      return atomToDOMCSSOMDetails(atom, { tetrahedron });
    }
  };
}

export function filterDOMCSSOMAtoms(registry, filters = {}) {
  const atoms = Array.isArray(registry?.atoms) ? registry.atoms : [];
  const omiPrefix = clean(filters.omiPrefix);
  const graphChannel = clean(filters.graphChannel);
  const omiPortChannel = clean(filters.omiPortChannel);
  const posHex = clean(filters.posHex).toLowerCase();
  const cidr = clean(filters.cidr);
  const centroid = clean(filters.centroid);
  const synsetCell = clean(filters.synsetCell);

  return atoms.filter((atom) => {
    if (omiPrefix && !atom.omi?.address?.startsWith(omiPrefix)) return false;
    if (graphChannel && atom.channel !== graphChannel) return false;
    if (omiPortChannel && atom.omi?.portChannel !== omiPortChannel) return false;
    if (posHex && atom.omi?.posHex !== posHex) return false;
    if (cidr && (atom.cidr || atom.address) !== cidr) return false;
    if (centroid && atom.centroid !== centroid) return false;
    if (synsetCell && !activeSynsetCells(atom).includes(synsetCell)) return false;
    return true;
  });
}

export function atomToDOMCSSOMDetails(atom, context = {}) {
  if (!atom) return null;
  const activeCells = activeSynsetCells(atom);
  return {
    id: atom.id,
    term: atom.term,
    label: atom.label,
    omiAddress: atom.omi?.address,
    selector: atom.omi?.selector,
    pos: atom.omi?.pos || atom.feature?.pos,
    posHex: atom.omi?.posHex,
    portChannel: atom.omi?.portChannel,
    graphChannel: atom.channel,
    controlCode: atom.omi?.controlCode || atom.controlCode,
    unit: atom.omi?.unit,
    cidr: atom.cidr || atom.address,
    centroid: atom.centroid,
    stable: atom.stable ?? atom.wordnet?.metric?.stable ?? false,
    relationCount: atom.relationCount ?? atom.wordnet?.relationCount ?? 0,
    activeSynsetCells: activeCells,
    dataAttributes: atom.omi?.dataAttributes || {},
    tetrahedron: {
      centroid: context.tetrahedron?.centroid?.ipv6,
      vertices: (context.tetrahedron?.vertices || []).map((vertex) => ({
        channel: vertex.channel,
        label: vertex.label,
        ipv4: vertex.ipv4,
        ipv6: vertex.ipv6,
        interfaces: vertex.interfaces?.length || 0
      }))
    }
  };
}

export function applyDOMCSSOMAttributes(element, atom) {
  if (!element || !atom) return element;
  const attributes = {
    ...(atom.omi?.dataAttributes || {}),
    "data-omi-atom-id": atom.id,
    "data-omi-graph-channel": atom.channel,
    "data-omi-cidr": atom.cidr || atom.address || "",
    "data-omi-centroid": atom.centroid || "",
    "data-omi-synset-cells": activeSynsetCells(atom).join(" ")
  };

  for (const [name, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) element.setAttribute(name, String(value));
  }
  return element;
}

function clean(value) {
  return String(value ?? "").trim();
}

function activeSynsetCells(atom) {
  const cells = atom.synsetCells || atom.wordnet?.cells;
  return [
    ...(cells?.fiveCell?.active || []),
    ...(cells?.twentyFourCell?.active || [])
  ];
}
