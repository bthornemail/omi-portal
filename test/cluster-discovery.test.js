import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiClusterDiscoveryKernel, MAX_CLUSTER_PEERS, INTERFACE_V4_BROADCAST, INTERFACE_V6_MULTICAST } from '../src/omi/cluster-discovery.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Cluster Mesh: registers new peer on virbr0', () => {
  const kernel = new OmiClusterDiscoveryKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(MAX_CLUSTER_PEERS, 10);
  assert.equal(INTERFACE_V4_BROADCAST, "192.168.122.255");
  assert.equal(INTERFACE_V6_MULTICAST, "ff02::1");

  const metrics = kernel.processDiscoveryFrame(S, 0, 10, 4242);

  assert.ok(metrics.accepted);
  assert.equal(metrics.targetInterface, "virbr0");
  assert.equal(metrics.networkTarget, INTERFACE_V4_BROADCAST);
  assert.equal(metrics.clusterMeshModel, "NEW_PEER_MESH_LINK_ESTABLISHED");
  assert.equal(metrics.activePeersCount, 1);
  assert.equal(metrics.canvasPresetColorId, "4");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Cluster Mesh: registers new peer on virbr1', () => {
  const kernel = new OmiClusterDiscoveryKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.processDiscoveryFrame(S, 1, 20, 9191);

  assert.ok(metrics.accepted);
  assert.equal(metrics.targetInterface, "virbr1");
  assert.equal(metrics.networkTarget, INTERFACE_V6_MULTICAST);
  assert.equal(metrics.activePeersCount, 1);
  assert.equal(metrics.canvasPresetColorId, "4");
});

test('Cluster Mesh: re-registering same peer returns already registered', () => {
  const kernel = new OmiClusterDiscoveryKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const first = kernel.processDiscoveryFrame(S, 0, 10, 4242);
  assert.ok(first.accepted);

  const second = kernel.processDiscoveryFrame(S, 0, 10, 4242);

  assert.ok(second.accepted);
  assert.equal(second.clusterMeshModel, "PEER_ALREADY_REGISTERED");
  assert.equal(second.activePeersCount, 1);
});

test('Cluster Mesh: evicts invalid interface index', () => {
  const kernel = new OmiClusterDiscoveryKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.processDiscoveryFrame(S, 99, 10, 8888);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUTSIDE_VIRTUAL_BRIDGE_INTERFACE_EVICTION");
});

test('Cluster Mesh: GATE_1 eviction on null S', () => {
  const kernel = new OmiClusterDiscoveryKernel();

  const metrics = kernel.processDiscoveryFrame(null, 0, 10, 4242);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('Cluster Mesh: weight 60 routes to yellow preset', () => {
  const kernel = new OmiClusterDiscoveryKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.processDiscoveryFrame(S, 0, 60, 7070);

  assert.ok(metrics.accepted);
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('Cluster Mesh: capacity maxed at 10 peers evicts', () => {
  const kernel = new OmiClusterDiscoveryKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  for (let uid = 1; uid <= 10; uid++) {
    const m = kernel.processDiscoveryFrame(S, 0, 10, uid);
    assert.ok(m.accepted);
    assert.equal(m.activePeersCount, uid);
  }

  const overflow = kernel.processDiscoveryFrame(S, 0, 10, 9999);

  assert.equal(overflow.accepted, false);
  assert.equal(overflow.clusterMeshModel, "CLUSTER_CAPACITY_MAXED_EVICTION_LANE");
  assert.equal(overflow.canvasPresetColorId, "1");
});

test('Cluster Mesh: CLA adder fires across interface slices', () => {
  const kernel = new OmiClusterDiscoveryKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.processDiscoveryFrame(S, 0, 10, 4242);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
