export function solidShapeLabel(name) {
  const labels = {
    tetrahedron: "Tetrahedron (4\u2217\u25B3)",
    octahedron:  "Octahedron (6\u2217\u25C7)",
    cube:        "Cube (8\u2217\u25A1)",
    icosahedron: "Icosahedron (12\u2217\u25C6)",
    dodecahedron:"Dodecahedron (20\u2217\u2B21)"
  };
  return labels[name] || name;
}

export function printMetrics(name, metrics, durationMs) {
  const duration = durationMs / 1000;
  const totalFrags = metrics.reduce((s, m) => s + m.fragmentsGenerated, 0);
  const totalSent = metrics.reduce((s, m) => s + m.gossipSent, 0);
  const totalRecv = metrics.reduce((s, m) => s + m.gossipReceived, 0);
  const totalRounds = metrics.reduce((s, m) => s + m.gossipRounds, 0);
  const totalRsEnc = metrics.reduce((s, m) => s + m.rsEncodes, 0);
  const totalRsDec = metrics.reduce((s, m) => s + m.rsDecodes, 0);
  const totalTurn = metrics.reduce((s, m) => s + m.turnCredentialsGenerated, 0);
  const totalHnswI = metrics.reduce((s, m) => s + m.hnswInserts, 0);
  const totalHnswS = metrics.reduce((s, m) => s + m.hnswSearches, 0);
  const totalClos = metrics.reduce((s, m) => s + m.causalClosures, 0);
  const avgMemDelta = metrics.reduce((s, m) => s + (m.memoryAfter - m.memoryBefore), 0) / metrics.length;

  const lines = [
    "",
    `\u2501 ${solidShapeLabel(name)} \u2501 ${metrics.length} vertices, ${duration.toFixed(1)}s`,
    `  Fragments:        ${totalFrags} gen, ${totalSent} sent, ${totalRecv} recv`,
    `  Gossip rounds:    ${totalRounds} (${(totalRounds / duration).toFixed(1)}/s)`,
    `  RS(k,n):          ${totalRsEnc} enc, ${totalRsDec} dec`,
    `  TURN credentials: ${totalTurn}`,
    `  HNSW:             ${totalHnswI} ins, ${totalHnswS} srch`,
    `  Causal closures:  ${totalClos}`,
    `  Avg mem delta:    ${(avgMemDelta / 1024).toFixed(1)} KB/vertex`,
    ""
  ];
  return lines.join("\n");
}
