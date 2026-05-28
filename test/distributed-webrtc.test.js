import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WebRTCTransport, createWebRTCTransport } from "../src/distributed/webrtc-transport.js";

describe("WebRTCTransport", () => {
  it("creates transport with default STUN", () => {
    const t = createWebRTCTransport();
    assert.ok(t instanceof WebRTCTransport);
    assert.equal(t.connectedPeerCount(), 0);
  });

  it("creates transport with custom config", () => {
    const t = createWebRTCTransport({
      iceServers: [{ urls: "stun:custom.example.com:3478" }],
      channelLabel: "custom-channel"
    });
    assert.equal(t.channelLabel, "custom-channel");
    assert.equal(t.iceServers[0].urls, "stun:custom.example.com:3478");
  });

  it("closeAll is safe when empty", () => {
    const t = createWebRTCTransport();
    t.closeAll();
    assert.equal(t.connectedPeerCount(), 0);
  });

  it("isConnected returns false for unknown peer", () => {
    const t = createWebRTCTransport();
    assert.equal(t.isConnected("nonexistent"), false);
  });

  it("send throws on missing peer", () => {
    const t = createWebRTCTransport();
    assert.throws(() => t.send("peer1", "data"), /No open data channel/);
  });

  it("set onMessage handler", () => {
    const t = createWebRTCTransport();
    const handler = () => {};
    t.onMessage = handler;
    assert.equal(t._onMessage, handler);
    t.onMessage = null;
    assert.equal(t._onMessage, null);
  });
});
