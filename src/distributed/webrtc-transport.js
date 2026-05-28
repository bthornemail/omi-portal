const ICE_SERVERS_DEFAULT = [{ urls: "stun:stun.l.google.com:19302" }];

export class WebRTCTransport {
  constructor(options = {}) {
    this.iceServers = options.iceServers || ICE_SERVERS_DEFAULT;
    this.channelLabel = options.channelLabel || "omi-gossip";
    this._peerConnections = new Map();
    this._dataChannels = new Map();
    this._onMessage = options.onMessage || null;
    this._localStream = null;
  }

  set onMessage(handler) {
    this._onMessage = typeof handler === "function" ? handler : null;
  }

  async createConnection(peerId, remoteOfferCallback) {
    if (this._peerConnections.has(peerId)) return this._peerConnections.get(peerId);
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    const dc = pc.createDataChannel(this.channelLabel, { ordered: true });
    this._setupDataChannel(peerId, dc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (remoteOfferCallback) {
      const remoteAnswer = await remoteOfferCallback(peerId, offer);
      await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
    }
    this._peerConnections.set(peerId, pc);
    this._dataChannels.set(peerId, dc);
    return pc;
  }

  async acceptConnection(peerId, remoteOffer, answerCallback) {
    if (this._peerConnections.has(peerId)) return this._peerConnections.get(peerId);
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    pc.ondatachannel = (event) => {
      const dc = event.channel;
      this._setupDataChannel(peerId, dc);
      this._dataChannels.set(peerId, dc);
    };
    await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    if (answerCallback) await answerCallback(peerId, answer);
    this._peerConnections.set(peerId, pc);
    return pc;
  }

  _setupDataChannel(peerId, dc) {
    dc.onmessage = (event) => {
      if (this._onMessage) this._onMessage(peerId, event.data);
    };
    dc.onclose = () => {
      this._peerConnections.delete(peerId);
      this._dataChannels.delete(peerId);
    };
  }

  send(peerId, data) {
    const dc = this._dataChannels.get(peerId);
    if (!dc || dc.readyState !== "open") throw new Error(`No open data channel to peer ${peerId}`);
    dc.send(data);
  }

  broadcast(data) {
    for (const [peerId, dc] of this._dataChannels) {
      if (dc.readyState === "open") dc.send(data);
    }
  }

  isConnected(peerId) {
    const dc = this._dataChannels.get(peerId);
    return dc ? dc.readyState === "open" : false;
  }

  close(peerId) {
    const pc = this._peerConnections.get(peerId);
    if (pc) {
      const dc = this._dataChannels.get(peerId);
      if (dc) dc.close();
      pc.close();
      this._peerConnections.delete(peerId);
      this._dataChannels.delete(peerId);
    }
  }

  closeAll() {
    for (const peerId of [...this._peerConnections.keys()]) this.close(peerId);
  }

  connectedPeerCount() {
    return [...this._dataChannels.values()].filter((dc) => dc.readyState === "open").length;
  }
}

export function createWebRTCTransport(options = {}) {
  return new WebRTCTransport(options);
}
