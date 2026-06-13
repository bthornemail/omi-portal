const TORUS_RADIUS = 6;
const TORUS_TUBE = 2;
const WORLD_SCALE = 1.6;

export function buildEntityFromNode(node, index, total) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const x = Math.cos(angle) * TORUS_RADIUS * WORLD_SCALE;
  const z = Math.sin(angle) * TORUS_RADIUS * WORLD_SCALE;
  const y = Math.sin(angle * 2) * 1.2;

  const carrierHex = node.carrier != null
    ? `0x${BigInt(node.carrier).toString(16).padStart(64, "0")}`
    : null;

  return {
    id: node.id || `entity-${index}`,
    motif: node.motif || null,
    emoji: node.emoji || null,
    synset: node.synset ? node.synset.lemma : null,
    carrierHex,
    selector: node.carrier != null ? Number((BigInt(node.carrier) >> 255n) & 1n) : null,
    routeCount: node._routeCount || 0,
    receipt: node.receipt !== null,
    position: { x: round3(x), y: round3(y), z: round3(z) },
    dataAttributes: buildDataAttributes(node, carrierHex)
  };
}

export function buildEntityList(topology) {
  const nodes = [...topology.nodes.values()];
  return nodes.map((node, i) => buildEntityFromNode(node, i, nodes.length));
}

export function entityToAframeHTML(entity) {
  const attrs = Object.entries(entity.dataAttributes)
    .map(([k, v]) => `${k}="${v}"`).join(" ");

  const color = entity.receipt ? "#8bffb5" : entity.motif ? "#5cf0ff" : "#888";
  const label = entity.emoji
    ? entity.emoji
    : entity.motif
    ? entity.motif.slice(0, 4)
    : entity.id.slice(0, 6);

  return `
    <a-entity
      id="${entity.id}"
      geometry="primitive:sphere;radius:0.6"
      material="color:${color};metalness:0.3;roughness:0.6"
      position="${entity.position.x} ${entity.position.y} ${entity.position.z}"
      ${attrs}>
      <a-text value="${label}" color="#000" align="center"
        position="0 0.9 0" scale="0.8 0.8 0.8"></a-text>
    </a-entity>`;
}

export function compileTopologyToScene(topology, options = {}) {
  const entities = buildEntityList(topology);
  const html = entities.map(entityToAframeHTML).join("\n");
  return {
    entities,
    html,
    entityCount: entities.length,
    receiptCount: entities.filter(e => e.receipt).length
  };
}

function round3(v) {
  return Math.round(v * 1000) / 1000;
}

function buildDataAttributes(node, carrierHex) {
  const attrs = {};
  if (node.id) attrs["data-omi"] = node.id;
  if (carrierHex) attrs["data-o-word"] = carrierHex;
  if (node.motif) attrs["data-omo"] = node.motif;
  if (node.emoji) attrs["data-imi"] = node.emoji;
  if (node.synset) {
    attrs["data-imo"] = node.synset.lemma;
    if (node.synset.id) attrs["data-synset"] = node.synset.id;
  }
  if (node.receipt !== null && node.receipt !== undefined) {
    attrs["data-receipt"] = "1";
  }
  return attrs;
}
