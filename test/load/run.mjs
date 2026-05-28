import { getSolid } from "./platonic-topology.mjs";
import { LoadVertex } from "./vertex.mjs";
import { printMetrics } from "./report.mjs";

const SOLID_NAME = process.env.OMI_SOLID || "tetrahedron";
const ROUNDS = parseInt(process.env.OMI_ROUNDS || "100", 10);
const INTERVAL_MS = parseInt(process.env.OMI_INTERVAL_MS || "10", 10);
const FANOUT = parseInt(process.env.OMI_FANOUT || "4", 10);

async function main() {
  const solid = getSolid(SOLID_NAME);
  const vertices = [];

  console.log(`OMI Load Test :: ${SOLID_NAME}`);
  console.log(`  Vertices: ${solid.vertices}, Edges: ${solid.edges.length}`);
  console.log(`  Rounds: ${ROUNDS}, Interval: ${INTERVAL_MS}ms, Fanout: ${FANOUT}`);
  console.log(`  720 boundaries: ${Math.floor(ROUNDS / 720)}, 5040 boundaries: ${Math.floor(ROUNDS / 5040)}`);
  console.log("");

  for (let i = 0; i < solid.vertices; i++) {
    vertices.push(new LoadVertex(i, SOLID_NAME, {
      interval: INTERVAL_MS,
      fanout: Math.min(FANOUT, 4)
    }));
  }

  for (const [a, b] of solid.edges) {
    vertices[a].addRemotePeer(vertices[b]);
    vertices[b].addRemotePeer(vertices[a]);
  }

  console.log(`Running ${ROUNDS} rounds across ${solid.vertices} vertices...`);
  const startWall = Date.now();

  const promises = vertices.map((v) => v.run(ROUNDS));
  const allMetrics = await Promise.all(promises);
  const elapsed = Date.now() - startWall;

  const output = printMetrics(SOLID_NAME, allMetrics, elapsed);
  console.log(output);

  const totals = {
    fragments: allMetrics.reduce((s, m) => s + m.fragmentsGenerated, 0),
    sent: allMetrics.reduce((s, m) => s + m.gossipSent, 0),
    received: allMetrics.reduce((s, m) => s + m.gossipReceived, 0),
    rsEnc: allMetrics.reduce((s, m) => s + m.rsEncodes, 0),
    rsDec: allMetrics.reduce((s, m) => s + m.rsDecodes, 0),
    turnCreds: allMetrics.reduce((s, m) => s + m.turnCredentialsGenerated, 0),
    hnswIns: allMetrics.reduce((s, m) => s + m.hnswInserts, 0),
    hnswSrch: allMetrics.reduce((s, m) => s + m.hnswSearches, 0),
  };

  const totalEvents = totals.fragments + totals.rsEnc + totals.rsDec + totals.turnCreds + totals.hnswIns + totals.hnswSrch;
  console.log(`Total operations: ${totalEvents} in ${(elapsed / 1000).toFixed(1)}s`);
  console.log(`Throughput: ${(totalEvents / (elapsed / 1000)).toFixed(0)} ops/s`);
  console.log(`RS decode ratio: ${totals.rsDec}/${totals.rsEnc} (${totals.rsEnc > 0 ? ((totals.rsDec / totals.rsEnc) * 100).toFixed(1) : 0}%)`);
  console.log(`Gossip efficiency: ${totals.received}/${totals.sent} delivered`);
  console.log("");

  const fail = allMetrics.some((m) => m.gossipRounds === 0 && vertices.length > 1);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});
