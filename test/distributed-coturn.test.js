import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CoTURNProxy, createCoTURNProxy } from "../src/distributed/coturn-proxy.js";

describe("CoTURNProxy", () => {
  it("creates with defaults", () => {
    const p = createCoTURNProxy();
    assert.ok(p instanceof CoTURNProxy);
    assert.equal(p.realm, "omi");
    assert.equal(p.ttl, 3600);
  });

  it("generates TURN credentials", async () => {
    const p = createCoTURNProxy({ secret: "test-secret" });
    const creds = await p.generateCredentials("alice");
    assert.ok(creds.username);
    assert.ok(creds.password);
    assert.ok(creds.username.includes("alice"));
    assert.equal(creds.ttl, 3600);
    assert.equal(creds.realm, "omi");
  });

  it("validates credentials", async () => {
    const p = createCoTURNProxy({ secret: "test-secret" });
    const creds = await p.generateCredentials("bob");
    assert.ok(await p.validateCredentials(creds.username, creds.password));
    assert.ok(!(await p.validateCredentials(creds.username, "bad-password")));
  });

  it("rejects expired credentials", async () => {
    const p = createCoTURNProxy({ secret: "test-secret", ttl: -1 });
    const creds = await p.generateCredentials("charlie");
    assert.ok(!(await p.validateCredentials(creds.username, creds.password)));
  });

  it("generateTurnUri returns correct structure", async () => {
    const p = createCoTURNProxy();
    const creds = await p.generateCredentials("dave");
    const uri = p.generateTurnUri(creds, { host: "turn.example.com", port: 3478 });
    assert.ok(uri.urls.some((u) => u.includes("turn.example.com")));
    assert.equal(uri.username, creds.username);
    assert.equal(uri.credential, creds.password);
  });

  it("urls returns service info", () => {
    const p = createCoTURNProxy();
    const info = p.urls();
    assert.ok(Array.isArray(info.stun));
    assert.equal(info.turn.host, "localhost");
    assert.equal(info.turn.port, 3478);
  });

  it("rejects invalid username format", async () => {
    const p = createCoTURNProxy();
    assert.ok(!(await p.validateCredentials("no-colon", "pw")));
  });
});
