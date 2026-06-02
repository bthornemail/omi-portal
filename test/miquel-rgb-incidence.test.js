import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getRgbCubeVertices, getRgbChannelFaces,
  getVerticesOnFace, getFacesForVertex,
  buildMiquelRgbIncidence, validateMiquelRgbIncidence,
} from "../src/canvas/miquel-rgb-incidence.js";

describe("Miquel RGB Incidence — Vertices", () => {
  it("returns 8 RGB cube vertices", () => {
    const vertices = getRgbCubeVertices();
    assert.equal(vertices.length, 8);
  });

  it("vertices include canonical colors", () => {
    const hexes = getRgbCubeVertices().map(v => v.hex);
    assert.ok(hexes.includes("000000"));
    assert.ok(hexes.includes("FF0000"));
    assert.ok(hexes.includes("00FF00"));
    assert.ok(hexes.includes("0000FF"));
    assert.ok(hexes.includes("FFFF00"));
    assert.ok(hexes.includes("FF00FF"));
    assert.ok(hexes.includes("00FFFF"));
    assert.ok(hexes.includes("FFFFFF"));
  });

  it("each vertex has r,g,b values", () => {
    for (const v of getRgbCubeVertices()) {
      assert.ok(typeof v.r === "number");
      assert.ok(typeof v.g === "number");
      assert.ok(typeof v.b === "number");
      assert.ok(v.name);
    }
  });
});

describe("Miquel RGB Incidence — Faces", () => {
  it("returns 6 channel faces", () => {
    const faces = getRgbChannelFaces();
    assert.equal(faces.length, 6);
  });

  it("faces cover all channel extremes", () => {
    const names = getRgbChannelFaces().map(f => f.name);
    assert.ok(names.includes("R=0"));
    assert.ok(names.includes("R=255"));
    assert.ok(names.includes("G=0"));
    assert.ok(names.includes("G=255"));
    assert.ok(names.includes("B=0"));
    assert.ok(names.includes("B=255"));
  });
});

describe("Miquel RGB Incidence — Vertex/Face Queries", () => {
  it("each face contains exactly 4 vertices", () => {
    for (const face of getRgbChannelFaces()) {
      const verts = getVerticesOnFace(face);
      assert.equal(verts.length, 4, `face ${face.name} should have 4 vertices`);
    }
  });

  it("black vertex touches R=0, G=0, B=0 faces", () => {
    const faces = getFacesForVertex("000000");
    assert.equal(faces.length, 3);
    assert.ok(faces.includes("R=0"));
    assert.ok(faces.includes("G=0"));
    assert.ok(faces.includes("B=0"));
  });

  it("white vertex touches R=255, G=255, B=255 faces", () => {
    const faces = getFacesForVertex("FFFFFF");
    assert.equal(faces.length, 3);
    assert.ok(faces.includes("R=255"));
    assert.ok(faces.includes("G=255"));
    assert.ok(faces.includes("B=255"));
  });

  it("red vertex touches R=255, G=0, B=0 faces", () => {
    const faces = getFacesForVertex("FF0000");
    assert.equal(faces.length, 3);
    assert.ok(faces.includes("R=255"));
    assert.ok(faces.includes("G=0"));
    assert.ok(faces.includes("B=0"));
  });

  it("unknown vertex returns empty", () => {
    assert.deepEqual(getFacesForVertex("123456"), []);
  });
});

describe("Miquel RGB Incidence — Build & Validate", () => {
  it("buildMiquelRgbIncidence returns 24 incidences", () => {
    const incidence = buildMiquelRgbIncidence();
    assert.equal(incidence.length, 24);
  });

  it("each incidence has vertex, face, axis, channelValue", () => {
    for (const inc of buildMiquelRgbIncidence()) {
      assert.ok(inc.vertex);
      assert.ok(inc.face);
      assert.ok(inc.axis);
      assert.ok(typeof inc.channelValue === "number");
    }
  });

  it("validateMiquelRgbIncidence passes structural checks", () => {
    const result = validateMiquelRgbIncidence();
    assert.ok(result.valid);
    assert.equal(result.incidenceCount, 24);
    assert.deepEqual(result.errors, []);
  });

  it("8 vertices × 3 faces = 24 incidences", () => {
    const incidence = buildMiquelRgbIncidence();
    const byVertex = {};
    for (const inc of incidence) {
      byVertex[inc.vertex] = (byVertex[inc.vertex] || 0) + 1;
    }
    for (const [vertex, count] of Object.entries(byVertex)) {
      assert.equal(count, 3, `vertex ${vertex} should have 3 incidences`);
    }
  });

  it("6 faces × 4 vertices = 24 incidences", () => {
    const incidence = buildMiquelRgbIncidence();
    const byFace = {};
    for (const inc of incidence) {
      byFace[inc.face] = (byFace[inc.face] || 0) + 1;
    }
    for (const [face, count] of Object.entries(byFace)) {
      assert.equal(count, 4, `face ${face} should have 4 incidences`);
    }
  });
});
