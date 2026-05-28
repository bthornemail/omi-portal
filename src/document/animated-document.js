import { readPOSTokens } from "../nlp/wink-pos.js";
import { featureTokens, posFeatureVector } from "../nlp/features.js";
import { makeDefaultSCGNNNode, connectDefaultSCGNN } from "../scgnn/default-node.js";
import { toJSONCanvas } from "../canvas/json-canvas.js";
import { enrichFeatureTokensWithWordNet } from "../wordnet/relation-space.js";
import { makeDOMCSSOMTetrahedron, tetrahedronToJSONCanvas } from "../web/dom-cssom-tetrahedron.js";
import { scoreNodeWithPolicy, makeTinyNEATPolicy } from "../neat/tinyneat-policy.js";

const CHANNEL_MOTION = Object.freeze({
  FS: { axis: "z", motion: "sink", color: "#38bdf8" },
  GS: { axis: "y", motion: "centroid", color: "#a78bfa" },
  RS: { axis: "x", motion: "route", color: "#facc15" },
  US: { axis: "xy", motion: "source", color: "#22c55e" }
});

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function relationWeight(node) {
  return clamp(node.wordnet?.metric?.stability ?? 0, 0, 1);
}

function tinyInputs(node) {
  return [
    node.feature.normalizedIndex,
    node.feature.tokenLength / 32,
    ...node.feature.channelOneHot
  ];
}

function fallbackSignal(node) {
  const score = scoreNodeWithPolicy(node);
  return (score % 2) - 0.5;
}

function motionForNode(node, index, tinySignal = fallbackSignal(node)) {
  const channel = CHANNEL_MOTION[node.channel] || CHANNEL_MOTION.US;
  const stability = relationWeight(node);
  const signal = clamp(tinySignal, -1, 1);
  const phase = ((index * 47) % 360) + signal * 24;
  const amplitude = 8 + stability * 28 + Math.abs(signal) * 14;
  const dx = Math.cos((phase * Math.PI) / 180) * amplitude;
  const dy = Math.sin((phase * Math.PI) / 180) * amplitude * 0.7;
  const depth = node.channel === "FS" ? -18 : node.channel === "RS" ? 16 : node.channel === "GS" ? 8 : 0;
  const duration = Math.round(1800 + (1 - stability) * 900 + index * 34);

  return {
    channel: node.channel,
    controlCode: node.controlCode,
    motion: channel.motion,
    axis: channel.axis,
    color: channel.color,
    phase,
    amplitude,
    dx,
    dy,
    depth,
    duration,
    chirality: node.executable ? "right" : "left",
    projection: node.channel === "FS" || node.channel === "RS" ? "3d" : "2d"
  };
}

async function tinySignals(nodes, options) {
  if (!options.useTinyNEAT) return nodes.map(fallbackSignal);
  try {
    const policy = await makeTinyNEATPolicy(6, 1, {
      initialPopulationSize: options.populationSize ?? 12,
      maxGenerations: options.generations ?? 2,
      loggingPlugins: [],
      ...(options.tinyneat || {})
    });
    const best = policy.evaluate(nodes);
    if (!best || typeof best.process !== "function") return nodes.map(fallbackSignal);
    return nodes.map((node) => {
      const out = best.process(tinyInputs(node));
      return Array.isArray(out) ? Number(out[0]) || 0 : fallbackSignal(node);
    });
  } catch {
    return nodes.map(fallbackSignal);
  }
}

export async function compileTextToAnimatedDocument(text, options = {}) {
  const compiled = await compileWordNetGraph(text, options);
  const signals = await tinySignals(compiled.nodes, options);

  const atoms = compiled.nodes.map((node, index) => {
    const motion = motionForNode(node, index, signals[index]);
    return {
      id: node.id,
      term: node.label.split(":").slice(1).join(":"),
      label: node.label,
      channel: node.channel,
      controlCode: node.controlCode,
      cidr: node.address,
      centroid: node.centroid,
      urn: node.urn,
      stable: node.wordnet?.metric?.stable ?? false,
      relationCount: node.wordnet?.relationCount ?? 0,
      motion
    };
  });

  return {
    text,
    atoms,
    tokens: compiled.tokens,
    features: compiled.features,
    tetrahedron: compiled.tetrahedron,
    canvas: compiled.canvas,
    css: animatedDocumentCSS(),
    html: animatedDocumentHTML(atoms)
  };
}

async function compileWordNetGraph(text, { wordpos, minRelations = 6, ...options } = {}) {
  const tokens = readPOSTokens(text);
  const features = posFeatureVector(tokens);
  const baseFeatureTokens = featureTokens(tokens);
  const enrichedFeatureTokens = await enrichFeatureTokensWithWordNet(baseFeatureTokens, wordpos, { minRelations });
  const nodes = enrichedFeatureTokens.map((ft, i) => makeDefaultSCGNNNode(ft, i, enrichedFeatureTokens.length));
  const edges = connectDefaultSCGNN(nodes);
  const tetrahedron = makeDOMCSSOMTetrahedron(nodes.map((n) => n.wordnet).filter(Boolean), { minRelations });
  const baseCanvas = toJSONCanvas(nodes, edges, options);
  const tetraCanvas = tetrahedronToJSONCanvas(tetrahedron, options.tetrahedronCanvas || {});
  return {
    tokens,
    features,
    featureTokens: enrichedFeatureTokens,
    nodes,
    edges,
    tetrahedron,
    canvas: {
      nodes: [...baseCanvas.nodes, ...tetraCanvas.nodes],
      edges: [...baseCanvas.edges, ...tetraCanvas.edges]
    }
  };
}

export function animatedDocumentCSS() {
  return `.animated-document{--doc-depth:1;display:flex;flex-wrap:wrap;gap:.42em;align-content:flex-start;perspective:900px;transform-style:preserve-3d}.term-atom{--amp:16;--dx:8;--dy:4;--depth:0;--color:#22c55e;position:relative;display:inline-block;padding:.18em .28em;border-radius:6px;color:#e5e7eb;background:color-mix(in srgb,var(--color) 18%,transparent);border:1px solid color-mix(in srgb,var(--color) 38%,transparent);font-weight:650;animation:term-chiral var(--dur,2200ms) ease-in-out infinite alternate;transform:translate3d(0,0,calc(var(--depth)*1px))}.term-atom[data-projection="2d"]{transform-style:flat}.term-atom[data-chirality="left"]{animation-direction:alternate-reverse}.term-atom::after{content:attr(data-channel) " " attr(data-cidr);display:block;margin-top:.15em;color:#94a3b8;font:9px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0}@keyframes term-chiral{0%{transform:translate3d(calc(var(--dx)*-.45px),calc(var(--dy)*.25px),calc(var(--depth)*1px)) rotateZ(-1.5deg)}100%{transform:translate3d(calc(var(--dx)*1px),calc(var(--dy)*-1px),calc((var(--depth) + var(--amp)*.35)*1px)) rotateZ(1.5deg)}}@media (prefers-reduced-motion:reduce){.term-atom{animation:none}}`;
}

export function animatedDocumentHTML(atoms) {
  return atoms.map((atom) => {
    const m = atom.motion;
    const style = [
      `--amp:${m.amplitude.toFixed(2)}`,
      `--dx:${m.dx.toFixed(2)}`,
      `--dy:${m.dy.toFixed(2)}`,
      `--depth:${m.depth.toFixed(2)}`,
      `--dur:${m.duration}ms`,
      `--color:${m.color}`
    ].join(";");
    return `<span class="term-atom" data-channel="${escapeHTML(atom.channel)}" data-cidr="${escapeHTML(atom.cidr)}" data-chirality="${escapeHTML(m.chirality)}" data-projection="${escapeHTML(m.projection)}" style="${style}">${escapeHTML(atom.term)}</span>`;
  }).join(" ");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
