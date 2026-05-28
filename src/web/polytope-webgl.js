import { POLYTOPE_SLOTS, unpack4D, tickFactorials, registerTick } from "../runtime/polytope-sab.js";

export function unpackPolytopePoints(polytopeBuffer, stride, pageIndex) {
  const start = pageIndex * stride;
  const end = Math.min(start + stride, POLYTOPE_SLOTS);
  const points = [];
  for (let i = start; i < end; i++) {
    const { x, y, z } = unpack4D(polytopeBuffer[i]);
    points.push(x / 1024, y / 1024, z / 1024);
  }
  return new Float32Array(points);
}

export function createPolytopeGeometry(THREE, polytopeBuffer, stride, pageIndex) {
  const positions = unpackPolytopePoints(polytopeBuffer, stride, pageIndex);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

export function updatePolytopeGeometry(THREE, geometry, polytopeBuffer, stride, pageIndex) {
  const posAttr = geometry.getAttribute("position");
  const positions = unpackPolytopePoints(polytopeBuffer, stride, pageIndex);
  posAttr.array.set(positions);
  posAttr.needsUpdate = true;
}

export function createPolytopeHUD(tick) {
  const f = tickFactorials(tick);
  return {
    tick: f.tick,
    page6: f.page6,
    block5: f.block5,
    cell4: f.cell4,
    frame3: f.frame3,
    edge2: f.edge2,
    html: `tick=${f.tick}<br>720p=${f.page6} 120b=${f.block5}<br>24c=${f.cell4} 6f=${f.frame3} 2e=${f.edge2}`
  };
}

export const PAGE_NAMES = [
  "600-cell/120-cell page 0",
  "600-cell/120-cell page 1",
  "600-cell/120-cell page 2",
  "600-cell/120-cell page 3",
  "600-cell/120-cell page 4",
  "600-cell/120-cell page 5",
  "600-cell/120-cell page 6"
];

export function applyProjectionToPage(pageIndex, tick, modifier = 1) {
  const f = tickFactorials(tick);
  const code = f.page6 >= 5 ? "0x24" : "0x05";
  return {
    code,
    page6: f.page6,
    block5: f.block5,
    cell4: f.cell4,
    dz: code === "0x24" ? Math.tan(Math.PI / 6) * modifier
      : Math.cos(Math.PI / 5) * modifier
  };
}