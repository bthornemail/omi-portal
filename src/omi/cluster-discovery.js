import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const MAX_CLUSTER_PEERS = 10;
export const INTERFACE_V4_BROADCAST = "192.168.122.255";
export const INTERFACE_V6_MULTICAST = "ff02::1";

export class OmiClusterDiscoveryKernel {
  constructor() {
    this.peerAdjacencyMap = new Uint32Array(MAX_CLUSTER_PEERS);
    this.activePeersCount = 0;
  }

  processDiscoveryFrame(S, targetInterfaceIndex, remoteNodeWeight, peerIdentifierBits) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const ifaceIdx = targetInterfaceIndex & 0xFF;
    const weight = Number(remoteNodeWeight) & 0xFF;
    const peerUid = Number(peerIdentifierBits) & 0xFFFF;

    const isInterfaceValid = (ifaceIdx === 0 || ifaceIdx === 1);
    if (!isInterfaceValid) {
      return { accepted: false, reason: "OUTSIDE_VIRTUAL_BRIDGE_INTERFACE_EVICTION" };
    }

    let existingSlotIndex = -1;
    let openSlotIndex = -1;

    for (let i = 0; i < MAX_CLUSTER_PEERS; i++) {
      if (this.peerAdjacencyMap[i] === peerUid) {
        existingSlotIndex = i;
        break;
      }
      if (this.peerAdjacencyMap[i] === 0 && openSlotIndex === -1) {
        openSlotIndex = i;
      }
    }

    let isRegistrationSuccessful = false;
    let canvasPresetColorId = "5";
    let clusterMeshModel = "PEER_ALREADY_REGISTERED";

    if (existingSlotIndex !== -1) {
      isRegistrationSuccessful = true;
      canvasPresetColorId = "4";
    } else if (openSlotIndex !== -1) {
      this.peerAdjacencyMap[openSlotIndex] = peerUid;
      this.activePeersCount++;
      isRegistrationSuccessful = true;
      clusterMeshModel = "NEW_PEER_MESH_LINK_ESTABLISHED";
      canvasPresetColorId = "4";
    } else {
      clusterMeshModel = "CLUSTER_CAPACITY_MAXED_EVICTION_LANE";
      canvasPresetColorId = "1";
    }

    if (weight === 60) {
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(ifaceIdx & 0x0F, this.activePeersCount & 0x0F, 1);

    return {
      accepted: isRegistrationSuccessful,
      clusterMeshModel,
      activePeersCount: this.activePeersCount,
      targetInterface: ifaceIdx === 0 ? "virbr0" : "virbr1",
      networkTarget: ifaceIdx === 0 ? INTERFACE_V4_BROADCAST : INTERFACE_V6_MULTICAST,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}
